"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

type Chatbot = {
  id: string;
  name: string;
  welcome_message: string;
  color: string;
};

export default function EmbedChatbotPage() {
  const params = useSearchParams();
  const chatbotId = params.get("chatbot_id");

  const [sessionId, setSessionId] = useState("");
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [initialize, setInitialize] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (!chatbotId) return;

        const resSession = await fetch("/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chatbotId }),
        });
        const dataSession = await resSession.json();
        setSessionId(dataSession.sessionId);

        const resChatbot = await fetch(`/api/chatbot/[id]?id=${chatbotId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const dataChatbot = await resChatbot.json();

        setChatbot(dataChatbot);
        setInitialize(true);
      } catch (err: unknown) {
        console.error("Error in creating session or fetching chatbot data", err);
      }
    };

    init();
  }, [chatbotId]);

  if (!initialize || !sessionId || !chatbot) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Loading chatbot...
      </div>
    );
  }

  return <ChatUI sessionId={sessionId} chatbot={chatbot} chatbotId={chatbotId!} />;
}

function ChatUI({ sessionId, chatbot, chatbotId }: { sessionId: string; chatbot: Chatbot; chatbotId: string }) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        chatbot_id: chatbotId,
        session_id: sessionId,
      },
    }),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="h-screen bg-neutral-50 p-3">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg shadow-neutral-900/10">
        <header className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: `${chatbot.color}1A`, border: `1px solid ${chatbot.color}40` }}
          >
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chatbot.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{chatbot.name}</p>
            <p className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700">
            {chatbot.welcome_message}
          </div>

          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === "user"
                  ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white"
                  : "max-w-[80%] rounded-2xl rounded-bl-sm border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700"
              }
              style={
                msg.role === "user"
                  ? {
                      background: `linear-gradient(135deg, ${chatbot.color}, #0284c7)`,
                    }
                  : undefined
              }
            >
              {msg.parts.map((part, j) => (part.type === "text" ? <span key={j}>{part.text}</span> : null))}
            </div>
          ))}

          {status === "streaming" ? (
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
              Thinking...
            </div>
          ) : null}

          <div ref={chatEndRef} />
        </div>

        <footer className="flex gap-2 border-t border-neutral-200 bg-neutral-50 p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage({ text: input });
                setInput("");
              }
            }}
            placeholder="Ask something..."
            className="input-polish"
          />
          <button
            onClick={() => {
              sendMessage({ text: input });
              setInput("");
            }}
            disabled={status === "streaming" || !input.trim()}
            className="btn-primary px-4 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${chatbot.color}, #0284c7)` }}
          >
            Send
          </button>
        </footer>
      </div>
    </div>
  );
}
