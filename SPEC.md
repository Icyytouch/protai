# ProtAI — Build Spec (source of truth)

**Product:** ProtAI — drop-in credit metering + spend guardrails for AI apps.
**Domain (to be purchased by founder):** protai.co.uk
**Audience:** INTERNATIONAL (indie AI builders worldwide — not UK-only).
**Pricing currency:** USD ($19 / $39). Copy in plain international English; no region-specific references.
**Repo:** `~/workspace/protai` — Next.js 14+ App Router, TypeScript, Tailwind.

## Directory ownership (do not write outside your area)
- Backend agent: `supabase/`, `lib/`, `app/api/`, `.env.example`, `middleware.ts`
- Frontend agent: `app/(marketing)/`, `app/dashboard/`, `app/docs/`, `components/`
- SDK agent: `packages/js/`, `packages/python/` (standalone, no dependency on app code)

## Database (Supabase Postgres) — `supabase/schema.sql`
```sql
projects (id uuid pk default gen_random_uuid(), owner_id uuid references auth.users(id), name text not null, kill_switch boolean default false, created_at timestamptz default now())
api_keys (id uuid pk, project_id uuid references projects(id) on delete cascade, key_hash text unique not null, key_prefix text not null, name text not null, created_at timestamptz default now(), last_used_at timestamptz)
meters (id uuid pk, project_id uuid references projects(id) on delete cascade, slug text not null, unit_label text not null, monthly_quota numeric not null default 100, overage text not null default 'block' check (overage in ('block','allow_alert')), created_at timestamptz default now(), unique(project_id, slug))
balances (id uuid pk, project_id uuid references projects(id) on delete cascade, meter_id uuid references meters(id) on delete cascade, end_user_id text not null, balance numeric not null default 0, period text not null, -- YYYY-MM
  updated_at timestamptz default now(), unique(project_id, meter_id, end_user_id, period))
ledger (id bigint generated always as identity pk, project_id uuid references projects(id) on delete cascade, meter_id uuid references meters(id) on delete cascade, end_user_id text not null, units numeric not null, kind text not null check (kind in ('check','report','adjust','grant','purchase')), balance_after numeric, created_at timestamptz default now())
alerts (id uuid pk, project_id uuid references projects(id) on delete cascade, meter_id uuid references meters(id) on delete set null, threshold_pct int not null default 80, channel text not null default 'email', last_triggered_at timestamptz)
credit_packs (id uuid pk, project_id uuid references projects(id) on delete cascade, name text not null, units numeric not null, price_cents int not null, currency text not null default 'usd', stripe_payment_link text, active boolean default true)
purchases (id uuid pk, project_id uuid references projects(id) on delete cascade, end_user_id text not null, pack_id uuid references credit_packs(id), stripe_session_id text unique, units numeric not null, status text not null default 'pending', created_at timestamptz default now())
subscriptions (project_id uuid pk references projects(id) on delete cascade, stripe_customer_id text, stripe_subscription_id text, tier text not null default 'free' check (tier in ('free','starter','pro')), status text not null default 'active', current_period_end timestamptz)
```
RLS: enable on all tables; owners access only rows where `projects.owner_id = auth.uid()` (via joins). Service-role key used ONLY in `app/api/v1/*` (server-side, never exposed).

## Metering API (public, keyed) — `app/api/v1/`
Auth: `Authorization: Bearer <api_key>`. Keys formatted `ptk_<32 random chars>`; store SHA-256 hash, compare safely. Return 401 on bad key. Rate-limit: 100 req/min per key (simple in-memory).

- `POST /api/v1/check` — body `{end_user_id: string, meter: string, units?: number=1}` → `{allowed: boolean, balance: number, quota: number, reason?: 'insufficient'|'killed'}`. Rules: if project.kill_switch → allowed=false reason=killed. Resolve current YYYY-MM balance row (create at 0 if missing). If overage=block and balance-units < -quota... define: quota = monthly free allowance; allowed if balance+quota-units >= 0 when block. Log ledger kind='check'.
- `POST /api/v1/report` — body `{end_user_id, meter, units}` → `{balance: number}`. Deduct units from balance (can go negative if overage=allow_alert). Log ledger kind='report'.
- `GET /api/v1/balance?end_user_id=&meter=` → `{balance, quota, period}`.
All responses JSON, proper status codes. Validate inputs with zod.

## Internal API (dashboard, session-auth via Supabase) — `app/api/`
CRUD for projects, api_keys (create returns full key ONCE), meters, balances adjust, alerts, credit_packs, kill-switch toggle. All scoped to owner's projects.

## Stripe — `app/api/stripe/`, `lib/stripe.ts`
- Products: Starter $19/mo, Pro $39/mo (recurring). Checkout Sessions; Customer Portal for manage/cancel.
- Webhooks (`/api/stripe/webhook`, raw body, verify signature): `checkout.session.completed` → create/update subscriptions row; `customer.subscription.updated/deleted` → sync tier/status; credit-pack purchases: `checkout.session.completed` with metadata {project_id, pack_id, end_user_id} → insert purchases row + grant balance via ledger kind='purchase'.
- Credit packs: builder creates pack in dashboard → we create Stripe Payment Link (or Checkout Session) and store URL.

## Dashboard — `app/dashboard/`
Pages: overview (projects list), project detail: Keys, Meters, Users (balances table w/ search + manual adjust), Ledger (filterable), Alerts (threshold config), Kill-switch (big obvious toggle + status), Billing (current tier, upgrade buttons, portal link), Credit packs. Clean, minimal, fast. Use Supabase SSR client.

## Marketing + docs
- `app/(marketing)/page.tsx` — landing: hero ("Stop free-tier users burning your AI budget"), 3 features, pricing (Free / $19 / $39), FAQ, CTA. International copy.
- `app/docs/page.tsx` — quickstart: install SDK, create key, 10-line example.

## SDKs — `packages/js`, `packages/python`
`@protai/sdk` (npm) and `protai` (pip). API: `new ProtAI(apiKey)`, `.check(userId, meter, units?)`, `.report(userId, meter, units)`, `.balance(userId, meter)`. Thin fetch wrappers, typed, with README + example. Do NOT publish to registries (founder does that); include publish configs.

## Env — `.env.example`
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_STARTER_PRICE_ID, STRIPE_PRO_PRICE_ID, NEXT_PUBLIC_APP_URL.

## Done criteria
`npm run build` passes with zero TS errors; all API routes tested against the spec; RLS prevents cross-owner reads (test with two users); Stripe webhooks verified with Stripe CLI.

## As-built notes (integration pass, 7 Oct 2026)
- `proxy.ts` used instead of `middleware.ts` (Next.js 16 convention).
- Dashboard uses Supabase SSR + server actions directly (RLS-scoped), not the internal `app/api/*` CRUD routes — both exist; no conflict.
- Credit packs: server-side Checkout Sessions via `POST /api/v1/packs/checkout` (carries `end_user_id` metadata so the webhook can grant credits). Static Stripe Payment Links are NOT used — they can't carry per-purchase metadata.
- Threshold alerts send real emails via Resend (`lib/email.ts`, fire-and-forget in `lib/alerts.ts`). Requires `RESEND_API_KEY` + verified `EMAIL_FROM`; without it, alerts still stamp `last_triggered_at` in the dashboard.
- `export const instant = false` on the dashboard layout (authenticated pages never prerender under `cacheComponents`).
- No Slack alerts (was in early copy; removed — email only in MVP).
- No tier-based feature gating enforced yet (tiers tracked + billed; hard limits are a later addition).
