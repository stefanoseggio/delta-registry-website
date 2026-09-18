"""Real, executable tests — schema round-trips for all 28 generated tools, plus unit tests for
the shared _client.py's retry/error-classification logic. Run with: pytest tests/ -v
"""

from __future__ import annotations

import json
import os
from unittest.mock import MagicMock, patch

import pytest
import requests

from langchain_delta_registry import DELTA_REGISTRY_TOOLS
from langchain_delta_registry._client import (
    MissingApifyTokenError,
    DeltaRegistryAPIError,
    _classify_for_retry,
    call_apify_actor,
)


# --- Tool inventory & schema round-trip -----------------------------------------------------


def test_exactly_28_tools_present():
    """The real, currently-committed fleet has 28 actors — a count drift here means the package
    is out of sync with lib/schema-generator/actor-registry.ts and must be regenerated."""
    assert len(DELTA_REGISTRY_TOOLS) == 28


def test_tool_names_are_unique():
    names = [t.name for t in DELTA_REGISTRY_TOOLS]
    assert len(names) == len(set(names)), f"duplicate tool names: {[n for n in names if names.count(n) > 1]}"


def test_tool_names_match_real_actor_slugs():
    """Each tool's .name is the real Apify actor slug — this is what an agent framework sees and
    calls by, so it must be exact, not a display-friendly rewording."""
    expected_slugs = {
        "actor-18-b2b-lead-magnet",
        "actor-19-maritime-sanctions-monitor",
        "actor-20-mdb-procurement-monitor",
        "actor-21-patent-ip-enforcement-monitor",
        "actor-22-drug-safety-recalls-monitor",
        "actor-24-clinical-trials-delta-engine",
        "ai-crawler-content-signal-permission-monitor",
        "aozora-bunko-public-domain-text-feed",
        "australia-grantconnect-monitor",
        "cordoba-compras-monitor",
        "diario-oficial-cl-monitor",
        "emerging-market-sovereign-debt-auction-monitor",
        "entrerios-compras-monitor",
        "eu-ted-procurement-delta-monitor",
        "florida-tenders-monitor",
        "kipris-patent-trademark-status-monitor",
        "mendoza-compras-monitor",
        "page-metadata-extractor",
        "pba-tenders-monitor",
        "regione-lombardia-grants-registry-monitor",
        "salta-compras-monitor",
        "santafe-compras-monitor",
        "sec-enforcement-litigation-delta-feed",
        "singapore-acra-registry-monitor",
        "tucuman-compras-monitor",
        "uae-corporate-registry-monitor",
        "uk-hse-enforcement-monitor",
        "uk-modern-slavery-statement-registry-monitor",
    }
    actual_slugs = {t.name for t in DELTA_REGISTRY_TOOLS}
    assert actual_slugs == expected_slugs, f"diff: {actual_slugs ^ expected_slugs}"


@pytest.mark.parametrize("tool", DELTA_REGISTRY_TOOLS, ids=lambda t: t.name)
def test_tool_has_nonempty_description(tool):
    # Every real Apify actor description is a genuine sentence; catches a tool accidentally
    # wired to an empty or placeholder description string.
    assert tool.description and len(tool.description) > 20


@pytest.mark.parametrize("tool", DELTA_REGISTRY_TOOLS, ids=lambda t: t.name)
def test_tool_args_schema_round_trips_through_pydantic(tool):
    """Real schema round-trip: every tool's args_schema must produce a valid JSON Schema via
    Pydantic's own model_json_schema() — this is exactly what LangChain calls internally when
    binding the tool to a model, so a failure here means the tool would fail at agent construction
    time, not just in this test."""
    schema = tool.args_schema.model_json_schema()
    assert schema["type"] == "object"
    assert "properties" in schema


@pytest.mark.parametrize("tool", DELTA_REGISTRY_TOOLS, ids=lambda t: t.name)
def test_tool_schema_required_fields_have_no_default_in_schema(tool):
    """A field the actor's own schema marks required must not carry a `default` in the generated
    JSON Schema — this is the exact class of bug caught and fixed earlier in this generator's
    history (a required field silently becoming optional because it also had a documented
    default). Real regression guard, not a hypothetical one."""
    schema = tool.args_schema.model_json_schema()
    required = set(schema.get("required", []))
    for field_name in required:
        field_schema = schema["properties"][field_name]
        assert "default" not in field_schema, (
            f"{tool.name}.{field_name} is required but has a schema default — "
            f"it would be treated as optional by a caller reading the schema"
        )


