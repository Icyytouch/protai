import type { Metadata } from "next";
import { createAdminSupabaseClient } from "./supabase-admin";

export type SeoRow = {
  page_path: string;
  page_label: string;
  title: string;
  description: string;
  keywords: string;
  noindex: boolean;
};

/**
 * Build page metadata: DB override from `seo_meta` wins, fallback otherwise.
 * Called from each page's `generateMetadata`. Server-only (admin client).
 */
export async function pageMetadata(
  pagePath: string,
  fallback: { title: string; description: string; keywords?: string; noindex?: boolean },
): Promise<Metadata> {
  let row: SeoRow | null = null;
  try {
    const db = createAdminSupabaseClient();
    const { data } = await db.from("seo_meta").select("*").eq("page_path", pagePath).maybeSingle();
    row = data as SeoRow | null;
  } catch {
    // table not migrated yet — use fallback
  }
  const title = row?.title ?? fallback.title;
  const description = row?.description ?? fallback.description;
  const keywords = row?.keywords ?? fallback.keywords ?? "";
  const noindex = row?.noindex ?? fallback.noindex ?? false;

  return {
    title,
    description,
    keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: pagePath === "/" ? "https://protai.co.uk" : `https://protai.co.uk${pagePath}`,
      type: "website",
      siteName: "ProtAI",
    },
    twitter: { card: "summary", title, description },
  };
}

/** All rows for the admin SEO panel. Returns [] when the table isn't migrated yet. */
export async function getAllSeo(): Promise<SeoRow[]> {
  try {
    const db = createAdminSupabaseClient();
    const { data } = await db.from("seo_meta").select("*").order("page_path");
    return (data as SeoRow[] | null) ?? [];
  } catch {
    return [];
  }
}
