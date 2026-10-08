# ProtAI — stop free-tier users burning your AI budget

Drop-in credit metering + spend guardrails for AI apps. Three lines of code:

```ts
const check = await protai.check(userId, "tokens");
if (!check.allowed) return showUpgrade(check);
await protai.report(userId, "tokens", usage.total_tokens);
```

**Live at:** protai.co.uk (domain pending) · **Docs:** `/docs`

## What's inside

- **Metering API** (`app/api/v1/`) — `check`, `report`, `balance` + credit-pack checkout. API-key authed (`ptk_…`), 100 req/min rate limit, monthly quotas, per-meter overage modes (`block` / `allow_alert`), project kill-switch, append-only audit ledger.
- **Dashboard** (`app/dashboard/`) — projects, API keys (shown once), meters, per-user balances with manual adjust, filterable ledger, threshold alerts **with email delivery**, kill-switch, credit packs, Stripe billing.
- **Landing + docs** — marketing homepage, pricing (Free / $19 / $39), 5-minute quickstart.
- **SDKs** (`packages/js`, `packages/python`) — typed `@protai/sdk` and `protai` clients (not yet published to registries).
- **Stripe** — subscriptions (Starter/Pro) + one-time credit packs; signature-verified webhooks, idempotent purchase granting.
- **Stack:** Next.js 16 + TypeScript + Tailwind, Supabase (Postgres + Auth + RLS), Stripe, Resend. **Running cost: ~$0/mo** on free tiers.

## Quick start

```bash
cp .env.example .env.local   # fill in (see SETUP.md)
npm install
npm run dev                  # http://localhost:3000
```

Apply the DB schema first: paste `supabase/schema.sql` into your Supabase project's SQL Editor.

## Docs

- **`SETUP.md`** — full launch guide: Supabase → Stripe → Resend → Vercel → domain → smoke tests → go-live checklist.
- **`SPEC.md`** — build spec / API contracts (source of truth during the build).
- **`supabase/TESTING.md`** — curl test suite for the metering API.
- **`packages/TESTING.md`** — SDK test cases.

## Project layout

```
app/(marketing)/   landing, login, signup
app/dashboard/     authenticated app (server actions + RLS)
app/docs/          quickstart + API reference
app/api/v1/        public metering API (service-role, keyed)
app/api/           internal CRUD + Stripe webhooks
lib/               supabase, keys, metering, alerts, email, stripe
supabase/          schema.sql (9 tables + RLS)
packages/js|python SDKs
```
