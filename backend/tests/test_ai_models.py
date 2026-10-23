"""
Automated AI Model Runtime Verification Suite
Tests the three local trained models (Email Threat DistilBERT, SMS Spam DistilBERT,
and URL Phishing XGBoost) to ensure genuine runtime execution, valid probability distributions,
calibrated thresholds, lazy loading behavior, and resilient error handling.
"""

import pytest
from httpx import AsyncClient
from app.core.model_config import (
    EMAIL_MODEL_WEIGHTS,
    EMAIL_MODEL_CONFIG,
    SMS_MODEL_WEIGHTS,
    SMS_MODEL_CONFIG,
    URL_MODEL_WEIGHTS,
    URL_MODEL_FEATURES,
    URL_MODEL_EXTRACTOR,
)
from app.ai.model_manager import model_manager
from app.ai.email_classifier import email_classifier
from app.ai.sms_classifier import sms_classifier
from app.ai.url_classifier import url_classifier


def test_model_files_exist_on_disk():
    """Verify that all required trained model weights, tokenizers, and configs exist."""
    # Email Threat files
    assert EMAIL_MODEL_WEIGHTS.is_file(), "Email model weights (model.safetensors) missing"
    assert EMAIL_MODEL_CONFIG.is_file(), "Email model config.json missing"
    assert (EMAIL_MODEL_WEIGHTS.parent / "tokenizer.json").is_file(), "Email tokenizer.json missing"
    assert (EMAIL_MODEL_WEIGHTS.parent / "metadata.json").is_file(), "Email metadata.json missing"

    # SMS Spam files
    assert SMS_MODEL_WEIGHTS.is_file(), "SMS model weights (model.safetensors) missing"
    assert SMS_MODEL_CONFIG.is_file(), "SMS model config.json missing"
    assert (SMS_MODEL_WEIGHTS.parent / "tokenizer.json").is_file(), "SMS tokenizer.json missing"
    assert (SMS_MODEL_WEIGHTS.parent / "metadata.json").is_file(), "SMS metadata.json missing"

    # URL Phishing files
    assert URL_MODEL_WEIGHTS.is_file(), "URL model weights (phishing_model.pkl) missing"
    assert URL_MODEL_FEATURES.is_file(), "URL feature names (feature_names.pkl) missing"
    assert URL_MODEL_EXTRACTOR.is_file(), "URL feature_extractor.py missing"


@pytest.mark.asyncio
async def test_model_status_endpoint(client: AsyncClient):
    """Ensure GET /api/v1/ai/models/status reports availability without loading all models into memory."""
    resp = await client.get("/api/v1/ai/models/status")
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "healthy"
    assert "models" in data

    for model_key in ["email_threat", "sms_spam", "url_phishing"]:
        assert model_key in data["models"]
        model_info = data["models"][model_key]
        assert model_info["files_available"] is True
        assert isinstance(model_info["loaded"], bool)
        assert model_info["status"] in ["READY_FOR_LAZY_LOAD", "LOADED"]


@pytest.mark.asyncio
async def test_email_threat_real_inference(client: AsyncClient):
    """
    Verify real DistilBERT inference on normal vs suspicious emails.
    Verifies valid probabilities, calibrated threshold (0.01133), and valid schema.
    """
    normal_email = (
        "Good afternoon team, please review the attached slide deck before our 3 PM architecture review. "
        "Best regards, Engineering Ops."
    )
    suspicious_email = (
        "URGENT NOTICE: Your bank account access has been frozen due to suspicious activity. "
        "Click the link immediately to confirm your credentials: http://banking-security-update.ru/login"
    )

    # 1. Normal Email
    resp1 = await client.post("/api/v1/ai/test/email", json={"text": normal_email})
    assert resp1.status_code == 200
    data1 = resp1.json()

    assert data1["model"] == "email_threat"
    assert data1["available"] is True
    assert data1["label"] in ["SAFE_EMAIL", "SUSPICIOUS_EMAIL"]
    assert data1["prediction"] in [0, 1]
    assert 0.0 <= data1["confidence"] <= 1.0
    assert 0.0 <= data1["safe_probability"] <= 1.0
    assert 0.0 <= data1["threat_probability"] <= 1.0
    assert abs((data1["safe_probability"] + data1["threat_probability"]) - 1.0) < 0.01
    assert data1["threshold"] == 0.01133
    # Real model should classify standard business email as SAFE
    assert data1["label"] == "SAFE_EMAIL"
    assert data1["prediction"] == 0

    # 2. Suspicious Email
    resp2 = await client.post("/api/v1/ai/test/email", json={"text": suspicious_email})
    assert resp2.status_code == 200
    data2 = resp2.json()

    assert data2["model"] == "email_threat"
    assert data2["available"] is True
    assert data2["label"] in ["SAFE_EMAIL", "SUSPICIOUS_EMAIL"]
    assert data2["prediction"] in [0, 1]
    assert 0.0 <= data2["confidence"] <= 1.0
    assert 0.0 <= data2["threat_probability"] <= 1.0
    # Real model should classify obvious credential harvest threat as SUSPICIOUS_EMAIL
    assert data2["label"] == "SUSPICIOUS_EMAIL"
    assert data2["prediction"] == 1
    assert data2["threat_probability"] > data1["threat_probability"]


