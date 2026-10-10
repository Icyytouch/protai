import { after } from 'next/server';
import { createHmac } from 'node:crypto';
import { createAdminSupabaseClient } from './supabase-admin';
import { type WebhookEvent, WEBHOOK_EVENTS } from './webhook-events';

export { WEBHOOK_EVENTS, type WebhookEvent };

export interface WebhookPayload {
  event: WebhookEvent;
  project_id: string;
  meter_slug?: string;
  end_user_id?: string;
  usage_pct?: number;
  threshold_pct?: number;
  balance_after?: number;
  kill_switch?: boolean;
  occurred_at: string;
}

function sign(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Deliver a webhook event to all active endpoints subscribed to it.
 * Fire-and-forget via `after()` — delivery must never slow down or fail
 * a metering request. Each attempt gets a 5s timeout; failures are logged.
 */
export function fireWebhooks(projectId: string, event: WebhookEvent, data: Omit<WebhookPayload, 'event' | 'project_id' | 'occurred_at'>): void {
  after(async () => {
    try {
      const db = createAdminSupabaseClient();
      const { data: endpoints } = await db
        .from('webhook_endpoints')
        .select('id,url,secret,events')
        .eq('project_id', projectId)
        .eq('active', true);

      const targets = ((endpoints as Array<{ id: string; url: string; secret: string; events: string[] }>) ?? [])
        .filter((e) => e.events.includes(event));
      if (targets.length === 0) return;

      const payload: WebhookPayload = {
        event,
        project_id: projectId,
        ...data,
        occurred_at: new Date().toISOString(),
      };
      const body = JSON.stringify(payload);

      await Promise.allSettled(
        targets.map(async (ep) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          try {
            await fetch(ep.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-ProtAI-Event': event,
                'X-ProtAI-Signature': `sha256=${sign(ep.secret, body)}`,
                'User-Agent': 'ProtAI-Webhooks/1.0',
              },
              body,
              signal: controller.signal,
            });
          } catch (err) {
            console.error(`[webhooks] delivery to ${ep.id} failed:`, err);
          } finally {
            clearTimeout(timer);
          }
        }),
      );
    } catch (err) {
      console.error('[webhooks] dispatch failed:', err);
    }
  });
}

/** Generate a random webhook signing secret. */
export function newWebhookSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}
