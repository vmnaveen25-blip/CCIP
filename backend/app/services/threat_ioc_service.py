"""
IOC Normalization, Extraction, and Defanging Service
Provides deterministic canonicalization, typing, and safety defanging for indicators.
"""

import re
import ipaddress
from urllib.parse import urlparse, urlunparse
from typing import Optional, Dict, Any, List


class IOCNormalizationService:
    # Regex patterns
    MD5_REGEX = re.compile(r"^[a-fA-F0-9]{32}$")
    SHA1_REGEX = re.compile(r"^[a-fA-F0-9]{40}$")
    SHA256_REGEX = re.compile(r"^[a-fA-F0-9]{64}$")
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    
    # Cryptocurrency wallet patterns
    BTC_REGEX = re.compile(r"^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,90})$")
    ETH_REGEX = re.compile(r"^0x[a-fA-F0-9]{40}$")
    TRX_REGEX = re.compile(r"^T[a-km-zA-HJ-NP-Z1-9]{33}$")

    # Domain pattern (RFC 1123)
    DOMAIN_REGEX = re.compile(
        r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
    )

    @classmethod
    def detect_ioc_type(cls, value: str) -> Optional[str]:
        """Detects the indicator type based on strict formatting checks."""
        val = value.strip()
        if not val:
            return None

        # Check IP address first
        try:
            ip = ipaddress.ip_address(val)
            if isinstance(ip, ipaddress.IPv4Address):
                return "IPV4"
            elif isinstance(ip, ipaddress.IPv6Address):
                return "IPV6"
        except ValueError:
            pass

        # Check Hashes
        if cls.SHA256_REGEX.match(val):
            return "SHA256"
        if cls.SHA1_REGEX.match(val):
            return "SHA1"
        if cls.MD5_REGEX.match(val):
            return "MD5"

        # Check Email
        if cls.EMAIL_REGEX.match(val):
            return "EMAIL"

        # Check Crypto Wallets
        if cls.ETH_REGEX.match(val) or cls.BTC_REGEX.match(val) or cls.TRX_REGEX.match(val):
            return "CRYPTO_WALLET"

        # Check URL
        if val.lower().startswith(("http://", "https://", "hxxp://", "hxxps://", "ftp://")):
            return "URL"

        # Check Domain
        clean_domain = val.split("/")[0].split(":")[0].rstrip(".")
        if cls.DOMAIN_REGEX.match(clean_domain):
            return "DOMAIN"

        return "GENERIC_INDICATOR"

    @classmethod
    def normalize_ioc(cls, original_value: str, ioc_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Normalizes, canonicalizes, and defangs an indicator.
        Returns a dictionary containing:
        - original_value
        - normalized_value
        - defanged_value
        - ioc_type
        """
        raw = str(original_value).strip()
        if not raw:
            return {
                "original_value": "",
                "normalized_value": "",
                "defanged_value": "",
                "ioc_type": "UNKNOWN"
            }

        detected_type = ioc_type or cls.detect_ioc_type(raw) or "UNKNOWN"
        normalized = raw
        defanged = raw

        if detected_type == "IPV4":
            try:
                ip = ipaddress.IPv4Address(raw)
                normalized = str(ip)
                defanged = normalized.replace(".", "[.]")
            except ValueError:
                normalized = raw.lower()
                defanged = normalized.replace(".", "[.]")

        elif detected_type == "IPV6":
            try:
                ip = ipaddress.IPv6Address(raw)
                normalized = str(ip.exploded)  # Standard exploded format for deduplication
                defanged = str(ip).replace(":", "[:]")
            except ValueError:
                normalized = raw.lower()
                defanged = normalized.replace(":", "[:]")

        elif detected_type in ("MD5", "SHA1", "SHA256"):
            normalized = raw.lower()
            defanged = normalized  # Hashes do not need bracket defanging

        elif detected_type == "EMAIL":
            normalized = raw.lower()
            parts = normalized.split("@", 1)
            if len(parts) == 2:
                defanged = f"{parts[0]}[@]{parts[1].replace('.', '[.]')}"
            else:
                defanged = normalized.replace(".", "[.]")

        elif detected_type == "DOMAIN":
            clean = raw.lower().rstrip(".")
            # Strip standard port if present
            if ":" in clean:
                clean = clean.split(":")[0]
            normalized = clean
            defanged = normalized.replace(".", "[.]")

        elif detected_type == "URL":
            # Handle refanging if input was already defanged
            refanged = raw.replace("hxxps://", "https://").replace("hxxp://", "http://").replace("[.]", ".")
            parsed = urlparse(refanged)
            scheme = (parsed.scheme or "http").lower()
            netloc = (parsed.netloc or "").lower()
            # Remove standard default ports
            if netloc.endswith(":80") and scheme == "http":
                netloc = netloc[:-3]
            elif netloc.endswith(":443") and scheme == "https":
                netloc = netloc[:-4]

            path = parsed.path or "/"
            normalized = urlunparse((scheme, netloc, path, parsed.params, parsed.query, parsed.fragment))
            
            # Defang for display
            defang_scheme = scheme.replace("https", "hxxps").replace("http", "hxxp")
            defang_netloc = netloc.replace(".", "[.]")
            defanged = f"{defang_scheme}://{defang_netloc}{path}"
            if parsed.query:
                defanged += f"?{parsed.query}"

        elif detected_type == "CRYPTO_WALLET":
            if cls.ETH_REGEX.match(raw):
                normalized = raw.lower()  # Ethereum addresses case-insensitive canonical
            else:
                normalized = raw  # Bitcoin/Tron base58 are case-sensitive
            defanged = normalized

        else:
            normalized = raw.strip()
            defanged = normalized

        return {
            "original_value": raw,
            "normalized_value": normalized,
            "defanged_value": defanged,
            "ioc_type": detected_type
        }

    @classmethod
    def extract_iocs_from_text(cls, text: str) -> List[Dict[str, Any]]:
        """Extracts and normalizes all observable indicators from arbitrary case text."""
        if not text:
            return []

        extracted = []
        seen_normalized = set()

        # Tokenize by common delimiters
        tokens = re.split(r"[\s,;\"'<>\[\]{}|\\]+", text)

        for token in tokens:
            cleaned = token.strip().rstrip(".,;:!?)")
            if not cleaned or len(cleaned) < 4:
                continue

            detected_type = cls.detect_ioc_type(cleaned)
            if detected_type and detected_type != "GENERIC_INDICATOR":
                norm = cls.normalize_ioc(cleaned, detected_type)
                unique_key = (norm["ioc_type"], norm["normalized_value"])
                if unique_key not in seen_normalized:
                    seen_normalized.add(unique_key)
                    extracted.append(norm)

        return extracted


ioc_normalization_service = IOCNormalizationService()
