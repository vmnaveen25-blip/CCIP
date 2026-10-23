"""
Gemini Contextual Document Intelligence Service for CCIP / Astraea Enclave
Uses official Google GenAI SDK (google-genai) to analyze redacted document text,
produce executive forensic summaries, classify cybercrime schemas, and suggest
investigator next steps without replacing deterministic extraction or source provenance.
"""

import json
import logging
from typing import Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiDocumentService:
    """
    Contextual Document Analyzer backed by Google Gemini.
    Strictly accepts privacy-redacted text to prevent PII leakage.
    Guarantees graceful degradation if API key is unconfigured or network is unreachable.
    """

    def __init__(self):
        self._model_name = getattr(settings, "AI_ASSISTANT_MODEL", "gemini-flash-lite-latest")

    def _get_api_key(self) -> Optional[str]:
        # Respect configured Gemini or assistant key from settings / env
        key = getattr(settings, "GEMINI_API_KEY", None) or getattr(settings, "AI_ASSISTANT_API_KEY", None)
        if key and key.startswith("astraea-"):
            # Internal enclave key placeholder, check GEMINI_API_KEY specifically
            return getattr(settings, "GEMINI_API_KEY", None)
        return key

    async def analyze_document(
        self,
        redacted_text: str,
        detected_format: str,
        filename: str,
        deterministic_entities: list
    ) -> Dict[str, Any]:
        """
        Submits redacted text to Gemini for structured contextual interpretation.
        Returns:
            {
                "status": "SUCCESS" | "FALLBACK_OFFLINE" | "FAILED",
                "summary": str,
                "analysis": Dict[str, Any]
            }
        """
        api_key = self._get_api_key()

        # If no valid Google API key is configured, return honest fallback
        if not api_key:
            return self._build_offline_fallback(redacted_text, detected_format, filename, deterministic_entities)

        if not redacted_text or not redacted_text.strip():
            return {
                "status": "FALLBACK_OFFLINE",
                "summary": "Document contained no extractable text content to analyze.",
                "analysis": {
                    "document_category": "EMPTY_OR_UNREADABLE",
                    "summary": "Document contained no extractable text content.",
                    "key_findings": ["No readable text extracted"],
                    "apparent_fraud_type": "Unknown",
                    "entities_explained": [],
                    "investigator_next_steps": ["Request clearer document or high-resolution screenshot from citizen"]
                }
            }

        # Truncate to safe length (first 8000 characters) to optimize latency & token limits
        safe_snippet = redacted_text[:8000]

        prompt = (
            "You are the Astraea Cybercrime Document Intelligence Forensics Assistant.\n"
            "Analyze the following privacy-redacted cybercrime evidence text and provide a structured JSON assessment.\n\n"
            "RULES:\n"
            "1. Ground all findings ONLY in the text provided. Do not hallucinate or invent names, accounts, or bank details.\n"
            "2. Note that citizen identity numbers have been pre-redacted for privacy protection.\n"
            "3. Output MUST be valid JSON with the following exact keys:\n"
            "   - 'document_category': string (e.g., 'PAYMENT_RECEIPT', 'SMS_SCAM_SCREENSHOT', 'BANK_STATEMENT', 'PHISHING_EVIDENCE', 'LEGAL_NOTICE', 'COMPLAINT_NARRATIVE', 'OTHER')\n"
            "   - 'summary': string (2-3 concise sentences explaining the document and what occurred)\n"
            "   - 'key_findings': list of strings (concrete factual observations from the text)\n"
            "   - 'apparent_fraud_type': string (e.g., 'UPI QR Code Trap', 'Phishing Credential Theft', 'Impersonation Scam', 'Investment Fraud', 'Non-fraud / Legitimate Notice', 'Unknown')\n"
            "   - 'entities_explained': list of objects with {'entity': string, 'role': string, 'context': string}\n"
            "   - 'investigator_next_steps': list of actionable steps for the investigating officer\n\n"
            f"FILE NAME: {filename}\n"
            f"DETECTED FORMAT: {detected_format}\n"
            f"REDACTED EVIDENCE TEXT:\n```\n{safe_snippet}\n```\n"
            "Output JSON only, without markdown fences or extraneous text:"
        )

        try:
            from google import genai

            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=self._model_name,
                contents=prompt
            )

            raw_response = response.text if hasattr(response, "text") else str(response)
            clean_json_str = raw_response.strip()
            if clean_json_str.startswith("```json"):
                clean_json_str = clean_json_str[7:]
            if clean_json_str.startswith("```"):
                clean_json_str = clean_json_str[3:]
            if clean_json_str.endswith("```"):
                clean_json_str = clean_json_str[:-3]
            clean_json_str = clean_json_str.strip()

            parsed = json.loads(clean_json_str)
            summary = parsed.get("summary", "Document analyzed by Gemini.")

            return {
                "status": "SUCCESS",
                "summary": summary,
                "analysis": parsed
            }

        except Exception as e:
            logger.warning(f"Gemini document analysis encountered exception: {e}. Falling back gracefully.")
            fallback = self._build_offline_fallback(redacted_text, detected_format, filename, deterministic_entities)
            fallback["status"] = "FAILED"
            fallback["summary"] = f"Gemini contextual AI analysis unavailable ({type(e).__name__}). Deterministic extraction preserved."
            return fallback

    def _build_offline_fallback(
        self,
        redacted_text: str,
        detected_format: str,
        filename: str,
        deterministic_entities: list
    ) -> Dict[str, Any]:
        """
        Builds a deterministic, honest forensic summary when Gemini API is unconfigured or offline.
        """
        entity_count = len(deterministic_entities)
        entity_types = list(set(e.get("entity_type", "") for e in deterministic_entities if isinstance(e, dict)))

        findings = []
        if entity_count > 0:
            findings.append(f"Extracted {entity_count} deterministic indicators: {', '.join(entity_types[:5])}")
        else:
            findings.append("No standard indicators detected in readable document body.")

        findings.append(f"Format: {detected_format} ({filename})")
        findings.append("Privacy Shield: Citizen Aadhaar, PAN, and credentials locally shielded.")

        summary = (
            f"Evidence file '{filename}' processed via local deterministic parsers ({detected_format}). "
            f"Extracted {entity_count} candidate indicators. "
            "Gemini contextual AI engine is currently in local offline mode."
        )

        next_steps = [
            "Verify extracted indicators in Evidence Repository",
            "Check candidate relationships in Cross-Case Correlation"
        ]
        if any("UPI" in t or "UTR" in t for t in entity_types):
            next_steps.insert(0, "Initiate 1930 / NPCI banking transaction freeze protocol")

        return {
            "status": "FALLBACK_OFFLINE",
            "summary": summary,
            "analysis": {
                "document_category": "EVIDENCE_DOCUMENT",
                "summary": summary,
                "key_findings": findings,
                "apparent_fraud_type": "Deterministic Analysis Pending Specialist Review",
                "entities_explained": [
                    {"entity": e.get("raw_value", ""), "role": e.get("entity_type", ""), "context": "Extracted from document"}
                    for e in deterministic_entities[:10] if isinstance(e, dict)
                ],
                "investigator_next_steps": next_steps
            }
        }


gemini_document_service = GeminiDocumentService()
