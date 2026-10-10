import Link from "next/link";
import type { Metadata } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// Blog index is dynamic (from the database) — render on demand, not at build time.
export const instant = false;

export const metadata: Metadata = {
  title: "Blog — ProtAI",
  description: "Practical guides on AI cost control, credit metering, and keeping your token bill under control.",
};

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  created_at: string;
};

async function getPosts(): Promise<Post[]> {
  try {
    const db = createAdminSupabaseClient();
    const { data } = await db
      .from("posts")
      .select("slug,title,excerpt,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    return (data as Post[]) ?? [];
  } catch {
    return [];
  }
}

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">Blog</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
        Notes on keeping AI bills small
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-400">
        Practical guides on credit metering, usage guardrails, and the unglamorous
        work of not overpaying for tokens.
      </p>

      <div className="mt-12 space-y-5">
        {posts.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center">
            <p className="font-medium text-zinc-200">Nothing published yet.</p>
            <p className="mt-2 text-sm text-zinc-500">Check back soon — we're writing the first posts.</p>
          </div>
        )}
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group block rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-zinc-700 sm:p-8"
          >
            <p className="text-xs text-zinc-500">
              {new Date(p.published_at ?? p.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50 group-hover:text-emerald-200 sm:text-2xl">
              {p.title}
            </h2>
            {p.excerpt && <p className="mt-2 leading-relaxed text-zinc-400">{p.excerpt}</p>}
            <p className="mt-4 text-sm font-medium text-emerald-300">
              Read more <span aria-hidden>→</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
