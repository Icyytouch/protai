import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const Slug = z.string().min(1).max(64).regex(/^[a-z0-9][a-z0-9_-]*$/, 'slug must be lowercase alphanumeric with dashes/underscores');

const CreateMeter = z.object({
  slug: Slug,
  unit_label: z.string().min(1).max(40),
  monthly_quota: z.number().min(0).max(1_000_000_000).optional().default(100),
  overage: z.enum(['block', 'allow_alert']).optional().default('block'),
});

type Ctx = { params: Promise<{ id: string }> };

/** GET — list meters. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('meters')
    .select('id, slug, unit_label, monthly_quota, overage, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to list meters' }, { status: 500 });
  return NextResponse.json({ meters: data });
}

/** POST — create a meter. */
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
  const parsed = CreateMeter.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('meters')
    .insert({
      project_id: id,
      slug: parsed.data.slug,
      unit_label: parsed.data.unit_label,
      monthly_quota: parsed.data.monthly_quota,
      overage: parsed.data.overage,
    })
    .select('id, slug, unit_label, monthly_quota, overage, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A meter with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create meter' }, { status: 500 });
  }
  return NextResponse.json({ meter: data }, { status: 201 });
}
