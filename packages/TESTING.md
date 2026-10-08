# Testing the ProtAI SDKs against a live API

Both SDKs are thin wrappers over the metering API, so the most valuable test
is an end-to-end run against a real backend. Two options:

- **Local dev:** `BASE=http://localhost:3000` (run `npm run dev` in `~/workspace/protai`)
- **Production:** `BASE=https://protai.co.uk`

You need a real project API key (`ptk_…`) from the dashboard (Keys page).
The examples below assume a meter with slug `tokens` exists on the project.

```bash
KEY="ptk_paste_your_key_here"
BASE="http://localhost:3000"
```

## 1. `check` — happy path

```bash
curl -s -X POST "$BASE/api/v1/check" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"end_user_id":"user_123","meter":"tokens","units":500}'
```

Expected (200):

```json
{"allowed": true, "balance": 9500, "quota": 10000}
```

## 2. `report` — deduct actual usage

```bash
curl -s -X POST "$BASE/api/v1/report" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"end_user_id":"user_123","meter":"tokens","units":812}'
```

Expected (200):

```json
{"balance": 8688}
```

## 3. `balance` — read-only lookup

```bash
curl -s "$BASE/api/v1/balance?end_user_id=user_123&meter=tokens" \
  -H "Authorization: Bearer $KEY"
```

Expected (200):

```json
{"balance": 8688, "quota": 10000, "period": "2026-10"}
```

## 4. Exhausted quota (overage = block)

Spend past the quota, then `check` again:

```bash
curl -s -X POST "$BASE/api/v1/check" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"end_user_id":"user_123","meter":"tokens","units":999999}'
```

Expected (200, fail-closed):

```json
{"allowed": false, "balance": 8688, "quota": 10000, "reason": "insufficient"}
```

## 5. Kill-switch on

Toggle the kill-switch in the dashboard, then:

```bash
curl -s -X POST "$BASE/api/v1/check" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"end_user_id":"user_123","meter":"tokens","units":1}'
```

Expected (200):

```json
{"allowed": false, "balance": 8688, "quota": 10000, "reason": "killed"}
```

Remember to toggle it back off.

## 6. Bad API key

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/v1/check" \
  -H "Authorization: Bearer ptk_wrong" \
  -H "Content-Type: application/json" \
  -d '{"end_user_id":"u","meter":"tokens"}'
```

Expected: `401`. Both SDKs map this to `unauthorized` / code `"unauthorized"`.

## 7. Rate limiting

Fire >100 requests in a minute with the same key; expected: `429`.
Both SDKs map this to `rate_limited` / code `"rate_limited"`.

## 8. SDK-level smoke test (no mocks needed)

Point either SDK at the local server and run the exact sequence from its
README quickstart:

```python
# pip install -e packages/python  (from repo root)
from protai import ProtAI
p = ProtAI("ptk_...", base_url="http://localhost:3000")
assert p.check("smoke", "tokens", units=10)["allowed"] is True
p.report("smoke", "tokens", units=10)
print(p.balance("smoke", "tokens"))
```

```js
// node with the built SDK
const { ProtAI } = require('./packages/js/dist/index.js');
(async () => {
  const p = new ProtAI('ptk_...', { baseUrl: 'http://localhost:3000' });
  console.log(await p.check('smoke', 'tokens', 10));
  console.log(await p.report('smoke', 'tokens', 10));
  console.log(await p.balance('smoke', 'tokens'));
})();
```

## What the SDKs already verified (mock-server suite, 2026-10-07)

Happy-path `check`/`report`/`balance`, 401 → `unauthorized`,
429 → `rate_limited`, empty args → `invalid_argument`, empty key →
`missing_api_key`, hung server → `timeout`. All green in both languages.