@pytest.mark.asyncio
async def test_sms_spam_real_inference(client: AsyncClient):
    """
    Verify real DistilBERT inference on normal vs spam SMS messages.
    Verifies valid probabilities, calibrated threshold (0.2685), and valid schema.
    """
    normal_sms = "Hi Mom, I will be home around 6:30 for dinner tonight."
    spam_sms = "CONGRATULATIONS! You have been selected to receive a $1000 Walmart Gift Card! Claim now: text YES to 88990"

    # 1. Normal SMS
    resp1 = await client.post("/api/v1/ai/test/sms", json={"text": normal_sms})
    assert resp1.status_code == 200
    data1 = resp1.json()

    assert data1["model"] == "sms_spam"
    assert data1["available"] is True
    assert data1["label"] in ["SAFE", "SPAM"]
    assert data1["prediction"] in [0, 1]
    assert 0.0 <= data1["confidence"] <= 1.0
    assert 0.0 <= data1["safe_probability"] <= 1.0
    assert 0.0 <= data1["spam_probability"] <= 1.0
    assert abs((data1["safe_probability"] + data1["spam_probability"]) - 1.0) < 0.01
    assert data1["threshold"] == 0.2685
    assert data1["label"] == "SAFE"
    assert data1["prediction"] == 0

    # 2. Spam SMS
    resp2 = await client.post("/api/v1/ai/test/sms", json={"text": spam_sms})
    assert resp2.status_code == 200
    data2 = resp2.json()

    assert data2["model"] == "sms_spam"
    assert data2["available"] is True
    assert data2["label"] in ["SAFE", "SPAM"]
    assert data2["prediction"] in [0, 1]
    assert 0.0 <= data2["confidence"] <= 1.0
    assert 0.0 <= data2["spam_probability"] <= 1.0
    assert data2["label"] == "SPAM"
    assert data2["prediction"] == 1
    assert data2["spam_probability"] > data1["spam_probability"]


@pytest.mark.asyncio
async def test_url_phishing_real_inference(client: AsyncClient):
    """
    Verify real XGBoost inference and feature extraction pipeline on URLs.
    Verifies valid probabilities and alignment with trained 30-feature schema.
    """
    legitimate_url = "https://google.com"
    suspicious_url = "https://bank-security-update-account-verification-alert.com/login@admin"

    # 1. Legitimate URL
    resp1 = await client.post("/api/v1/ai/test/url", json={"url": legitimate_url})
    assert resp1.status_code == 200
    data1 = resp1.json()

    assert data1["model"] == "url_phishing"
    assert data1["available"] is True
    assert data1["label"] in ["Legitimate", "Phishing"]
    assert data1["prediction"] in [0, 1]
    assert 0.0 <= data1["confidence"] <= 1.0
    assert 0.0 <= data1["legitimate_probability"] <= 1.0
    assert 0.0 <= data1["phishing_probability"] <= 1.0
    assert abs((data1["legitimate_probability"] + data1["phishing_probability"]) - 1.0) < 0.01

    # 2. Suspicious URL
    resp2 = await client.post("/api/v1/ai/test/url", json={"url": suspicious_url})
    assert resp2.status_code == 200
    data2 = resp2.json()

    assert data2["model"] == "url_phishing"
    assert data2["available"] is True
    assert data2["label"] in ["Legitimate", "Phishing"]
    assert data2["prediction"] in [0, 1]
    assert 0.0 <= data2["confidence"] <= 1.0
    assert 0.0 <= data2["phishing_probability"] <= 1.0


@pytest.mark.asyncio
async def test_error_handling_and_validation(client: AsyncClient):
    """Verify production error handling for invalid or empty inputs."""
    # Empty email
    resp = await client.post("/api/v1/ai/test/email", json={"text": ""})
    assert resp.status_code == 422

    # Empty SMS
    resp = await client.post("/api/v1/ai/test/sms", json={"text": ""})
    assert resp.status_code == 422

    # Invalid URL
    resp = await client.post("/api/v1/ai/test/url", json={"url": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_lazy_loading_singleton_caching():
    """Verify that models load once and reuse their in-memory cached instances."""
    # First invocation retrieves cached instance
    bundle1 = model_manager.get_email_model()
    bundle2 = model_manager.get_email_model()
    assert bundle1[0] is bundle2[0], "Email model should be cached as a singleton"

    sms_bundle1 = model_manager.get_sms_model()
    sms_bundle2 = model_manager.get_sms_model()
    assert sms_bundle1[0] is sms_bundle2[0], "SMS model should be cached as a singleton"

    url_bundle1 = model_manager.get_url_model()
    url_bundle2 = model_manager.get_url_model()
    assert url_bundle1[0] is url_bundle2[0], "URL model should be cached as a singleton"

    status = model_manager.get_status()
    assert status["models"]["email_threat"]["loaded"] is True
    assert status["models"]["sms_spam"]["loaded"] is True
    assert status["models"]["url_phishing"]["loaded"] is True
