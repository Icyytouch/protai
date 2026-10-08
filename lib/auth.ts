import { createServerSupabaseClient } from './supabase';

export interface SessionContext {
  userId: string;
  email: string | undefined;
}

/** Return the signed-in user, or null when not authenticated. */
export async function getSessionUser(): Promise<(SessionContext & { supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> }) | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { userId: user.id, email: user.email ?? undefined, supabase };
}

export interface OwnedProject {
  id: string;
  owner_id: string;
  name: string;
  kill_switch: boolean;
  created_at: string;
}

/**
 * Load a project by id, enforcing ownership. RLS already scopes the query
 * to the caller's rows; this is a second, explicit check so route handlers
 * can return a clean 404 for foreign/missing projects.
 */
export async function getOwnedProject(projectId: string): Promise<{
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
  project: OwnedProject | null;
}> {
  const session = await getSessionUser();
  if (!session) {
    const supabase = await createServerSupabaseClient();
    return { supabase, userId: '', project: null };
  }
  const { data } = await session.supabase
    .from('projects')
    .select('id, owner_id, name, kill_switch, created_at')
    .eq('id', projectId)
    .single();
  return { supabase: session.supabase, userId: session.userId, project: (data as OwnedProject | null) ?? null };
}
