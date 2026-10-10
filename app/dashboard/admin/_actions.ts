"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/components/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getSiteRole, canManageRoles, type SiteRole } from "@/lib/roles";

async function requireAdmin() {
  const { user } = await getUser();
  if (!user) redirect("/login");
  const role = await getSiteRole(user.id);
  if (!canManageRoles(role)) redirect("/dashboard");
  return { user, db: createAdminSupabaseClient() };
}

export type AdminStats = {
  users: number;
  projects: number;
  postsPublished: number;
  postsDraft: number;
  team: number;
};

/** Site-wide numbers for the admin overview. */
export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const [users, projects, pub, draft, team] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("projects").select("id", { count: "exact", head: true }),
    db.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    db.from("profiles").select("id", { count: "exact", head: true }).neq("role", "user"),
  ]);
  return {
    users: users.count ?? 0,
    projects: projects.count ?? 0,
    postsPublished: pub.count ?? 0,
    postsDraft: draft.count ?? 0,
    team: team.count ?? 0,
  };
}

export type RecentSignup = { id: string; email: string | null; created_at: string; role: SiteRole };

/** Newest registered users with their site roles. */
export async function getRecentSignups(limit = 8): Promise<RecentSignup[]> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: limit });
  const users = data?.users ?? [];
  const ids = users.map((u) => u.id);
  const { data: profiles } = await db.from("profiles").select("id,role").in("id", ids);
  const roleById = new Map((profiles as Array<{ id: string; role: SiteRole }>)?.map((p) => [p.id, p.role]) ?? []);
  return users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    role: roleById.get(u.id) ?? "user",
  }));
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  role: SiteRole;
  projects: number;
  tier: string | null;
};

/** Every registered user with role, project count and billing tier. */
export async function listAllUsers(): Promise<AdminUserRow[]> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = data?.users ?? [];
  const ids = users.map((u) => u.id);

  const [{ data: profiles }, { data: projects }, { data: subs }] = await Promise.all([
    db.from("profiles").select("id,role").in("id", ids),
    db.from("projects").select("id,owner_id").in("owner_id", ids),
    db.from("subscriptions").select("user_id,tier,status").in("user_id", ids).eq("status", "active"),
  ]);

  const roleById = new Map(((profiles as Array<{ id: string; role: SiteRole }>) ?? []).map((p) => [p.id, p.role]));
  const projectCount = new Map<string, number>();
  ((projects as Array<{ id: string; owner_id: string }>) ?? []).forEach((p) => {
    projectCount.set(p.owner_id, (projectCount.get(p.owner_id) ?? 0) + 1);
  });
  const tierById = new Map(
    ((subs as Array<{ user_id: string; tier: string }>) ?? []).map((s) => [s.user_id, s.tier])
  );

  return users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    role: roleById.get(u.id) ?? "user",
    projects: projectCount.get(u.id) ?? 0,
    tier: tierById.get(u.id) ?? null,
  }));
}

/** Invite a new team member by email. They get an invite email and the chosen role on arrival. */
export async function inviteMember(
  email: string,
  role: SiteRole,
  displayName: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return { ok: false, error: "That doesn't look like a valid email address." };
  }
  if (!["admin", "editor", "author"].includes(role)) {
    return { ok: false, error: "Team members must be admin, editor, or author." };
  }

  const { data, error } = await db.auth.admin.inviteUserByEmail(cleanEmail, {
    data: { display_name: displayName.trim() || undefined },
  });
  if (error) {
    // Already registered? Just set the role on the existing account.
    if (error.message.toLowerCase().includes("already")) {
      const { data: existing } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
      const match = existing?.users.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (match) {
        await db.from("profiles").upsert(
          { id: match.id, role, display_name: displayName.trim() || null },
          { onConflict: "id" }
        );
        revalidatePath("/dashboard/admin/team");
        return { ok: true };
      }
    }
    return { ok: false, error: error.message };
  }

  const newId = data?.user?.id;
  if (newId) {
    await db.from("profiles").upsert(
      { id: newId, role, display_name: displayName.trim() || null },
      { onConflict: "id" }
    );
  }
  revalidatePath("/dashboard/admin/team");
  return { ok: true };
}

/** Remove a team member's staff role (demote to regular user). Does not delete their account. */
export async function removeFromTeam(userId: string): Promise<{ ok: boolean; error?: string }> {
  const { user, db } = await requireAdmin();
  if (userId === user.id) return { ok: false, error: "You can't remove yourself." };
  const { error } = await db.from("profiles").upsert({ id: userId, role: "user" }, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin/team");
  return { ok: true };
}
