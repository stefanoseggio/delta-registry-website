"""Shared, production-hardened HTTP client for calling Apify's hosted MCP gateway's underlying
REST API (`run-sync-get-dataset-items`) from every one of the 28 generated tool modules.

Hand-written once here rather than duplicated per actor — the earlier, first-pass generated tool
files (public/schemas/{slug}/langchain_tool.py) each inlined a bare `requests.post(...).raise_for_status()`
call with no retry, no timeout differentiation, and no structured error type an agent framework
could branch on. This module exists specifically to fix that for the packaged, publishable version.
"""

from __future__ import annotations

import os
import random
import time
from dataclasses import dataclass
from typing import Any

import requests

# Apify's real, documented cap on run-sync-get-dataset-items is 300s; this client's own read
# timeout leaves a 20s margin rather than cutting it exactly at the server-side limit, so a
# slow-but-legitimate run isn't killed client-side moments before the server would have returned.
DEFAULT_TIMEOUT_SECS = 320

# Bounded, real retry policy — never unbounded. Only transient failure classes are retried;
# a real 4xx (bad input, bad token, actor doesn't exist) is never retried, since retrying an
# unrecoverable error just burns Apify credits for a call guaranteed to fail again.
MAX_RETRIES = 3
BACKOFF_BASE_SECS = 1.0
BACKOFF_CAP_SECS = 20.0

APIFY_RUN_SYNC_URL_TEMPLATE = "https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"


class DeltaRegistryAPIError(Exception):
    """Structured error an agent framework can branch on, instead of a bare requests exception.

    Attributes:
        actor_id: the real Apify actor ID the call was made against.
        status_code: the real HTTP status returned, or None if the request never got a response
            (a connection error / timeout after all retries were exhausted).
        response_body: the real response body text, truncated to 2000 chars — enough for an agent
            or a human operator to diagnose a real Apify-side validation error without the
            exception growing unbounded on a large error payload.
        retried: how many retry attempts were actually made before this error was raised.
    """

    def __init__(
        self,
        message: str,
        *,
        actor_id: str,
        status_code: int | None,
        response_body: str | None,
        retried: int,
    ) -> None:
        super().__init__(message)
        self.actor_id = actor_id
        self.status_code = status_code
        self.response_body = (response_body or "")[:2000]
        self.retried = retried


class MissingApifyTokenError(DeltaRegistryAPIError):
    """Raised before any network call is made if APIFY_TOKEN is unset or empty.

    A real, deliberate safety check: sending an unauthenticated request would still reach Apify's
    gateway and fail with a real 401, but failing fast, locally, with a clear message is strictly
    better than burning a network round-trip (and, for some actors, partial billing before the
    auth check on Apify's own side) on a request that can never succeed.
    """

    def __init__(self, actor_id: str) -> None:
        super().__init__(
            "APIFY_TOKEN environment variable is not set. Get a token from the Apify Console "
            "under Settings -> Integrations, then set it as an environment variable before "
            "calling any Delta Registry tool. This library never reads a token from any other "
            "source (no config file, no hardcoded default) — it is never issued or brokered by "
            "Delta Registry itself.",
            actor_id=actor_id,
            status_code=None,
            response_body=None,
            retried=0,
        )


@dataclass(frozen=True)
class _RetryDecision:
    should_retry: bool
    reason: str


def _classify_for_retry(exc: Exception | None, status_code: int | None) -> _RetryDecision:
    """Real retry classification: network-level failures and 429/5xx are transient and worth
    retrying with backoff; 4xx (other than 429) is a real client-side error that will not succeed
    on retry, so it is not retried."""
    if exc is not None and status_code is None:
        # Connection error, DNS failure, or a read timeout — no response was ever received.
        return _RetryDecision(True, f"network-level failure: {exc}")
    if status_code == 429:
        return _RetryDecision(True, "rate limited (429)")
    if status_code is not None and 500 <= status_code < 600:
        return _RetryDecision(True, f"server error ({status_code})")
    return _RetryDecision(False, f"non-retryable status ({status_code})")


def call_apify_actor(
    actor_id: str,
    payload: dict[str, Any],
    *,
    timeout_secs: int = DEFAULT_TIMEOUT_SECS,
    max_retries: int = MAX_RETRIES,
) -> list[dict[str, Any]]:
    """Calls Apify's real run-sync-get-dataset-items endpoint for one actor and returns the
    dataset items array directly (that endpoint's own real response shape — not dataset metadata,
    not a wrapped envelope).

    Raises MissingApifyTokenError if APIFY_TOKEN is unset. Raises DeltaRegistryAPIError for any
    real failure that survives the bounded retry policy above, carrying the actor id, real status
    code, and a truncated real response body for diagnosis.
    """
    token = os.environ.get("APIFY_TOKEN", "").strip()
    if not token:
        raise MissingApifyTokenError(actor_id)

    url = APIFY_RUN_SYNC_URL_TEMPLATE.format(actor_id=actor_id)
    last_exc: Exception | None = None
    last_status: int | None = None
    last_body: str | None = None

    for attempt in range(max_retries + 1):
        try:
            resp = requests.post(
                url,
                params={"token": token},
                json=payload,
                timeout=timeout_secs,
            )
        except requests.RequestException as exc:
            last_exc, last_status, last_body = exc, None, None
        else:
            last_exc, last_status, last_body = None, resp.status_code, resp.text
            if resp.ok:
                return resp.json()  # real run-sync-get-dataset-items shape: dataset items array

        decision = _classify_for_retry(last_exc, last_status)
        if not decision.should_retry or attempt == max_retries:
            break

        # Real, bounded exponential backoff with full jitter — the same pattern already proven
        # elsewhere in this fleet's own actor code (documented in delta-registry-website's
        # Infrastructure Telemetry section: full-jitter backoff prevents a batch of failures from
        # all retrying against the same upstream at the same instant).
        sleep_for = random.uniform(0, min(BACKOFF_CAP_SECS, BACKOFF_BASE_SECS * (2**attempt)))
        time.sleep(sleep_for)

    message = (
        f"Delta Registry actor '{actor_id}' failed after {max_retries + 1} attempt(s): "
        f"{last_exc if last_exc else f'HTTP {last_status}'}"
    )
    raise DeltaRegistryAPIError(
        message,
        actor_id=actor_id,
        status_code=last_status,
        response_body=last_body,
        retried=max_retries,
    )
