import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';

const ContactBody = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(10).max(5000),
});

/**
 * POST /api/contact — contact form submissions.
 * Stored in the DB and emailed to CONTACT_EMAIL when set.
 * Rate-limited: 5/hour per IP.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const parsed = ContactBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please fill in every field (message needs 10+ characters).' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`contact:${ip}`, 5, 3600_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many messages — please try again later.' }, { status: 429 });
  }

  const { name, email, subject, message } = parsed.data;

  try {
    const db = createAdminSupabaseClient();
    await db.from('contact_messages').insert({ name, email, subject, message });
  } catch (err) {
    console.error('[contact] db insert failed:', err);
  }

  const to = process.env.CONTACT_EMAIL;
  if (to) {
    await sendEmail(
      to,
      `[ProtAI contact] ${subject}`,
      `From: ${name} <${email}>\n\n${message}`,
    );
  }

  return NextResponse.json({ ok: true });
}
