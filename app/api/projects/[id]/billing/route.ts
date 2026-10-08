import { NextRequest, NextResponse } from 'next/server';
import { requireProject } from '@/lib/api';


type Ctx = { params: Promise<{ id: string }> };

/** GET — current subscription state for the billing page. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { data } = await ctx.supabase
    .from('subscriptions')
    .select('tier, status, current_period_end, stripe_customer_id')
    .eq('project_id', id)
    .single();

  return NextResponse.json({
    subscription: data ?? { tier: 'free', status: 'active', current_period_end: null },
    has_customer: Boolean((data as { stripe_customer_id?: string } | null)?.stripe_customer_id),
    prices: {
      starter_configured: Boolean(process.env.STRIPE_STARTER_PRICE_ID),
      pro_configured: Boolean(process.env.STRIPE_PRO_PRICE_ID),
    },
  });
}
