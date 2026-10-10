"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/components/supabase/client";
import { AuthShell } from "@/components/AuthShell";
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
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Log in
          </Link>
        </>
      }
    >
      {sent ? (
        <>
          <p className="text-sm leading-relaxed text-zinc-400">
            If an account exists for <span className="text-zinc-200">{email}</span>, a reset
            link is on its way. Check your inbox (and spam) — the link expires in an hour.
          </p>
          <Link href="/login" className={`${btnPrimaryClass} mt-6 block text-center !py-3`}>
            Back to log in
          </Link>
        </>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
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
          <button type="submit" disabled={loading} className={`${btnPrimaryClass} w-full !py-3`}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
