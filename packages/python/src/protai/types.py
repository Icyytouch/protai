"""Typed result shapes returned by the ProtAI client."""

from typing import TypedDict


class CheckResult(TypedDict, total=False):
    """Result of :meth:`ProtAI.check`.

    ``reason`` is present only when ``allowed`` is ``False``:
    ``"insufficient"`` (quota exhausted, meter blocks overage) or
    ``"killed"`` (project kill-switch is on).
    """

    allowed: bool
    balance: float
    quota: float
    reason: str


class ReportResult(TypedDict, total=False):
    """Result of :meth:`ProtAI.report`."""

    balance: float


class BalanceResult(TypedDict, total=False):
    """Result of :meth:`ProtAI.balance`. ``period`` is ``YYYY-MM``."""

    balance: float
    quota: float
    period: str
