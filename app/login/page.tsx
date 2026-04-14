"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowRight, IconLock, IconMail } from "@tabler/icons-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="app-shell flex min-h-screen items-center py-10">
      <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl section-enter md:grid-cols-2">
        <section className="relative hidden border-r border-neutral-200/60 bg-gradient-to-br from-indigo-600 to-sky-600 p-8 text-white md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_45%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Welcome back</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight">Manage your chatbot workspace with confidence.</h1>
              <p className="mt-4 text-sm text-indigo-100/90">
                Access your bots, monitor training data, and keep your embedded support assistant updated.
              </p>
            </div>
            <p className="text-xs text-indigo-100/80">BotForge dashboard</p>
          </div>
        </section>

        <section className="p-6 sm:p-8">
          <div className="mb-8 reveal-up">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Account</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">Login</h2>
            <p className="mt-2 text-sm text-neutral-600">Continue building your AI assistant.</p>
          </div>

          <div className="space-y-4 reveal-up reveal-delay-1">
            <div>
              <Label htmlFor="email" className="mb-1.5 inline-block">Email</Label>
              <div className="relative">
                <IconMail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-polish pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="mb-1.5 inline-block">Password</Label>
              <div className="relative">
                <IconLock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="input-polish pl-10"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary mt-2 w-full disabled:opacity-60">
              {loading ? "Logging in..." : "Login"}
              <IconArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>

          <p className="mt-6 text-sm text-neutral-600">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-neutral-900 hover:text-indigo-700">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
