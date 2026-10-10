"use client";

import { useMemo } from "react";
import { analyzeSeo, seoGrade, type SeoInput } from "@/lib/seo";
import { inputClass } from "@/components/ui";

export function SeoPanel({ input, onChange }: {
  input: SeoInput & { metaTitle: string; metaDescription: string; ogImage: string };
  onChange: (patch: Partial<SeoInput & { ogImage: string }>) => void;
}) {
  const { score, checks, wordCount } = useMemo(() => analyzeSeo(input), [input]);
  const grade = seoGrade(score);
  const radius = 26;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="#27272a" strokeWidth="7" />
            <circle
              cx="32" cy="32" r={radius} fill="none"
              stroke={score >= 80 ? "#34d399" : score >= 60 ? "#a3e635" : score >= 40 ? "#fbbf24" : "#f87171"}
              strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ - (circ * score) / 100}
              className="transition-all"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold text-zinc-100">
            {score}
          </span>
        </div>
        <div>
          <p className={`text-sm font-semibold ${grade.color}`}>{grade.label}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{wordCount} words · {checks.filter((c) => c.passed).length}/{checks.length} checks passing</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Search appearance</p>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Focus keyword</label>
          <input
            value={input.focusKeyword}
            onChange={(e) => onChange({ focusKeyword: e.target.value })}
            placeholder="e.g. ai credit metering"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            SEO title <span className="text-zinc-600">({(input.metaTitle || input.title).length} chars)</span>
          </label>
          <input
            value={input.metaTitle}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
            placeholder="Defaults to the post title"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Meta description <span className="text-zinc-600">({input.metaDescription.trim().length} chars)</span>
          </label>
          <textarea
            value={input.metaDescription}
            onChange={(e) => onChange({ metaDescription: e.target.value })}
            rows={3}
            placeholder="The snippet shown under your title in search results."
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">URL slug</label>
          <div className="flex items-center gap-0">
            <span className="rounded-l-xl border border-r-0 border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-500">/blog/</span>
            <input
              value={input.slug}
              onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              className={`${inputClass} rounded-l-none font-mono`}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">OG image URL <span className="text-zinc-600">(optional)</span></label>
          <input
            value={input.ogImage}
            onChange={(e) => onChange({ ogImage: e.target.value })}
            placeholder="https://…"
            className={inputClass}
          />
        </div>

        {/* Google preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">Search preview</p>
          <p className="text-[15px] leading-snug text-[#8ab4f8]">{input.metaTitle.trim() || input.title.trim() || "Your post title"}</p>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">protai.co.uk/blog/{input.slug || "your-slug"}</p>
          <p className="mt-1.5 text-[13px] leading-snug text-zinc-400">
            {input.metaDescription.trim() || "Your meta description will appear here. Write something that earns the click."}
          </p>
        </div>
      </div>

      {/* Checks */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">SEO checks</p>
        <ul className="space-y-2.5">
          {checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                c.passed ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-500"
              }`}>
                {c.passed ? "✓" : "·"}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-zinc-200">
                  {c.label}
                  <span className="ml-1.5 font-mono text-[11px] text-zinc-500">{c.score}/{c.max}</span>
                </p>
                <p className="text-xs text-zinc-500">{c.hint}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
