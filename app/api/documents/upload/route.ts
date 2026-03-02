import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})


function chunkText(text: string, chunkSize = 500): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '))
    }
    return chunks
}

export async function POST(req: NextRequest) {
    try {
        const { chatbotId, content } = await req.json();

        if (!chatbotId || !content) {
            return new Response(JSON.stringify({ error: "Missing chatbotId or content" }), { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
        }

        const { data: chatbot } = await supabase
            .from('chatbots')
            .select('id')
            .eq('id', chatbotId)
            .eq('user_id', user.id)
            .single()

        if (!chatbot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })


        const chunks = chunkText(content)

        const embeddingRespone = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: chunks
        })

        const rows = chunks.map((chunk,i) => ({
            chatbot_id: chatbotId,
            content: chunk,
            embedding: embeddingRespone.data[i].embedding
        }))

        const { error } = await supabase.from('documents').insert(rows)
        if (error) throw error

        return NextResponse.json({ success: true, chunks: chunks.length })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || "An error occurred while uploading the document" }), { status: 500 })
    }
}