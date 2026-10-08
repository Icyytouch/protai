"""Official Python SDK for ProtAI — drop-in credit metering for AI apps."""

from .client import ProtAI
from .errors import ProtAIError
from .types import BalanceResult, CheckResult, ReportResult

__all__ = ["ProtAI", "ProtAIError", "BalanceResult", "CheckResult", "ReportResult"]
__version__ = "0.1.0"
