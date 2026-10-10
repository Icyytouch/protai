import type { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { appUrl } from "@/lib/stripe";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/docs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/signup`, changeFrequency: "yearly", priority: 0.5 },
  ];

  try {
    const db = createAdminSupabaseClient();
    const { data } = await db
      .from("posts")
      .select("slug,updated_at,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    const posts: MetadataRoute.Sitemap = ((data as Array<{ slug: string; updated_at: string }> | null) ?? []).map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    return [...staticPages, ...posts];
  } catch {
    return staticPages;
  }
}
