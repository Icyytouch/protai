import type { Metadata } from "next";
import { cacheTag, updateTag } from "next/cache";
import { createAdminSupabaseClient } from "./supabase-admin";

export type SeoRow = {
  page_path: string;
  page_label: string;
  title: string;
  description: string;
  keywords: string;
  noindex: boolean;
};

export const PAGE_SEO_TAG = "page-seo";

/**
 * SEO settings live in a private Storage bucket as JSON — the app creates the
 * bucket + file itself on first use, so there is no SQL migration to run.
 */
const BUCKET = "site-config";
const FILE = "page-seo.json";

/** Built-in defaults. Used until the admin edits something in Page SEO. */
export const SEO_SEEDS: SeoRow[] = [
  {
    page_path: "/",
    page_label: "Homepage",
    title: "ProtAI: AI Cost Control & Metered Billing for AI Apps",
    description:
      "Stop runaway AI spend. ProtAI gives every user a credit balance with quotas, alerts and a kill-switch for OpenAI, Anthropic and any LLM. Live in 3 lines of code.",
    keywords: "AI cost control, metered billing AI, AI API cost management, LLM spend tracking, usage based billing AI",
    noindex: false,
  },
  {
    page_path: "/docs",
    page_label: "Documentation",
    title: "ProtAI Docs: Meter AI Usage in 5 Minutes (JS, Python, cURL)",
    description:
      "Integrate ProtAI in 5 minutes. Check credit balances before you spend, report usage after — with copy-paste quickstarts for Next.js, Express and FastAPI.",
    keywords: "ProtAI docs, AI metering API, check credit balance API, token usage API",
    noindex: false,
  },
  {
    page_path: "/blog",
    page_label: "Blog",
    title: "ProtAI Blog: AI Cost Control Guides & LLM Pricing Breakdowns",
    description:
      "Practical guides to controlling AI API costs — token pricing breakdowns, quota strategies and metering patterns for OpenAI, Anthropic and more.",
    keywords: "AI cost control blog, LLM pricing guide, OpenAI cost optimization",
    noindex: false,
  },
  {
    page_path: "/about",
    page_label: "About",
    title: "About ProtAI: Credit Metering Built for AI App Builders",
    description:
      "ProtAI exists for one reason: AI apps should not go broke on token bills. Learn why we built per-user credit metering with guardrails.",
    keywords: "about ProtAI, AI cost control company",
    noindex: false,
  },
  {
    page_path: "/contact",
    page_label: "Contact",
    title: "Contact ProtAI: Talk to Our Team",
    description:
      "Questions about billing, integration help or partnerships? Message the ProtAI team — we reply within one business day.",
    keywords: "contact ProtAI, ProtAI support",
    noindex: false,
  },
  {
    page_path: "/security",
    page_label: "Security",
    title: "ProtAI Security: No-Proxy Architecture & Data Protection",
    description:
      "How ProtAI protects your data — no-proxy architecture, hashed API keys, encryption everywhere and responsible disclosure.",
    keywords: "ProtAI security, AI metering security",
    noindex: false,
  },
  {
    page_path: "/terms",
    page_label: "Terms of Service",
    title: "ProtAI Terms of Service",
    description: "The terms governing your use of ProtAI credit metering — plans, billing, API fair use and liability.",
    keywords: "",
    noindex: false,
  },
  {
    page_path: "/privacy",
    page_label: "Privacy Policy",
    title: "ProtAI Privacy Policy (UK GDPR)",
    description:
      "How ProtAI collects, uses and protects your data — and your rights under UK GDPR. We never see your prompts.",
    keywords: "",
    noindex: false,
  },
  {
    page_path: "/refunds",
    page_label: "Refund Policy",
    title: "ProtAI Refund Policy",
    description: "How refunds work at ProtAI — cancel anytime, keep access until the end of your paid month.",
    keywords: "",
    noindex: false,
  },
  {
    page_path: "/login",
    page_label: "Login",
    title: "Log in to ProtAI",
    description: "Log in to your ProtAI dashboard to manage meters, quotas and API keys.",
    keywords: "",
    noindex: true,
  },
  {
    page_path: "/signup",
    page_label: "Sign up",
    title: "Start Free with ProtAI",
    description:
      "Create a free ProtAI account — per-user credit metering for your AI app in 3 lines of code. No credit card.",
    keywords: "ProtAI signup, free AI metering",
    noindex: true,
  },
];

