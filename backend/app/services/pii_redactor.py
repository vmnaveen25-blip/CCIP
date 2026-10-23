"""
Local PII Redaction Service for CCIP / Astraea Enclave
Guarantees citizen data privacy before external or LLM processing.
Masks Aadhaar numbers, PAN numbers, credit/debit cards, and passwords locally.
Preserves cybercrime indicators (UPI, UTR, URLs, IPs, Hashes) for investigation context.
"""

import re
from typing import Tuple, Dict, Any


class PIIRedactor:
    """
    Local privacy-shielding redaction engine.
    Ensures raw identity numbers and credentials are never leaked.
    """

    # Credit / Debit card: 16 digits (continuous or 4-4-4-4 separated)
    CARD_PATTERN = re.compile(r'\b(?:\d{4}[ -]?){3}\d{4}\b')

    # Aadhaar: 12 digits, commonly formatted as 4-4-4 or continuous 12 digits
    # First digit cannot be 0 or 1 under UIDAI specs. Must not be followed by another group of 4 digits (card)
    AADHAAR_PATTERN = re.compile(r'\b([2-9]\d{3})[ -]?(\d{4})[ -]?(\d{4})\b(?![ -]?\d{4})')

    # Indian PAN: 5 uppercase alphabetic, 4 numeric digits, 1 uppercase alphabetic
    PAN_PATTERN = re.compile(r'\b([A-Z]{5})([0-9]{4})([A-Z])\b')

    # Passwords, PINs, and OTP credentials in narrative context
    CREDENTIAL_PATTERN = re.compile(
        r'(?i)\b(password|pwd|otp|pin|passcode|cvv|secret)\s*[:=\-]?\s*([A-Za-z0-9!@#$%^&*()_+]{3,24})\b'
    )

    @classmethod
    def redact(cls, text: str) -> Tuple[str, Dict[str, int]]:
        """
        Redacts sensitive citizen identity and authentication credentials from text.
        Returns:
            (redacted_text, counts_dict)
        """
        if not text:
            return "", {"aadhaar": 0, "pan": 0, "card": 0, "credential": 0}

        counts = {"aadhaar": 0, "pan": 0, "card": 0, "credential": 0}

        # 1. Redact Credit / Debit Card numbers FIRST (16 digits)
        def _mask_card(match: re.Match) -> str:
            raw_val = match.group(0).replace('-', '').replace(' ', '')
            if len(raw_val) == 16:
                counts["card"] += 1
                return f"[CARD_REDACTED_XXXX_{raw_val[-4:]}]"
            return match.group(0)

        redacted = cls.CARD_PATTERN.sub(_mask_card, text)

        # 2. Redact Aadhaar (12 digits, preserve last 4 digits for citizen reference)
        def _mask_aadhaar(match: re.Match) -> str:
            # Check preceding context within 30 characters
            start = match.start()
            preceding = redacted[max(0, start - 30):start].lower()
            # If preceded by UTR/RRN/Ref/Txn/Transaction keywords, preserve it as a financial indicator!
            if any(k in preceding for k in ("utr", "rrn", "ref", "reference", "txn", "transaction", "amount", "order", "slip", "payment")):
                return match.group(0)

            counts["aadhaar"] += 1
            last4 = match.group(3)
            return f"[AADHAAR_REDACTED_XX{last4}]"

        redacted = cls.AADHAAR_PATTERN.sub(_mask_aadhaar, redacted)

        # 3. Redact PAN
        def _mask_pan(match: re.Match) -> str:
            counts["pan"] += 1
            last1 = match.group(3)
            return f"[PAN_REDACTED_XXXX{last1}]"

        redacted = cls.PAN_PATTERN.sub(_mask_pan, redacted)

        # 3. Redact Credit / Debit Card numbers
        def _mask_card(match: re.Match) -> str:
            # Avoid masking normal 12-digit UTRs or 16-digit bank accounts if they don't match card patterns
            raw_val = match.group(0).replace('-', '').replace(' ', '')
            # Check Luhn or 16 digits
            if len(raw_val) == 16:
                counts["card"] += 1
                return f"[CARD_REDACTED_XXXX_{raw_val[-4:]}]"
            return match.group(0)

        redacted = cls.CARD_PATTERN.sub(_mask_card, redacted)

        # 4. Redact Credentials / Passwords / OTPs
        def _mask_credential(match: re.Match) -> str:
            label = match.group(1)
            counts["credential"] += 1
            return f"{label}: [CREDENTIAL_REDACTED]"

        redacted = cls.CREDENTIAL_PATTERN.sub(_mask_credential, redacted)

        return redacted, counts


pii_redactor = PIIRedactor()
