# ProtAI Backend — Testing Guide

## 1. Setup

1. Create a Supabase project. In the SQL editor, run `supabase/schema.sql` in full.
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Stripe keys (test mode is fine): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
     `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
3. `npm install && npm run dev`
4. Sign up in the app (the frontend provides auth UI) — or via Supabase Auth API.

### Create a test project + key + meter via SQL

The dashboard normally does this, but for API testing you can seed directly.
Replace `<YOUR_AUTH_USER_ID>` with your user's id (Supabase → Authentication → Users):

```sql
-- Project
insert into projects (id, owner_id, name)
values ('11111111-1111-1111-1111-111111111111', '<YOUR_AUTH_USER_ID>', 'Test Project')
returning id;

-- API key: hash of a KNOWN test key. Test key: ptk_testkey00000000000000000000000001
-- (32 chars after ptk_; compute its SHA-256:)
--   echo -n 'ptk_testkey00000000000000000000000001' | sha256sum
insert into api_keys (project_id, key_hash, key_prefix, name)
values (
  '11111111-1111-1111-1111-111111111111',
  '<SHA256_HEX_OF_TEST_KEY>',
  'ptk_testk',
  'Test key'
);

-- Meter: 100 free units/month, hard block on overage
insert into meters (project_id, slug, unit_label, monthly_quota, overage)
values ('11111111-1111-1111-1111-111111111111', 'tokens', 'tokens', 100, 'block');
```

> Never use a guessable test key outside local dev. Real keys are generated
> by `POST /api/projects/[id]/keys` and shown exactly once.

## 2. v1 metering API (curl)

Base: `http://localhost:3000`. Use your test key.

```bash
KEY=ptk_testkey00000000000000000000000001

# Balance (creates the row at 0 on first call)
curl -s -H "Authorization: Bearer $KEY" \
  "http://localhost:3000/api/v1/balance?end_user_id=user_123&meter=tokens"
# → {"balance":0,"quota":100,"period":"2026-10"}

# Check 10 units (no deduction)
curl -s -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"end_user_id":"user_123","meter":"tokens","units":10}' \
  http://localhost:3000/api/v1/check
# → {"allowed":true,"balance":0,"quota":100}

# Report 10 units (deducts)
curl -s -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"end_user_id":"user_123","meter":"tokens","units":10}' \
  http://localhost:3000/api/v1/report
# → {"balance":-10}

# Over-quota check (usable = -10 + 100 = 90, requesting 95 → blocked)
curl -s -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"end_user_id":"user_123","meter":"tokens","units":95}' \
  http://localhost:3000/api/v1/check
# → {"allowed":false,"balance":-10,"quota":100,"reason":"insufficient"}

# Over-quota report → 403
curl -s -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"end_user_id":"user_123","meter":"tokens","units":95}' \
  http://localhost:3000/api/v1/report -w "\n%{http_code}\n"
# → 403 {"error":"Insufficient quota","reason":"insufficient","balance":-10}

# Bad key → 401
curl -s -H "Authorization: Bearer ptk_nope" \
  "http://localhost:3000/api/v1/balance?end_user_id=u&meter=tokens" -w "\n%{http_code}\n"

# Unknown meter → 404
curl -s -H "Authorization: Bearer $KEY" \
  "http://localhost:3000/api/v1/balance?end_user_id=u&meter=nope" -w "\n%{http_code}\n"

# Kill-switch: enable via dashboard or
#   POST /api/projects/11111111-1111-1111-1111-111111111111/kill-switch {"enabled":true}
# then check → {"allowed":false,"balance":0,"quota":100,"reason":"killed"}

# Rate limit: 100 req/min/key — hammer the endpoint 101+ times fast
for i in $(seq 1 105); do
  curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $KEY" \
    "http://localhost:3000/api/v1/balance?end_user_id=u&meter=tokens"
done | sort | uniq -c
# expect mostly 200s then 429s with {"error":"Rate limit exceeded","retry_after":N}
```

## 3. Internal API (session-authenticated)

These need a Supabase session cookie. Easiest: use the dashboard UI, or in
the browser console / a logged-in page. Example with `fetch` from a
logged-in tab's console:

```js
// Create a key (full key returned ONCE)
const r = await fetch('/api/projects/11111111-1111-1111-1111-111111111111/keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Production' }),
}).then(r => r.json());
console.log(r.key.key); // ← copy now; never retrievable again
```

## 4. RLS test (two users)

1. Sign up as **user A**, create a project via the dashboard. Note its id.
2. Sign up as **user B** (incognito window).
3. As B, try `GET /api/projects/<A's project id>` → expect **404** (not 403 —
   RLS makes foreign rows invisible, which is the correct behavior).
4. As B, `GET /api/projects` → only B's projects listed.
5. Direct SQL check (service role bypasses RLS; anon key does not):
   ```sql
   -- Run as the anon role with A's JWT to prove isolation (Supabase SQL
   -- editor "Run as" is not available; do this via the API test above).
   ```

## 5. Stripe webhook test

```bash
# Terminal 1: forward events to local
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
# → use the printed whsec_... as STRIPE_WEBHOOK_SECRET, restart dev server

# Terminal 2: fire a test checkout completion
stripe trigger checkout.session.completed
# Then check the subscriptions/purchases tables for the upserted rows.
```

Credit-pack purchase flow:
1. Dashboard: create a credit pack (e.g. "500 credits", 500 units, $9.00).
2. Builder's backend calls (with their `ptk_` key):
   ```bash
   curl -s -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
     -d '{"pack_id":"<PACK_UUID>","meter_slug":"tokens","end_user_id":"user_123",
          "success_url":"https://example.com/ok","cancel_url":"https://example.com/cancel"}' \
     http://localhost:3000/api/v1/packs/checkout
   # → {"url":"https://checkout.stripe.com/...","session_id":"cs_test_..."}
   ```
3. Complete payment with test card `4242 4242 4242 4242`.
4. Webhook grants 500 to (project, tokens, user_123) + ledger `purchase` entry.
   Re-delivering the same event is a no-op (idempotent via `stripe_session_id`).

## 6. Known limitations (documented, not bugs)

- **Concurrency:** `report` is read-modify-write. At extreme concurrent load
  for the SAME end_user+meter, two requests could both pass the quota check.
  Mitigation path: `SELECT ... FOR UPDATE` or a Postgres function. The
  100 req/min/key limit makes this a non-issue at MVP scale.
- **Rate limit is per-instance memory.** Multi-region deploys enforce per
  instance; use Upstash Redis for a global budget later.
- **Alert delivery:** threshold *detection* is implemented
  (`alerts.last_triggered_at` is stamped, edge-triggered per period); email/
  Slack *delivery* is a follow-up — add a provider key and a sender in
  `lib/alerts.ts`.
- **Kill-switch on `check`:** returns `allowed:false` with HTTP 200 (the
  answer to "may I proceed?" is no — not a request error). `report` under
  kill-switch returns 403.
