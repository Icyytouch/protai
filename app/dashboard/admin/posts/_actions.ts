"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUser } from "@/components/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getSiteRole, canWritePosts, canManageRoles, type SiteRole } from "@/lib/roles";

async function requireStaff() {
  const { user } = await getUser();
  if (!user) redirect("/login");
  const role = await getSiteRole(user.id);
  if (!canWritePosts(role)) redirect("/dashboard");
  return { user, role, db: createAdminSupabaseClient() };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

const PostInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  slug: z.string().max(140).optional(),
  excerpt: z.string().max(400).optional(),
  content: z.string().max(200_000),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(400).optional(),
  og_image: z.string().url().max(500).optional().or(z.literal("")),
  focus_keyword: z.string().max(100).optional(),
  status: z.enum(["draft", "published"]),
});

export type PostFormState = { ok: boolean; error?: string; id?: string };

export async function savePost(raw: unknown): Promise<PostFormState> {
  const { user, db } = await requireStaff();
  const parsed = PostInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please fill in the title and content." };
  const v = parsed.data;

  const slug = slugify(v.slug || v.title);
  if (!slug) return { ok: false, error: "Could not generate a URL slug from the title." };

  // Ensure slug uniqueness (excluding self on update).
  const { data: clash } = await db.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (clash && (clash as { id: string }).id !== v.id) {
    return { ok: false, error: `The slug “${slug}” is already used by another post.` };
  }

  const row = {
    title: v.title.trim(),
    slug,
    excerpt: v.excerpt?.trim() || null,
    content: v.content,
    meta_title: v.meta_title?.trim() || null,
    meta_description: v.meta_description?.trim() || null,
    og_image: v.og_image?.trim() || null,
    focus_keyword: v.focus_keyword?.trim() || null,
    status: v.status,
    published_at: v.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  if (v.id) {
    const { error } = await db.from("posts").update(row).eq("id", v.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await db
      .from("posts")
      .insert({ ...row, author_id: user.id })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Could not create the post." };
    v.id = (data as { id: string }).id;
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/dashboard/admin/posts");
  return { ok: true, id: v.id };
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  const { db } = await requireStaff();
  const { data: post } = await db.from("posts").select("slug").eq("id", id).single();
  const { error } = await db.from("posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/blog");
  if (post) revalidatePath(`/blog/${(post as { slug: string }).slug}`);
  revalidatePath("/dashboard/admin/posts");
  return { ok: true };
}

export async function listPosts(): Promise<Array<{
  id: string; slug: string; title: string; status: string;
  updated_at: string; published_at: string | null;
}>> {
  const { db } = await requireStaff();
  const { data } = await db
    .from("posts")
    .select("id,slug,title,status,updated_at,published_at")
    .order("updated_at", { ascending: false });
  return (data as Array<{
    id: string; slug: string; title: string; status: string;
    updated_at: string; published_at: string | null;
  }>) ?? [];
}

export async function getPost(id: string) {
  const { db } = await requireStaff();
  const { data } = await db.from("posts").select("*").eq("id", id).single();
  return data as {
    id: string; slug: string; title: string; excerpt: string | null;
    content: string; meta_title: string | null; meta_description: string | null;
    og_image: string | null; focus_keyword: string | null;
    status: "draft" | "published";
  } | null;
}

/* ------------------------------- team roles ------------------------------ */

export async function listTeam(): Promise<Array<{ id: string; role: SiteRole; display_name: string | null; email: string | null }>> {
  const { user, role, db } = await requireStaff();
  if (!canManageRoles(role)) redirect("/dashboard/admin/posts");
  const { data } = await db.from("profiles").select("id,role,display_name").order("created_at");
  const rows = (data as Array<{ id: string; role: SiteRole; display_name: string | null }>) ?? [];
  // Attach emails via auth admin.
  const out: Array<{ id: string; role: SiteRole; display_name: string | null; email: string | null }> = [];
  for (const r of rows) {
    let email: string | null = null;
    try {
      const { data: u } = await db.auth.admin.getUserById(r.id);
      email = u?.user?.email ?? null;
    } catch { /* ignore */ }
    out.push({ ...r, email });
  }
  // Make sure the current admin is listed even before their first post.
  if (!out.some((r) => r.id === user.id)) {
    out.push({ id: user.id, role, display_name: null, email: user.email ?? null });
  }
  return out;
}

export async function setRole(userId: string, role: SiteRole): Promise<{ ok: boolean; error?: string }> {
  const { user, role: myRole, db } = await requireStaff();
  if (!canManageRoles(myRole)) return { ok: false, error: "Only admins can change roles." };
  if (userId === user.id) return { ok: false, error: "You can't change your own role." };
  if (!["admin", "editor", "author", "user"].includes(role)) return { ok: false, error: "Invalid role." };
  const { error } = await db.from("profiles").upsert({ id: userId, role }, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin/team");
  return { ok: true };
}
