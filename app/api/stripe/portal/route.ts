import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';
import { appUrl, getStripe } from '@/lib/stripe';


const PortalBody = z.object({
  project_id: z.string().uuid(),
});

/** POST /api/stripe/portal — Customer Portal session (manage/cancel plan). */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = PortalBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const ctx = await requireProject(parsed.data.project_id);
  if ('error' in ctx) return ctx.error;

  const { data: sub } = await ctx.supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('project_id', parsed.data.project_id)
    .single();

  const customerId = (sub as { stripe_customer_id?: string } | null)?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: 'No Stripe customer yet — subscribe first' }, { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/dashboard/${parsed.data.project_id}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
