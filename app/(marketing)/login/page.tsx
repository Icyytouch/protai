"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/components/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your ProtAI dashboard."
      footer={
        <>
          New to ProtAI?{" "}
          <Link href="/signup" className="font-medium text-emerald-400 hover:text-emerald-300">
            Create an account
          </Link>
        </>
      }
    >
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
        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            autoComplete="current-password"
          />
        </Field>
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={`${btnPrimaryClass} w-full !py-3`}>
          {loading ? "Logging in…" : "Log in"}
        </button>
        <div className="text-center">
          <Link href="/forgot-password" className="text-sm text-zinc-500 transition hover:text-emerald-300">
            Forgot your password?
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
