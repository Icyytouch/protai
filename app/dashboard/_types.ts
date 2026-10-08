export type Project = {
  id: string;
  name: string;
  kill_switch: boolean;
  created_at: string;
};

export type ApiKey = {
  id: string;
  project_id: string;
  key_prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
};

export type Meter = {
  id: string;
  project_id: string;
  slug: string;
  unit_label: string;
  monthly_quota: number;
  overage: "block" | "allow_alert";
  created_at: string;
};

export type Balance = {
  id: string;
  project_id: string;
  meter_id: string;
  end_user_id: string;
  balance: number;
  period: string;
  updated_at: string;
  meters?: { slug: string; unit_label: string } | null;
};

export type LedgerKind = "check" | "report" | "adjust" | "grant" | "purchase";

export type LedgerRow = {
  id: number;
  project_id: string;
  meter_id: string;
  end_user_id: string;
  units: number;
  kind: LedgerKind;
  balance_after: number | null;
  created_at: string;
  meters?: { slug: string } | null;
};

export type Alert = {
  id: string;
  project_id: string;
  meter_id: string | null;
  threshold_pct: number;
  channel: string;
  last_triggered_at: string | null;
  meters?: { slug: string } | null;
};

export type CreditPack = {
  id: string;
  project_id: string;
  name: string;
  units: number;
  price_cents: number;
  currency: string;
  stripe_payment_link: string | null;
  active: boolean;
};

export type Subscription = {
  project_id: string;
  tier: "free" | "starter" | "pro";
  status: string;
  current_period_end: string | null;
};

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
