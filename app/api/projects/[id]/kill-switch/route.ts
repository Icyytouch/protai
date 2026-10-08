import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const ToggleBody = z.object({
  enabled: z.boolean(),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/kill-switch — toggle the project kill-switch.
 * When enabled, /api/v1/check returns {allowed:false, reason:'killed'} and
 * /api/v1/report is rejected with 403. The safety brake for runaway spend.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = ToggleBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await ctx.supabase
    .from('projects')
    .update({ kill_switch: parsed.data.enabled })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to toggle kill-switch' }, { status: 500 });
  return NextResponse.json({ kill_switch: parsed.data.enabled });
}
