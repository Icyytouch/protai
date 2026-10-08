"use client";

import { useState } from "react";
import { adjustBalance } from "@/app/dashboard/_actions";
import { Modal } from "@/components/ui-client";
import { Field, inputClass, btnPrimaryClass, btnSecondaryClass } from "@/components/ui";

export function AdjustDialog({
  projectId,
  meterId,
  meterSlug,
  endUserId,
  currentBalance,
}: {
  projectId: string;
  meterId: string;
  meterSlug: string;
  endUserId: string;
  currentBalance: number;
}) {
  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adjustBalance(projectId, { meter_id: meterId, end_user_id: endUserId, units: Number(units), note: note || undefined });
      setOpen(false);
      setUnits("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not adjust balance.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-zinc-300 hover:text-white">
        Adjust
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Adjust balance">
        <p className="mb-4 text-sm text-zinc-400">
          User <code className="font-mono text-xs text-zinc-200">{endUserId}</code> · meter{" "}
          <code className="font-mono text-xs text-emerald-300">{meterSlug}</code>
          <br />
          Current balance: <strong className="tabular-nums text-zinc-100">{Number(currentBalance).toLocaleString("en-US")}</strong>
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Units (+ credit, − debit)" hint="e.g. 500 to grant, −200 to deduct.">
            <input
              type="number"
              step="any"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="500"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Note (optional)">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Goodwill credit"
              className={inputClass}
              maxLength={140}
            />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryClass}>Cancel</button>
            <button type="submit" disabled={loading} className={btnPrimaryClass}>
              {loading ? "Adjusting…" : "Apply adjustment"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
