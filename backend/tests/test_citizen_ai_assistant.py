import pytest
from app.ai.adapters.citizen_assistant import citizen_assistant_adapter
from app.services.citizen_assistant_service import citizen_assistant_service


def test_citizen_assistant_modality_detection():
    # URL detection
    assert citizen_assistant_adapter.detect_modality("https://secure-login-hdfc.phish.top/verify") == "url"
    assert citizen_assistant_adapter.detect_modality("http://electricity-bill-update.in") == "url"
    assert citizen_assistant_adapter.detect_modality("www.paytm-refund-claim.xyz") == "url"

    # Email detection
    assert citizen_assistant_adapter.detect_modality("Subject: Immediate legal notice regarding pending court summons") == "email"
    assert citizen_assistant_adapter.detect_modality("Dear customer, your bank account will be suspended today. Regards, IT Team") == "email"

    # Portal help detection
    assert citizen_assistant_adapter.detect_modality("how to file a cybercrime complaint?") == "portal_help"
    assert citizen_assistant_adapter.detect_modality("what is the 1930 helpline?") == "portal_help"
    assert citizen_assistant_adapter.detect_modality("how can I track my complaint status?") == "portal_help"

    # SMS detection (default for short texts)
    assert citizen_assistant_adapter.detect_modality("Your SBI account has been locked. Click link to verify OTP: 98124") == "sms"


def test_citizen_assistant_portal_guidance():
    res_file = citizen_assistant_service.assist_citizen("How do I file a complaint?", query_type="portal_help")
    assert res_file["success"] is True
    assert res_file["modality"] == "portal_help"
    assert "File a Cybercrime Complaint" in res_file["title"]
    assert len(res_file["guidance_steps"]) >= 4

    res_1930 = citizen_assistant_service.assist_citizen("Tell me about 1930 helpline fund freeze", query_type="portal_help")
    assert res_1930["success"] is True
    assert "1930" in res_1930["title"]
    assert any("Golden Hour" in s for s in res_1930["guidance_steps"])


def test_citizen_assistant_url_screening():
    # Suspicious / homoglyph URL
    res = citizen_assistant_service.assist_citizen("http://192.168.1.1.secure-verify-update.xyz/login", query_type="url")
    assert res["success"] is True
    assert res["modality"] == "url"
    assert "risk_level" in res
    assert "explainable_reasons" in res
    assert len(res["explainable_reasons"]) > 0
    assert len(res["recommended_actions"]) > 0
    assert "prefill_data" in res


def test_citizen_assistant_sms_screening():
    sms_text = "URGENT: Your electricity power will be disconnected tonight. Call officer at 9876543210 immediately."
    res = citizen_assistant_service.assist_citizen(sms_text, query_type="sms")
    assert res["success"] is True
    assert res["modality"] == "sms"
    assert "risk_level" in res
    assert "explainable_reasons" in res
    assert "recommended_actions" in res
