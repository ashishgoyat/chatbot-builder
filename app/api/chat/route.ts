import { createClient } from "@/lib/supabase/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";


const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY })

const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
})


export async function POST(req: NextRequest) {
    const supabase = await createClient();
    try {
        const { chatbot_id, message, session_id } = await req.json()

        if (!chatbot_id || !message || !session_id) return NextResponse.json({ error: "Missing chatbot_id, message, or session_id" }, { status: 400 })

        const { data: chatbot, error: chatbotError } = await supabase.from('chatbots').select('id, name, welcome_message, system_prompt').eq('id', chatbot_id).single()

        if (chatbotError) throw chatbotError

        if (!chatbot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })

        const queryEmbedding = await embeddings.embedQuery(message)

        const { data: chunks } = await supabase.rpc('match_document_chunks', {
            query_embedding: queryEmbedding,
            match_count: 5,
        })

        const context = chunks?. map((chunk: any) => chunk.content).join('\n\n') || 'No relevant information found.';

        const messages = [
            {
                role: 'system',
                content: chatbot.system_prompt || `You are a helpful AI assistant called "${chatbot.name}".`
            },
            {
                role: 'system',
                content: `Answer questions based ONLY on the context provided below. If the answer is not in the context, say "I don't have information about that. Please contact support for more details." Keep answers concise, friendly, and helpful.

Context:
${context}`,
            },
            {
                role: 'user',
                content: message,
            },
        ]

    } catch (err) {
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 })
    }
}