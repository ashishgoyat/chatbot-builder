"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EncryptedText } from "@/components/ui/encrypted-text";

type Chatbot = {
  id: string;
  name: string;
  welcome_message: string;
  color: string;
  created_at: string;
};

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#64748b",
];

export default function DashboardPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWelcome, setNewWelcome] = useState("Hi! How can I help you?");
  const [newColor, setNewColor] = useState("#6366f1");
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
      await loadChatbots();
    };
    init();
  }, []);

  const loadChatbots = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chatbots")
      .select("*")
      .order("created_at", { ascending: false });
    setChatbots(data || []);
    setLoading(false);
  };

  const createChatbot = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("chatbots").insert({
      name: newName.trim(),
      welcome_message: newWelcome,
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
    setNewColor("#6366f1");
    setCreating(false);
    setShowModal(false);
    await loadChatbots();
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
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-normal text-black no-underline">
            <img
              src="https://assets.aceternity.com/logo-dark.png"
              alt="logo"
              width={30}
              height={30}
            />
            <span className="font-medium text-black">BotForge</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-800 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-800 sm:text-4xl">
              <EncryptedText
                text="Your Chatbots"
                encryptedClassName="text-neutral-400"
                revealedClassName="text-black"
                revealDelayMs={40}
              />
            </h1>
            <p className="mt-2 text-base text-neutral-500">
              Build, train and deploy AI chatbots on any website.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="relative inline-flex h-11 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 cursor-pointer"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 px-5 py-1 text-sm font-medium text-white backdrop-blur-3xl">
              <span className="text-base leading-none">+</span> New Chatbot
            </span>
          </button>
        </div>

        {/* Stats */}
        {!loading && chatbots.length > 0 && (
          <div className="mb-8 flex gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-3">
              <span className="text-xl">🤖</span>
              <div>
                <div className="text-lg font-bold text-neutral-800">
                  {chatbots.length}
                </div>
                <div className="text-xs text-neutral-500">Total Chatbots</div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100"
              />
            ))}
          </div>
        ) : chatbots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 px-6 py-20 transition-colors hover:border-neutral-300">
            <img className="w-20 h-20" src="https://imgs.search.brave.com/m5eGgGA0s9nYv92C_i3C10aJjiU0HTk_gYxlhfvgLq0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA1LzgzLzc0LzI4/LzM2MF9GXzU4Mzc0/Mjg4OF9MMGRJaTVk/MjNxSjJydGVTbFhN/ZU1ER05zbkx4Ymtq/Qi5qcGc" alt="chatbot" />
            <h3 className="mb-1 text-lg font-bold text-neutral-800">
              No chatbots yet
            </h3>
            <p className="mb-6 max-w-sm text-center text-sm text-neutral-500">
              Create your first AI chatbot and deploy it on any website in
              minutes.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 cursor-pointer"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                + Create your first chatbot
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {chatbots.map((bot) => (
              <div
                key={bot.id}
                className="group relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md"
              >
                {/* Color accent */}
                <div
                  className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                  style={{ backgroundColor: bot.color }}
                />

                {/* Header */}
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold"
                      style={{
                        backgroundColor: bot.color + "15",
                        color: bot.color,
                      }}
                    >
                      {bot.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-800">
                        {bot.name}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {new Date(bot.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Welcome message */}
                <p
                  className="mt-3 rounded-lg border-l-[3px] bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-500"
                  style={{ borderLeftColor: bot.color }}
                >
                  &ldquo;{bot.welcome_message}&rdquo;
                </p>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/${bot.id}`}
                    className="flex-1 no-underline"
                  >
                    <button
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 transition-all hover:border-neutral-400 hover:text-neutral-800 cursor-pointer"
                    >
                      Manage →
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteChatbot(bot.id)}
                    disabled={deletingId === bot.id}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-400 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                  >
                    {deletingId === bot.id ? "..." : "🗑"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowModal(false)
          }
        >
          <div className="shadow-input w-full max-w-md rounded-2xl bg-white p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-neutral-800">
                New Chatbot
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <LabelInputContainer>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Chatbot Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createChatbot()}
                  placeholder="e.g. Support Bot, Sales Assistant..."
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400"
                  autoFocus
                />
              </LabelInputContainer>

              <LabelInputContainer>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Welcome Message
                </label>
                <input
                  type="text"
                  value={newWelcome}
                  onChange={(e) => setNewWelcome(e.target.value)}
                  placeholder="Hi! How can I help you?"
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400"
                />
              </LabelInputContainer>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className="h-7 w-7 rounded-full border-2 transition-all cursor-pointer hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: newColor === c ? "#1e293b" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={createChatbot}
                disabled={!newName.trim() || creating}
                className="relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                  {creating ? "Creating..." : "Create Chatbot →"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
