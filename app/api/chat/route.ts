// Import necessary modules and initialize clients
import { createClient } from "@/lib/supabase/server";
import { CohereEmbeddings } from "@langchain/cohere"
import { NextRequest, NextResponse } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider"


const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
// Initialize OpenAI client and embeddings
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY!, })



export async function POST(req: NextRequest) {
    const supabase = await createClient();
    try {
        if (!process.env.COHERE_API_KEY) {
            return NextResponse.json(
                { error: "Server misconfiguration: COHERE_API_KEY is missing" },
                { status: 500 }
            );
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: "Server misconfiguration: OPENROUTER_API_KEY is missing" },
                { status: 500 }
            );
        }

        const embeddings = new CohereEmbeddings({
            model: "embed-english-v3.0",
            inputType: "search_query",
        });


        // Extract and validate input parameters
        const { chatbot_id, messages, session_id } = await req.json()
        // Safely extract the last user message — parts[0].text is the AI SDK format
        const lastMsg = messages?.[messages.length - 1]
        const message: string = lastMsg?.parts?.[0]?.text ?? lastMsg?.content ?? ""


        if (!chatbot_id || !message || !session_id) return NextResponse.json({ error: "Missing chatbot_id, message, or session_id" }, { status: 400 })

        if (message.trim().length > 400) {
            return NextResponse.json({ error: "Message exceeds maximum length of 400 characters" }, { status: 400 })
        }

        const { data: session, error: sessionError } = await supabase.from('sessions').select('id').eq('id', session_id).eq('chatbot_id', chatbot_id).maybeSingle();

        if (sessionError) throw sessionError
        if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

        const { data: chatbot, error: chatbotError } = await supabase.from('chatbots').select('id, name, welcome_message, system_prompt').eq('id', chatbot_id).single()

        if (chatbotError) throw chatbotError

        if (!chatbot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })


        // Generate embedding for the user message and retrieve relevant document chunks
        const queryEmbedding = await embeddings.embedQuery(message)

        const { data: chunks, error: chunksError } = await supabase.rpc('match_document_chunks', {
            query_embedding: queryEmbedding,
            chatbot_id,
            match_count: 3,
        })

        if (chunksError) throw chunksError

        // Filter out low-similarity chunks so off-topic questions don't get hallucinated answers
        const SIMILARITY_THRESHOLD = 0.3; // Cohere cosine similarity — 0.3 is a safe floor for relevant chunks
        const relevantChunks = chunks?.filter((chunk: any) => chunk.similarity >= SIMILARITY_THRESHOLD) ?? [];
        const context = relevantChunks.length
            ? relevantChunks.map((chunk: any) => chunk.content).join('\n\n')
            : "";


        // Retrieve recent chat history for the session
        const { data: history, error: historyError } = await supabase
            .from("messages")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", { ascending: false })
            .limit(4);

        if (historyError) throw historyError

        const historyMessages: ModelMessage[] = history && history.length > 0 ? [...history].reverse().map((msg: any) => ({
            role: msg.role,
            content: msg.content,
        })) : [];

        // Merge persona + RAG constraint into ONE system message.
        // Two separate system messages let the first (persona) silently override the second (RAG rule).
        const basePersona = chatbot.system_prompt
            ? `${chatbot.system_prompt}\n\n`
            : `You are a helpful AI assistant called "${chatbot.name}".\n\n`;

        const ragConstraint = context
            ? `IMPORTANT RULE: Answer using ONLY the context below. Do NOT use outside knowledge. If the answer is not in the context, say: "I\'m sorry, I don\'t have information about that in the provided documents."\n\nContext:\n${context}`
            : `IMPORTANT RULE: No relevant information was found in the documents. You MUST say: "I\'m sorry, I don\'t have information about that." Do not answer from general knowledge.`;

        // Creating messages array for OpenAI completion, including system prompts, context, history, and user message
        const promptMessages: ModelMessage[] = [
            {
                role: 'system',
                content: basePersona + ragConstraint
            },

            ...historyMessages,

            {
                role: 'user',
                content: message,
            },
        ];


        // Generate a streaming response from OpenAI and save the user message and assistant response to the database once complete
        const result = await streamText({
            model: openrouter('openai/gpt-4o-mini'),
            messages: promptMessages,

            onFinish: async ({ text }) => {
                const { error } = await supabase.from('messages').insert([
                    {
                        session_id,
                        role: "user",
                        content: message,
                    },
                    {
                        session_id,
                        role: "assistant",
                        content: text,
                    },
                ]);
                if (error) throw error;
            }
        })

        return result.toUIMessageStreamResponse();


    } catch (err) {
        console.error("Error in POST /chat:", err);
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 })
    }
}