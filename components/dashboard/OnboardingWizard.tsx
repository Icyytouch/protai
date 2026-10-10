"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { wizardCreateProject, wizardCreateMeter, wizardCreateKey } from "@/app/dashboard/_actions";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

const STEPS = ["Project", "Meter", "API key", "Test call"];

/** Guided first-time setup: project → meter → key → live test call. */
export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [meterSlug, setMeterSlug] = useState("tokens");
  const [unitLabel, setUnitLabel] = useState("Tokens");
  const [quota, setQuota] = useState(100);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function next() {
    setError(null);
    setLoading(true);
    try {
      if (step === 0) {
        const res = await wizardCreateProject(projectName);
        if (!res.ok || !res.id) throw new Error(res.error);
        setProjectId(res.id);
      } else if (step === 1 && projectId) {
        const res = await wizardCreateMeter(projectId, { slug: meterSlug, unit_label: unitLabel, monthly_quota: quota });
        if (!res.ok) throw new Error(res.error);
      } else if (step === 2 && projectId) {
        const res = await wizardCreateKey(projectId);
        if (!res.ok || !res.key) throw new Error(res.error);
        setApiKey(res.key);
      }
      setStep((s) => s + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function testCall() {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ end_user_id: "wizard_demo", meter: meterSlug.trim() || "tokens", units: 1 }),
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch {
      setError("The test call failed. Your key still works — try it from your app.");
    } finally {
      setLoading(false);
    }
  }

  function copyKey() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* progress */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                  i < step ? "bg-emerald-500 text-zinc-950" : i === step ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50" : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className={`hidden text-sm sm:block ${i === step ? "text-zinc-100" : "text-zinc-500"}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-emerald-500/60" : "bg-zinc-800"}`} />}
          </div>
        ))}
      </div>

      <div className="border-beam rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
        {error && (
          <p className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{error}</p>
        )}

        {step === 0 && (
          <>
            <h2 className="text-xl font-semibold text-zinc-50">Name your project</h2>
            <p className="mt-1 text-sm text-zinc-500">One project per AI app. You can add more later.</p>
            <div className="mt-5">
              <Field label="Project name">
                <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="My AI app" maxLength={80} className={inputClass} autoFocus />
              </Field>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold text-zinc-50">Create your first meter</h2>
            <p className="mt-1 text-sm text-zinc-500">A meter is anything you bill usage for — tokens, generations, minutes.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Slug (used in API calls)">
                <input value={meterSlug} onChange={(e) => setMeterSlug(e.target.value)} placeholder="tokens" className={`${inputClass} font-mono`} />
              </Field>
              <Field label="Unit label">
                <input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="Tokens" className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Free monthly quota per user">
                  <input type="number" min={0} value={quota} onChange={(e) => setQuota(Number(e.target.value))} className={`${inputClass} font-mono`} />
                </Field>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold text-zinc-50">Your API key</h2>
            <p className="mt-1 text-sm text-zinc-500">Keep this secret. It won't be shown again.</p>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3.5">
              <code className="flex-1 truncate font-mono text-sm text-emerald-300">{apiKey ?? "…"}</code>
              <button onClick={copyKey} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold text-zinc-50">Make your first call</h2>
            <p className="mt-1 text-sm text-zinc-500">This hits the real API with your new key.</p>
            <div className="mt-5">
              {!testResult ? (
                <button onClick={testCall} disabled={loading} className={`${btnPrimaryClass} w-full`}>
                  {loading ? "Calling…" : "Run test check() call"}
                </button>
              ) : (
                <>
                  <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 font-mono text-xs leading-relaxed text-emerald-200">
                    {testResult}
                  </pre>
                  <p className="mt-3 text-sm text-zinc-400">It works. Your app is now metered.</p>
                </>
              )}
            </div>
          </>
        )}

        <div className="mt-7 flex items-center justify-between">
          {step < 3 ? (
            <>
              <span className="text-xs text-zinc-600">Step {step + 1} of 4</span>
              <button onClick={next} disabled={loading || (step === 0 && !projectName.trim())} className={btnPrimaryClass}>
                {loading ? "Working…" : step === 2 ? "Generate key" : "Continue"}
              </button>
            </>
          ) : (
            <>
              <Link href="/docs" className="text-sm text-zinc-500 transition hover:text-emerald-300">Read the docs</Link>
              <button onClick={() => projectId && router.push(`/dashboard/${projectId}`)} className={btnPrimaryClass}>
                Go to dashboard →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
