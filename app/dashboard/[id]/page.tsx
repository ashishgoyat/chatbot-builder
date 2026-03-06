'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Chatbot = {
    id: string
    name: string
    welcome_message: string
    color: string
}

type Document = {
    id: string
    content: string
    created_at: string
}

type Tab = 'documents' | 'embed' | 'preview'

export default function ChatbotDetailPage() {
    const [chatbot, setChatbot] = useState<Chatbot | null>(null)
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<Tab>('documents')
    const [text, setText] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Preview chat state
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    const router = useRouter()
    const params = useParams()
    const id = params.id as string
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')
            await fetchChatbot()
            await fetchDocuments()
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, chatLoading])

    const fetchChatbot = async () => {
        const { data } = await supabase.from('chatbots').select('*').eq('id', id).single()
        if (!data) return router.push('/dashboard')
        setChatbot(data)
    }

    const fetchDocuments = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('documents')
            .select('id, content, created_at')
            .eq('chatbot_id', id)
            .order('created_at', { ascending: false })
        setDocuments(data || [])
        setLoading(false)
    }

    const uploadDocument = async () => {
        if (!text.trim()) return
        setUploading(true)
        setUploadProgress('Generating embeddings...')

        try {
            const res = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatbotId: id, content: text.trim() }),
            })

            if (!res.ok) throw new Error('Upload failed')
            setUploadProgress('Done!')
            setText('')
            await fetchDocuments()
        } catch {
            setUploadProgress('Error uploading. Try again.')
        } finally {
            setUploading(false)
            setTimeout(() => setUploadProgress(''), 2000)
        }
    }

    const deleteDocument = async (docId: string) => {
        setDeletingId(docId)
        await supabase.from('documents').delete().eq('id', docId)
        setDocuments(prev => prev.filter(d => d.id !== docId))
        setDeletingId(null)
    }

    const copyEmbedCode = () => {
        const code = `<script src="${window.location.origin}/embed.js" data-chatbot-id="${id}"></script>`
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const sendPreviewMessage = async () => {
        if (!chatInput.trim() || chatLoading) return
        const userMsg = chatInput.trim()
        setChatInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setChatLoading(true)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatbot_id: id, message: userMsg }),
            })
            const data = await res.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
        } finally {
            setChatLoading(false)
        }
    }

    if (!chatbot) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-neutral-400">Loading...</p>
            </div>
        )
    }

    const embedCode = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" data-chatbot-id="${id}"></script>`

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'documents', label: 'Documents', icon: '📄' },
        { key: 'preview', label: 'Preview', icon: '💬' },
        { key: 'embed', label: 'Embed', icon: '🔗' },
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="text-sm text-neutral-400 no-underline transition-colors hover:text-neutral-600"
                        >
                            ← Dashboard
                        </Link>
                        <span className="text-neutral-300">/</span>
                        <div className="flex items-center gap-2">
                            <div
                                className="flex h-6 w-6 items-center justify-center rounded-md"
                                style={{ backgroundColor: chatbot.color + '15', border: `1px solid ${chatbot.color}30` }}
                            >
                                <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: chatbot.color }}
                                />
                            </div>
                            <span className="font-semibold text-neutral-800">{chatbot.name}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-5xl px-6 py-8">
                {/* Tabs */}
                <div className="mb-8 inline-flex gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === t.key
                                    ? 'bg-white text-neutral-800 shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* ── DOCUMENTS TAB ── */}
                {tab === 'documents' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Upload panel */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-1 text-lg font-bold text-neutral-800">Add Training Data</h2>
                            <p className="mb-4 text-sm text-neutral-500">
                                Paste FAQs, product info, support docs — anything you want your bot to know.
                            </p>
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder="e.g. Our return policy is 30 days. To initiate a return, email support@company.com with your order number..."
                                className="w-full resize-y rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400"
                                style={{ minHeight: '200px', lineHeight: 1.6 }}
                            />
                            <div className="mt-4 flex items-center justify-between">
                                {uploadProgress && (
                                    <span className={`text-sm ${uploadProgress.includes('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {uploadProgress}
                                    </span>
                                )}
                                <div className="ml-auto">
                                    <button
                                        onClick={uploadDocument}
                                        disabled={uploading || !text.trim()}
                                        className="relative inline-flex h-10 cursor-pointer overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                        <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                                            {uploading ? 'Uploading...' : 'Upload & Train →'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Documents list */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-neutral-800">Trained Documents</h2>
                                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-0.5 text-xs font-medium text-neutral-500">
                                    {documents.length} docs
                                </span>
                            </div>

                            {loading ? (
                                <div className="py-8 text-center text-sm text-neutral-400">Loading...</div>
                            ) : documents.length === 0 ? (
                                <div className="rounded-2xl border-2 border-dashed border-neutral-200 px-6 py-10 text-center transition-colors hover:border-neutral-300">
                                    <div className="mb-3 text-3xl">📭</div>
                                    <p className="text-sm text-neutral-500">
                                        No documents yet. Add some training data to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto">
                                    {documents.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="flex-1 text-sm leading-relaxed text-neutral-600 line-clamp-3">
                                                    {doc.content}
                                                </p>
                                                <button
                                                    onClick={() => deleteDocument(doc.id)}
                                                    disabled={deletingId === doc.id}
                                                    className="shrink-0 cursor-pointer border-none bg-transparent text-neutral-400 transition-colors hover:text-red-500 disabled:opacity-50"
                                                >
                                                    {deletingId === doc.id ? '...' : '🗑'}
                                                </button>
                                            </div>
                                            <div className="mt-2 text-xs text-neutral-400">
                                                {new Date(doc.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── PREVIEW TAB ── */}
                {tab === 'preview' && (
                    <div className="mx-auto max-w-md">
                        <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
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
                            <div className="flex h-96 flex-col gap-3 overflow-y-auto bg-white p-5">
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
                                        {msg.content}
                                    </div>
                                ))}

                                {chatLoading && (
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
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendPreviewMessage()}
                                    placeholder="Ask something..."
                                    className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400"
                                />
                                <button
                                    onClick={sendPreviewMessage}
                                    disabled={chatLoading || !chatInput.trim()}
                                    className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{ background: `linear-gradient(135deg, ${chatbot.color}, #3b82f6)` }}
                                >
                                    →
                                </button>
                            </div>
                        </div>
                        <p className="mt-3 text-center text-xs text-neutral-400">
                            This is a live preview. Make sure you&apos;ve added training documents first.
                        </p>
                    </div>
                )}

                {/* ── EMBED TAB ── */}
                {tab === 'embed' && (
                    <div className="max-w-xl">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-1 text-lg font-bold text-neutral-800">
                                Embed on your website
                            </h2>
                            <p className="mb-5 text-sm leading-relaxed text-neutral-500">
                                Copy the snippet below and paste it before the closing{' '}
                                <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-700">&lt;/body&gt;</code>{' '}
                                tag of your website.
                            </p>

                            <div className="mb-4 break-all rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed text-neutral-700">
                                {embedCode}
                            </div>

                            <button
                                onClick={copyEmbedCode}
                                className="relative inline-flex h-10 cursor-pointer overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                                    {copied ? '✓ Copied!' : 'Copy Embed Code'}
                                </span>
                            </button>

                            {/* How it works */}
                            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                    How it works
                                </div>
                                {[
                                    'Paste the script tag into your website HTML',
                                    'A chat bubble appears in the bottom-right corner',
                                    'Visitors click it to chat with your AI bot',
                                    'Bot answers using only your trained documents',
                                ].map((step, i) => (
                                    <div key={i} className="mb-2 flex items-start gap-3">
                                        <div
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                                            style={{
                                                backgroundColor: chatbot.color + '15',
                                                color: chatbot.color,
                                                border: `1px solid ${chatbot.color}30`,
                                            }}
                                        >
                                            {i + 1}
                                        </div>
                                        <span className="text-sm leading-relaxed text-neutral-600">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
