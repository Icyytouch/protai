"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/components/supabase/client";
import { Logo } from "@/components/Logo";
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
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">Log in to your ProtAI dashboard.</p>
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
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className={`${btnPrimaryClass} w-full`}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        New to ProtAI?{" "}
        <Link href="/signup" className="font-medium text-emerald-400 hover:text-emerald-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
