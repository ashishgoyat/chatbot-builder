"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

type Chatbot = {
  id: string;
  name: string;
  welcome_message: string;
  color: string;
};

function LoadingScreen({ text = "Loading chatbot..." }: { text?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
      {text}
    </div>
  );
}

export default function EmbedChatbotPage() {
  // useSearchParams() requires a Suspense boundary to build as a static/CSR page.
  return (
    <Suspense fallback={<LoadingScreen />}>
      <EmbedChatbot />
    </Suspense>
  );
}

function EmbedChatbot() {
  const params = useSearchParams();
  const chatbotId = params.get("chatbot_id");

  const [sessionId, setSessionId] = useState("");
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [initialize, setInitialize] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        if (!chatbotId) {
          setError("Missing chatbot id.");
          return;
        }

        const resSession = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatbotId }),
        });
        const dataSession = await resSession.json();
        if (!resSession.ok || !dataSession.sessionId) {
          setError(dataSession.error || "Couldn't start a chat session.");
          return;
        }
        setSessionId(dataSession.sessionId);

        const resChatbot = await fetch(`/api/chatbot/${chatbotId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const dataChatbot = await resChatbot.json();
        if (!resChatbot.ok) {
          setError(dataChatbot.error || "Couldn't load this chatbot.");
          return;
        }

        setChatbot(dataChatbot);
        setInitialize(true);
      } catch (err: unknown) {
        console.error("Error in creating session or fetching chatbot data", err);
        setError("Something went wrong. Please try again.");
      }
    };
    init();
  }, [chatbotId]);

  if (error) {
    return <LoadingScreen text={error} />;
  }

  if (!initialize || !sessionId || !chatbot) {
    return <LoadingScreen />;
  }

  return <ChatUI sessionId={sessionId} chatbot={chatbot} chatbotId={chatbotId!} />;
}

function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500"
          style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

function ChatUI({ sessionId, chatbot, chatbotId }: { sessionId: string; chatbot: Chatbot; chatbotId: string }) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // useChat in ai-sdk v6 already tracks both user + assistant messages in `messages`.
  // sendMessage() optimistically adds the user message immediately — no separate state needed.
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        chatbot_id: chatbotId,
        session_id: sessionId,
      },
    }),
  });

  // "submitted" = request in flight, "streaming" = tokens arriving
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Return focus to the input once a reply finishes so the visitor can keep typing
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-neutral-900">
      <header
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ background: `linear-gradient(135deg, ${chatbot.color}, ${chatbot.color}cc)` }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-base font-semibold text-white backdrop-blur-sm">
          {chatbot.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{chatbot.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Online — typically replies instantly
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-950">
        {/* Welcome message */}
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-neutral-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          {chatbot.welcome_message}
        </div>

        {/* All messages — useChat includes both user and assistant */}
        {messages.map((msg, i) => {
          const text = msg.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("") ?? (msg as any).content ?? "";

          if (!text) return null;

          return (
            <div
              key={i}
              className={
                msg.role === "user"
                  ? "ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm"
                  : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-neutral-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              }
              style={msg.role === "user" ? { backgroundColor: chatbot.color } : undefined}
            >
              {text}
            </div>
          );
        })}

        {status === "submitted" && <TypingDots />}

        {status === "error" && (
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            Something went wrong. Please try sending your message again.
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <footer className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Type your message..."
            aria-label="Type your message"
            autoFocus
            maxLength={400}
            className="input-polish flex-1"
          />
          <button
            onClick={handleSend}
            disabled={busy || !input.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-all duration-150 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: chatbot.color }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
          Powered by BotForge
        </p>
      </footer>
    </div>
  );
}
