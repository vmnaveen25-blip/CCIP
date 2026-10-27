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

        try:
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
                "engine": "distilbert_transformer",
                "available": True,
                "model_available": True,
                "fallback_mode": False,
                "status": "SUCCESS",
                "label": label,
                "prediction": prediction,
                "confidence": round(confidence, 4),
                "safe_probability": round(safe_prob, 4),
                "spam_probability": round(spam_prob, 4),
                "threshold": round(threshold, 4),
                "threshold_source": "DISTILBERT_CALIBRATED_THRESHOLD",
                "score_type": "CALIBRATED_PROBABILITY",
                "score_semantics": "NEURAL_MODEL_PROBABILITY",
                "model_version": metadata.get("model_version", "1.0.0")
            }

            logger.info(
                f"[SMSSpam] text_len={len(text)} -> label={label} "
                f"spam_prob={spam_prob:.4f} (threshold={threshold:.4f})"
            )
            return result

        except Exception as e:
            logger.info(f"DistilBERT weights not active ({e}); applying sovereign offline smishing engine.")
            return self._predict_heuristic(text)

    def _predict_heuristic(self, text: str) -> Dict[str, Any]:
        """
        Sovereign offline smishing analysis when DistilBERT model weights are not deployed.
        Calibrated against banking, UPI, KYC, lottery, and APK smishing patterns.
        Uses uncalibrated heuristic scoring; does NOT inherit DistilBERT neural thresholds.
        """
        lower = text.lower()
        score = 0.05

        # 1. Banking / Financial credential harvesting indicators
        if any(w in lower for w in ["otp", "pin", "cvv", "password", "debit card", "credit card", "netbanking", "atm"]):
            score += 0.40
        if any(w in lower for w in ["sbi", "yono", "hdfc", "icici", "axis", "pnb", "bob", "canara", "paytm", "phonepe", "gpay", "upi", "rbi"]):
            score += 0.30
        if any(w in lower for w in ["kyc", "pan", "pan card", "aadhaar", "bank account", "beneficiary"]):
            score += 0.25

        # 2. Urgency and Account Coercion
        if any(w in lower for w in ["blocked", "locked", "suspended", "suspend", "freeze", "frozen", "deactivated", "cut off", "disconnected", "penalty", "fine"]):
            score += 0.35
        if any(w in lower for w in ["immediately", "within 24 hours", "today only", "urgent", "24 hrs", "final notice", "electricity"]):
            score += 0.25

        # 3. Lottery, Reward, Task, and Part-time Job Scams
        if any(w in lower for w in ["lottery", "won", "winner", "prize", "kbc", "crore", "lakh", "cashback", "reward", "lucky draw", "jackpot"]):
            score += 0.45
        if any(w in lower for w in ["part-time job", "part time", "daily income", "telegram task", "earn rs", "earn 5000", "youtube subscribe", "review task"]):
            score += 0.45

        # 4. Deceptive URLs and APK Malware
        if any(w in lower for w in [".apk", "bit.ly", "tinyurl", "cutt.ly", "t.co", ".xyz", ".top", ".buzz", ".club", ".cam", ".sbs"]):
            score += 0.35
        elif any(w in lower for w in ["http://", "https://", "www."]):
            score += 0.20

        # 5. Calls to action
        if any(w in lower for w in ["click here", "update now", "verify now", "call now", "contact now", "download app"]):
            score += 0.20

        # Normal conversational adjustments
        if any(w in lower for w in ["dad", "mom", "friend", "home", "dinner", "lunch", "office", "meeting", "ok", "thanks", "hello", "hi"]):
            score -= 0.15

        # Legitimate transaction receipts without lures
        if ("credited to" in lower or "debited by" in lower or "avlbl bal" in lower or "avl bal" in lower) and not any(w in lower for w in ["click", "http", "update", "verify", "blocked", "kyc"]):
            score = 0.08

        # Standard authentic OTP alerts
        if "otp" in lower and "never share" in lower and not any(w in lower for w in ["click", "http", "blocked", "kyc", "link", "update", "locked"]):
            score = 0.05

        heuristic_score = round(max(0.01, min(0.99, score)), 4)
        # Explicit heuristic decision boundary: distinct from DistilBERT's neural threshold
        heuristic_threshold = 0.50
        is_spam = heuristic_score >= heuristic_threshold

        return {
            "model": "sms_spam",
            "engine": "sovereign_heuristic_fallback",
            "available": True,
            "model_available": False,
            "fallback_mode": True,
            "status": "RESPONDED_DEGRADED_FALLBACK",
            "label": "SPAM" if is_spam else "SAFE",
            "prediction": 1 if is_spam else 0,
            "confidence": heuristic_score if is_spam else round(1.0 - heuristic_score, 4),
            "safe_probability": round(1.0 - heuristic_score, 4),
            "spam_probability": heuristic_score,
            "threshold": heuristic_threshold,
            "threshold_source": "HEURISTIC_RULE_DECISION_BOUNDARY",
            "neural_threshold": None,
            "score_type": "UNCALIBRATED_HEURISTIC_SCORE",
            "score_semantics": "UNCALIBRATED_RULE_HEURISTIC",
            "model_version": "1.0.0"
        }


sms_classifier = SMSClassifier()
