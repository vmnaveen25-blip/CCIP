"""
Test Suite: Server-Side Masking and Reliability-Gated AI / Heuristic Threat Triage Interaction
Validates all 5 Core Functional Pillars:
1. Masked Payload Delivery: Sensitive identity and authentication tokens are redacted before triage.
2. Readiness Gate Evaluation: Inspects whether neural model weights are provisioned, loaded, and responsive.
3. Neural or Heuristic Execution: Executes neural inference when ready; seamlessly falls back to deterministic rule-based heuristic scoring engine when unavailable or degraded.
4. Provenance Tagging: Results are tagged with execution mode (NEURAL vs. HEURISTIC_FALLBACK) and audit provenance.
5. Case Queue Prioritization: Triage results update case priority, risk score, and case management priority queue rank.
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from httpx import AsyncClient

from app.models.case import Case
from app.models.complaint import Complaint
from app.models.complaint_event import ComplaintEvent
from app.services.server_side_masking_service import server_side_masking_service
from app.ai.adapters.threat_triage_engine import threat_triage_engine, ThreatCategory
from app.services.threat_triage_service import threat_triage_service


# -----------------------------------------------------------------------------
# 1. MASKED PAYLOAD DELIVERY TESTS
# -----------------------------------------------------------------------------
def test_server_side_masking_module_redacts_pii_and_credentials():
    """
    Validates Pillar 1: Server-Side Sensitive-Information Masking Module [5].
    Verifies that Aadhaar, PAN, Credit Cards, and Passwords are redacted,
    while forensic threat indicators (UPI, UTR, Crypto, IP, URLs) are preserved.
    """
    sample_narrative = (
        "Complainant Aadhaar is 2345 6789 0123 and PAN is ABCDE1234F. "
        "Entered credit card 4111 2222 3333 4444 with password: SecretPass123! on fraudulent site. "
        "Money was stolen via fraudulent transfer of INR 85,000 to mule UPI fraud.scammer@okaxis "
        "with bank transaction UTR 112233445566. "
        "Scammer communicated from IP 192.168.1.100 and phishing domain https://fake-sbi-portal.top."
    )

    masked_payload = server_side_masking_service.mask_complaint_narrative(
        raw_narrative=sample_narrative,
        preserve_iocs=True
    )

    masked_text = masked_payload["masked_narrative"]
    counts = masked_payload["redaction_counts"]

    # Assert sensitive PII and credentials are NOT leaked in payload
    assert "2345 6789 0123" not in masked_text
    assert "[AADHAAR_REDACTED_" in masked_text
    assert "ABCDE1234F" not in masked_text
    assert "[PAN_REDACTED_" in masked_text
    assert "4111 2222 3333 4444" not in masked_text
    assert "[CARD_REDACTED_" in masked_text
    assert "SecretPass123!" not in masked_text
    assert "[CREDENTIAL_REDACTED]" in masked_text

    # Assert redactions were recorded accurately
    assert counts["aadhaar"] >= 1
    assert counts["pan"] >= 1
    assert counts["card"] >= 1
    assert counts["credential"] >= 1
    assert masked_payload["is_masked"] is True

    # Assert technical cybercrime indicators are preserved for downstream forensic analysis
    assert "fraud.scammer@okaxis" in masked_text
    assert "112233445566" in masked_text
    assert "192.168.1.100" in masked_text
    assert "https://fake-sbi-portal.top" in masked_text


# -----------------------------------------------------------------------------
# 2. READINESS GATE EVALUATION TESTS
# -----------------------------------------------------------------------------
def test_readiness_gate_evaluation_degrades_when_weights_missing():
    """
    Validates Pillar 2: Readiness Gate Evaluation.
    When neural weights are not provisioned on disk, the gate must return
    DEGRADED_HEURISTIC_ACTIVE and route to HEURISTIC_FALLBACK.
    """
    readiness = threat_triage_engine.evaluate_readiness_gate(force_refresh=True)
    assert readiness["is_provisioned"] is False
    assert readiness["is_loaded"] is False
    assert readiness["is_responsive"] is False
    assert readiness["status"] == "DEGRADED_HEURISTIC_ACTIVE"
    assert readiness["execution_route"] == "HEURISTIC_FALLBACK"
    assert len(readiness["failure_reasons"]) > 0


def test_readiness_gate_evaluation_passes_when_weights_active_and_responsive():
    """
    Validates that when weights are provisioned, loaded, and responsive,
    the gate returns PASS_NEURAL_READY and routes to NEURAL.
    """
    with patch.object(threat_triage_engine, "check_neural_weights_provisioned", return_value=True), \
         patch("app.ai.model_manager.model_manager.get_complaint_model", return_value=(MagicMock(), MagicMock(), ["Financial Fraud"], {}, {})), \
         patch("app.ai.adapters.complaint_classifier.complaint_classifier.predict", return_value={"status": "SUCCESS"}):

        readiness = threat_triage_engine.evaluate_readiness_gate(force_refresh=True)
        assert readiness["is_provisioned"] is True
        assert readiness["is_loaded"] is True
        assert readiness["is_responsive"] is True
        assert readiness["status"] == "PASS_NEURAL_READY"
        assert readiness["execution_route"] == "NEURAL"


# -----------------------------------------------------------------------------
# 3. HEURISTIC FALLBACK SCORING ENGINE TESTS
# -----------------------------------------------------------------------------
def test_heuristic_triage_financial_fraud_with_high_loss():
    """
    Validates Pillar 3 & 4: Heuristic fallback scoring on financial fraud
    with large loss and golden-hour banking transfer indicators.
    """
    raw_text = (
        "Victim PAN ABCDE9999K. Just now my bank account was siphoned through unauthorized UPI transfer. "
        "Rs 15,00,000 debited without consent to mule account. Please freeze account immediately."
    )
    masked_payload = server_side_masking_service.mask_complaint_narrative(raw_text)
    
    with patch.object(threat_triage_engine, "evaluate_readiness_gate", return_value={
        "status": "DEGRADED_HEURISTIC_ACTIVE",
        "is_provisioned": False,
        "is_loaded": False,
        "is_responsive": False,
        "execution_route": "HEURISTIC_FALLBACK",
        "failure_reasons": ["Neural weights offline"],
        "details": "Heuristic fallback active."
    }):
        result = threat_triage_engine.triage_masked_payload(
            masked_payload=masked_payload,
            financial_loss=1500000.0
        )

        assert result["status"] == "SUCCESS"
        assert result["execution_mode"] == "HEURISTIC_FALLBACK"
        assert result["threat_category"] == ThreatCategory.FINANCIAL_FRAUD
        assert result["priority"] == "CRITICAL"
        assert result["triage_score"] >= 85
        assert result["is_high_risk"] is True
        assert result["provenance"]["execution_mode"] == "HEURISTIC_FALLBACK"
        assert result["provenance"]["masked_payload_used"] is True
        assert "advisory_disclaimer" in result["provenance"]


def test_heuristic_triage_ransomware_extortion():
    """Validates heuristic classification and priority scoring for ransomware extortion."""
    raw_text = (
        "All our office server files are locked with .lockbit extension! "
        "Ransomware note left demanding 5 Bitcoin. Hacker threatens to leak all patient medical records online if not paid."
    )
    masked_payload = server_side_masking_service.mask_complaint_narrative(raw_text)
    
    with patch.object(threat_triage_engine, "evaluate_readiness_gate", return_value={
        "status": "DEGRADED_HEURISTIC_ACTIVE",
        "is_provisioned": False,
        "is_loaded": False,
        "is_responsive": False,
        "execution_route": "HEURISTIC_FALLBACK",
        "failure_reasons": ["Neural weights offline"],
        "details": "Heuristic fallback active."
    }):
        result = threat_triage_engine.triage_masked_payload(
            masked_payload=masked_payload,
            financial_loss=500000.0
        )

        assert result["execution_mode"] == "HEURISTIC_FALLBACK"
        assert result["threat_category"] == ThreatCategory.RANSOMWARE
        assert result["priority"] in ["CRITICAL", "HIGH"]
        assert result["triage_score"] >= 75


# -----------------------------------------------------------------------------
# 4. NEURAL EXECUTION MODE & PROVENANCE TAGGING TESTS
# -----------------------------------------------------------------------------
def test_neural_execution_and_provenance_tagging():
    """
    Validates Pillar 3 & 4: When readiness gate passes, neural models predict
    threat category and priority, and the result is tagged as NEURAL with full provenance.
    """
    mock_gate = {
        "status": "PASS_NEURAL_READY",
        "is_provisioned": True,
        "is_loaded": True,
        "is_responsive": True,
        "execution_route": "NEURAL",
        "failure_reasons": [],
        "details": "Neural pipeline verified."
    }

    mock_category_result = {
        "status": "SUCCESS",
        "model": "ccip-complaint-classifier-deberta-v3",
        "architecture": "microsoft/deberta-v3-base",
        "predictions": [
            {"label": "Phishing / Social Eng", "probability": 0.94, "threshold": 0.50},
            {"label": "Identity Theft", "probability": 0.42, "threshold": 0.50}
        ]
    }

    mock_urgency_result = {
        "model_name": "ccip-incident-urgency-distilroberta-v3",
        "urgency_level": "HIGH",
        "confidence": 0.91,
        "probabilities": {"LOW": 0.02, "MEDIUM": 0.07, "HIGH": 0.88, "CRITICAL": 0.03}
    }

    raw_text = "Complainant clicked fake SBI KYC phishing link sent via SMS. Password was entered."
    masked_payload = server_side_masking_service.mask_complaint_narrative(raw_text)

    with patch.object(threat_triage_engine, "evaluate_readiness_gate", return_value=mock_gate), \
         patch("app.ai.adapters.complaint_classifier.complaint_classifier.predict", return_value=mock_category_result), \
         patch("app.ai.adapters.incident_urgency.incident_urgency_adapter.predict_urgency", return_value=mock_urgency_result):

        result = threat_triage_engine.triage_masked_payload(
            masked_payload=masked_payload,
            financial_loss=15000.0
        )

        assert result["status"] == "SUCCESS"
        assert result["execution_mode"] == "NEURAL"
        assert result["threat_category"] == "Phishing / Social Eng"
        assert result["priority"] == "HIGH"
        assert result["readiness_gate"]["status"] == "PASS_NEURAL_READY"
        assert result["provenance"]["execution_mode"] == "NEURAL"
        assert result["provenance"]["masked_payload_used"] is True
        assert "advisory_disclaimer" in result["provenance"]


# -----------------------------------------------------------------------------
# 5. END-TO-END PIPELINE & CASE QUEUE PRIORITIZATION TESTS
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_end_to_end_complaint_submission_triage_and_case_priority_queue(
    client: AsyncClient
):
    """
    Validates Pillar 1 through 5 end-to-end:
    - Submitting a complaint triggers Server-Side Masking Module [5].
    - Delivers masked payload to Threat-Triage Engine [6].
    - Triage classification updates Case Priority and Risk Score.
    - Timeline event records the triage execution mode and provenance.
    - Case Management endpoint (/cases?order_by=priority_queue) returns cases
      ranked in proper priority queue order (CRITICAL > HIGH > MEDIUM > LOW).
    """
    # 1. Register a test citizen
    reg_resp = await client.post("/api/v1/auth/register", json={
        "name": "Arjun Sharma",
        "email": "arjun.sharma@delhi-telecom.org",
        "phone": "+91 98111 22334",
        "password": "SecurePassword#2026",
        "consent": True
    })
    assert reg_resp.status_code in [200, 201], f"Registration failed: {reg_resp.text}"
    citizen_token = reg_resp.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # 2. Citizen submits urgent financial wire fraud complaint with sensitive PII
    complaint_payload = {
        "title": "Unauthorized Golden-Hour Wire Fraud Transfer",
        "category": "Financial Fraud",
        "severity": "MEDIUM",  # Citizen selects medium, but triage should evaluate CRITICAL
        "incidentDate": "2026-10-27",
        "financialLoss": 2500000.0,  # 25 Lakhs loss -> triggers CRITICAL priority
        "description": (
            "Complainant Aadhaar 3456 7890 1234 and PAN BKZPD1111K were leaked. "
            "Password Secret9988! was entered on fake phishing site. "
            "Rs 25,00,000 siphoned via unauthorized IMPS transfer to mule UPI scammer@okaxis. "
            "Need immediate emergency debit freeze within the golden hour!"
        ),
        "suspectInfo": {
            "alias": "Fraud Syndicate Alpha",
            "phone": "+919876543210"
        }
    }

    create_resp = await client.post(
        "/api/v1/complaints",
        json=complaint_payload,
        headers=citizen_headers
    )
    assert create_resp.status_code == 201, f"Complaint creation failed: {create_resp.text}"
    created_data = create_resp.json()
    complaint_id = created_data["id"]

    # Assert triage automatically updated triage_score and priority
    assert created_data["aiTriageScore"] >= 85
    assert created_data["severity"] == "CRITICAL"
    assert created_data["triageExecutionMode"] in ["NEURAL", "HEURISTIC_FALLBACK"]

    # Verify timeline events record the triage execution
    timeline = created_data.get("timeline", [])
    triage_events = [ev for ev in timeline if "Threat Triage Executed" in ev["title"]]
    assert len(triage_events) >= 1, "Forensic Threat Triage Executed timeline event was not sealed"
    assert "Masking" in triage_events[0]["description"]

    # 3. Log in as specialist to inspect the Case Management Priority Queue
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200, f"Specialist login failed: {login_resp.text}"
    specialist_token = login_resp.json()["access_token"]
    specialist_headers = {"Authorization": f"Bearer {specialist_token}"}

    # 4. Specialist retrieves Case Management Priority Queue
    cases_resp = await client.get(
        "/api/v1/cases?order_by=priority_queue",
        headers=specialist_headers
    )
    assert cases_resp.status_code == 200
    cases_list = cases_resp.json()
    assert len(cases_list) > 0

    # Ensure the priority queue is strictly sorted: highest priority first
    priority_ranks = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
    for i in range(len(cases_list) - 1):
        rank_curr = priority_ranks.get(cases_list[i]["priority"], 0)
        rank_next = priority_ranks.get(cases_list[i + 1]["priority"], 0)
        assert rank_curr >= rank_next, (
            f"Case Priority Queue out of order: {cases_list[i]['priority']} ({rank_curr}) "
            f"appeared before {cases_list[i + 1]['priority']} ({rank_next})"
        )


@pytest.mark.asyncio
async def test_triage_api_evaluate_and_readiness_endpoints(
    client: AsyncClient
):
    """
    Validates dedicated API endpoints:
    - POST /api/v1/triage/evaluate
    - GET /api/v1/triage/readiness
    """
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    specialist_token = login_resp.json()["access_token"]
    specialist_headers = {"Authorization": f"Bearer {specialist_token}"}

    # Test GET /readiness
    readiness_resp = await client.get(
        "/api/v1/triage/readiness",
        headers=specialist_headers
    )
    assert readiness_resp.status_code == 200
    readiness_json = readiness_resp.json()
    assert "readiness_gate" in readiness_json
    assert "is_provisioned" in readiness_json["readiness_gate"]
    assert "is_loaded" in readiness_json["readiness_gate"]
    assert "is_responsive" in readiness_json["readiness_gate"]

    # Test POST /evaluate
    eval_resp = await client.post(
        "/api/v1/triage/evaluate",
        json={
            "text": "Card 4111 2222 3333 4444 entered on fake bank page with password MyPass@123. Stolen INR 60,000 via UPI test@upi.",
            "financial_loss": 60000.0
        },
        headers=specialist_headers
    )
    assert eval_resp.status_code == 200
    eval_json = eval_resp.json()
    assert eval_json["status"] == "SUCCESS"
    assert eval_json["execution_mode"] in ["NEURAL", "HEURISTIC_FALLBACK"]
    assert "threat_category" in eval_json
    assert "priority" in eval_json
    assert "triage_score" in eval_json
    assert "masked_payload_delivery" in eval_json
    assert eval_json["masked_payload_delivery"]["is_masked"] is True
    assert eval_json["provenance"]["masked_payload_used"] is True
