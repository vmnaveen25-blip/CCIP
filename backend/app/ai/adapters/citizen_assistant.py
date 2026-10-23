"""
Citizen Portal AI Assistant ("Citizen Cyber Shield") Adapter
Provides real pre-incident cyber threat analysis and portal navigation assistance.
Evaluates suspicious URLs, SMS texts, and emails using the sovereign enclave AI models:
- url_phishing (XGBoost)
- sms_spam (DistilBERT)
- email_threat (DistilBERT)
Generates explainable rationale and safe digital hygiene advice.
Answers procedural queries (filing complaints, tracking case, 1930 emergency advice).
"""

import re
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

from app.ai.url_classifier import URLPhishingClassifier
from app.ai.sms_classifier import SMSClassifier
from app.ai.email_classifier import EmailThreatClassifier
from app.core.logging import logger


class CitizenAssistantAdapter:
    """
    Production assistant adapter serving pre-incident threat assessment and procedural help.
    Strictly explains results derived from real underlying model outputs.
    """

    def __init__(self):
        self.url_classifier = URLPhishingClassifier()
        self.sms_classifier = SMSClassifier()
        self.email_classifier = EmailThreatClassifier()

    def detect_modality(self, content: str) -> str:
        """Heuristically detects whether user query is a URL, Email, SMS, or General Help."""
        s = content.strip()
        # Check if URL
        if re.match(r"^(https?:\/\/|www\.)[^\s]+$", s, re.IGNORECASE) or (
            len(s.split()) == 1 and ("." in s and ("http" in s or "/" in s or any(s.endswith(tld) for tld in [".com", ".in", ".org", ".net", ".xyz", ".top", ".info", ".online", ".site", ".ru", ".cn"])))
        ):
            return "url"

        # Check if Email content (headers, Subject:, Dear citizen, email signatures)
        lower = s.lower()
        if (
            "subject:" in lower or "from:" in lower or "to:" in lower or
            "dear customer" in lower or "dear user" in lower or "regards," in lower or
            "dear account holder" in lower or len(s) > 300
        ):
            return "email"

        # Check if portal help request
        help_keywords = ["how to file", "how to track", "complaint status", "helpline", "1930", "portal", "fir", "police", "process", "where to report"]
        if any(kw in lower for kw in help_keywords) and len(s) < 200:
            return "portal_help"

        # Default short messages to SMS / text
        return "sms"

    def analyze_threat(self, content: str, query_type: str = "auto") -> Dict[str, Any]:
        """
        Executes pre-incident screening using real enclave models.
        Returns explainable rationale and defensive instructions.
        """
        content = content.strip()
        if not content:
            raise ValueError("Query content cannot be empty.")

        modality = query_type if query_type != "auto" else self.detect_modality(content)

        if modality == "url":
            return self._analyze_url(content)
        elif modality == "email":
            return self._analyze_email(content)
        elif modality == "sms":
            return self._analyze_sms(content)
        elif modality == "portal_help":
            return self._answer_portal_help(content)
        else:
            return self._analyze_sms(content)

    def _analyze_url(self, url_str: str) -> Dict[str, Any]:
        try:
            pred = self.url_classifier.predict(url_str)
            phishing_prob = pred.get("phishing_probability", 0.0)
            is_phish = pred.get("is_phishing", False) or phishing_prob >= 0.5

            reasons = []
            if phishing_prob >= 0.7:
                risk_level = "HIGH_RISK"
                reasons.append("The machine learning classifier identified deceptive URL heuristics matching known phishing kit architectures.")
            elif phishing_prob >= 0.4:
                risk_level = "SUSPICIOUS"
                reasons.append("The link exhibits elevated risk indicators or atypical domain formatting.")
            else:
                risk_level = "SAFE"
                reasons.append("Structural lexical features show normal, legitimate web domain characteristics.")

            # Add human-friendly explainable breakdown
            parsed = urlparse(url_str if url_str.startswith("http") else "http://" + url_str)
            host = parsed.hostname or url_str
            if any(char.isdigit() for char in host):
                reasons.append("Domain hostname contains numeric characters, often used in disposable scam hosts.")
            if host.count(".") > 2:
                reasons.append("Excessive subdomains detected, typical of homoglyph or spoofing attempts.")
            if "@" in url_str:
                reasons.append("URL contains '@' symbol which can conceal the true destination server.")

            recommendations = []
            if risk_level in ["HIGH_RISK", "SUSPICIOUS"]:
                recommendations.append("DO NOT click this link or enter passwords, OTPs, or bank account numbers.")
                recommendations.append("Never download APK files or install apps suggested by this link.")
                recommendations.append("If this link was sent via SMS/WhatsApp claiming to be your bank or electricity provider, contact the official helpline directly.")
            else:
                recommendations.append("While this URL currently appears normal, always verify the SSL certificate padlock before entering login credentials.")

            return {
                "modality": "url",
                "risk_level": risk_level,
                "is_threat": is_phish,
                "confidence": round(phishing_prob if is_phish else pred.get("legitimate_probability", 1.0 - phishing_prob), 4),
                "model_name": "url_phishing_xgboost",
                "model_version": pred.get("model_version", "1.0.0"),
                "raw_metrics": {
                    "phishing_probability": phishing_prob,
                    "legitimate_probability": pred.get("legitimate_probability", 1.0 - phishing_prob)
                },
                "explainable_reasons": reasons,
                "recommended_actions": recommendations,
                "can_prefill_complaint": is_phish,
                "prefill_data": {
                    "category": "PHISHING",
                    "suspect_url": url_str,
                    "description": f"Citizen received suspicious phishing URL: {url_str}. AI risk level: {risk_level} (Confidence: {phishing_prob:.2%})."
                }
            }
        except Exception as e:
            logger.error(f"URL analysis error: {e}")
            raise

    def _analyze_sms(self, text: str) -> Dict[str, Any]:
        try:
            pred = self.sms_classifier.predict(text)
            spam_prob = pred.get("spam_probability", 0.0)
            label = pred.get("label", "SAFE")
            is_spam = (label == "SPAM")

            reasons = []
            lower = text.lower()
            if is_spam:
                risk_level = "HIGH_RISK" if spam_prob > 0.7 else "SUSPICIOUS"
                reasons.append(f"DistilBERT sequence model classified message as smishing/spam with {spam_prob:.1%} model probability.")
                if any(w in lower for w in ["otp", "pin", "cvv", "password"]):
                    reasons.append("Message solicits confidential authentication credentials (OTP/PIN).")
                if any(w in lower for w in ["blocked", "suspend", "kyc", "pan", "electricity", "cut off"]):
                    reasons.append("Artificial urgency or threat of account suspension detected.")
                if any(w in lower for w in ["lottery", "prize", "won", "crore", "lakh", "bonus", "part-time"]):
                    reasons.append("Financial baiting pattern typical of task/lottery fraud.")
            else:
                risk_level = "SAFE"
                reasons.append("Message does not contain typical smishing signatures or credential solicitation patterns.")

            recommendations = []
            if is_spam:
                recommendations.append("DO NOT share any OTP, UPI PIN, or bank passwords under any circumstances.")
                recommendations.append("Do not click any embedded links in the SMS.")
                recommendations.append("Take a screenshot of the SMS including the sender header and phone number as evidence.")
                recommendations.append("If money has been deducted, immediately call the National Cyber Crime Helpline at 1930.")
            else:
                recommendations.append("No immediate threat detected. Still remain cautious if unsolicited senders request personal information.")

            return {
                "modality": "sms",
                "risk_level": risk_level,
                "is_threat": is_spam,
                "confidence": round(pred.get("confidence", spam_prob), 4),
                "model_name": "sms_spam_distilbert",
                "model_version": pred.get("model_version", "1.0.0"),
                "raw_metrics": {
                    "spam_probability": spam_prob,
                    "safe_probability": pred.get("safe_probability", 1.0 - spam_prob)
                },
                "explainable_reasons": reasons,
                "recommended_actions": recommendations,
                "can_prefill_complaint": is_spam,
                "prefill_data": {
                    "category": "UPI_FRAUD" if "upi" in lower or "bank" in lower else "PHISHING",
                    "description": f"Citizen received fraudulent smishing text: \"{text[:200]}...\". AI risk level: {risk_level} (Confidence: {spam_prob:.2%})."
                }
            }
        except Exception as e:
            logger.error(f"SMS analysis error: {e}")
            raise

    def _analyze_email(self, text: str) -> Dict[str, Any]:
        try:
            pred = self.email_classifier.predict(text)
            threat_prob = pred.get("threat_probability", 0.0)
            is_threat = (pred.get("label") == "THREAT")

            reasons = []
            lower = text.lower()
            if is_threat:
                risk_level = "HIGH_RISK" if threat_prob > 0.5 else "SUSPICIOUS"
                reasons.append(f"Transformer email threat classifier detected spear-phishing or malicious intent ({threat_prob:.1%} probability).")
                if any(w in lower for w in ["urgent", "immediately", "legal notice", "court", "police", "arrest"]):
                    reasons.append("Psychological intimidation or artificial legal urgency detected.")
                if any(w in lower for w in ["invoice", "payment", "wire transfer", "gift card", "crypto", "bitcoin"]):
                    reasons.append("Unverified financial transaction request or business email compromise (BEC) indicator.")
            else:
                risk_level = "SAFE"
                reasons.append("Email narrative conforms to standard legitimate correspondence with low threat scoring.")

            recommendations = []
            if is_threat:
                recommendations.append("Do NOT open attached zip, pdf, or exe files from this sender.")
                recommendations.append("Check the actual sender email address domain (not just the display name).")
                recommendations.append("Do not reply or negotiate with the sender.")
                recommendations.append("Save the full email with headers (.eml format) as evidence.")
            else:
                recommendations.append("Email scored within normal safety thresholds. Keep spam filters active.")

            return {
                "modality": "email",
                "risk_level": risk_level,
                "is_threat": is_threat,
                "confidence": round(pred.get("confidence", threat_prob), 4),
                "model_name": "email_threat_distilbert",
                "model_version": pred.get("model_version", "1.0.0"),
                "raw_metrics": {
                    "threat_probability": threat_prob,
                    "safe_probability": pred.get("safe_probability", 1.0 - threat_prob)
                },
                "explainable_reasons": reasons,
                "recommended_actions": recommendations,
                "can_prefill_complaint": is_threat,
                "prefill_data": {
                    "category": "BUSINESS_EMAIL_COMPROMISE" if "invoice" in lower or "transfer" in lower else "PHISHING",
                    "description": f"Citizen received deceptive phishing email. AI risk level: {risk_level} (Confidence: {threat_prob:.2%})."
                }
            }
        except Exception as e:
            logger.error(f"Email analysis error: {e}")
            raise

    def _answer_portal_help(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        title = "CCIP Citizen Guidance"
        steps = []
        quick_actions = []

        if "file" in lower or "report" in lower or "register" in lower:
            title = "How to File a Cybercrime Complaint on CCIP"
            steps = [
                "Step 1: Click the 'File Complaint' tab on the Citizen Portal.",
                "Step 2: Provide your contact details (Full Name, Phone Number, Email).",
                "Step 3: Select the incident category (e.g., UPI Fraud, Phishing, Identity Theft).",
                "Step 4: Describe the incident in detail: date, time, loss amount, and narrative.",
                "Step 5: Attach evidence (screenshots, transaction receipts, bank statements, SMS).",
                "Step 6: Submit to receive your permanent Complaint Reference ID (e.g., CCIP-2026-XXXX)."
            ]
            quick_actions.append({"label": "Go to File Complaint", "action": "NAVIGATE_FILE_COMPLAINT"})

        elif "track" in lower or "status" in lower or "case" in lower:
            title = "How to Track Your Complaint Status"
            steps = [
                "Step 1: Locate your Complaint Reference ID provided during submission.",
                "Step 2: Enter your Reference ID in the 'Track Complaint' search bar.",
                "Step 3: View the real-time status: SUBMITTED, IN_REVIEW, CASE_ASSIGNED, or RESOLVED.",
                "Step 4: You can download your official acknowledgment slip directly from the tracking card."
            ]
            quick_actions.append({"label": "Go to Track Complaint", "action": "NAVIGATE_TRACK_COMPLAINT"})

        elif "1930" in lower or "helpline" in lower or "money" in lower or "freeze" in lower or "golden" in lower:
            title = "Emergency 1930 Helpline & Golden Hour Financial Fraud Protocol"
            steps = [
                "CRITICAL: If you suffered financial fraud within the last 24 hours (Golden Hour):",
                "1. Immediately call the National Cyber Crime Reporting Helpline: 1930.",
                "2. Keep your Bank Account Number, UPI Transaction ID (UTR), and mobile number ready.",
                "3. The 1930 operator will raise an interdiction request to freeze the stolen funds in the suspect's bank or merchant wallet.",
                "4. Immediately block your ATM/Debit card and netbanking password via your bank's helpline.",
                "5. Next, file a detailed complaint right here on the CCIP portal for police investigation."
            ]
            quick_actions.append({"label": "Call 1930 Helpline", "action": "OPEN_DIALER_1930"})

        else:
            title = "CCIP Citizen Support Assistant"
            steps = [
                "You can ask me to:",
                "- Check if a URL link, SMS, or Email message is a scam or phishing threat.",
                "- Guide you through filing a cybercrime complaint.",
                "- Help you track an ongoing investigation.",
                "- Provide emergency guidance on 1930 Golden Hour financial freezing."
            ]

        return {
            "modality": "portal_help",
            "risk_level": "INFO",
            "is_threat": False,
            "confidence": 1.0,
            "title": title,
            "guidance_steps": steps,
            "quick_actions": quick_actions,
            "explainable_reasons": ["Informational response generated for citizen assistance."],
            "recommended_actions": [
                "For urgent financial fraud, always call 1930 first.",
                "Never share OTP, PIN, or confidential passwords with anyone claiming to be police or bank officials."
            ]
        }


citizen_assistant_adapter = CitizenAssistantAdapter()
