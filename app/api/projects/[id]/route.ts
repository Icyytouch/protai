import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const UpdateProject = z.object({
  name: z.string().min(1).max(80),
});

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/projects/[id] — project detail + subscription + counts. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const [{ count: keyCount }, { count: meterCount }, { data: sub }] = await Promise.all([
    ctx.supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('project_id', id),
    ctx.supabase.from('meters').select('id', { count: 'exact', head: true }).eq('project_id', id),
    ctx.supabase.from('subscriptions').select('tier, status, current_period_end').eq('project_id', id).single(),
  ]);

  return NextResponse.json({
    project: ctx.project,
    subscription: sub ?? { tier: 'free', status: 'active', current_period_end: null },
    counts: { keys: keyCount ?? 0, meters: meterCount ?? 0 },
  });
}

/** PATCH /api/projects/[id] — rename. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = UpdateProject.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('projects')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .select('id, name, kill_switch, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  return NextResponse.json({ project: data });
}

/** DELETE /api/projects/[id] — delete project and everything under it (cascade). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { error } = await ctx.supabase.from('projects').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
