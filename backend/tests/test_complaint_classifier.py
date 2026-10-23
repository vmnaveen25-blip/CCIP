"""
Automated Verification Suite: DeBERTa-v3 Complaint Classifier Model
Verifies physical artifacts, schema integrity, 18-label calibration,
local model reload, lazy-load singleton caching, and HTTP API endpoints.
"""

import json
import pytest
from httpx import AsyncClient

from app.core.model_config import (
    COMPLAINT_MODEL_PATH,
    COMPLAINT_MODEL_WEIGHTS,
    COMPLAINT_MODEL_CONFIG,
    COMPLAINT_MODEL_LABELS,
    COMPLAINT_MODEL_THRESHOLDS,
    COMPLAINT_MODEL_METADATA,
    COMPLAINT_MODEL_METRICS
)
from app.ai.model_manager import model_manager
from app.ai.adapters.complaint_classifier import complaint_classifier


def test_complaint_model_artifacts_exist():
    """1. Verify all complaint classifier model artifacts physically exist on disk."""
    assert COMPLAINT_MODEL_PATH.is_dir(), "Complaint model directory missing"
    assert COMPLAINT_MODEL_WEIGHTS.is_file(), "model.safetensors missing"
    assert COMPLAINT_MODEL_CONFIG.is_file(), "config.json missing"
    assert COMPLAINT_MODEL_LABELS.is_file(), "labels.json missing"
    assert COMPLAINT_MODEL_THRESHOLDS.is_file(), "thresholds.json missing"
    assert COMPLAINT_MODEL_METADATA.is_file(), "metadata.json missing"
    assert COMPLAINT_MODEL_METRICS.is_file(), "metrics.json missing"
    assert (COMPLAINT_MODEL_PATH / "tokenizer.json").is_file(), "tokenizer.json missing"
    assert (COMPLAINT_MODEL_PATH / "tokenizer_config.json").is_file(), "tokenizer_config.json missing"
    assert COMPLAINT_MODEL_WEIGHTS.stat().st_size > 500_000_000, "model.safetensors size is unrealistically small"


def test_complaint_model_exactly_18_labels():
    """2. Confirm labels.json contains exactly 18 cybercrime categories."""
    with open(COMPLAINT_MODEL_LABELS, "r", encoding="utf-8") as f:
        data = json.load(f)
    labels = data.get("labels", [])
    assert len(labels) == 18, f"Expected exactly 18 labels, found {len(labels)}"
    assert "UPI_FRAUD" in labels
    assert "PHISHING" in labels
    assert "DIGITAL_ARREST" in labels
    assert "OTHER" in labels


def test_complaint_model_thresholds_parse():
    """3. Confirm thresholds.json provides valid float thresholds [0, 1] for all 18 labels."""
    with open(COMPLAINT_MODEL_LABELS, "r", encoding="utf-8") as f:
        labels = json.load(f).get("labels", [])
    with open(COMPLAINT_MODEL_THRESHOLDS, "r", encoding="utf-8") as f:
        thresholds = json.load(f)

    for label in labels:
        assert label in thresholds, f"Missing calibrated threshold for label: {label}"
        val = thresholds[label]
        assert isinstance(val, (int, float)), f"Threshold for {label} is not a number"
        assert 0.0 <= val <= 1.0, f"Threshold for {label} out of range [0, 1]: {val}"


def test_complaint_model_local_reload():
    """4. Verify model and tokenizer reload locally without external network access."""
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch

    tokenizer = AutoTokenizer.from_pretrained(str(COMPLAINT_MODEL_PATH), local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(str(COMPLAINT_MODEL_PATH), local_files_only=True)
    model.eval()

    num_labels = getattr(model.config, "num_labels", len(model.config.id2label))
    assert num_labels == 18

    encoded = tokenizer("Test narrative", return_tensors="pt", truncation=True, max_length=512)
    with torch.inference_mode():
        logits = model(**encoded).logits
    probs = torch.sigmoid(logits)[0]
    assert probs.shape[0] == 18


def test_complaint_lazy_loading_and_singleton_caching():
    """5 & 7. Verify lazy loading and thread-safe singleton caching."""
    bundle1 = model_manager.get_complaint_model()
    assert bundle1 is not None
    assert len(bundle1) == 5  # (model, tokenizer, labels, thresholds, metadata)

    bundle2 = model_manager.get_complaint_model()
    # Identical in-memory cached instance
    assert bundle1[0] is bundle2[0]
    assert bundle1[1] is bundle2[1]


def test_complaint_first_inference_succeeds():
    """6 & 10. First inference succeeds with valid probabilities and schema."""
    text = "I sent money to a fraudulent UPI QR code and was scammed."
    res = complaint_classifier.predict(text)

    assert res["status"] == "SUCCESS"
    assert res["model"] == "complaint_classifier"
    assert isinstance(res["is_cybercrime"], bool)
    assert isinstance(res["predictions"], list)

    for pred in res["predictions"]:
        assert "label" in pred
        assert "probability" in pred
        assert "threshold" in pred
        assert 0.0 <= pred["probability"] <= 1.0
        assert 0.0 <= pred["threshold"] <= 1.0
        assert pred["probability"] >= pred["threshold"]


def test_complaint_empty_input_rejected():
    """8. Empty or whitespace-only inputs are rejected with ValueError."""
    with pytest.raises(ValueError):
        complaint_classifier.predict("")

    with pytest.raises(ValueError):
        complaint_classifier.predict("   \n\t  ")


@pytest.mark.asyncio
async def test_complaint_api_endpoint_success(client: AsyncClient):
    """9 & 10. POST /api/v1/ai/test/complaint returns 200 with truthful predictions."""
    payload = {
        "text": "A police officer on WhatsApp said drugs were found in a parcel in my name and demanded money to avoid arrest."
    }
    resp = await client.post("/api/v1/ai/test/complaint", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "SUCCESS"
    assert data["model"] == "complaint_classifier"
    assert data["is_cybercrime"] is True
    assert len(data["predictions"]) > 0

    for pred in data["predictions"]:
        assert 0.0 <= pred["probability"] <= 1.0
        assert 0.0 <= pred["threshold"] <= 1.0


@pytest.mark.asyncio
async def test_complaint_api_endpoint_empty_rejected(client: AsyncClient):
    """POST /api/v1/ai/test/complaint with empty text returns 422 Unprocessable Entity."""
    resp = await client.post("/api/v1/ai/test/complaint", json={"text": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_complaint_model_status_endpoint(client: AsyncClient):
    """11. Verify GET /api/v1/ai/models/status reports complaint_classifier properly."""
    resp = await client.get("/api/v1/ai/models/status")
    assert resp.status_code == 200
    data = resp.json()

    assert "complaint_classifier" in data["models"]
    info = data["models"]["complaint_classifier"]
    assert info["files_available"] is True
    assert info["available"] is True
    assert info["state"] in ["READY_FOR_LAZY_LOAD", "LOADED"]
    assert info["status"] in ["READY_FOR_LAZY_LOAD", "LOADED"]


def test_complaint_legitimate_salary_message():
    """12. Legitimate non-crime message does not crash inference and yields is_cybercrime=False."""
    text = "Your salary has been credited to your account."
    res = complaint_classifier.predict(text)

    assert res["status"] == "SUCCESS"
    assert res["model"] == "complaint_classifier"
    assert res["is_cybercrime"] is False
    assert res["predictions"] == []
