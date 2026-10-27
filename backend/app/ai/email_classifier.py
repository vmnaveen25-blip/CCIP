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

        try:
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
                "engine": "distilbert_transformer",
                "available": True,
                "model_available": True,
                "fallback_mode": False,
                "status": "SUCCESS",
                "label": label,
                "prediction": prediction,
                "confidence": round(confidence, 4),
                "safe_probability": round(safe_prob, 4),
                "threat_probability": round(threat_prob, 4),
                "threshold": round(threshold, 5),
                "threshold_source": "DISTILBERT_CALIBRATED_THRESHOLD",
                "score_type": "CALIBRATED_PROBABILITY",
                "score_semantics": "NEURAL_MODEL_PROBABILITY",
                "model_version": metadata.get("model_version", "1.0.0")
            }

            logger.info(
                f"[EmailThreat] text_len={len(text)} -> label={label} "
                f"threat_prob={threat_prob:.4f} (threshold={threshold:.5f})"
            )
            return result

        except Exception as e:
            logger.info(f"DistilBERT email weights not active ({e}); applying sovereign offline email threat engine.")
            return self._predict_heuristic(text)

    def _predict_heuristic(self, text: str) -> Dict[str, Any]:
        """
        Sovereign offline email threat analysis when DistilBERT model weights are not deployed.
        Calibrated against Business Email Compromise, spear-phishing, extortion, and attachment lures.
        Uses uncalibrated heuristic scoring; does NOT inherit DistilBERT neural thresholds.
        """
        lower = text.lower()
        score = 0.005

        # 1. Business Email Compromise (BEC) and Financial Misdirection
        if any(w in lower for w in ["wire transfer", "ach payment", "invoice", "bank account details", "remittance", "swift code", "vendor payment", "direct deposit", "payroll"]):
            score += 0.35
        if any(w in lower for w in ["updated bank", "new account details", "change of account", "pay immediately", "overdue balance"]):
            score += 0.35

        # 2. Account Security & Credential Harvesting Lures
        if any(w in lower for w in ["password expired", "password expiration", "reset password", "login alert", "re-authenticate", "unauthorized sign-in", "microsoft 365", "office 365", "google workspace"]):
            score += 0.40
        if any(w in lower for w in ["account suspended", "account locked", "verify your account", "action required within", "click here to login"]):
            score += 0.30

        # 3. Legal Coercion, Law Enforcement, & Extortion
        if any(w in lower for w in ["arrest warrant", "court summons", "police notice", "cyber crime", "legal notice", "fbi", "interpol", "extortion", "bitcoin payment", "recorded your video"]):
            score += 0.50

        # 4. Dangerous Attachments and Links
        if any(w in lower for w in [".zip", ".exe", ".scr", ".iso", ".html", "attached invoice", "view attachment", "download attachment", "bit.ly", "tinyurl"]):
            score += 0.30
        elif any(w in lower for w in ["http://", "https://", "click here"]):
            score += 0.15

        # 5. Psychological Urgency
        if any(w in lower for w in ["urgent", "immediately", "immediate action", "within 2 hours", "within 24 hours", "final reminder"]):
            score += 0.20

        # Benign professional discourse adjustments
        if any(w in lower for w in ["sprint review", "meeting notes", "team discussion", "architecture review", "code review", "standup", "best regards", "thanks team"]):
            score -= 0.10

        heuristic_score = round(max(0.001, min(0.99, score)), 4)
        # Explicit heuristic decision boundary: distinct from DistilBERT's neural threshold
        heuristic_threshold = 0.50
        is_threat = heuristic_score >= heuristic_threshold

        return {
            "model": "email_threat",
            "engine": "sovereign_heuristic_fallback",
            "available": True,
            "model_available": False,
            "fallback_mode": True,
            "status": "RESPONDED_DEGRADED_FALLBACK",
            "label": "SUSPICIOUS_EMAIL" if is_threat else "SAFE_EMAIL",
            "prediction": 1 if is_threat else 0,
            "confidence": heuristic_score if is_threat else round(1.0 - heuristic_score, 4),
            "safe_probability": round(1.0 - heuristic_score, 4),
            "threat_probability": heuristic_score,
            "threshold": heuristic_threshold,
            "threshold_source": "HEURISTIC_RULE_DECISION_BOUNDARY",
            "neural_threshold": None,
            "score_type": "UNCALIBRATED_HEURISTIC_SCORE",
            "score_semantics": "UNCALIBRATED_RULE_HEURISTIC",
            "model_version": "1.0.0"
        }


email_classifier = EmailThreatClassifier()
