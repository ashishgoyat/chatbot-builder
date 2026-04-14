"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowLeft, IconArrowRight, IconLock, IconMail } from "@tabler/icons-react";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="app-shell flex min-h-screen items-center py-10">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl section-enter">
        {success ? (
          <section className="p-7 sm:p-10 reveal-up">
            <span className="chip">Account created</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900">Check your inbox</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              We sent a confirmation link to <span className="font-semibold text-neutral-800">{email}</span>. Open the
              email and verify your account, then login to continue.
            </p>
            <Link href="/login" className="btn-secondary mt-7 no-underline">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </section>
        ) : (
          <div className="grid md:grid-cols-[1.1fr_0.9fr]">
            <section className="border-b border-neutral-200/70 bg-neutral-50/70 p-7 reveal-up md:border-b-0 md:border-r md:p-10">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Get started</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-neutral-900">Create your BotForge workspace.</h1>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                Launch your first support chatbot, train it on your documents, and embed it on any website.
              </p>
              <div className="mt-8 space-y-3 text-sm text-neutral-700">
                <p>1. Sign up with email</p>
                <p>2. Create chatbot</p>
                <p>3. Upload docs and deploy</p>
              </div>
            </section>

            <section className="p-7 reveal-up reveal-delay-1 md:p-10">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Sign up</h2>
              <p className="mt-2 text-sm text-neutral-600">No credit card required.</p>

              <div className="mt-6 space-y-4">
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
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="input-polish pl-10"
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary mt-2 w-full disabled:opacity-60">
                  {loading ? "Creating account..." : "Create account"}
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>

              <p className="mt-6 text-sm text-neutral-600">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-neutral-900 hover:text-indigo-700">
                  Login
                </Link>
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
