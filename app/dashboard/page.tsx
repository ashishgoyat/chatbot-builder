"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconArrowRight, IconLogout, IconMessageCirclePlus, IconRobot, IconTrash } from "@tabler/icons-react";

type Chatbot = {
  id: string;
  name: string;
  welcome_message: string;
  color: string;
  created_at: string;
};

const COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#334155",
  "#64748b",
];

export default function DashboardPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSystemPrompt, setSystemPrompt] = useState("");
  const [newWelcome, setNewWelcome] = useState("Hi! How can I help you?");
  const [newColor, setNewColor] = useState("#4f46e5");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      await loadChatbots(user.id);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadChatbots = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase.from("chatbots").select("*").eq('user_id',userId).order("created_at", { ascending: false });
    setChatbots(data || []);
    setLoading(false);
  };

  const createChatbot = async () => {
    if (!newName.trim()) return;
    if (newSystemPrompt.length > 500) return;

    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("chatbots").insert({
      name: newName.trim(),
      welcome_message: newWelcome,
      system_prompt: newSystemPrompt,
      color: newColor,
      user_id: user?.id,
    });

    if (error) {
      console.error("Error creating chatbot:", error);
      setCreating(false);
      return;
    }

    setNewName("");
    setNewWelcome("Hi! How can I help you?");
    setSystemPrompt("");
    setNewColor("#4f46e5");
    setCreating(false);
    setShowModal(false);
    if(user?.id != null) {
      await loadChatbots(user.id);
    }
  };

  const deleteChatbot = async (id: string) => {
    setDeletingId(id);
    await supabase.from("chatbots").delete().eq("id", id);
    setChatbots((prev) => prev.filter((bot) => bot.id !== id));
    setDeletingId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen pb-10">
      <header className="app-shell pt-6 nav-enter">
        <div className="glass-panel flex items-center justify-between px-5 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Workspace</p>
            <h1 className="text-xl font-semibold text-neutral-900">BotForge Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 sm:inline">
              {user?.email}
            </span>
            <button onClick={handleSignOut} className="btn-secondary">
              <IconLogout className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell mt-8">
        <section className="glass-panel hero-mesh section-enter relative overflow-hidden p-6 sm:p-8">
          <div className="float-orb pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/15 blur-3xl" />
          <div className="float-orb-slow pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-sky-300/12 blur-3xl" />

          <div className="relative z-10 mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="editorial-kicker">Control Center</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">Your chatbots</h2>
              <p className="mt-2 text-sm text-neutral-600">Create, train, and deploy customer-facing AI assistants.</p>
            </div>

            <button onClick={() => setShowModal(true)} className="btn-primary">
              <IconMessageCirclePlus className="mr-2 h-4 w-4" />
              New chatbot
            </button>
          </div>

          {!loading && chatbots.length > 0 ? (
            <div className="relative z-10 mb-6 grid gap-3 sm:grid-cols-3">
              <div className="soft-card reveal-up p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Total</p>
                <p className="mt-1 text-2xl font-semibold text-neutral-900">{chatbots.length}</p>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-44 animate-pulse rounded-2xl border border-neutral-200 bg-white/80" />
              ))}
            </div>
          ) : chatbots.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-neutral-300 bg-white/70 px-6 py-14 text-center">
              <IconRobot className="mx-auto mb-4 h-10 w-10 text-neutral-400" />
              <h3 className="text-lg font-semibold text-neutral-900">No chatbots yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
                Create your first chatbot and start answering customer questions from your own documents.
              </p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-6">
                Create first chatbot
              </button>
            </div>
          ) : (
            <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {chatbots.map((bot, index) => (
                <article
                  key={bot.id}
                  className="soft-card p-5"
                  style={{ animationDelay: `${index * 55}ms`, animation: "revealUp 420ms var(--ease-out) both" }}
                >
                  <div
                    className="mb-4 h-1.5 w-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${bot.color}, #38bdf8)` }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
                        style={{ backgroundColor: `${bot.color}1A`, color: bot.color }}
                      >
                        {bot.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-neutral-900">{bot.name}</h3>
                        <p className="text-xs text-neutral-500">
                          {new Date(bot.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                    {bot.welcome_message}
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <Link href={`/dashboard/${bot.id}`} className="flex-1 no-underline">
                      <span className="btn-primary w-full">
                        Manage
                        <IconArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </Link>

                    <button
                      onClick={() => deleteChatbot(bot.id)}
                      disabled={deletingId === bot.id}
                      className="btn-secondary px-3"
                      aria-label="Delete chatbot"
                    >
                      {deletingId === bot.id ? "..." : <IconTrash className="h-4 w-4" />}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white p-6 shadow-2xl shadow-indigo-950/20 sm:p-7 section-enter">
            <h2 className="text-xl font-semibold text-neutral-900">Create chatbot</h2>
            <p className="mt-1 text-sm text-neutral-600">Set up the basics now. You can customize later.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 inline-block text-sm font-medium text-neutral-700">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createChatbot()}
                  placeholder="Support assistant"
                  className="input-polish"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 inline-block text-sm font-medium text-neutral-700">Welcome message</label>
                <input
                  type="text"
                  value={newWelcome}
                  onChange={(e) => setNewWelcome(e.target.value)}
                  placeholder="Hi! How can I help you?"
                  className="input-polish"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-700">System prompt</label>
                  <span className={`text-xs tabular-nums ${newSystemPrompt.length >= 500 ? "text-red-500 font-medium" : "text-neutral-400"}`}>
                    {newSystemPrompt.length}/500
                  </span>
                </div>
                <textarea
                  value={newSystemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="You are a helpful support assistant for Acme Corp..."
                  className="input-polish resize-none"
                />
              </div>

              <div>
                <label className="mb-2 inline-block text-sm font-medium text-neutral-700">Accent color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className="h-8 w-8 rounded-full border-2 transition-transform duration-150 ease-out hover:scale-110 active:scale-95"
                      style={{ backgroundColor: color, borderColor: newColor === color ? "#0f172a" : "transparent" }}
                      aria-label={`Choose color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={createChatbot} disabled={!newName.trim() || creating} className="btn-primary disabled:opacity-60">
                {creating ? "Creating..." : "Create chatbot"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
