"use client";

import { useState } from "react";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

const subjects = ["General question", "Billing & subscriptions", "Integration help", "Feature request", "Report a bug", "Partnership"];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send your message.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your message.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-8 text-center">
        <p className="text-3xl">✓</p>
        <h3 className="mt-3 font-medium text-zinc-100">Message sent</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Thanks for reaching out — we read everything and reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" maxLength={80} className={inputClass} required />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" maxLength={160} className={inputClass} required />
        </Field>
      </div>
      <Field label="Subject">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass}>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Message">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          rows={6}
          maxLength={5000}
          className={`${inputClass} resize-y`}
          required
        />
      </Field>
      <button type="submit" disabled={loading} className={`${btnPrimaryClass} w-full sm:w-auto`}>
        {loading ? "Sending…" : "Send message"}
      </button>
      <p className="text-xs text-zinc-600">We reply within one business day. No newsletters, no spam — ever.</p>
    </form>
  );
}
