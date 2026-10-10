"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/components/supabase/client";
import { Logo } from "@/components/Logo";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

function baseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${baseUrl()}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Reset your password</h1>
        {sent ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              If an account exists for <span className="text-zinc-200">{email}</span>, a reset
              link is on its way. Check your inbox (and spam) — the link expires in an hour.
            </p>
            <Link href="/login" className={`${btnPrimaryClass} mt-6 block text-center`}>
              Back to log in
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-zinc-500">Enter your account email and we'll send you a reset link.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  autoComplete="email"
                />
              </Field>
              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className={`${btnPrimaryClass} w-full`}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
          Log in
        </Link>
      </p>
    </div>
  );
}
