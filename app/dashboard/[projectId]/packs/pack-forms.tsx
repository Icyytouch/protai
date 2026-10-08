"use client";

import { useState } from "react";
import { createPack, updatePack, deletePack } from "@/app/dashboard/_actions";
import { Modal, CopyButton } from "@/components/ui-client";
import { Field, inputClass, btnPrimaryClass, btnSecondaryClass, btnDangerClass, Badge } from "@/components/ui";
import type { CreditPack } from "@/app/dashboard/_types";

type FormState = { name: string; units: string; price_usd: string; active: boolean };

const emptyForm: FormState = { name: "", units: "1000", price_usd: "9", active: true };

function PackForm({
  projectId,
  pack,
  onDone,
}: {
  projectId: string;
  pack?: CreditPack;
  onDone: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    pack
      ? {
          name: pack.name,
          units: String(pack.units),
          price_usd: String(pack.price_cents / 100),
          active: pack.active,
        }
      : emptyForm
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        units: Number(form.units),
        price_usd: Number(form.price_usd),
        active: form.active,
      };
      if (pack) await updatePack(projectId, pack.id, payload);
      else await createPack(projectId, payload);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save pack.");
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Pack name">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="1,000 generations" className={inputClass} maxLength={80} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Units granted">
          <input type="number" min={1} step="any" value={form.units} onChange={(e) => set("units", e.target.value)} className={inputClass} required />
        </Field>
        <Field label="Price (USD)">
          <input type="number" min={0.5} step="0.01" value={form.price_usd} onChange={(e) => set("price_usd", e.target.value)} className={inputClass} required />
        </Field>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set("active", e.target.checked)}
          className="h-4 w-4 rounded accent-emerald-500"
        />
        Active (available for purchase)
      </label>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className={btnSecondaryClass}>Cancel</button>
        <button type="submit" disabled={loading} className={btnPrimaryClass}>
          {loading ? "Saving…" : pack ? "Save changes" : "Create pack"}
        </button>
      </div>
    </form>
  );
}

export function PackButtons({ projectId, pack }: { projectId: string; pack: CreditPack }) {
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setLoading(true);
    setError(null);
    try {
      await deletePack(projectId, pack.id);
      setMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete pack.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setMode("edit")} className="text-xs text-zinc-300 hover:text-white">Edit</button>
      <span className="mx-2 text-zinc-700">·</span>
      <button type="button" onClick={() => setMode("delete")} className="text-xs text-red-300/80 hover:text-red-300">Delete</button>

      <Modal open={mode === "edit"} onClose={() => setMode(null)} title={`Edit pack “${pack.name}”`}>
        <PackForm projectId={projectId} pack={pack} onDone={() => setMode(null)} />
      </Modal>

      <Modal open={mode === "delete"} onClose={() => setMode(null)} title={`Delete pack “${pack.name}”?`}>
        <p className="text-sm text-zinc-400">New purchases of this pack will stop working. Past purchases are unaffected.</p>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setMode(null)} className={btnSecondaryClass}>Cancel</button>
          <button type="button" onClick={onDelete} disabled={loading} className={btnDangerClass}>
            {loading ? "Deleting…" : "Delete pack"}
          </button>
        </div>
      </Modal>
    </>
  );
}

export function CreatePackButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnPrimaryClass}>
        Create pack
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create credit pack">
        <PackForm projectId={projectId} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function PackLinkCell({ pack }: { pack: CreditPack }) {
  const snippet = `{"pack_id": "${pack.id}", "meter_slug": "generations", "end_user_id": "user_123"}`;
  return (
    <span className="inline-flex items-center gap-2">
      {!pack.active && <Badge tone="neutral">Inactive</Badge>}
      <CopyButton text={pack.id} label="Copy pack ID" />
      <span className="hidden xl:inline" title="POST this JSON to /api/v1/packs/checkout with your API key">
        <CopyButton text={snippet} label="Copy API snippet" />
      </span>
    </span>
  );
}
