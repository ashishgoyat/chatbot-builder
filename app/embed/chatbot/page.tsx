"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai";

type Chatbot = {
    id: string
    name: string
    welcome_message: string
    color: string
}

export default function EmbedChatbotPage() {
    const params = useSearchParams();

    const chatbotId = params.get("chatbot_id");

    const [sessionId, setSessionId] = useState("");
    const [chatbot, setChatbot] = useState<Chatbot | null>(null)
    const [initialize, setInitialize] = useState(false);



    useEffect(() => {
        const init = async () => {
            try {

                if (!chatbotId) return
                const res_session = await fetch('/api/sessions', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        chatbotId
                    })
                })
                const data_session = await res_session.json();
                setSessionId(data_session.sessionId);
                console.log("session created", data_session, sessionId)

                const res_chatbot = await fetch(`/api/chatbot/[id]?id=${chatbotId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                const data_chatbot = await res_chatbot.json();
                setChatbot(data_chatbot)
                setInitialize(true)
                console.log("chatbot data found", data_chatbot, chatbot)

            } catch (err: any) {
                console.error("Error in 'creating session' or 'fetching chatbot data'", err);
            }
        }

        init();
    }, [chatbotId])


    if(!initialize || !sessionId || !chatbot) return <div>Loading...</div>

    return <ChatUI sessionId={sessionId} chatbot={chatbot} chatbotId={chatbotId!} />

}


function ChatUI({sessionId, chatbot, chatbotId}: {sessionId: string, chatbot: Chatbot, chatbotId: string}) {
    const [input, setInput] = useState("");

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: {
                chatbot_id: chatbotId,
                session_id: sessionId,
            }
        })
    })

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-1 overflow-auto">
                {messages.map((msg) => (
                    <div key={msg.id}>
                        {msg.parts.map((part, i) => part.type === 'text' ? <span key={i}>{part.text}</span> : null)}
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    placeholder="Ask something..."
                    className="flex-1 border p-2"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button className="cursor-pointer" onClick={() => {sendMessage({text: input}); setInput('')}}>
                    Send
                </button>
            </div>
        </div>
    )
}