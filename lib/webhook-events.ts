/** Webhook event catalogue — client-safe, no server imports. */
export type WebhookEvent =
  | 'usage.threshold'
  | 'quota.exhausted'
  | 'kill_switch.toggled';

export const WEBHOOK_EVENTS: { id: WebhookEvent; label: string; desc: string }[] = [
  { id: 'usage.threshold', label: 'Usage threshold', desc: 'A user crosses a configured usage threshold (e.g. 80%).' },
  { id: 'quota.exhausted', label: 'Quota exhausted', desc: 'A user runs out of balance on a meter.' },
  { id: 'kill_switch.toggled', label: 'Kill-switch toggled', desc: 'The project kill-switch is turned on or off.' },
];
