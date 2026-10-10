"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/components/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free for 1 project. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Log in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm leading-relaxed text-emerald-200">
          Check your inbox — we sent a confirmation link to <strong>{email}</strong>.
          Click it, then log in to reach your dashboard.
        </div>
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
          <Field label="Password" hint="At least 8 characters.">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              autoComplete="new-password"
            />
          </Field>
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className={`${btnPrimaryClass} w-full !py-3`}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
