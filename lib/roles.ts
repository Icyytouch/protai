import { createAdminSupabaseClient } from './supabase-admin';

export type SiteRole = 'admin' | 'editor' | 'author' | 'user';

const STAFF: SiteRole[] = ['admin', 'editor', 'author'];

/** Look up a user's site role (service-role, bypasses RLS). Returns 'user' when unknown. */
export async function getSiteRole(userId: string | null | undefined): Promise<SiteRole> {
  if (!userId) return 'user';
  try {
    const db = createAdminSupabaseClient();
    const { data } = await db.from('profiles').select('role').eq('id', userId).single();
    const role = (data as { role?: string } | null)?.role;
    if (role === 'admin' || role === 'editor' || role === 'author') return role;
  } catch {
    /* fall through */
  }
  return 'user';
}

/** Can this role manage blog posts? */
export function canWritePosts(role: SiteRole): boolean {
  return STAFF.includes(role);
}

/** Can this role manage other users' roles? */
export function canManageRoles(role: SiteRole): boolean {
  return role === 'admin';
}
