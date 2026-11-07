# IOC NORMALIZATION AND SAFETY DEFANGING SPECIFICATION

**System:** CCIP (Citizen Cybercrime Intelligence Platform)  
**Classification:** RESTRICTED  
**Document Ref:** CTI-NORM-002  

---

## 1. Overview & Operational Need

Indicators of Compromise (IOCs) ingested from heterogeneous threat feeds and citizen complaint narratives vary significantly in formatting, casing, port notations, and protocol schemes. Without deterministic normalization:
1. Duplicate indicators enter the database, breaking deduplication and cross-case correlation.
2. Malicious links could accidentally be clicked or rendered by investigators' browsers, creating high-risk drive-by infection vectors.

The `IOCNormalizationService` enforces strict type detection, canonicalization, and bracket-defanging across 9 observable categories.

---

## 2. Supported Indicator Types & Normalization Rules

| Indicator Type | Detection Criteria | Canonicalization Rule | Safety Defanging Format |
| :--- | :--- | :--- | :--- |
| **`IPV4`** | Valid IPv4 address via `ipaddress.IPv4Address` | Strips whitespace, converts to standard dotted quad | Replaces `.` with `[.]`<br/>*Example:* `198[.]51[.]100[.]1` |
| **`IPV6`** | Valid IPv6 address via `ipaddress.IPv6Address` | Explodes to 32 hex digits with colons (`0000:0000...`) | Replaces `:` with `[:]`<br/>*Example:* `2001[:]0db8[:]...[:]1` |
| **`DOMAIN`** | Valid RFC 1123 hostname pattern | Lowercased, stripped of trailing dots and port suffixes | Replaces `.` with `[.]`<br/>*Example:* `malicious-bank[.]com` |
| **`URL`** | Begins with `http://`, `https://`, `hxxp://`, `hxxps://` | Scheme and host lowercased; default ports `:80` and `:443` removed | Replaces `http` with `hxxp`, `.` with `[.]`<br/>*Example:* `hxxps://evil[.]com/drop.exe` |
| **`SHA256`** | 64 hexadecimal characters | Lowercased | Retains hex string (safe from execution) |
| **`SHA1`** | 40 hexadecimal characters | Lowercased | Retains hex string |
| **`MD5`** | 32 hexadecimal characters | Lowercased | Retains hex string |
| **`EMAIL`** | Standard RFC 5322 email regex | Lowercased | Replaces `@` with `[@]`, `.` with `[.]`<br/>*Example:* `phisher[@]evil[.]com` |
| **`CRYPTO_WALLET`**| BTC (Base58/Bech32), ETH (`0x` + 40 hex), TRX (`T` + 33 chars) | ETH lowercased; BTC/TRX preserved as case-sensitive | Retains string (safe from execution) |

---

## 3. Database Schema Representation

Normalized indicators are persisted in `threat_indicators` with strict indexation:

```sql
CREATE TABLE threat_indicators (
    id VARCHAR(36) PRIMARY KEY,
    indicator_type VARCHAR(50) NOT NULL,
    original_value VARCHAR(1000) NOT NULL,
    normalized_value VARCHAR(1000) NOT NULL,
    defanged_value VARCHAR(1000) NOT NULL,
    first_seen DATETIME NOT NULL,
    last_seen DATETIME NOT NULL,
    source_id VARCHAR(36) REFERENCES threat_intelligence_sources(id),
    source_name VARCHAR(200) NOT NULL,
    external_reference VARCHAR(500),
    threat_category VARCHAR(100) NOT NULL,
    confidence_score FLOAT NOT NULL,
    reputation_verdict VARCHAR(50) NOT NULL,
    composite_threat_score FLOAT NOT NULL,
    score_breakdown_json JSON NOT NULL,
    finding_state VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    expires_at DATETIME,
    mitre_techniques_json JSON NOT NULL,
    associated_threat_actor VARCHAR(200),
    tags_json JSON NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX ix_threat_indicators_normalized ON threat_indicators (normalized_value);
CREATE INDEX ix_threat_indicators_type ON threat_indicators (indicator_type);
CREATE INDEX ix_threat_indicators_state ON threat_indicators (finding_state);
```

---

## 4. Unstructured Narrative Extraction Pipeline

The service provides `extract_iocs_from_text(text: str)` which tokenizes free-text incident narratives and FIR statements. Delimiters `[\s,;\"'<>\[\]{}|\\]+` are applied to isolate potential observables, which are then passed through the typing and normalization engine. Duplicate observables within the same narrative are automatically deduplicated.
