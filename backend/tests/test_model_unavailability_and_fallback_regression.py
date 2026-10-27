"""
Regression tests for model unavailability handling, degraded fallbacks,
and input validation across CCIP AI endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complaint_missing_weights_returns_model_not_deployed(client: AsyncClient):
    """POST /api/v1/ai/test/complaint returns 200 with MODEL_NOT_DEPLOYED when weights absent."""
    payload = {"text": "I was defrauded of INR 50000 via a fake UPI link"}
    resp = await client.post("/api/v1/ai/test/complaint", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "complaint_classifier"
    # When weights are absent, must explicitly report MODEL_NOT_DEPLOYED without raising 500
    if not data.get("available"):
        assert data["status"] == "MODEL_NOT_DEPLOYED"
        assert data["model_available"] is False
        assert data["fallback_mode"] is False
        assert data["is_cybercrime"] is False
        assert data["predictions"] == []


@pytest.mark.asyncio
async def test_complaint_empty_input_rejected(client: AsyncClient):
    """POST /api/v1/ai/test/complaint with empty text returns 422."""
    resp = await client.post("/api/v1/ai/test/complaint", json={"text": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_complaint_whitespace_input_rejected(client: AsyncClient):
    """POST /api/v1/ai/test/complaint with whitespace returns 422."""
    resp = await client.post("/api/v1/ai/test/complaint", json={"text": "   \n\t  "})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_complaint_malformed_payload_rejected(client: AsyncClient):
    """POST /api/v1/ai/test/complaint with missing 'text' key returns 422."""
    resp = await client.post("/api/v1/ai/test/complaint", json={"unknown_key": "sample"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_email_fallback_mode_identified(client: AsyncClient):
    """POST /api/v1/ai/test/email truthfully discloses engine and fallback_mode."""
    payload = {"text": "Urgent: please verify your wire transfer invoice"}
    resp = await client.post("/api/v1/ai/test/email", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "email_threat"
    assert "engine" in data
    assert "fallback_mode" in data
    assert "model_available" in data
    if data["fallback_mode"]:
        assert data["engine"] == "sovereign_heuristic_fallback"
        assert data["status"] == "RESPONDED_DEGRADED_FALLBACK"
        assert data["model_available"] is False
        assert data["score_type"] == "UNCALIBRATED_HEURISTIC_SCORE"
        assert data["threshold_source"] == "HEURISTIC_RULE_DECISION_BOUNDARY"
        assert data["neural_threshold"] is None
        assert data["threshold"] == 0.50


@pytest.mark.asyncio
async def test_sms_fallback_mode_identified(client: AsyncClient):
    """POST /api/v1/ai/test/sms truthfully discloses engine and fallback_mode."""
    payload = {"text": "Your SBI account is blocked. Update PAN immediately"}
    resp = await client.post("/api/v1/ai/test/sms", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "sms_spam"
    assert "engine" in data
    assert "fallback_mode" in data
    assert "model_available" in data
    if data["fallback_mode"]:
        assert data["engine"] == "sovereign_heuristic_fallback"
        assert data["status"] == "RESPONDED_DEGRADED_FALLBACK"
        assert data["model_available"] is False
        assert data["score_type"] == "UNCALIBRATED_HEURISTIC_SCORE"
        assert data["threshold_source"] == "HEURISTIC_RULE_DECISION_BOUNDARY"
        assert data["neural_threshold"] is None
        assert data["threshold"] == 0.50


@pytest.mark.asyncio
async def test_url_phishing_engine_identified(client: AsyncClient):
    """POST /api/v1/ai/test/url identifies active XGBoost model and no fallback."""
    payload = {"url": "https://secure-login.example.com/account"}
    resp = await client.post("/api/v1/ai/test/url", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "url_phishing"
    assert data["engine"] == "xgboost_classifier"
    assert data["fallback_mode"] is False
    assert data["model_available"] is True
    assert data["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_citizen_assistant_discloses_engine_and_fallback(client: AsyncClient):
    """POST /api/v1/ai/citizen/assist exposes engine and fallback_mode."""
    resp = await client.post(
        "/api/v1/ai/citizen/assist",
        json={"content": "Your bank account is blocked. Call now", "query_type": "sms"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["modality"] == "sms"
    assert "engine" in data
    assert "fallback_mode" in data
    assert "model_available" in data


def test_feedback_gate_hard_rule_deterministic_semantics():
    """Verify feedback gate hard rule overrides emit deterministic confidence semantics."""
    from app.ai.adapters.feedback_gate import feedback_gate_adapter
    unauthorized_features = {
        "reviewer_authorized": False,
        "audit_complete": True,
        "appeal_pending": False,
        "case_closed": True,
    }
    result = feedback_gate_adapter.evaluate(unauthorized_features)
    assert result["decision"] == "REJECT"
    assert result["gate_source"] == "HARD_RULES_OVERRIDE"
    assert result["decision_source"] == "HARD_RULES_OVERRIDE"
    assert result["model_inference_used"] is False
    assert result["confidence_semantics"] == "DETERMINISTIC_RULE_OUTCOME"
    assert result["confidence"] == 1.0
