import { NextResponse } from 'next/server';
import { getOwnedProject, type OwnedProject } from './auth';
import type { createServerSupabaseClient } from './supabase';

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type GuardOk = { supabase: ServerSupabase; project: OwnedProject };
export type GuardResult = GuardOk | { error: NextResponse };

/**
 * Session-auth guard for internal /api/projects/[id]/* routes.
 * Returns 401 when not signed in, 404 when the project doesn't exist
 * or belongs to someone else (RLS + explicit check).
 */
export async function requireProject(projectId: string): Promise<GuardResult> {
  const { supabase, userId, project } = await getOwnedProject(projectId);
  if (!userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!project) {
    return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) };
  }
  return { supabase, project };
}

/** Session-auth guard for routes that don't take a project id. */
export async function requireSession(): Promise<
  { supabase: ServerSupabase; userId: string } | { error: NextResponse }
> {
  const supabase = await (await import('./supabase')).createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { supabase, userId: user.id };
}
