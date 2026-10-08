"use client";

import { useState } from "react";
import { btnPrimaryClass, btnSecondaryClass } from "@/components/ui";

async function postJson(path: string, body: unknown): Promise<{ url?: string; error?: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: text || `Request failed (${res.status})` };
    }
    return (await res.json()) as { url?: string };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
}

export function CheckoutButton({
  projectId,
  tier,
  label,
  primary,
}: {
  projectId: string;
  tier: "starter" | "pro";
  label: string;
  primary?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const res = await postJson("/api/stripe/checkout", { project_id: projectId, tier });
    if (res.url) {
      window.location.href = res.url;
    } else {
      setError(
        res.error && res.error.length < 200
          ? res.error
          : "Checkout is not available yet — billing is still being connected. Please try again shortly."
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={onClick} disabled={loading} className={primary ? btnPrimaryClass : btnSecondaryClass}>
        {loading ? "Redirecting…" : label}
      </button>
      {error && <p className="mt-2 max-w-xs text-xs text-red-300">{error}</p>}
    </div>
  );
}

export function PortalButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const res = await postJson("/api/stripe/portal", { project_id: projectId });
    if (res.url) {
      window.location.href = res.url;
    } else {
      setError("The billing portal is not available yet. Please try again shortly.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={onClick} disabled={loading} className={btnSecondaryClass}>
        {loading ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
