"""ProtAI client — drop-in credit metering for AI apps."""

from typing import Any, Dict, Optional

import requests

from .errors import ProtAIError
from .types import BalanceResult, CheckResult, ReportResult

DEFAULT_BASE_URL = "https://protai.co.uk"
DEFAULT_TIMEOUT = 10  # seconds


class ProtAI:
    """Client for the ProtAI metering API.

    Example:
        from protai import ProtAI

        protai = ProtAI(os.environ["PROTAI_API_KEY"])  # key starts with ptk_

        res = protai.check("user_123", "tokens", units=500)
        if not res["allowed"]:
            raise RuntimeError(f"Out of credits ({res.get('reason')})")
        # ... run your AI call ...
        protai.report("user_123", "tokens", units=completion.usage.total_tokens)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
    ):
        if not api_key or not str(api_key).strip():
            raise ProtAIError(
                "missing_api_key",
                "ProtAI: api_key is required. Create one in your ProtAI dashboard under Keys.",
            )
        self._api_key = str(api_key).strip()
        self._base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self._timeout = timeout
        self._session = requests.Session()
        self._session.headers.update({"Authorization": f"Bearer {self._api_key}"})

    # -- internals ------------------------------------------------------

    @staticmethod
    def _assert_user_and_meter(user_id: str, meter: str) -> None:
        if not user_id or not str(user_id).strip():
            raise ProtAIError("invalid_argument", "ProtAI: user_id must be a non-empty string.")
        if not meter or not str(meter).strip():
            raise ProtAIError(
                "invalid_argument",
                "ProtAI: meter must be a non-empty string (the meter slug from your dashboard).",
            )

    @staticmethod
    def _assert_units(units: float) -> None:
        if not isinstance(units, (int, float)) or isinstance(units, bool) or units <= 0:
            raise ProtAIError("invalid_argument", "ProtAI: units must be a positive number.")

    def _request(
        self,
        method: str,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        url = f"{self._base_url}{path}"
        try:
            resp = self._session.request(method, url, json=json, params=params, timeout=self._timeout)
        except requests.Timeout:
            raise ProtAIError("timeout", f"ProtAI: request timed out after {self._timeout}s.")
        except requests.RequestException as exc:
            raise ProtAIError("network_error", f"ProtAI: network error — {exc}.")

        if resp.status_code == 401:
            raise ProtAIError("unauthorized", "ProtAI: invalid API key (401). Check the key in your dashboard.", 401)
        if resp.status_code == 429:
            raise ProtAIError(
                "rate_limited",
                "ProtAI: rate limit exceeded — 100 req/min per key (429). Back off and retry.",
                429,
            )
        if resp.status_code == 404:
            raise ProtAIError("not_found", "ProtAI: endpoint not found (404). Check your base_url.", 404)
        if resp.status_code >= 500:
            raise ProtAIError("server_error", f"ProtAI: server error ({resp.status_code}). Retry shortly.", resp.status_code)

        try:
            data = resp.json()
        except ValueError:
            raise ProtAIError("invalid_response", "ProtAI: server returned a non-JSON response.", resp.status_code)

        if not resp.ok:
            message = data.get("error") if isinstance(data, dict) else None
            raise ProtAIError("bad_request", f"ProtAI: {message or f'Request failed ({resp.status_code}).'}", resp.status_code)

        if not isinstance(data, dict):
            raise ProtAIError("invalid_response", "ProtAI: unexpected response shape from server.", resp.status_code)
        return data

    # -- public API -----------------------------------------------------

    def check(self, user_id: str, meter: str, units: float = 1) -> CheckResult:
        """Check whether ``user_id`` may spend ``units`` on ``meter``.

        Call BEFORE running your AI call. Returns ``allowed`` plus the
        current ``balance``/``quota``. When ``allowed`` is ``False``,
        ``reason`` is ``"insufficient"`` (quota exhausted, meter blocks
        overage) or ``"killed"`` (project kill-switch is on).
        """
        self._assert_user_and_meter(user_id, meter)
        self._assert_units(units)
        return self._request("POST", "/api/v1/check", json={"end_user_id": user_id, "meter": meter, "units": units})

    def report(self, user_id: str, meter: str, units: float) -> ReportResult:
        """Deduct ``units`` from ``user_id``'s balance on ``meter``.

        Call AFTER your AI call with actual usage (e.g. total tokens).
        """
        self._assert_user_and_meter(user_id, meter)
        self._assert_units(units)
        return self._request("POST", "/api/v1/report", json={"end_user_id": user_id, "meter": meter, "units": units})

    def balance(self, user_id: str, meter: str) -> BalanceResult:
        """Read-only lookup of balance, quota and billing period.

        Useful for showing "X credits left" in your UI.
        """
        self._assert_user_and_meter(user_id, meter)
        return self._request("GET", "/api/v1/balance", params={"end_user_id": user_id, "meter": meter})
