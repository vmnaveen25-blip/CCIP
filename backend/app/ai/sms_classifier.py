"""
SMS Spam Classifier: Sovereign Inference Service
Performs real DistilBERT sequence classification for SMS spam and smishing threats.
"""

from typing import Dict, Any
from app.ai.model_manager import model_manager
from app.core.logging import logger


class SMSClassifier:
    """
    Production inference service for SMS Spam & Smishing Detection.
    Uses trained DistilBertForSequenceClassification with calibrated spam threshold.
    """

    DEFAULT_THRESHOLD = 0.2685096263885498
    MAX_LENGTH = 128

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Executes real inference on raw SMS text.
        Returns true model probabilities and threshold-calibrated classification.
        """
        if not text or not isinstance(text, str) or not text.strip():
            raise ValueError("Input SMS text cannot be empty.")

        try:
            import torch
        except ImportError as e:
            logger.error("PyTorch ('torch') is not installed in the environment.")
            raise RuntimeError("PyTorch ('torch') is required for SMS Spam AI model inference.") from e

        # Lazy-load model and tokenizer
        model, tokenizer, metadata = model_manager.get_sms_model()

        threshold = metadata.get("spam_threshold", self.DEFAULT_THRESHOLD)
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
        spam_prob = float(probs[1])

        # Apply trained threshold
        if spam_prob >= threshold:
            prediction = 1
            label = "SPAM"
            confidence = spam_prob
        else:
            prediction = 0
            label = "SAFE"
            confidence = safe_prob

        result = {
            "model": "sms_spam",
            "available": True,
            "label": label,
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "safe_probability": round(safe_prob, 4),
            "spam_probability": round(spam_prob, 4),
            "threshold": round(threshold, 4),
            "model_version": metadata.get("model_version", "1.0.0")
        }

        logger.info(
            f"[SMSSpam] text_len={len(text)} -> label={label} "
            f"spam_prob={spam_prob:.4f} (threshold={threshold:.4f})"
        )
        return result


sms_classifier = SMSClassifier()
