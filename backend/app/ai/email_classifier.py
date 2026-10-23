"""
Email Threat Classifier: Sovereign Inference Service
Performs real DistilBERT sequence classification for phishing and suspicious emails.
"""

from typing import Dict, Any
from app.ai.model_manager import model_manager
from app.core.logging import logger


class EmailThreatClassifier:
    """
    Production inference service for Email Threat & Phishing Detection.
    Uses trained DistilBertForSequenceClassification with sovereign calibrated threshold.
    """

    DEFAULT_THRESHOLD = 0.011331753805279732
    MAX_LENGTH = 256

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Executes real inference on raw email text.
        Returns true model probabilities and threshold-calibrated classification.
        """
        if not text or not isinstance(text, str) or not text.strip():
            raise ValueError("Input email text cannot be empty.")

        try:
            import torch
        except ImportError as e:
            logger.error("PyTorch ('torch') is not installed in the environment.")
            raise RuntimeError("PyTorch ('torch') is required for Email Threat AI model inference.") from e

        # Lazy-load model and tokenizer
        model, tokenizer, metadata = model_manager.get_email_model()

        threshold = metadata.get("decision_threshold", self.DEFAULT_THRESHOLD)
        max_length = metadata.get("maximum_token_length", self.MAX_LENGTH)

        # Tokenize with exact trained hyperparameters
        inputs = tokenizer(
            text.strip(),
            truncation=True,
            max_length=max_length,
            padding=True,
            return_tensors="pt"
        )

        # Inference under evaluation mode with gradients disabled
        with torch.inference_mode():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1).squeeze().tolist()

        if isinstance(probs, float):
            probs = [1.0 - probs, probs]

        safe_prob = float(probs[0])
        threat_prob = float(probs[1])

        # Apply trained threshold
        if threat_prob >= threshold:
            prediction = 1
            label = "SUSPICIOUS_EMAIL"
            confidence = threat_prob
        else:
            prediction = 0
            label = "SAFE_EMAIL"
            confidence = safe_prob

        result = {
            "model": "email_threat",
            "available": True,
            "label": label,
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "safe_probability": round(safe_prob, 4),
            "threat_probability": round(threat_prob, 4),
            "threshold": round(threshold, 5),
            "model_version": metadata.get("model_version", "1.0.0")
        }

        logger.info(
            f"[EmailThreat] text_len={len(text)} -> label={label} "
            f"threat_prob={threat_prob:.4f} (threshold={threshold:.5f})"
        )
        return result


email_classifier = EmailThreatClassifier()
