"use client";

import { useState } from "react";
import { saveSeoMeta } from "@/app/dashboard/admin/_actions";
import type { SeoRow } from "@/lib/page-seo";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

function meter(len: number, min: number, max: number) {
  const ok = len >= min && len <= max;
  const short = len < min;
  return (
    <span className={`font-mono text-xs ${ok ? "text-emerald-400" : short ? "text-amber-400" : "text-red-400"}`}>
      {len} chars {ok ? "✓" : short ? "— too short" : "— too long"}
    </span>
  );
}

/** Google SERP preview, RankMath-style. */
function SerpPreview({ title, description, path }: { title: string; description: string; path: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-white p-4">
      <p className="text-xs text-zinc-600">protai.co.uk{path === "/" ? "" : path}</p>
      <p className="mt-0.5 text-lg leading-snug text-[#1a0dab]">{title || "Page title"}</p>
      <p className="mt-0.5 text-sm leading-snug text-zinc-700">{description || "Meta description…"}</p>
    </div>
  );
}

export function SeoEditor({ row }: { row: SeoRow }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(row.title);
  const [description, setDescription] = useState(row.description);
  const [keywords, setKeywords] = useState(row.keywords);
  const [noindex, setNoindex] = useState(row.noindex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSave() {
    setLoading(true);
    setError(null);
    setSaved(false);
    const res = await saveSeoMeta(row.page_path, { title, description, keywords, noindex });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn't save.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const dirty =
    title !== row.title || description !== row.description || keywords !== row.keywords || noindex !== row.noindex;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <code className="w-24 shrink-0 font-mono text-xs text-emerald-300">{row.page_path}</code>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-zinc-100">{row.page_label}</span>
          <span className="block truncate text-xs text-zinc-500">{title}</span>
        </span>
        {row.noindex && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            noindex
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-zinc-800/60 px-5 py-5">
          {error && (
            <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{error}</p>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-widest text-zinc-500">Meta title</label>
                  {meter(title.length, 30, 60)}
                </div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={inputClass} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-widest text-zinc-500">Meta description</label>
                  {meter(description.length, 70, 155)}
                </div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={320} className={`${inputClass} resize-y`} />
              </div>
              <Field label="Keywords (comma-separated)">
                <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="ai cost control, metered billing" maxLength={300} className={`${inputClass} font-mono text-sm`} />
              </Field>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300">
                <input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} className="accent-emerald-500" />
                Hide from search engines (noindex)
              </label>
              <div className="flex items-center gap-3">
                <button onClick={onSave} disabled={loading || !dirty} className={btnPrimaryClass}>
                  {loading ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
                </button>
                {!dirty && !saved && <span className="text-xs text-zinc-600">No changes</span>}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-zinc-500">Google preview</p>
              <SerpPreview title={title} description={description} path={row.page_path} />
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-xs leading-relaxed text-zinc-500">
                <p className="font-medium text-zinc-300">Tips</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>Put the main keyword near the <strong className="text-zinc-300">start</strong> of the title.</li>
                  <li>Titles get cut off after ~60 characters on Google.</li>
                  <li>Descriptions don't rank you, but a good one gets the click.</li>
                  <li>Keep login/signup on noindex — they add nothing to search.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
