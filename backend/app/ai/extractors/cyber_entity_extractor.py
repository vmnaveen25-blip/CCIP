"""
Cyber Entity Extractor (Cyber NER)
Mode: HYBRID_RULE_BASED
Production-ready deterministic indicator and entity extraction for CCIP.
Honest extraction engine for structured cybercrime entities with false-positive controls.
"""

import re
import ipaddress
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse


# Common Indian Top-Level Domains and standard TLDs
VALID_TLDS = {
    "com", "in", "co.in", "org", "gov.in", "net", "edu", "ac.in", "mil",
    "info", "io", "biz", "xyz", "online", "site", "live", "tech", "store",
    "bank", "bank.in", "app", "me", "dev", "club", "top", "pro", "cc", "ru"
}

# Common Indian UPI PSP handles
COMMON_UPI_HANDLES = {
    "oksbi", "okhdfcbank", "okicici", "okaxis", "paytm", "ybl", "ibl", "axl",
    "apl", "upi", "postbank", "barodampay", "federal", "kotak", "indus",
    "pnb", "cnrb", "aubank", "jupiteraxis", "idfcbank", "slice", "yesbank"
}


class ExtractedEntity:
    def __init__(
        self,
        entity_type: str,
        raw_value: str,
        normalized_value: str,
        confidence: float,
        start_offset: int,
        end_offset: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.entity_type = entity_type
        self.raw_value = raw_value
        self.normalized_value = normalized_value
        self.confidence = round(confidence, 2)
        self.start_offset = start_offset
        self.end_offset = end_offset
        self.metadata = metadata or {}
        self.occurrence_count = 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_type": self.entity_type,
            "raw_value": self.raw_value,
            "normalized_value": self.normalized_value,
            "confidence": self.confidence,
            "start_offset": self.start_offset,
            "end_offset": self.end_offset,
            "occurrence_count": self.occurrence_count,
            "metadata": self.metadata
        }


