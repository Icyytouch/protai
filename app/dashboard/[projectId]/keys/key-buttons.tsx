"use client";

import { useState } from "react";
import { createApiKey, revokeApiKey } from "@/app/dashboard/_actions";
import { Modal, CopyButton } from "@/components/ui-client";
import { Field, inputClass, btnPrimaryClass, btnSecondaryClass, btnDangerClass } from "@/components/ui";

export function CreateKeyButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function onCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await createApiKey(projectId, name);
      setNewKey(res.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create key.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setName("");
    setError(null);
    // The full key is intentionally discarded here — it was shown once.
    setNewKey(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnPrimaryClass}>
        Create API key
      </button>
      <Modal open={open} onClose={close} title="Create API key">
        {newKey ? (
          <div>
            <p className="text-sm font-medium text-amber-300">
              Copy this key now — you won't see it again.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
              <code className="flex-1 break-all font-mono text-xs text-emerald-300">{newKey}</code>
              <CopyButton text={newKey} />
            </div>
            <button type="button" onClick={close} className={`${btnPrimaryClass} mt-5 w-full`}>
              I've copied it
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Key name" hint="e.g. Production, Staging — so you know where it's used.">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production"
                className={inputClass}
                maxLength={80}
              />
            </Field>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={close} className={btnSecondaryClass}>Cancel</button>
              <button type="button" onClick={onCreate} disabled={loading} className={btnPrimaryClass}>
                {loading ? "Creating…" : "Create key"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export function RevokeKeyButton({ projectId, keyId, keyName }: { projectId: string; keyId: string; keyName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRevoke() {
    setLoading(true);
    setError(null);
    try {
      await revokeApiKey(projectId, keyId);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke key.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-red-300/80 hover:text-red-300">
        Revoke
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Revoke API key?">
        <p className="text-sm text-zinc-400">
          <strong className="text-zinc-100">“{keyName}”</strong> will stop working immediately.
          Any app using it will get <code className="font-mono text-xs">401 Unauthorized</code>.
        </p>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setOpen(false)} className={btnSecondaryClass}>Cancel</button>
          <button type="button" onClick={onRevoke} disabled={loading} className={btnDangerClass}>
            {loading ? "Revoking…" : "Revoke key"}
          </button>
        </div>
      </Modal>
    </>
  );
}