# --- _client.py retry/error classification --------------------------------------------------


def test_classify_network_error_is_retryable():
    decision = _classify_for_retry(requests.ConnectionError("boom"), None)
    assert decision.should_retry is True


def test_classify_429_is_retryable():
    decision = _classify_for_retry(None, 429)
    assert decision.should_retry is True


def test_classify_5xx_is_retryable():
    for status in (500, 502, 503):
        assert _classify_for_retry(None, status).should_retry is True


def test_classify_4xx_other_than_429_is_not_retryable():
    for status in (400, 401, 403, 404):
        assert _classify_for_retry(None, status).should_retry is False


def test_classify_2xx_is_not_retryable():
    assert _classify_for_retry(None, 200).should_retry is False


def test_missing_apify_token_raises_before_any_network_call():
    """Real, deliberate fail-fast check — no network call should ever be attempted if the token
    is unset. Verified here via mock: if this raises without hitting the mock, no HTTP call was
    attempted, confirming the fail-fast happens before the requests.post line."""
    with patch.dict(os.environ, {}, clear=True), patch("requests.post") as mock_post:
        with pytest.raises(MissingApifyTokenError):
            call_apify_actor("fakeActorId123", {})
        mock_post.assert_not_called()


def test_successful_call_returns_dataset_items_directly():
    fake_items = [{"event_type": "NEW", "record_id": "abc"}]
    mock_response = MagicMock(ok=True, status_code=200)
    mock_response.json.return_value = fake_items

    with patch.dict(os.environ, {"APIFY_TOKEN": "fake_token_for_test"}), patch(
        "requests.post", return_value=mock_response
    ) as mock_post:
        result = call_apify_actor("fakeActorId123", {"maxItems": 10})

    assert result == fake_items
    mock_post.assert_called_once()
    call_kwargs = mock_post.call_args.kwargs
    assert call_kwargs["params"] == {"token": "fake_token_for_test"}
    assert call_kwargs["json"] == {"maxItems": 10}


def test_retries_on_5xx_then_succeeds():
    fail_response = MagicMock(ok=False, status_code=503, text="Service Unavailable")
    success_response = MagicMock(ok=True, status_code=200)
    success_response.json.return_value = [{"ok": True}]

    with patch.dict(os.environ, {"APIFY_TOKEN": "fake_token_for_test"}), patch(
        "requests.post", side_effect=[fail_response, success_response]
    ) as mock_post, patch("time.sleep"):  # real backoff sleep is skipped in the test, not the logic
        result = call_apify_actor("fakeActorId123", {}, max_retries=2)

    assert result == [{"ok": True}]
    assert mock_post.call_count == 2


def test_exhausts_retries_and_raises_structured_error():
    fail_response = MagicMock(ok=False, status_code=500, text="Internal Server Error")

    with patch.dict(os.environ, {"APIFY_TOKEN": "fake_token_for_test"}), patch(
        "requests.post", return_value=fail_response
    ) as mock_post, patch("time.sleep"):
        with pytest.raises(DeltaRegistryAPIError) as exc_info:
            call_apify_actor("fakeActorId123", {}, max_retries=2)

    assert mock_post.call_count == 3  # initial attempt + 2 retries
    assert exc_info.value.status_code == 500
    assert exc_info.value.actor_id == "fakeActorId123"


def test_does_not_retry_on_real_4xx_client_error():
    fail_response = MagicMock(ok=False, status_code=400, text="Bad Request: invalid maxItems")

    with patch.dict(os.environ, {"APIFY_TOKEN": "fake_token_for_test"}), patch(
        "requests.post", return_value=fail_response
    ) as mock_post:
        with pytest.raises(DeltaRegistryAPIError) as exc_info:
            call_apify_actor("fakeActorId123", {}, max_retries=3)

    # A real 400 must never be retried — it will fail identically every time.
    assert mock_post.call_count == 1
    assert exc_info.value.status_code == 400
