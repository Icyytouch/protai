# protai

Official Python SDK for [ProtAI](https://protai.co.uk) — drop-in credit metering and spend guardrails for AI apps. Stop free-tier users burning your AI budget.

> **Name note:** `protai` is the working package name. It may be renamed if the name is taken on PyPI — check before publishing.

## Install

```bash
pip install protai
```

Requires Python 3.9+.

## Quickstart (10 lines)

```python
import os
from protai import ProtAI

protai = ProtAI(os.environ["PROTAI_API_KEY"])  # key starts with ptk_

res = protai.check("user_123", "tokens", units=500)
if not res["allowed"]:
    raise RuntimeError(f"Out of credits ({res.get('reason')})")

completion = openai.chat.completions.create( ... )  # your AI call

protai.report("user_123", "tokens", units=completion.usage.total_tokens)
```

That's the whole integration: `check` before you spend, `report` after with actual usage.

## API reference

### `ProtAI(api_key, base_url=..., timeout=10)`

| Argument   | Default                | Description                                   |
|------------|------------------------|-----------------------------------------------|
| `api_key`  | (required)             | Your project API key (`ptk_…`) from the dashboard |
| `base_url` | `https://protai.co.uk` | Point at `http://localhost:3000` for local dev |
| `timeout`  | `10`                   | Per-request timeout in seconds                |

Raises `ProtAIError` (`code="missing_api_key"`) if the key is empty.

### `check(user_id, meter, units=1) -> CheckResult`

Ask whether `user_id` may spend `units` on `meter` (the meter slug from your dashboard). Creates the monthly balance row at 0 on first use.

```python
res = protai.check("user_123", "tokens", units=500)
# {"allowed": True, "balance": 9500, "quota": 10000}
```

`reason` is present only when `allowed` is `False`:
- `"insufficient"` — quota exhausted and the meter blocks overage
- `"killed"` — the project's kill-switch is on (fail closed)

### `report(user_id, meter, units) -> ReportResult`

Deduct `units` after your AI call. Pass **actual** usage, not the estimate from `check`.

```python
res = protai.report("user_123", "tokens", units=812)
# {"balance": 8688}
```

> **Tip:** wrap your AI call in try/finally so usage is always reported, even on errors.

### `balance(user_id, meter) -> BalanceResult`

Read-only lookup — useful for showing "X credits left" in your UI.

```python
res = protai.balance("user_123", "tokens")
# {"balance": 8688, "quota": 10000, "period": "2026-10"}
```

## Error handling

Every failure raises `ProtAIError` with a machine-readable `code`:

```python
from protai import ProtAI, ProtAIError

try:
    protai.report("user_123", "tokens", units=100)
except ProtAIError as err:
    if err.code == "unauthorized":
        pass  # bad/revoked key — alert yourself, not the user
    elif err.code == "rate_limited":
        pass  # 100 req/min per key — back off and retry
    elif err.code in ("timeout", "network_error", "server_error"):
        pass  # transient — retry with backoff
    else:
        pass  # bad_request, not_found, invalid_argument, invalid_response
    raise
```

**Recommended failure policy:** fail **closed** on `unauthorized`/`invalid_argument` (your bug — don't spend), and decide per product whether `timeout`/`network_error` fails open (let the user through, reconcile later) or closed. When in doubt, fail closed — that's what the tool is for.

## Multiple meters

Meters are just slugs (`"tokens"`, `"images"`, `"minutes"`). Create them in the dashboard with their own monthly quotas and overage behavior (`block` vs `allow_alert`), then meter each independently:

```python
protai.check("user_123", "images", units=1)
```

## License

MIT
