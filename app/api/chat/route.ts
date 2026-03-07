// Import necessary modules and initialize clients
import { createClient } from "@/lib/supabase/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";


// Initialize OpenAI client and embeddings
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY!, })

const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
})


export async function POST(req: NextRequest) {
    const supabase = await createClient();
    try {


        // Extract and validate input parameters
        const { chatbot_id, message, session_id } = await req.json()

        if (!chatbot_id || !message || !session_id) return NextResponse.json({ error: "Missing chatbot_id, message, or session_id" }, { status: 400 })
            
        if(message.length > 400) {
            return NextResponse.json({ error: "Message exceeds maximum length of 400 characters" }, { status: 400 })
        }
        
        const { data: session, error: sessionError } = await supabase.from('sessions').select('id').eq('id', session_id).eq('chatbot_id', chatbot_id).single();

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

        const context = chunks?.length ? chunks.map((chunk: any) => chunk.content).join('\n\n') : "";


        // Retrieve recent chat history for the session
        const { data: history, error: historyError } = await supabase
            .from("messages")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", { ascending: false })
            .limit(4);

        if (historyError) throw historyError

        const historyMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = history && history.length > 0 ? history.reverse().map((msg: any) => ({
            role: msg.role,
            content: msg.content,
        })) : [];


        // Creating messages array for OpenAI completion, including system prompts, context, history, and user message
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: chatbot.system_prompt || `You are a helpful AI assistant called "${chatbot.name}".`
            },
            {
                role: 'system',
                content: context
                    ? `You must answer the user's question using ONLY the information below.

                    Context:
                    ${context}

                    If the answer is not contained in the context, say you don't know.`
                    : `No relevant information was found. If you cannot answer confidently, say you don't know.`
            },

            ...historyMessages,

            {
                role: 'user',
                content: message,
            },
        ];


        // Generate a response from OpenAI and handle the reply
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
        })

        const reply = completion.choices?.[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";

        if(!reply) {
            return NextResponse.json({ error: "Failed to generate a response" }, { status: 500 })
        }


        // Store the user message and assistant reply in the database
        const { error: insertError } = await supabase.from('messages').insert([
        {
            session_id,
            role: 'user',
            content: message,
        },
        {
            session_id,
            role: 'assistant',
            content: reply,
        },
        ])

        if (insertError) throw insertError

        return NextResponse.json({ reply })


    } catch (err) {
        console.error("Error in POST /chat:", err);
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 })
    }
}