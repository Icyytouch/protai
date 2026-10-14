"use client";

import { useCallback, useEffect, useState } from "react";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-key";
import { btnPrimaryClass, btnSecondaryClass } from "@/components/ui";

type Status = "loading" | "unsupported" | "denied" | "on" | "off";

/** Toggle push notifications for spend alerts on this device. */
export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    } catch {
      setStatus("unsupported");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        throw new Error("Couldn't save. Try again.");
      }
      setStatus("on");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      if (sub) await sub.unsubscribe();
      if (endpoint) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setStatus("off");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-zinc-500">Checking notification support…</p>;
  }
  if (status === "unsupported") {
    return (
      <p className="text-sm text-zinc-500">
        Push isn't supported in this browser. Email alerts still work.
      </p>
    );
  }
  if (status === "denied") {
    return (
      <p className="text-sm text-zinc-500">
        Notifications are blocked for this site — allow them in your browser settings to get
        spend alerts on your phone.
      </p>
    );
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-300">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={status === "on" ? disable : enable}
          disabled={busy}
          className={status === "on" ? btnSecondaryClass : btnPrimaryClass}
        >
          {busy ? "Working…" : status === "on" ? "Mute phone alerts" : "Enable phone alerts"}
        </button>
        {status === "on" && (
          <span className="flex items-center gap-2 text-sm text-emerald-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Alerts on for this device
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Threshold breaches, quota exhausted, and kill-switch events — straight to your phone.
      </p>
    </div>
  );
}
