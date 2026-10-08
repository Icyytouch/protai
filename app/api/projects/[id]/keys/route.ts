import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';
import { generateApiKey, hashApiKey, keyDisplayPrefix } from '@/lib/keys';


const CreateKey = z.object({
  name: z.string().min(1).max(80),
});

type Ctx = { params: Promise<{ id: string }> };

/** GET — list keys (hashes are never returned). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_at, last_used_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 });
  return NextResponse.json({ keys: data });
}

/**
 * POST — create a key. The FULL key is returned ONCE in this response;
 * it is never stored and can never be retrieved again.
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
  const parsed = CreateKey.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const fullKey = generateApiKey();
  const { data, error } = await ctx.supabase
    .from('api_keys')
    .insert({
      project_id: id,
      key_hash: hashApiKey(fullKey),
      key_prefix: keyDisplayPrefix(fullKey),
      name: parsed.data.name,
    })
    .select('id, name, key_prefix, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
  }

  return NextResponse.json({ key: { ...data, key: fullKey } }, { status: 201 });
}
