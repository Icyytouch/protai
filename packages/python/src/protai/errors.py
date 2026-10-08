"""Error type for the ProtAI SDK.

Every failure surfaces as a :class:`ProtAIError` with a machine-readable
``code`` attribute (see README for the full list).
"""


class ProtAIError(Exception):
    """Raised for every ProtAI SDK failure.

    Attributes:
        code: machine-readable error code, e.g. ``"unauthorized"``,
            ``"rate_limited"``, ``"timeout"``, ``"network_error"``.
        status: HTTP status when the error came from the API
            (``None`` for client-side errors).
    """

    def __init__(self, code: str, message: str, status=None):
        super().__init__(message)
        self.code = code
        self.status = status
