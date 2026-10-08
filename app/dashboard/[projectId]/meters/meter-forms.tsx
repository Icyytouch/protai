"use client";

import { useState } from "react";
import { createMeter, updateMeter, deleteMeter } from "@/app/dashboard/_actions";
import { Modal } from "@/components/ui-client";
import { Field, inputClass, btnPrimaryClass, btnSecondaryClass, btnDangerClass, Badge } from "@/components/ui";
import type { Meter } from "@/app/dashboard/_types";

type FormState = { slug: string; unit_label: string; monthly_quota: string; overage: "block" | "allow_alert" };

const emptyForm: FormState = { slug: "", unit_label: "", monthly_quota: "100", overage: "block" };

function MeterForm({
  initial,
  projectId,
  meterId,
  onDone,
}: {
  initial: FormState;
  projectId: string;
  meterId?: string;
  onDone: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const quota = Number(form.monthly_quota);
      if (meterId) {
        await updateMeter(projectId, meterId, { unit_label: form.unit_label, monthly_quota: quota, overage: form.overage });
      } else {
        await createMeter(projectId, { slug: form.slug, unit_label: form.unit_label, monthly_quota: quota, overage: form.overage });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save meter.");
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!meterId && (
        <Field label="Slug" hint="Used in API calls, e.g. protai.check(userId, &quot;tokens&quot;). Lowercase, no spaces.">
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="tokens" className={`${inputClass} font-mono`} maxLength={60} required />
        </Field>
      )}
      <Field label="Unit label" hint="Human-readable unit shown in the dashboard, e.g. Tokens, Generations, Minutes.">
        <input value={form.unit_label} onChange={(e) => set("unit_label", e.target.value)} placeholder="Tokens" className={inputClass} maxLength={40} required />
      </Field>
      <Field label="Monthly free quota" hint="Units each end user gets free per calendar month.">
        <input type="number" min={0} step="any" value={form.monthly_quota} onChange={(e) => set("monthly_quota", e.target.value)} className={inputClass} required />
      </Field>
      <Field label="When quota runs out">
        <select value={form.overage} onChange={(e) => set("overage", e.target.value)} className={inputClass}>
          <option value="block">Hard block — check() returns allowed: false</option>
          <option value="allow_alert">Allow + alert — usage continues, you get emailed</option>
        </select>
      </Field>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className={btnSecondaryClass}>Cancel</button>
        <button type="submit" disabled={loading} className={btnPrimaryClass}>
          {loading ? "Saving…" : meterId ? "Save changes" : "Create meter"}
        </button>
      </div>
    </form>
  );
}

export function MeterButtons({ projectId, meter }: { projectId: string; meter: Meter }) {
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setLoading(true);
    setError(null);
    try {
      await deleteMeter(projectId, meter.id);
      setMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete meter.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setMode("edit")} className="text-xs text-zinc-300 hover:text-white">Edit</button>
      <span className="mx-2 text-zinc-700">·</span>
      <button type="button" onClick={() => setMode("delete")} className="text-xs text-red-300/80 hover:text-red-300">Delete</button>

      <Modal open={mode === "edit"} onClose={() => setMode(null)} title={`Edit meter “${meter.slug}”`}>
        <MeterForm
          projectId={projectId}
          meterId={meter.id}
          onDone={() => setMode(null)}
          initial={{
            slug: meter.slug,
            unit_label: meter.unit_label,
            monthly_quota: String(meter.monthly_quota),
            overage: meter.overage,
          }}
        />
      </Modal>

      <Modal open={mode === "delete"} onClose={() => setMode(null)} title={`Delete meter “${meter.slug}”?`}>
        <p className="text-sm text-zinc-400">
          Balances and ledger history for this meter will be deleted too. API calls using this slug will fail.
        </p>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setMode(null)} className={btnSecondaryClass}>Cancel</button>
          <button type="button" onClick={onDelete} disabled={loading} className={btnDangerClass}>
            {loading ? "Deleting…" : "Delete meter"}
          </button>
        </div>
      </Modal>
    </>
  );
}

export function CreateMeterButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnPrimaryClass}>
        Create meter
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create meter">
        <MeterForm projectId={projectId} initial={emptyForm} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function OverageBadge({ overage }: { overage: Meter["overage"] }) {
  return overage === "block" ? (
    <Badge tone="amber">Hard block</Badge>
  ) : (
    <Badge tone="blue">Allow + alert</Badge>
  );
}
