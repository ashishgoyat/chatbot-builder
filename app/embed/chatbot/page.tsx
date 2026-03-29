"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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


    if (!initialize || !sessionId || !chatbot) return <div>Loading...</div>

    return <ChatUI sessionId={sessionId} chatbot={chatbot} chatbotId={chatbotId!} />

}


function ChatUI({ sessionId, chatbot, chatbotId }: { sessionId: string, chatbot: Chatbot, chatbotId: string }) {
    const [input, setInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null)

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: {
                chatbot_id: chatbotId,
                session_id: sessionId,
            }
        })
    })

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, status])


    return (
        <div className="flex flex-col h-screen">
            <div className="flex flex-col h-full overflow-hidden border border-neutral-200">
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-5 py-3">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ backgroundColor: chatbot.color + '15', border: `1px solid ${chatbot.color}30` }}
                    >
                        <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: chatbot.color }}
                        />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-neutral-800">{chatbot.name}</div>
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-white p-5">
                    {/* Welcome message */}
                    <div className="max-w-[75%] self-start rounded-2xl rounded-bl-sm border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700">
                        {chatbot.welcome_message}
                    </div>

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={
                                msg.role === 'user'
                                    ? 'max-w-[75%] self-end rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white'
                                    : 'max-w-[75%] self-start rounded-2xl rounded-bl-sm border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700'
                            }
                            style={msg.role === 'user' ? { background: `linear-gradient(135deg, ${chatbot.color}, #3b82f6)` } : undefined}
                        >
                            {msg.parts.map((part, j) =>
                                part.type === 'text' ? <span key={j}>{part.text}</span> : null
                            )}
                        </div>
                    ))}
                    {status === 'streaming' && (
                        <div className="flex max-w-[75%] items-center gap-1 self-start rounded-2xl rounded-bl-sm border border-neutral-200 bg-neutral-50 px-4 py-3">
                            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div className="flex gap-2 border-t border-neutral-200 bg-neutral-50 p-4">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { sendMessage({ text: input }); setInput('') } }}
                        placeholder="Ask something..."
                        className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400"
                    />
                    <button
                        onClick={() => { sendMessage({ text: input }); setInput('') }}
                        disabled={status === 'streaming' || !input.trim()}
                        className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg, ${chatbot.color}, #3b82f6)` }}
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    )
}