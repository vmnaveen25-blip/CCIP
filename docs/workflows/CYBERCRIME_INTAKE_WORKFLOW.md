# CYBERCRIME INTAKE WORKFLOW SPECIFICATION
## Step-by-Step Multi-Stage Incident Intake & Evidence Processing
**Document Version:** 2026.2  
**Platform:** CCIP Sovereign Enclave  

---

## 1. Multi-Step Reporting Wizard Architecture

The CCIP intake wizard guides complainants through a structured, 5-stage intake protocol designed to maximize evidentiary value while safeguarding citizen privacy:

### Step 1: Incident Overview
- **Category & Subcategory:** Specific classification (e.g. UPI Scam, Phishing, Ransomware).
- **Narrative Details:** Description of event chronology, communication channels, and threat vectors.
- **Temporal Metadata:** Incident date and timestamp (UTC-normalized).
- **Status Flag:** Indicates whether the cyber threat is actively ongoing or historical.

### Step 2: Financial Impact & Transaction Metadata
- **Direct Loss Amount:** Monetary loss value and currency (default: INR).
- **Payment Provider:** Bank, payment aggregator, or UPI application involved.
- **Transaction Identifiers:** Bank UTR, RRN, or merchant transaction reference.
- *Strict Prohibition:* Complainants are explicitly notified NEVER to enter banking passwords, UPI PINs, OTP codes, or card CVVs.

### Step 3: Suspect & Indicator Submission
- **Suspect Contact Points:** Phone numbers, email addresses, WhatsApp numbers.
- **Digital Infrastructure:** Malicious URLs, landing domains, fake APK application names.
- **Financial Destinations:** Suspect bank account numbers, IFSC codes, cryptocurrency wallet addresses.
- **Indicator Normalization:** Backend normalizes phone numbers (E.164) and domains for cross-case correlation without altering the complainant's raw submission text.

### Step 4: Evidentiary Documentation & Integrity Sealing
- **Supported File Types:** PDF, PNG, JPG, JPEG, TXT, DOCX.
- **Cryptographic Hashing:** The moment a file reaches the server, SHA-256 integrity hashes are computed and recorded into `evidence_hashes` and `evidence_metadata`.
- **Virus / Malware Quarantine:** Files are isolated in `storage_vault/evidence/quarantine` prior to forensic scanning.

### Step 5: Review, Statutory Consent & Submission
- **Summary Preview:** Complainant reviews all entered fields.
- **Statutory Consent Checkbox:** Explicit, non-preselected consent confirming truthfulness under penalty of law and authorizing forensic evidence analysis.
- **Idempotency Guard:** Form submission transmits a unique `X-Idempotency-Key`, preventing duplicate complaints during network delays or accidental double-clicks.
- **Sealed Receipt:** Upon successful creation, the system issues an unforgeable reference ID (`CYBER-2026-XXXX`) and confidential tracking token (`ccip_trk_...`).
