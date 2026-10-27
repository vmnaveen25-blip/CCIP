"""
URL Phishing Classifier: Sovereign Inference Service
Performs real XGBoost prediction with 30 heuristic and behavioral features extracted from raw URLs.
"""

from typing import Dict, Any
from urllib.parse import urlparse
from app.ai.model_manager import model_manager
from app.core.logging import logger


class URLPhishingClassifier:
    """
    Production inference service for URL Phishing & Malicious Domain Detection.
    Executes trained XGBClassifier using dynamic feature extraction.
    """

    def predict(self, url: str) -> Dict[str, Any]:
        """
        Executes real inference on a given URL.
        Validates, extracts features, aligns schemas, and computes model probabilities.
        """
        if not url or not isinstance(url, str) or not url.strip():
            raise ValueError("Input URL cannot be empty.")

        try:
            import pandas as pd
        except ImportError as e:
            logger.error("Pandas is not installed in the environment.")
            raise RuntimeError("Pandas is required for URL Phishing AI model inference.") from e

        url = url.strip()
        # Ensure scheme for proper hostname extraction
        if not url.startswith(("http://", "https://")):
            normalized_url = "https://" + url
        else:
            normalized_url = url

        parsed = urlparse(normalized_url)
        if not parsed.hostname:
            raise ValueError("Invalid URL: hostname could not be parsed.")

        # Lazy-load model, feature names list, and feature extraction function
        model, feature_names, extract_features_fn, metadata = model_manager.get_url_model()

        # Extract features using the trained pipeline
        raw_features = extract_features_fn(normalized_url)

        # Convert to DataFrame matching trained feature names exactly
        feature_df = pd.DataFrame([raw_features])
        feature_df = feature_df.reindex(columns=feature_names, fill_value=0)

        # Execute XGBoost inference
        probs = model.predict_proba(feature_df)[0]
        legitimate_prob = float(probs[0])
        phishing_prob = float(probs[1])

        # Model binary prediction (Class 1 = Phishing, Class 0 = Legitimate)
        raw_prediction = int(model.predict(feature_df)[0])
        suspicious_count = sum(1 for v in raw_features.values() if v == 1)

        # Critical heuristic threat indicators
        has_at_symbol = ("@" in url)
        is_ip_domain = (raw_features.get("having_IP_Address") == 1)
        has_suspicious_tld = (raw_features.get("Statistical_report") == 1)
        has_abnormal_host = (raw_features.get("Abnormal_URL") == 1)

        # RFC credential spoofing (@ in URL), IP hosting, and suspicious TLD synthesis
        if has_at_symbol:
            phishing_prob = max(phishing_prob, 0.985)
            legitimate_prob = round(1.0 - phishing_prob, 4)
        elif is_ip_domain and (not parsed.hostname.startswith("127.") and parsed.hostname != "localhost"):
            phishing_prob = max(phishing_prob, 0.96)
            legitimate_prob = round(1.0 - phishing_prob, 4)
        elif has_suspicious_tld and (suspicious_count >= 3 or has_abnormal_host):
            phishing_prob = max(phishing_prob, 0.92)
            legitimate_prob = round(1.0 - phishing_prob, 4)
        elif suspicious_count >= 6:
            phishing_prob = max(phishing_prob, 0.88)
            legitimate_prob = round(1.0 - phishing_prob, 4)

        # Use probability threshold of 0.5 or positive indicator
        if phishing_prob >= 0.5 or raw_prediction == 1 or has_at_symbol:
            prediction = 1
            label = "Phishing"
            confidence = phishing_prob
        else:
            prediction = 0
            label = "Legitimate"
            confidence = legitimate_prob

        result = {
            "model": "url_phishing",
            "engine": "xgboost_classifier",
            "available": True,
            "model_available": True,
            "fallback_mode": False,
            "status": "SUCCESS",
            "label": label,
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "legitimate_probability": round(legitimate_prob, 4),
            "phishing_probability": round(phishing_prob, 4),
            "threshold": 0.5
        }

        logger.info(
            f"[URLPhishing] url={normalized_url[:60]} -> label={label} "
            f"phishing_prob={phishing_prob:.4f} (suspicious_features={suspicious_count}/30)"
        )
        return result


url_classifier = URLPhishingClassifier()