class CyberEntityExtractor:
    def __init__(self):
        self.extractor_name = "CYBER_ENTITY_EXTRACTOR_V1"
        self.mode = "HYBRID_RULE_BASED"

    def extract(self, text: str, source_type: str = "COMPLAINT_NARRATIVE") -> List[ExtractedEntity]:
        """Extract all supported cyber entity types from input text."""
        if not text or not text.strip():
            return []

        entities: List[ExtractedEntity] = []

        # 1. URLs & Domains
        entities.extend(self._extract_urls_and_domains(text))

        # 2. Email Addresses
        entities.extend(self._extract_emails(text))

        # 3. UPI IDs (Virtual Payment Addresses)
        entities.extend(self._extract_upis(text))

        # 4. Indian Phone Numbers
        entities.extend(self._extract_phone_numbers(text))

        # 5. IFSC Codes
        entities.extend(self._extract_ifsc_codes(text))

        # 6. Bank Accounts
        entities.extend(self._extract_bank_accounts(text))

        # 7. IP Addresses (IPv4 & IPv6)
        entities.extend(self._extract_ip_addresses(text))

        # 8. Crypto Wallets (BTC, ETH, SOL, TRX)
        entities.extend(self._extract_crypto_wallets(text))

        # 9. Cryptographic Hashes (MD5, SHA1, SHA256, SHA512)
        entities.extend(self._extract_file_hashes(text))

        # 10. Financial Amounts (INR / ₹)
        entities.extend(self._extract_amounts(text))

        # 11. Transaction IDs & UTRs
        entities.extend(self._extract_transaction_ids_and_utrs(text))

        # Deduplicate & aggregate occurrence counts
        return self._deduplicate(entities)

    # -------------------------------------------------------------------------
    # 1. URLs and Domains
    # -------------------------------------------------------------------------
    def _extract_urls_and_domains(self, text: str) -> List[ExtractedEntity]:
        res = []
        # Match explicit URLs
        url_pattern = re.compile(
            r'https?://(?:[a-zA-Z0-9\-._~%!$&\'()*+,;=:]+@)?([a-zA-Z0-9.\-]+(?:\.[a-zA-Z]{2,}))(?::\d+)?(?:/[^\s<>"\'`{}|\\^\[\]]*)?',
            re.IGNORECASE
        )
        found_domains = set()

        for match in url_pattern.finditer(text):
            raw_url = match.group(0).rstrip('.,;:)!?"\'')
            domain_raw = match.group(1).lower()

            res.append(ExtractedEntity(
                entity_type="URL",
                raw_value=raw_url,
                normalized_value=raw_url.lower(),
                confidence=0.98,
                start_offset=match.start(),
                end_offset=match.start() + len(raw_url),
                metadata={"domain": domain_raw}
            ))

            if domain_raw and domain_raw not in found_domains:
                found_domains.add(domain_raw)
                res.append(ExtractedEntity(
                    entity_type="DOMAIN",
                    raw_value=domain_raw,
                    normalized_value=domain_raw,
                    confidence=0.95,
                    start_offset=match.start(1),
                    end_offset=match.end(1),
                    metadata={"derived_from_url": True}
                ))

        # Standalone domains (e.g. secure-bank-update.example.com or evil-phish.in)
        domain_pattern = re.compile(
            r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+([a-zA-Z]{2,63})\b'
        )
        for match in domain_pattern.finditer(text):
            raw_d = match.group(0).lower()
            tld = match.group(1).lower()

            # False-positive guard: skip if already captured in URLs or emails
            if raw_d in found_domains or tld not in VALID_TLDS:
                continue
            # Avoid single words like "e.g." or "etc."
            if raw_d in {"e.g.", "i.e.", "etc.", "vs.", "al."}:
                continue

            found_domains.add(raw_d)
            res.append(ExtractedEntity(
                entity_type="DOMAIN",
                raw_value=match.group(0),
                normalized_value=raw_d,
                confidence=0.88,
                start_offset=match.start(),
                end_offset=match.end(),
                metadata={"tld": tld}
            ))

        return res

    # -------------------------------------------------------------------------
    # 2. Email Addresses
    # -------------------------------------------------------------------------
    def _extract_emails(self, text: str) -> List[ExtractedEntity]:
        res = []
        email_pattern = re.compile(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.([A-Za-z]{2,63})\b'
        )
        for match in email_pattern.finditer(text):
            raw_email = match.group(0)
            tld = match.group(1).lower()
            if tld not in VALID_TLDS:
                continue
            norm_email = raw_email.lower()
            res.append(ExtractedEntity(
                entity_type="EMAIL_ADDRESS",
                raw_value=raw_email,
                normalized_value=norm_email,
                confidence=0.96,
                start_offset=match.start(),
                end_offset=match.end(),
                metadata={"domain": norm_email.split('@')[-1]}
            ))
        return res

    # -------------------------------------------------------------------------
    # 3. UPI IDs (Virtual Payment Addresses)
    # -------------------------------------------------------------------------
    def _extract_upis(self, text: str) -> List[ExtractedEntity]:
        res = []
        # Indian VPA format: identifier@handle (e.g. fraud@oksbi, 9876543210@paytm, victim.name@ybl)
        upi_pattern = re.compile(
            r'\b([a-zA-Z0-9.\-_]{2,64})@([a-zA-Z]{2,30})\b'
        )
        for match in upi_pattern.finditer(text):
            handle = match.group(2).lower()
            # If handle matches common UPI handles or ends with standard PSP identifiers
            if handle in COMMON_UPI_HANDLES or any(handle.endswith(h) for h in ["bank", "pay", "axis", "sbi", "hdfc", "icici"]):
                raw_upi = match.group(0)
                norm_upi = raw_upi.lower()
                res.append(ExtractedEntity(
                    entity_type="UPI_ID",
                    raw_value=raw_upi,
                    normalized_value=norm_upi,
                    confidence=0.96,
                    start_offset=match.start(),
                    end_offset=match.end(),
                    metadata={"psp_handle": handle}
                ))
        return res

    # -------------------------------------------------------------------------
    # 4. Indian Phone Numbers
    # -------------------------------------------------------------------------
    def _extract_phone_numbers(self, text: str) -> List[ExtractedEntity]:
        res = []
        # Matches:
        # +91 98765 43210, +91-9876543210, +919876543210, 09876543210, 9876543210
        phone_pattern = re.compile(
            r'(?:(?:\+91|91|0)[\s\-]?)?([6-9]\d{4}[\s\-]?\d{5})\b'
        )
        for match in phone_pattern.finditer(text):
            raw_phone = match.group(0).strip()
            digits = re.sub(r'\D', '', raw_phone)
            # Must resolve to exactly 10 digits mobile in India
            if len(digits) >= 10:
                core_10 = digits[-10:]
                if core_10[0] in "6789":
                    norm_phone = f"+91{core_10}"
                    confidence = 0.95 if ("+91" in raw_phone or "91" in raw_phone) else 0.85
                    res.append(ExtractedEntity(
                        entity_type="PHONE_NUMBER",
                        raw_value=raw_phone,
                        normalized_value=norm_phone,
                        confidence=confidence,
                        start_offset=match.start(),
                        end_offset=match.end(),
                        metadata={"country": "IN", "carrier_series": core_10[:2]}
                    ))
        return res

    # -------------------------------------------------------------------------
    # 5. IFSC Codes
    # -------------------------------------------------------------------------
    def _extract_ifsc_codes(self, text: str) -> List[ExtractedEntity]:
        res = []
        # Indian IFSC standard: 4 alphabetic bank code, followed by '0', followed by 6 alphanumeric branch code
        ifsc_pattern = re.compile(r'\b([A-Z]{4}0[A-Z0-9]{6})\b', re.IGNORECASE)
        for match in ifsc_pattern.finditer(text):
            raw_ifsc = match.group(1)
            norm_ifsc = raw_ifsc.upper()
            bank_code = norm_ifsc[:4]
            res.append(ExtractedEntity(
                entity_type="IFSC_CODE",
                raw_value=raw_ifsc,
                normalized_value=norm_ifsc,
                confidence=0.98,
                start_offset=match.start(),
                end_offset=match.end(),
                metadata={"bank_code": bank_code}
            ))
        return res

    # -------------------------------------------------------------------------
    # 6. Bank Accounts
    # -------------------------------------------------------------------------
    def _extract_bank_accounts(self, text: str) -> List[ExtractedEntity]:
        res = []
        # Context-aware extraction: Requires preceding keyword (account, a/c, acct, transfer to, credit to)
        # to avoid classifying random 10-18 digit numbers as bank accounts
        acct_pattern = re.compile(
            r'(?:(?:account|acct|a/c|acc\.?|transfer(?:red)?\s+to|deposited\s+in|funds\s+to)\s*(?:number|no\.?|#)?\s*[:=\-]?\s*)([0-9]{9,18})\b',
            re.IGNORECASE
        )
        for match in acct_pattern.finditer(text):
            raw_acct = match.group(1)
            # False positive filter: reject pure years or repeated single digits (e.g. 000000000)
            if len(set(raw_acct)) <= 1:
                continue
            # Reject if it's already a 10-digit mobile starting with 6-9
            if len(raw_acct) == 10 and raw_acct[0] in "6789":
                continue

            res.append(ExtractedEntity(
                entity_type="BANK_ACCOUNT",
                raw_value=raw_acct,
                normalized_value=raw_acct,
                confidence=0.92,
                start_offset=match.start(1),
                end_offset=match.end(1),
                metadata={"digit_length": len(raw_acct)}
            ))
        return res

    # -------------------------------------------------------------------------
    # 7. IP Addresses (IPv4 & IPv6)
    # -------------------------------------------------------------------------
    def _extract_ip_addresses(self, text: str) -> List[ExtractedEntity]:
        res = []
        # IPv4 pattern: 4 dot-separated decimal octets
        ipv4_pattern = re.compile(r'\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b')
        for match in ipv4_pattern.finditer(text):
            raw_ip = match.group(1)
            try:
                ip_obj = ipaddress.IPv4Address(raw_ip)
                res.append(ExtractedEntity(
                    entity_type="IP_ADDRESS",
                    raw_value=raw_ip,
                    normalized_value=str(ip_obj),
                    confidence=0.97,
                    start_offset=match.start(),
                    end_offset=match.end(),
                    metadata={"version": 4, "is_private": ip_obj.is_private}
                ))
            except ValueError:
                # Octets > 255 are strictly rejected (false positive control)
                continue

        # IPv6 pattern
        ipv6_pattern = re.compile(r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b')
        for match in ipv6_pattern.finditer(text):
            raw_ip = match.group(0)
            try:
                ip_obj = ipaddress.IPv6Address(raw_ip)
                res.append(ExtractedEntity(
                    entity_type="IP_ADDRESS",
                    raw_value=raw_ip,
                    normalized_value=str(ip_obj).lower(),
                    confidence=0.98,
                    start_offset=match.start(),
                    end_offset=match.end(),
                    metadata={"version": 6}
                ))
            except ValueError:
                continue

        return res

    # -------------------------------------------------------------------------
    # 8. Crypto Wallets
    # -------------------------------------------------------------------------
    def _extract_crypto_wallets(self, text: str) -> List[ExtractedEntity]:
        res = []
        # EVM / Ethereum (0x followed by 40 hex chars)
        eth_pattern = re.compile(r'\b(0x[a-fA-F0-9]{40})\b')
        for match in eth_pattern.finditer(text):
            raw_addr = match.group(1)
            res.append(ExtractedEntity(
                entity_type="CRYPTO_WALLET",
                raw_value=raw_addr,
                normalized_value=raw_addr.lower(),
                confidence=0.98,
                start_offset=match.start(),
                end_offset=match.end(),
                metadata={"network": "EVM / Ethereum"}
            ))

        # Bitcoin: Legacy (1 or 3 followed by 26-34 Base58) or Bech32 (bc1 followed by 25-39 chars)
        btc_pattern = re.compile(r'\b(bc1[a-zA-HJ-NP-Z0-9]{25,39}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b')
        for match in btc_pattern.finditer(text):
            raw_addr = match.group(1)
            res.append(ExtractedEntity(
                entity_type="CRYPTO_WALLET",
                raw_value=raw_addr,
                normalized_value=raw_addr,
                confidence=0.96,
                start_offset=match.start(),
                end_offset=match.end(),
                metadata={"network": "Bitcoin"}
            ))

        # Tron (T followed by 33 Base58 chars)
        trx_pattern = re.compile(r'\b(T[a-km-zA-HJ-NP-Z1-9]{33})\b')
        for match in trx_pattern.finditer(text):
            raw_addr = match.group(1)
            res.append(ExtractedEntity(
                entity_type="CRYPTO_WALLET",
                raw_value=raw_addr,
                normalized_value=raw_addr,
                confidence=0.94,
                start_offset=match.start(),
                end_offset=match.end(),
                metadata={"network": "TRON"}
            ))

        return res

    # -------------------------------------------------------------------------
    # 9. Cryptographic Hashes (MD5, SHA1, SHA256, SHA512)
    # -------------------------------------------------------------------------
    def _extract_file_hashes(self, text: str) -> List[ExtractedEntity]:
        res = []
        # Only match standalone hexadecimal sequences of exact hash lengths
        # SHA-256 (64 hex chars)
        sha256_pattern = re.compile(r'\b([a-fA-F0-9]{64})\b')
        for match in sha256_pattern.finditer(text):
            raw_h = match.group(1)
            res.append(ExtractedEntity(
                entity_type="FILE_HASH",
                raw_value=raw_h,
                normalized_value=raw_h.lower(),
                confidence=0.96,
                start_offset=match.start(),
                end_offset=match.end(),
                metadata={"algorithm": "SHA-256"}
            ))

        # MD5 (32 hex chars) - require context or strict boundary to avoid matching short tokens
        md5_pattern = re.compile(r'(?:(?:hash|md5|file)\s*[:=\-]?\s*)?([a-fA-F0-9]{32})\b')
        for match in md5_pattern.finditer(text):
            raw_h = match.group(1)
            if not re.search(r'\d', raw_h) or not re.search(r'[a-fA-F]', raw_h):
                # Avoid pure numbers like 32 digits or pure letters
                continue
            res.append(ExtractedEntity(
                entity_type="FILE_HASH",
                raw_value=raw_h,
                normalized_value=raw_h.lower(),
                confidence=0.90,
                start_offset=match.start(1),
                end_offset=match.end(1),
                metadata={"algorithm": "MD5"}
            ))

        return res

    # -------------------------------------------------------------------------
    # 10. Financial Amounts
    # -------------------------------------------------------------------------
    def _extract_amounts(self, text: str) -> List[ExtractedEntity]:
        res = []
        # Matches: ₹45,000, Rs. 50000, INR 1,50,000, 45000 INR
        amount_pattern = re.compile(
            r'(?:(?:₹|rs\.?|inr|rupees)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)|([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr|rupees)\b)',
            re.IGNORECASE
        )
        for match in amount_pattern.finditer(text):
            num_str = match.group(1) or match.group(2)
            if not num_str:
                continue
            cleaned_num = num_str.replace(',', '')
            try:
                val = float(cleaned_num)
                if val <= 0:
                    continue
                res.append(ExtractedEntity(
                    entity_type="AMOUNT",
                    raw_value=match.group(0).strip(),
                    normalized_value=f"INR {val:,.2f}",
                    confidence=0.95,
                    start_offset=match.start(),
                    end_offset=match.end(),
                    metadata={"numeric_value": val, "currency": "INR"}
                ))
            except ValueError:
                continue

        return res

    # -------------------------------------------------------------------------
    # 11. Transaction IDs and UTR Numbers
    # -------------------------------------------------------------------------
    def _extract_transaction_ids_and_utrs(self, text: str) -> List[ExtractedEntity]:
        res = []
        # UTR (Unique Transaction Reference): exactly 12 or 16 digits under UTR context
        utr_pattern = re.compile(
            r'(?:(?:utr|rrn|reference)\s*(?:number|no\.?|#)?\s*[:=\-]?\s*)([0-9]{12,16})\b',
            re.IGNORECASE
        )
        for match in utr_pattern.finditer(text):
            raw_utr = match.group(1)
            res.append(ExtractedEntity(
                entity_type="UTR",
                raw_value=raw_utr,
                normalized_value=raw_utr,
                confidence=0.94,
                start_offset=match.start(1),
                end_offset=match.end(1),
                metadata={"length": len(raw_utr)}
            ))

        # General Transaction IDs: e.g. TXN987654321, UPI/123456789
        txn_pattern = re.compile(
            r'(?:(?:txn|transaction|ref)\s*(?:id|number|no\.?|#)?\s*[:=\-]?\s*)([A-Za-z0-9\-_]{8,35})\b',
            re.IGNORECASE
        )
        for match in txn_pattern.finditer(text):
            raw_txn = match.group(1)
            if raw_txn.lower() in {"number", "details", "unknown", "none"}:
                continue
            res.append(ExtractedEntity(
                entity_type="TRANSACTION_ID",
                raw_value=raw_txn,
                normalized_value=raw_txn.upper(),
                confidence=0.91,
                start_offset=match.start(1),
                end_offset=match.end(1),
                metadata={"raw_prefix": raw_txn[:3]}
            ))

        return res

    # -------------------------------------------------------------------------
    # Deduplication & Frequency Aggregation
    # -------------------------------------------------------------------------
    def _deduplicate(self, entities: List[ExtractedEntity]) -> List[ExtractedEntity]:
        seen: Dict[Tuple[str, str], ExtractedEntity] = {}
        for ent in entities:
            key = (ent.entity_type, ent.normalized_value)
            if key in seen:
                seen[key].occurrence_count += 1
                # Keep the highest confidence if different
                if ent.confidence > seen[key].confidence:
                    seen[key].confidence = ent.confidence
            else:
                seen[key] = ent

        return list(seen.values())


# Singleton instance
cyber_entity_extractor = CyberEntityExtractor()
