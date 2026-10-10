"use client";

import { useState } from "react";
import { inviteMember } from "../_actions";
import type { SiteRole } from "@/lib/roles";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

/** Admin-only form: invite a new team member by email with a chosen role. */
export function InviteForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<SiteRole>("author");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await inviteMember(email, role, name);
    setLoading(false);
    if (res.ok) {
      setMsg({ ok: true, text: `Invite sent to ${email.trim()}. They'll get an email to set up their account.` });
      setEmail("");
      setName("");
    } else {
      setMsg({ ok: false, text: res.error ?? "Could not send the invite." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            className={inputClass}
            autoComplete="off"
          />
        </Field>
        <Field label="Name (optional)">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            className={inputClass}
            autoComplete="off"
          />
        </Field>
      </div>
      <Field label="Role">
        <div className="grid grid-cols-3 gap-2">
          {(["author", "editor", "admin"] as SiteRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition ${
                role === r
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-zinc-600">
          Authors write drafts · Editors publish anything · Admins manage the site and roles
        </p>
      </Field>
      {msg && (
        <p
          className={`rounded-xl border px-3.5 py-2.5 text-sm ${
            msg.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={loading} className={btnPrimaryClass}>
        {loading ? "Sending invite…" : "Send invite"}
      </button>
    </form>
  );
}