type Db = ReturnType<typeof createAdminSupabaseClient>;

async function ensureBucket(db: Db): Promise<void> {
  const { error } = await db.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
}

function toBlob(rows: SeoRow[]): Blob {
  return new Blob([JSON.stringify(rows)], { type: "application/json" });
}

/** Read config from Storage, creating bucket + seed file on first use. Never throws. */
async function readConfig(db: Db): Promise<SeoRow[]> {
  await ensureBucket(db);
  const { data, error } = await db.storage.from(BUCKET).download(FILE);
  if (error || !data) {
    await db.storage.from(BUCKET).upload(FILE, toBlob(SEO_SEEDS), {
      upsert: true,
      contentType: "application/json",
    });
    return SEO_SEEDS;
  }
  try {
    const rows = JSON.parse(await data.text()) as SeoRow[];
    return Array.isArray(rows) && rows.length > 0 ? rows : SEO_SEEDS;
  } catch {
    return SEO_SEEDS;
  }
}

/** Write the full config back to Storage. Throws on failure. */
export async function writeConfig(rows: SeoRow[]): Promise<void> {
  const db = createAdminSupabaseClient();
  await ensureBucket(db);
  const { error } = await db.storage.from(BUCKET).upload(FILE, toBlob(rows), {
    upsert: true,
    contentType: "application/json",
  });
  if (error) throw new Error(error.message);
}

/** Cached read — lets generateMetadata stay fast while remaining editable. */
async function getRows(): Promise<SeoRow[]> {
  "use cache";
  cacheTag(PAGE_SEO_TAG);
  try {
    const db = createAdminSupabaseClient();
    return await readConfig(db);
  } catch {
    return SEO_SEEDS;
  }
}

/** Invalidate cached page metadata after an admin edit. */
export function revalidatePageSeo() {
  updateTag(PAGE_SEO_TAG);
}

function seedFor(pagePath: string): SeoRow {
  return (
    SEO_SEEDS.find((r) => r.page_path === pagePath) ?? {
      page_path: pagePath,
      page_label: pagePath,
      title: "ProtAI",
      description: "Per-user credit metering and guardrails for AI apps.",
      keywords: "",
      noindex: false,
    }
  );
}

/**
 * Build page metadata: admin override from Storage wins, built-in default otherwise.
 * Called from each page's `generateMetadata`. Server-only.
 */
export async function pageMetadata(
  pagePath: string,
  fallback: { title: string; description: string; keywords?: string; noindex?: boolean },
): Promise<Metadata> {
  const rows = await getRows();
  const row = rows.find((r) => r.page_path === pagePath);
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

/** All rows for the admin SEO panel. */
export async function getAllSeo(): Promise<SeoRow[]> {
  return getRows();
}

/** Upsert a single page's row and persist. Used by the admin save action. */
export async function saveSeoRow(
  pagePath: string,
  input: { title: string; description: string; keywords: string; noindex: boolean },
): Promise<void> {
  const db = createAdminSupabaseClient();
  const rows = await readConfig(db);
  const base = rows.find((r) => r.page_path === pagePath) ?? seedFor(pagePath);
  const next: SeoRow = {
    ...base,
    page_path: pagePath,
    title: input.title.trim().slice(0, 120),
    description: input.description.trim().slice(0, 320),
    keywords: input.keywords.trim().slice(0, 300),
    noindex: input.noindex,
  };
  if (!next.title) throw new Error("Title is required.");
  if (!next.description) throw new Error("Description is required.");
  const idx = rows.findIndex((r) => r.page_path === pagePath);
  const updated = idx >= 0 ? rows.map((r, i) => (i === idx ? next : r)) : [...rows, next];
  await writeConfig(updated);
}
