# ProtAI — Setup & Launch Guide

Get from this codebase to a live, money-taking SaaS at protai.co.uk. Estimated hands-on time: **2–3 hours** (plus domain propagation).

## What you'll need (all free to start)

| Service | For | Cost |
|---|---|---|
| Supabase | Postgres DB + auth | Free tier |
| Stripe | Subscriptions + credit-pack payments | Free (2.9% + 30¢ only when paid) |
| Resend | Spend-alert emails | Free (100 emails/day) |
| Vercel | Hosting (recommended) | Free hobby tier |
| Domain | protai.co.uk | ~£10/yr (Namecheap/Cloudflare) |

## Step 1 — Supabase (15 min)

1. Sign up at supabase.com → **New project**. Name it `protai`, pick a region near you, set a strong DB password.
2. Open **SQL Editor** → paste the entire contents of `supabase/schema.sql` → **Run**. You should see 9 tables created.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (never expose this)
4. Go to **Authentication → Sign In / Sign Up** and confirm **Email** provider is enabled (it is by default).

## Step 2 — Stripe (20 min, test mode first)

1. Sign up at stripe.com (skip activation — stay in **test mode** for now).
2. **Products → Add product** (recurring):
   - `ProtAI Starter` — $19/month → copy the **Price ID** (`price_...`) → `STRIPE_STARTER_PRICE_ID`
   - `ProtAI Pro` — $39/month → copy the **Price ID** → `STRIPE_PRO_PRICE_ID`
3. **Developers → API keys** → copy **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://protai.co.uk/api/stripe/webhook` (use your Vercel URL until the domain is connected)
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`
5. For local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Step 3 — Resend (10 min)

1. Sign up at resend.com → **API Keys → Create** → `RESEND_API_KEY`.
2. **Domains → Add** `protai.co.uk`, add the DNS records they show. Until verified, emails can go from Resend's onboarding domain for testing — set `EMAIL_FROM` accordingly.
3. Set `EMAIL_FROM=ProtAI <alerts@protai.co.uk>` (must match a verified domain to deliver reliably).

## Step 4 — Environment variables

Copy `.env.example` to `.env.local` for local dev. In Vercel (**Project → Settings → Environment Variables**), add all of these:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_APP_URL=https://protai.co.uk
RESEND_API_KEY=
EMAIL_FROM=ProtAI <alerts@protai.co.uk>
```

## Step 5 — Deploy to Vercel (10 min) ⭐ recommended host

Why Vercel: it's built by the Next.js team — zero-config deploys, preview URLs per push, free hobby tier, one-click custom domains. Nothing else comes close for a Next.js app at this stage.

1. Push this repo to GitHub (it's already git-initialized — just add your remote and push).
2. vercel.com → **Add New → Project** → import the repo. Framework preset: Next.js (auto-detected).
3. Add the environment variables from Step 4. **Deploy.**
4. Buy `protai.co.uk`, then in Vercel: **Project → Settings → Domains → Add** `protai.co.uk` (+ `www`). Add the DNS records Vercel shows at your registrar. HTTPS is automatic.

## Step 6 — Smoke test (15 min)

1. Visit `https://protai.co.uk/signup` → create your account.
2. Dashboard → create a project → **API Keys** → create a key (copy the `ptk_...` value — shown once).
3. **Meters** → create meter `tokens`, quota 100, overage `block`.
4. From your terminal:
   ```bash
   curl -X POST https://protai.co.uk/api/v1/check \
     -H "Authorization: Bearer ptk_YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"end_user_id":"test_1","meter":"tokens","units":10}'
   # → {"allowed":true,"balance":0,"quota":100}
   ```
5. In Stripe **test mode**, complete a subscription checkout from the Billing page → confirm the dashboard shows your tier.
6. Create an 80% alert, burn past it via `report` calls, confirm the email arrives.

## Day-to-day updates (the ongoing workflow)

You never need to touch code. The loop is:

1. **You** tell Rio what to change ("change the headline to X", "add a yearly pricing option").
2. **Rio** makes the change in his copy, tests the build, and hands you an updated zip (like the codebase zip above).
3. **You** unzip it over your local project folder, then open **GitHub Desktop** → it shows the changed files → type a short summary → **Commit** → **Push**.
4. **Vercel** sees the push and redeploys automatically — the live site updates in ~2 minutes.

One-time GitHub Desktop setup: install it from desktop.github.com, sign in, **Clone** your protai repo once. After that it's just unzip → commit → push, forever.

If a change ever needs a database tweak (new table/column), Rio will give you a small SQL snippet to paste into Supabase's SQL Editor — 30 seconds, no expertise needed.

## Going live checklist

- [ ] Stripe: switch to **live mode**, recreate the two products/prices, new webhook endpoint + secret, update the three `STRIPE_*` vars in Vercel, redeploy.
- [ ] Supabase: fine on free tier until ~500MB DB / 50k monthly users — you'll know well before.
- [ ] Resend: domain verified, `EMAIL_FROM` set.
- [ ] `NEXT_PUBLIC_APP_URL` = `https://protai.co.uk` in Vercel.
- [ ] Test a real $19 purchase with your own card, then refund it.

## When things cost money (sooner or later)

- **Vercel Pro ($20/mo):** only if you exceed hobby limits (unlikely before real traction).
- **Supabase Pro ($25/mo):** only past free-tier DB/bandwidth.
- **Resend:** free to 3,000 emails/month — alerts will never get near this early.
- **Stripe:** purely success-based (only when customers pay you).

Realistic total before first revenue: **~£10 for the domain. Everything else $0.**

## Publish the SDKs (when ready)

```bash
cd packages/js && npm run build && npm publish --access public   # needs npm account
cd packages/python && python -m build && twine upload dist/*      # needs PyPI account
```
Check name availability first: `@protai/sdk` on npm, `protai` on PyPI — rename in `package.json`/`pyproject.toml` if taken.
