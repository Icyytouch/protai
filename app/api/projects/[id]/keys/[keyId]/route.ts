import { NextRequest, NextResponse } from 'next/server';
import { requireProject } from '@/lib/api';


type Ctx = { params: Promise<{ id: string; keyId: string }> };

/** DELETE — revoke a key (immediate). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, keyId } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { error } = await ctx.supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('project_id', id);

  if (error) return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
