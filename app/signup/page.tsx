"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EncryptedText } from "@/components/ui/encrypted-text";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClient();
  const router = useRouter();

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 text-center mt-20 mb-4">
          Check your email
        </h2>
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mb-8">
          We&apos;ve sent a confirmation link to <span className="font-semibold text-neutral-800 dark:text-white">{email}</span>. Click it to activate your account.
        </p>
        <div className="text-center">
          <Link href="/login" className="font-semibold text-neutral-800 dark:text-white hover:underline text-sm">
            ← Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-4xl font-extrabold text-neutral-800 dark:text-neutral-200 text-center my-20">
        <EncryptedText
          text="Start Building."
          encryptedClassName="text-neutral-500"
          revealedClassName="dark:text-white text-black"
          revealDelayMs={50}
        />
      </h2>

      <div className="my-8">
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" placeholder="projectmayhem@fc.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input id="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </LabelInputContainer>

        {error && (
          <p className="mb-4 text-sm text-red-500 text-center">{error}</p>
        )}

        <button type="button" onClick={handleSubmit} disabled={loading} className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 w-full disabled:opacity-50">
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            {loading ? "Creating account..." : "Sign up →"}
          </span>
          <BottomGradient />
        </button>

        <p className="text-center text-xs text-neutral-600 dark:text-neutral-400 mt-8">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
        <div className="flex flex-col space-y-4">
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-neutral-800 dark:text-white hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

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