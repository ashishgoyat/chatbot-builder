import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { chatbot_id, message } = await req.json()

        if (!chatbot_id || !message) return NextResponse.json({ error: "Missing chatbot_id or message" }, { status: 404 })

        const supabase = await createClient();

        const { data: chatbot } = await supabase.from('chatbots').select('id, name, welcome_message').eq('id', chatbot_id).single()

        if (!chatbot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })



        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: message,
        })
        const queryEmbedding = embeddingResponse.data[0].embedding

        const { data: relevantDocs, error: matchError } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_chatbot_id: chatbot_id,
            match_count: 5,
        })

        if (matchError) throw matchError

        const context = relevantDocs && relevantDocs.length > 0 ? relevantDocs.map((doc: any) => doc.content).join('\n\n') : 'No relevant information found.'

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful AI assistant called "${chatbot.name}". 
Answer questions based ONLY on the context provided below. 
If the answer is not in the context, say "I don't have information about that. Please contact support for more details."
Keep answers concise, friendly, and helpful.

Context:
${context}`,
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
            max_tokens: 500,
            temperature: 0.3,
        })

        const reply = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response."

        await supabase.from('conversations').insert([
            {chatbot_id, role: 'user', message},
            {chatbot_id, role: 'assistant', message: reply},
        ])

        return NextResponse.json({reply}, { headers: {'Access-Control-Allow-Origin': '*'}})


    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Chat failed' }, { status: 500 })
    }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}