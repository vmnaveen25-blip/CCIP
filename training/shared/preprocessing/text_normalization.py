import html
import re
import unicodedata
from typing import Optional
from .pii_handling import PIIConfig, mask_pii


HTML_TAG_REGEX = re.compile(r"<[^>]+>")
CONTROL_CHAR_REGEX = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")
WHITESPACE_REGEX = re.compile(r"[ \t\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]+")
NEWLINE_REGEX = re.compile(r"(\r\n|\r|\n)+")


def normalize_text(
    text: str,
    pii_config: Optional[PIIConfig] = None,
    clean_html: bool = True,
    normalize_unicode: bool = True,
) -> str:
    """
    Conservatively normalize complaint and scam text while preserving
    critical investigation-relevant forensic entities (URLs, UPI IDs, amounts, etc.).
    """
    if not text or not isinstance(text, str):
        return ""

    s = text

    # 1. Unicode Normalization (NFKC to normalize accented characters and width variants while preserving script)
    if normalize_unicode:
        s = unicodedata.normalize("NFKC", s)

    # 2. HTML unescape and tag removal
    if clean_html:
        s = html.unescape(s)
        # Only remove HTML tags if they look like real tags, don't destroy <PHONE> or math expressions
        s = re.sub(r"<(?!/?(?:PHONE|EMAIL|UPI_ID|BANK_ACCOUNT|CARD_NUMBER|AADHAAR|PAN|AMOUNT|NUM|URL)\b)[^>]*>", " ", s)

    # 3. Strip dangerous control characters (preserve newlines and tabs for now)
    s = CONTROL_CHAR_REGEX.sub("", s)

    # 4. Normalize newlines and consecutive whitespace
    s = NEWLINE_REGEX.sub(" ", s)
    s = WHITESPACE_REGEX.sub(" ", s)
    s = s.strip()

    # 5. Optional configurable PII masking
    if pii_config is not None:
        s = mask_pii(s, pii_config)

    return s
