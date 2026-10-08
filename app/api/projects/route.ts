import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/api';


const CreateProject = z.object({
  name: z.string().min(1).max(80),
});

/** GET /api/projects — list the caller's projects with subscription tier. */
export async function GET() {
  const ctx = await requireSession();
  if ('error' in ctx) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('projects')
    .select('id, name, kill_switch, created_at, subscriptions (tier, status)')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 });

  const projects = (data as Array<Record<string, unknown>>).map((p) => {
    const sub = p['subscriptions'] as { tier?: string; status?: string } | Array<{ tier?: string; status?: string }> | null;
    const subRow = Array.isArray(sub) ? sub[0] : sub;
    return {
      id: p['id'],
      name: p['name'],
      kill_switch: p['kill_switch'],
      created_at: p['created_at'],
      tier: subRow?.tier ?? 'free',
      subscription_status: subRow?.status ?? 'active',
    };
  });
  return NextResponse.json({ projects });
}

/** POST /api/projects — create a project (starts on the free tier). */
export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  if ('error' in ctx) return ctx.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = CreateProject.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: project, error } = await ctx.supabase
    .from('projects')
    .insert({ owner_id: ctx.userId, name: parsed.data.name })
    .select('id, name, kill_switch, created_at')
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }

  await ctx.supabase.from('subscriptions').insert({
    project_id: (project as { id: string }).id,
    tier: 'free',
    status: 'active',
  });

  return NextResponse.json({ project }, { status: 201 });
}
