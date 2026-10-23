import re
from typing import Dict, Optional


# Regex patterns for common sensitive Indian and international entities
PHONE_REGEX = re.compile(r"(?:\+?91[\s\-]?)?[6-9]\d{9}\b")
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
UPI_REGEX = re.compile(r"\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b")
CARD_REGEX = re.compile(r"\b(?:\d[ -]*?){13,16}\b")
BANK_ACC_REGEX = re.compile(r"\b\d{9,18}\b")
IFSC_REGEX = re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b")
AADHAAR_REGEX = re.compile(r"\b[2-9]\d{3}\s\d{4}\s\d{4}\b")
PAN_REGEX = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")


class PIIConfig:
    def __init__(
        self,
        mask_phone: bool = False,
        mask_email: bool = False,
        mask_upi: bool = False,
        mask_card: bool = False,
        mask_bank_account: bool = False,
        mask_aadhaar: bool = False,
        mask_pan: bool = False,
    ):
        self.mask_phone = mask_phone
        self.mask_email = mask_email
        self.mask_upi = mask_upi
        self.mask_card = mask_card
        self.mask_bank_account = mask_bank_account
        self.mask_aadhaar = mask_aadhaar
        self.mask_pan = mask_pan


def mask_pii(text: str, config: Optional[PIIConfig] = None) -> str:
    """
    Apply configurable PII masking to text.
    By default, preserves forensic information unless specific masking is enabled.
    """
    if config is None:
        return text

    result = text
    if config.mask_card:
        result = CARD_REGEX.sub("<CARD_NUMBER>", result)
    if config.mask_aadhaar:
        result = AADHAAR_REGEX.sub("<AADHAAR>", result)
    if config.mask_pan:
        result = PAN_REGEX.sub("<PAN>", result)
    if config.mask_upi:
        result = UPI_REGEX.sub("<UPI_ID>", result)
    if config.mask_email:
        result = EMAIL_REGEX.sub("<EMAIL>", result)
    if config.mask_phone:
        result = PHONE_REGEX.sub("<PHONE>", result)
    if config.mask_bank_account:
        # Care: only mask standalone long numbers not already matched
        result = BANK_ACC_REGEX.sub("<BANK_ACCOUNT>", result)

    return result
