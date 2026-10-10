"use client";

import { useState } from "react";
import { createWebhook, deleteWebhook, sendTestWebhook } from "@/app/dashboard/_actions";
import { WEBHOOK_EVENTS } from "@/lib/webhook-events";
import { Modal } from "@/components/ui-client";
import { Field, inputClass, btnPrimaryClass, btnSecondaryClass, btnDangerClass } from "@/components/ui";

export function CreateWebhookButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(WEBHOOK_EVENTS.map((e) => e.id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  function toggleEvent(id: string) {
    setEvents((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createWebhook(projectId, { url, events });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Could not create the webhook.");
      return;
    }
    // Show the signing secret ONCE.
    setSecret(res.secret ?? null);
  }

  function close() {
    setOpen(false);
    setUrl("");
    setEvents(WEBHOOK_EVENTS.map((e) => e.id));
    setSecret(null);
    setError(null);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={btnPrimaryClass}>
        Add webhook
      </button>
      <Modal open={open} onClose={close} title="Add webhook endpoint">
        {secret ? (
          <>
            <p className="text-sm text-zinc-400">
              Save this signing secret now — it's shown only once. Verify the{" "}
              <code className="font-mono text-xs text-emerald-300">X-ProtAI-Signature</code> header with it.
            </p>
            <code className="mt-3 block break-all rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 font-mono text-sm text-emerald-300">
              {secret}
            </code>
            <div className="mt-5 flex justify-end">
              <button onClick={close} className={btnPrimaryClass}>
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{error}</p>}
            <Field label="Endpoint URL (https)">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-app.com/webhooks/protai"
                className={`${inputClass} font-mono`}
                autoFocus
              />
            </Field>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">Events</p>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map((e) => (
                  <label key={e.id} className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                    <input
                      type="checkbox"
                      checked={events.includes(e.id)}
                      onChange={() => toggleEvent(e.id)}
                      className="mt-1 accent-emerald-500"
                    />
                    <span>
                      <span className="block text-sm text-zinc-200">{e.label}</span>
                      <span className="block text-xs text-zinc-500">{e.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={close} className={btnSecondaryClass}>Cancel</button>
              <button type="submit" disabled={loading || !url.trim()} className={btnPrimaryClass}>
                {loading ? "Creating…" : "Create webhook"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export function WebhookActions({ projectId, webhookId }: { projectId: string; webhookId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function test() {
    setLoading(true);
    setMessage(null);
    const res = await sendTestWebhook(projectId, webhookId);
    setLoading(false);
    setMessage(res.ok ? "Test delivered — check your endpoint logs." : (res.error ?? "Test failed."));
  }

  async function remove() {
    if (!confirm("Delete this webhook endpoint?")) return;
    setLoading(true);
    try {
      await deleteWebhook(projectId, webhookId);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button onClick={test} disabled={loading} className={btnSecondaryClass}>
        {loading ? "…" : "Send test"}
      </button>
      <button onClick={remove} disabled={loading} className={btnDangerClass}>
        Delete
      </button>
      {message && <span className="text-xs text-zinc-500">{message}</span>}
    </div>
  );
}
