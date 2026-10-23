import hashlib
import re
from typing import Optional


def compute_sha256(text: str) -> str:
    """Compute deterministic SHA-256 hash of a string."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def generate_deterministic_id(source: str, source_row_id: str, text: str) -> str:
    """Generate stable deterministic ID for a record from source, original id, and text snippet."""
    payload = f"{source}::{source_row_id}::{text.strip()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def compute_template_fingerprint(text: str) -> str:
    """
    Generate a structural template fingerprint of text by abstracting numbers,
    amounts, dates, links, and contact details to identify template variations.
    """
    cleaned = text.lower().strip()
    # Replace URLs
    cleaned = re.sub(r"https?://\S+|www\.\S+", "<URL>", cleaned)
    # Replace emails
    cleaned = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "<EMAIL>", cleaned)
    # Replace phone numbers
    cleaned = re.sub(r"(?:\+91|91)?[\s\-]?[6-9]\d{9}\b", "<PHONE>", cleaned)
    # Replace UPI IDs
    cleaned = re.sub(r"[\w\.\-]+@[a-zA-Z]{2,}", "<UPI_ID>", cleaned)
    # Replace amounts (Rs. 500, INR 1000, $50, etc.)
    cleaned = re.sub(r"(?:rs\.?|inr|₹|\$)\s*[\d,]+(?:\.\d+)?", "<AMOUNT>", cleaned)
    # Replace remaining numbers/digits
    cleaned = re.sub(r"\b\d+\b", "<NUM>", cleaned)
    # Collapse whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return hashlib.md5(cleaned.encode("utf-8")).hexdigest()[:16]
