"use client";

import { useState } from "react";
import { toggleKillSwitch } from "@/app/dashboard/_actions";
import { Modal } from "@/components/ui-client";
import { btnDangerClass, btnSecondaryClass } from "@/components/ui";

export function KillSwitchToggle({
  projectId,
  projectName,
  enabled,
}: {
  projectId: string;
  projectName: string;
  enabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await toggleKillSwitch(projectId, !enabled);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update kill-switch.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={enabled ? btnSecondaryClass : btnDangerClass}
      >
        {enabled ? "Turn kill-switch OFF" : "Turn kill-switch ON"}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={enabled ? "Disable kill-switch?" : "Enable kill-switch?"}
      >
        {enabled ? (
          <p className="text-sm text-zinc-400">
            Usage checks for <strong className="text-zinc-100">“{projectName}”</strong> will work
            normally again. Make sure your spend is under control first.
          </p>
        ) : (
          <p className="text-sm text-zinc-400">
            This immediately denies <strong className="text-zinc-100">every</strong> check() call
            for <strong className="text-zinc-100">“{projectName}”</strong> with reason{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-red-300">killed</code>.
            Use it when spend is out of control.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setOpen(false)} className={btnSecondaryClass}>
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={loading} className={enabled ? btnPrimaryClassFallback : btnDangerClass}>
            {loading ? "Working…" : enabled ? "Turn OFF" : "Turn ON now"}
          </button>
        </div>
      </Modal>
    </>
  );
}

const btnPrimaryClassFallback =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed";
