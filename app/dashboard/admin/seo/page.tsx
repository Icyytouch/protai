import { getAllSeo } from "@/lib/page-seo";
import { PageHeader, EmptyState, Card } from "@/components/ui";
import { SeoEditor } from "./seo-editor";

export default async function AdminSeoPage() {
  const rows = await getAllSeo();

  return (
    <>
      <PageHeader
        title="Page SEO"
        sub="Meta titles & descriptions for every page — WordPress-style. Changes go live instantly."
      />

      <Card className="mb-6 border-sky-500/20 bg-sky-500/[0.04]">
        <h2 className="font-medium text-zinc-100">How it works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
          <li>Edit any page's title, description, keywords, or noindex — it overrides the built-in default immediately.</li>
          <li>Blog posts have their own per-post SEO panel in the post editor — this page covers static pages only.</li>
          <li>If the <code className="font-mono text-xs text-emerald-300">seo_meta</code> table is empty, run <code className="font-mono text-xs text-emerald-300">supabase/migrations/09-seo-meta.sql</code> in Supabase first.</li>
        </ul>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No SEO data yet"
          sub="Run supabase/migrations/09-seo-meta.sql in the Supabase SQL editor to seed titles and descriptions for all pages."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <SeoEditor key={row.page_path} row={row} />
          ))}
        </div>
      )}
    </>
  );
}
