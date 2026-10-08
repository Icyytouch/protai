/**
 * Transactional email via Resend (free tier: 100/day — plenty for alerts).
 * Fire-and-forget by design: alert emails must never slow down metering.
 */

const RESEND_API = 'https://api.resend.com/emails';

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM || 'ProtAI <alerts@protai.co.uk>';
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // email not configured — skip silently
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: emailFrom(), to: [to], subject, text }),
    });
    if (!res.ok) {
      console.error('[email] resend failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}
