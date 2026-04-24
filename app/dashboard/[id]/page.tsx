"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IconArrowLeft,
  IconBolt,
  IconCheck,
  IconCode,
  IconCopy,
  IconFileText,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";

type Chatbot = {
  id: string;
  name: string;
  welcome_message: string;
  color: string;
};

type Document = {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
};

type Tab = "documents" | "embed";

export default function ChatbotDetailPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("documents");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      await fetchChatbot();
      await fetchDocuments();
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchChatbot = async () => {
    const { data } = await supabase.from("chatbots").select("*").eq("id", id).single();
    if (!data) return router.push("/dashboard");
    setChatbot(data);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    setDocumentsError(null);
    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, status, created_at")
      .eq("chatbot_id", id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
      setDocumentsError(error.message);
      setLoading(false);
      return;
    }

    setDocuments(data || []);
    setLoading(false);
  };

  const uploadDocument = async () => {
    setUploading(true);
    setUploadProgress("Generating embeddings...");
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatbotId", id);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      setUploadProgress("Done");
      setFile(null);
      await fetchDocuments();
    } catch {
      setUploadProgress("Error uploading. Try again.");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(""), 2000);
    }
  };

  const deleteDocument = async (docId: string) => {
    setDeletingId(docId);
    await supabase.from("documents").delete().eq("id", docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setDeletingId(null);
  };

  const copyEmbedCode = () => {
    const code = `<script src="${window.location.origin}/embed.js" data-chatbot-id="${id}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!chatbot) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed.js" data-chatbot-id="${id}"></script>`;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "documents", label: "Documents", icon: <IconFileText className="h-4 w-4" /> },
    { key: "embed", label: "Embed", icon: <IconCode className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen pb-10">
      <header className="app-shell pt-6 reveal-up">
        <div className="glass-panel flex items-center justify-between px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-secondary no-underline">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <div className="h-6 w-px bg-neutral-200" />
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chatbot.color }} />
              <h1 className="text-base font-semibold text-neutral-900">{chatbot.name}</h1>
            </div>
          </div>

          <span className="chip">Chatbot workspace</span>
        </div>
      </header>

      <main className="app-shell mt-8">
        <section className="glass-panel section-enter relative overflow-hidden p-5 sm:p-7">
          <div className="float-orb pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-indigo-300/15 blur-3xl" />
          <div className="float-orb-slow pointer-events-none absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-sky-300/12 blur-3xl" />

          <div className="relative z-10 mb-6 inline-flex gap-1 rounded-2xl border border-neutral-200 bg-neutral-100/70 p-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  tab === item.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {tab === "documents" ? (
            <div className="relative z-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] section-enter">
              <div className="soft-card p-5">
                <div className="flex items-center gap-2">
                  <IconUpload className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-base font-semibold text-neutral-900">Upload training document</h2>
                </div>
                <p className="mt-2 text-sm text-neutral-600">Upload one PDF file and we will generate embeddings for retrieval.</p>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-4 block w-full rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-700 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700"
                />

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className={`text-sm ${uploadProgress.includes("Error") ? "text-red-600" : "text-emerald-600"}`}>
                    {uploadProgress}
                  </span>
                  <button onClick={uploadDocument} disabled={uploading || !file} className="btn-primary disabled:opacity-60">
                    {uploading ? "Uploading..." : "Upload and train"}
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-neutral-900">Documents</h2>
                  <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600">
                    {documents.length} total
                  </span>
                </div>

                {loading ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">Loading documents...</div>
                ) : documentsError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                    Failed to load documents: {documentsError}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
                    <p className="text-sm text-neutral-600">No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {documents.map((doc) => (
                      <article key={doc.id} className="soft-card p-4 reveal-up">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">{doc.file_name}</p>
                            <p className="mt-1 text-xs text-neutral-500">Status: {doc.status}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <time className="text-xs text-neutral-500">
                            {new Date(doc.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            disabled={deletingId === doc.id}
                            className="btn-secondary px-3"
                            aria-label="Delete document"
                          >
                            {deletingId === doc.id ? "..." : <IconTrash className="h-4 w-4" />}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {tab === "embed" ? (
            <div className="section-enter max-w-2xl">
              <div className="soft-card p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <IconBolt className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">Embed on your website</h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  Copy and paste this snippet before the closing <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{`</body>`}</code> tag.
                </p>

                <pre className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-700">
                  {embedCode}
                </pre>

                <button onClick={copyEmbedCode} className="btn-primary mt-4">
                  {copied ? (
                    <>
                      <IconCheck className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <IconCopy className="mr-2 h-4 w-4" />
                      Copy embed code
                    </>
                  )}
                </button>

                <div className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Flow</p>
                  <p className="text-sm text-neutral-700">1. Add script tag to your website.</p>
                  <p className="text-sm text-neutral-700">2. A launcher appears in the bottom-right corner through which Visitors can chat.</p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
