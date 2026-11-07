# CITIZEN DATA PROTECTION SPECIFICATION
## Statutory Privacy Controls, Ephemeral Chat Retention & PII Redaction
**Document Version:** 2026.2  
**Platform:** CCIP Sovereign Enclave  
**Compliance Mandate:** Digital Personal Data Protection (DPDP) Act 2023  

---

## 1. Statutory Privacy Mandates

CCIP handles citizen complaints under the Indian Digital Personal Data Protection (DPDP) Act 2023 and CERT-In directions:

### 1.1 Data Minimization
- No passwords, PINs, OTP codes, or CVVs are collected.
- Complainant phone numbers and emails are collected strictly for investigation notifications and reference verification.
- Anonymous public assistance inquiries do not record complainant identity.

### 1.2 Automated Server-Side Masking
- The `pii_redactor.py` service scans raw narratives and evidence OCR text.
- 12-digit Aadhaar numbers and 10-character PAN identifiers are masked (`XXXXXXXX1234`) before indexing into search vectors or audit logs.

### 1.3 Complainant Ownership & BOLA / IDOR Defense
- Complainants can only query dossiers matching their authenticated `citizen_id` or registered email.
- Unauthorized attempts to probe foreign reference numbers are strictly denied with `403 Forbidden` / `404 Not Found` and logged to `security_events_registry`.

### 1.4 Non-Training Guarantee
- Complainant incident narratives and attached evidence files are **NEVER** used for training external AI models or open-weight foundational LLMs.
