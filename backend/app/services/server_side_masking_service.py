"""
Server-Side Sensitive-Information Masking Module [5]
Redacts citizen PII and authentication credentials before forwarding payloads
to downstream ML/AI inference pipelines or heuristic scoring engines.

Guarantees:
1. Sensitive PII (Aadhaar, PAN, Card Numbers, Credentials/Passwords/OTPs) are redacted locally.
2. Technical cybercrime indicators (UPI, UTR, URLs, IP addresses, BTC/crypto wallets, Hashes) are preserved for forensic context.
3. Provides structured payload delivery containing redaction metadata and transparent provenance.
"""

from typing import Tuple, Dict, Any, List, Optional
from datetime import datetime, timezone
import re
from app.services.pii_redactor import pii_redactor
from app.core.logging import logger


class ServerSideMaskingService:
    """
    Module [5]: Server-Side Sensitive-Information Masking Module.
    Pre-processes raw complaint narratives into sanitized, redacted payloads.
    """

    MODULE_NAME = "Server-Side Sensitive-Information Masking Module [5]"
    MODULE_VERSION = "2.1.0"

    # Regex patterns for cyber indicators to preserve
    UPI_PATTERN = re.compile(r'[\w\.\-]+@[\w\-]+')
    UTR_PATTERN = re.compile(r'\b(?:\d{12}|\d{16})\b')
    CRYPTO_PATTERN = re.compile(r'\b(?:0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b')
    IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
    URL_PATTERN = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')

    @classmethod
    def mask_complaint_narrative(
        cls,
        raw_narrative: str,
        preserve_iocs: bool = True
    ) -> Dict[str, Any]:
        """
        Redacts sensitive citizen information from narrative and prepares
        the masked payload for the reliability-gated threat triage engine.

        Returns:
            Dict containing:
                - masked_narrative (str): The sanitized narrative.
                - is_masked (bool): True if any redaction occurred.
                - redaction_counts (dict): Frequency of each redacted entity type.
                - preserved_indicators (list): List of preserved threat indicators.
                - masking_metadata (dict): Module provenance details.
        """
        if not raw_narrative or not raw_narrative.strip():
            return {
                "masked_narrative": "",
                "is_masked": False,
                "redaction_counts": {"aadhaar": 0, "pan": 0, "card": 0, "credential": 0},
                "preserved_indicators": [],
                "masking_metadata": {
                    "module": cls.MODULE_NAME,
                    "version": cls.MODULE_VERSION,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status": "EMPTY_INPUT"
                }
            }

        text = raw_narrative.strip()

        # Extract indicators before redaction to ensure they are tracked and preserved
        preserved_iocs = []
        if preserve_iocs:
            for m in cls.UPI_PATTERN.finditer(text):
                val = m.group(0)
                if "@" in val and not val.endswith((".com", ".org", ".net", ".gov", ".edu")):
                    preserved_iocs.append({"type": "UPI_ID", "value": val})
            for m in cls.CRYPTO_PATTERN.finditer(text):
                preserved_iocs.append({"type": "CRYPTO_WALLET", "value": m.group(0)})
            for m in cls.IP_PATTERN.finditer(text):
                preserved_iocs.append({"type": "IP_ADDRESS", "value": m.group(0)})
            for m in cls.URL_PATTERN.finditer(text):
                preserved_iocs.append({"type": "URL", "value": m.group(0)})

        # Execute primary PII and Credential Redaction using sovereign regex engine
        redacted_text, counts = pii_redactor.redact(text)

        # Additional guard: redact explicit phone numbers if labeled as victim contact
        victim_phone_pattern = re.compile(r'(?i)(?:my\s*(?:phone|mobile|number|contact)|victim\s*phone|contact\s*me\s*at)[:\s]+(\+?91[\s\-]?)?([6-9]\d{9})\b')
        def _mask_victim_phone(m):
            counts["victim_phone"] = counts.get("victim_phone", 0) + 1
            return f"my contact: [VICTIM_PHONE_REDACTED_XXXX{m.group(2)[-4:]}]"
        redacted_text = victim_phone_pattern.sub(_mask_victim_phone, redacted_text)

        total_redactions = sum(counts.values())
        is_masked = total_redactions > 0

        logger.info(
            f"[{cls.MODULE_NAME}] Narrative masked: {total_redactions} redactions applied "
            f"(Aadhaar: {counts.get('aadhaar', 0)}, PAN: {counts.get('pan', 0)}, "
            f"Card: {counts.get('card', 0)}, Credential: {counts.get('credential', 0)})"
        )

        return {
            "masked_narrative": redacted_text,
            "original_length": len(text),
            "masked_length": len(redacted_text),
            "is_masked": is_masked,
            "redaction_counts": counts,
            "preserved_indicators": preserved_iocs[:10],
            "masking_metadata": {
                "module": cls.MODULE_NAME,
                "version": cls.MODULE_VERSION,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "MASKED_SUCCESS" if is_masked else "NO_SENSITIVE_DATA_FOUND"
            }
        }


server_side_masking_service = ServerSideMaskingService()
