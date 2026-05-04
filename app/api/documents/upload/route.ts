// Add Imports
import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { CohereEmbeddings } from "@langchain/cohere";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";


// function to extract text from PDF using pdf-parse
async function extractTextFromPDF(file: File) {
    const buffer = await file.arrayBuffer()
    const text = await extractText(new Uint8Array(buffer))
    const fullText = text.text.join('\n')
    if (!fullText.trim()) throw new Error("PDF contains no extractable text")
    return fullText
}


// Initialize text splitter and embeddings
const tokenSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 250,
});


export async function POST(req: NextRequest) {
    const supabase = await createClient();
    let documentId: string | null = null;
    try {
        if (!process.env.COHERE_API_KEY) {
            return NextResponse.json(
                { error: "Server misconfiguration: COHERE_API_KEY is missing" },
                { status: 500 }
            );
        }

        const embeddings = new CohereEmbeddings({
            model: "embed-english-v3.0",
            inputType: "search_document",
        });

        const setDocumentStatus = async (id: string, status: string) => {
            const { data, error } = await supabase
                .from("documents")
                .update({ status })
                .eq("id", id)
                .select("id, status")
                .maybeSingle();

            // If RLS blocks the update, PostgREST often returns 0 rows updated with no error.
            if (error || !data) {
                throw new Error(
                    `Failed to update document status to "${status}". ` +
                    `This is usually caused by Supabase RLS/policies denying updates for the row.`
                );
            }
        };


        // Authenticate user and validate input
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 10 uploads per hour per user
        const { allowed, retryAfter } = checkRateLimit(`upload:${user.id}`, 10, 60 * 60_000)
        if (!allowed) return rateLimitResponse(retryAfter)

        const formdata = await req.formData();
        const file = formdata.get('file') as File;
        const chatbotId = formdata.get('chatbotId') as string;
        if(!chatbotId) return NextResponse.json({ error: "Missing chatbotId" }, { status: 400 });

        const { data: chatbot, error: chatbotError } = await supabase.from('chatbots').select('id').eq('id', chatbotId).eq('user_id', user.id).single();
        if (chatbotError) throw chatbotError;
        if (!chatbot) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "only PDF files below 10MB are allowed" }, { status: 400 });

        const {data: existingDocument} = await supabase.from('documents').select('id').eq('file_name', file.name).eq('chatbot_id', chatbotId).maybeSingle();
        if (existingDocument) {
            return NextResponse.json({ error: "Document with the same name already exists for this chatbot" }, { status: 400 });
        }


        // Create a new document record in the database with status "uploading"
        const { data: documentData, error } = await supabase.from('documents').insert({
            chatbot_id: chatbotId,
            file_name: file.name,
            status: "uploading"
        }).select().single();

        if (error || !documentData) return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });

        documentId = documentData.id;

        // Update document status to "processing"
        await setDocumentStatus(documentData.id, "processing");


        // Extract text from the PDF
        const text = await extractTextFromPDF(file);


        // Split the extracted text into chunks
        const tokenChunks = (await tokenSplitter.splitText(text)).filter(chunk => chunk.trim().length > 10);
        if(tokenChunks.length > 1000) {
            throw new Error("Document is too large to process (exceeds 1000 chunks)");
        }


        // set document status to "embedding" before starting the embedding process
        await setDocumentStatus(documentData.id, "embedding");



        // Generate embeddings for each chunk and store them in the database, processing in batches of 50 to optimize performance
        for (let i = 0; i < tokenChunks.length; i += 50) {
            const chunkBatch = tokenChunks.slice(i, i + 50);
            const batchEmbeddings = await embeddings.embedDocuments(chunkBatch);

            if(batchEmbeddings.length !== chunkBatch.length) {
                throw new Error("Embedding generation failed for a batch of chunks");
            }

            const chunkRows = chunkBatch.map((chunk, index) => ({
                document_id: documentData.id,
                chunk_index: i + index,
                content: chunk,
                embedding: batchEmbeddings[index],
                metadata: {
                    source: file.name,
                    chunk_length: chunk.length,
                }
            }))

            const { error: chunkError } = await supabase.from('document_chunks').insert(chunkRows);
            if (chunkError) throw chunkError;
        }


        // After successful embedding, update document status to "completed"
        await setDocumentStatus(documentData.id, "completed");


        return NextResponse.json({ success: true, documentId: documentData.id, status: "completed", chunks: tokenChunks.length })
    } catch (err: any) {
        if(documentId) {
            // Best-effort; don't mask the original error if this fails.
            try {
                await supabase.from('documents').update({ status: "failed" }).eq('id', documentId);
            } catch {}
        }
        console.error("Error occurred while processing the document:", err);
        return NextResponse.json({ error: "An error occurred while processing the document" }, { status: 500 });
    }
}
