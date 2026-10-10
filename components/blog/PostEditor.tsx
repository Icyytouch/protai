"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RichEditor } from "./RichEditor";
import { SeoPanel } from "./SeoPanel";
import { savePost, deletePost } from "@/app/dashboard/admin/posts/_actions";
import { inputClass, btnPrimaryClass, btnSecondaryClass, btnDangerClass } from "@/components/ui";

type Initial = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  focusKeyword: string;
  status: "draft" | "published";
};

export function PostEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(initial.slug.length > 0);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [content, setContent] = useState(initial.content);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [ogImage, setOgImage] = useState(initial.ogImage);
  const [focusKeyword, setFocusKeyword] = useState(initial.focusKeyword);
  const [status, setStatus] = useState<"draft" | "published">(initial.status);

  // Auto-slug from title until manually edited.
  const onTitleChange = (v: string) => {
    setTitle(v);
    if (!slugTouched) {
      setSlug(
        v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 120)
      );
    }
  };

  const seoInput = useMemo(
    () => ({ title, slug, contentHtml: content, metaTitle, metaDescription, focusKeyword }),
    [title, slug, content, metaTitle, metaDescription, focusKeyword]
  );

  const doSave = (nextStatus: "draft" | "published") => {
    setError(null);
    setSavedAt(null);
    startTransition(async () => {
      const res = await savePost({
        id: initial.id,
        title, slug, excerpt, content,
        meta_title: metaTitle, meta_description: metaDescription,
        og_image: ogImage, focus_keyword: focusKeyword,
        status: nextStatus,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save the post.");
        return;
      }
      setStatus(nextStatus);
      setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
      if (!initial.id && res.id) {
        router.replace(`/dashboard/admin/posts/${res.id}`);
      } else {
        router.refresh();
      }
    });
  };

  const doDelete = () => {
    if (!initial.id) return;
    if (!window.confirm("Delete this post permanently?")) return;
    startTransition(async () => {
      const res = await deletePost(initial.id as string);
      if (!res.ok) setError(res.error ?? "Could not delete the post.");
      else router.push("/dashboard/admin/posts");
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-5">
        <div>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Post title"
            className="w-full border-0 border-b border-zinc-800 bg-transparent pb-3 text-3xl font-semibold tracking-tight text-zinc-50 outline-none placeholder:text-zinc-700 focus:border-emerald-500/60"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Excerpt <span className="text-zinc-600">(used on the blog index)</span></label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="One or two sentences summarizing the post."
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Content</label>
          <RichEditor initialHtml={content} onChange={setContent} />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}
        {savedAt && !error && (
          <p className="text-sm text-emerald-300">Saved at {savedAt}.</p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-5">
          <button type="button" disabled={pending} onClick={() => doSave("draft")} className={btnSecondaryClass}>
            {pending ? "Saving…" : "Save draft"}
          </button>
          <button type="button" disabled={pending} onClick={() => doSave("published")} className={btnPrimaryClass}>
            {pending ? "Publishing…" : status === "published" ? "Update live post" : "Publish"}
          </button>
          {initial.id && (
            <button type="button" disabled={pending} onClick={doDelete} className={`${btnDangerClass} ml-auto`}>
              Delete
            </button>
          )}
          {status === "published" && slug && (
            <a href={`/blog/${slug}`} target="_blank" rel="noreferrer" className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline">
              View live →
            </a>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="xl:sticky xl:top-24">
          <SeoPanel
            input={{ title, slug, contentHtml: content, metaTitle, metaDescription, focusKeyword, ogImage }}
            onChange={(patch) => {
              if (patch.metaTitle !== undefined) setMetaTitle(patch.metaTitle);
              if (patch.metaDescription !== undefined) setMetaDescription(patch.metaDescription);
              if (patch.focusKeyword !== undefined) setFocusKeyword(patch.focusKeyword);
              if (patch.slug !== undefined) { setSlug(patch.slug); setSlugTouched(true); }
              if (patch.ogImage !== undefined) setOgImage(patch.ogImage);
              if (patch.title !== undefined) onTitleChange(patch.title);
            }}
          />
        </div>
      </div>
    </div>
  );
}
