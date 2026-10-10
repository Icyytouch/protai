"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/components/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Make it at least 8 characters."
      footer={
        <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {loading ? "Saving…" : "Set new password"}
        </button>
      </form>
    </AuthShell>
  );
}
