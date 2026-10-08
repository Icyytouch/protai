"use client";

import { useState } from "react";
import { createAlert, deleteAlert } from "@/app/dashboard/_actions";
import { Modal } from "@/components/ui-client";
import { Field, inputClass, btnPrimaryClass, btnSecondaryClass, btnDangerClass } from "@/components/ui";

export function CreateAlertButton({
  projectId,
  meters,
}: {
  projectId: string;
  meters: { id: string; slug: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [meterId, setMeterId] = useState("");
  const [threshold, setThreshold] = useState("80");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createAlert(projectId, { meter_id: meterId || null, threshold_pct: Number(threshold) });
      setOpen(false);
      setMeterId("");
      setThreshold("80");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create alert.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnPrimaryClass}>
        Create alert
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create spend alert">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Meter" hint="Leave on “All meters” for a project-wide burn alert.">
            <select value={meterId} onChange={(e) => setMeterId(e.target.value)} className={inputClass}>
              <option value="">All meters (project-wide)</option>
              {meters.map((m) => (
                <option key={m.id} value={m.id}>{m.slug}</option>
              ))}
            </select>
          </Field>
          <Field label="Threshold %" hint="Email you when a user's spend passes this share of their quota.">
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondaryClass}>Cancel</button>
            <button type="submit" disabled={loading} className={btnPrimaryClass}>
              {loading ? "Creating…" : "Create alert"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteAlertButton({ projectId, alertId }: { projectId: string; alertId: string }) {
  const [loading, setLoading] = useState(false);
  async function onDelete() {
    if (!window.confirm("Delete this alert?")) return;
    setLoading(true);
    try {
      await deleteAlert(projectId, alertId);
    } finally {
      setLoading(false);
    }
  }
  return (
    <button type="button" onClick={onDelete} disabled={loading} className="text-xs text-red-300/80 hover:text-red-300">
      Delete
    </button>
  );
}
