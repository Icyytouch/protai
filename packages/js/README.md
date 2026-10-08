# @protai/sdk

Official JavaScript/TypeScript SDK for [ProtAI](https://protai.co.uk) — drop-in credit metering and spend guardrails for AI apps. Stop free-tier users burning your AI budget.

> **Name note:** `@protai/sdk` is the working package name. It may be renamed if the name is taken on npm — check before publishing.

## Install

```bash
npm install @protai/sdk
```

Requires Node 18+ (uses the global `fetch`).

## Quickstart (10 lines)

```ts
import { ProtAI } from '@protai/sdk';

const protai = new ProtAI(process.env.PROTAI_API_KEY!); // key starts with ptk_

const { allowed, reason } = await protai.check('user_123', 'tokens', 500);
if (!allowed) throw new Error(`Out of credits (${reason})`);

const completion = await openai.chat.completions.create({ /* … */ });

await protai.report('user_123', 'tokens', completion.usage.total_tokens);
```

That's the whole integration: `check` before you spend, `report` after with actual usage.

## API reference

### `new ProtAI(apiKey, options?)`

| Option      | Type     | Default                 | Description                                  |
|-------------|----------|-------------------------|----------------------------------------------|
| `baseUrl`   | `string` | `https://protai.co.uk`  | Point at `http://localhost:3000` for local dev |
| `timeoutMs` | `number` | `10000`                 | Per-request timeout in milliseconds          |

Throws `ProtAIError` (`code: 'missing_api_key'`) if the key is empty.

### `check(userId, meter, units = 1): Promise<CheckResult>`

Ask whether `userId` may spend `units` on `meter` (the meter slug from your dashboard). Creates the monthly balance row at 0 on first use.

```ts
const res = await protai.check('user_123', 'tokens', 500);
// { allowed: true, balance: 9500, quota: 10000 }
```

`reason` is present only when `allowed` is `false`:
- `'insufficient'` — quota exhausted and the meter blocks overage
- `'killed'` — the project's kill-switch is on (fail closed)

### `report(userId, meter, units): Promise<ReportResult>`

Deduct `units` after your AI call. Pass **actual** usage (e.g. `completion.usage.total_tokens`), not the estimate from `check`.

```ts
const { balance } = await protai.report('user_123', 'tokens', 812);
// { balance: 8688 }
```

> **Tip:** wrap your AI call in try/finally so usage is always reported, even on errors.

### `balance(userId, meter): Promise<BalanceResult>`

Read-only lookup — useful for showing "X credits left" in your UI.

```ts
const { balance, quota, period } = await protai.balance('user_123', 'tokens');
// { balance: 8688, quota: 10000, period: '2026-10' }
```

## Error handling

Every failure throws `ProtAIError` with a machine-readable `code`:

```ts
import { ProtAI, ProtAIError } from '@protai/sdk';

try {
  await protai.report('user_123', 'tokens', 100);
} catch (err) {
  if (err instanceof ProtAIError) {
    switch (err.code) {
      case 'unauthorized': /* bad/revoked key — alert yourself, not the user */ break;
      case 'rate_limited': /* 100 req/min per key — back off and retry */ break;
      case 'timeout':
      case 'network_error': /* transient — retry with backoff */ break;
      case 'server_error': /* our problem — retry shortly */ break;
      default: /* bad_request, not_found, invalid_argument, invalid_response */
    }
  }
  throw err;
}
```

**Recommended failure policy:** fail **closed** on `unauthorized`/`invalid_argument` (your bug — don't spend), and decide per product whether `timeout`/`network_error` fails open (let the user through, reconcile later) or closed. When in doubt, fail closed — that's what the tool is for.

## Multiple meters

Meters are just slugs (`'tokens'`, `'images'`, `'minutes'`). Create them in the dashboard with their own monthly quotas and overage behavior (`block` vs `allow_alert`), then meter each independently:

```ts
await protai.check('user_123', 'images', 1);
```

## Development

```bash
npm run build   # typecheck + emit to dist/
```

## License

MIT
