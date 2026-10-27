"""
Complaint Classifier AI Adapter
Integrates the fine-tuned DeBERTa-v3-base multi-label cybercrime classifier.
Performs thread-safe, local inference with per-label calibrated thresholding.
"""

from typing import Any, Dict, Optional
import torch

from app.core.logging import logger
from app.ai.base import BaseAIAdapter
from app.core.model_config import (
    COMPLAINT_MODEL_WEIGHTS,
    COMPLAINT_MODEL_CONFIG
)
from app.ai.model_manager import model_manager


class ComplaintClassifier(BaseAIAdapter):
    """
    Production-grade multi-label cybercrime complaint classification adapter.
    Evaluates incident narratives across 18 specialized cybercrime categories.
    """

    @property
    def adapter_name(self) -> str:
        return "ComplaintClassifier"

    @property
    def is_available(self) -> bool:
        """Returns True if local DeBERTa-v3 weights and config are physically available."""
        return COMPLAINT_MODEL_WEIGHTS.is_file() and COMPLAINT_MODEL_CONFIG.is_file()

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Executes multi-label complaint classification using DeBERTa-v3-base.
        Applies per-label calibrated thresholds from thresholds.json.

        Contract:
        - Rejects empty/whitespace input
        - Truncates to max_length=512
        - Returns only predictions meeting or exceeding calibrated threshold
        - Computes is_cybercrime based on thresholded predictions
        """
        if not isinstance(text, str):
            raise ValueError("Input text must be a string.")

        clean_text = text.strip()
        if not clean_text:
            raise ValueError("Input text cannot be empty or whitespace.")

        # Sensible maximum request length guard
        if len(clean_text) > 10000:
            clean_text = clean_text[:10000]

        if not self.is_available:
            raise FileNotFoundError("Complaint Classifier model weights not found in local enclave.")

        # Lazy-load or fetch cached model bundle
        model, tokenizer, labels, thresholds, metadata = model_manager.get_complaint_model()

        encoded = tokenizer(
            clean_text,
            return_tensors="pt",
            truncation=True,
            max_length=512
        )

        with torch.inference_mode():
            logits = model(**encoded).logits

        probabilities = torch.sigmoid(logits)[0]

        predictions = []
        for idx, label in enumerate(labels):
            prob = float(probabilities[idx].item())
            thresh = float(thresholds.get(label, 0.5))
            if prob >= thresh:
                predictions.append({
                    "label": label,
                    "probability": round(prob, 4),
                    "threshold": round(thresh, 4)
                })

        # Sort predictions by probability descending
        predictions.sort(key=lambda x: x["probability"], reverse=True)

        # is_cybercrime is True if one or more complaint labels exceed their thresholds
        # Note: OTHER is also a valid cybercrime category if thresholded
        is_cybercrime = len(predictions) > 0

        return {
            "status": "SUCCESS",
            "model": "complaint_classifier",
            "is_cybercrime": is_cybercrime,
            "predictions": predictions,
            "model_version": metadata.get("dataset_version", "1.1.0"),
            "architecture": metadata.get("base_model", "microsoft/deberta-v3-base")
        }

    async def classify(self, text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Classify incident category and urgency based on text narrative."""
        if not self.is_available:
            return self.default_unavailable_response("Complaint Category Classification")
        return self.predict(text)


complaint_classifier = ComplaintClassifier()
