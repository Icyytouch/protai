import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { appUrl } from "@/lib/stripe";

// Blog posts are dynamic (from the database) — render on demand, not at build time.
export const instant = false;

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

async function getPost(slug: string): Promise<Post | null> {
  try {
    const db = createAdminSupabaseClient();
    const { data } = await db
      .from("posts")
      .select("slug,title,excerpt,content,meta_title,meta_description,og_image,published_at,created_at,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    return (data as Post | null) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const base = appUrl();
  const title = post.meta_title?.trim() || post.title;
  const description = post.meta_description?.trim() || post.excerpt || undefined;
  const url = `${base}/blog/${post.slug}`;
  return {
    title: `${title} — ProtAI`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      images: post.og_image ? [{ url: post.og_image }] : undefined,
    },
    twitter: {
      card: post.og_image ? "summary_large_image" : "summary",
      title,
      description,
      images: post.og_image ? [post.og_image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const base = appUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description?.trim() || post.excerpt || undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: `${base}/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: "ProtAI", url: base },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="text-sm text-zinc-500 transition hover:text-zinc-200">
        ← All posts
      </Link>

      <p className="mt-8 text-sm text-zinc-500">
        {new Date(post.published_at ?? post.created_at).toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        })}
        {" · ProtAI"}
      </p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
        {post.title}
      </h1>
      {post.excerpt && (
        <p className="mt-5 text-lg leading-relaxed text-zinc-400">{post.excerpt}</p>
      )}

      <div
        className="prose prose-invert prose-zinc mt-10 max-w-none text-[16px] leading-relaxed text-zinc-300 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-zinc-50 prose-a:text-emerald-300 prose-strong:text-zinc-100 prose-code:rounded prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[14px] prose-code:text-emerald-200 prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-emerald-500/50 prose-blockquote:text-zinc-400 prose-img:rounded-2xl"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="mt-14 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h2 className="text-xl font-semibold text-zinc-50">Stop guessing about your token bill.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
          ProtAI gives every user a balance, alerts you before spend spikes, and kills runaway usage automatically.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-block rounded-xl bg-emerald-500 px-7 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Start free
        </Link>
      </div>
    </article>
  );
}
