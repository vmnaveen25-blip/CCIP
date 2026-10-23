# CCIP Cybercrime Complaint Dataset - Curation Guidelines

## Purpose
This document establishes strict editorial, forensic, and labeling standards for the CCIP Cybercrime Complaint Classifier dataset (`complaint-dataset-v1.1.0`). These guidelines ensure that curated and augmented complaints accurately reflect real-world victim narratives reported to cybercrime helplines (such as National Cyber Crime Reporting Portal - cybercrime.gov.in / 1930) while eliminating label ambiguity, target leakage, and synthetic repetitive templates.

---

## 1. Core Principles

1. **Victim Narrative Perspective:**
   - Text must describe the incident from the victim's, witness's, or reporting officer's viewpoint.
   - Do **NOT** write dictionary definitions (e.g., *"Sextortion is a cybercrime where an attacker..."*).
   - Do **NOT** include chatbot completions, advice, or legal guidance (e.g., *"You should immediately call 1930 and file an FIR under Section 66D..."*). The model must learn from the incident details, not from leaked advice keywords.

2. **Forensic Entity Preservation:**
   - Complaints should naturally incorporate realistic entities:
     - Transaction references: UPI Ref, UTR numbers, transaction IDs.
     - Amounts: Rs. 500, ₹12,500, Rs. 4.5 lakh, etc.
     - Communication channels: WhatsApp, Telegram, Instagram, SMS, email, voice call, fake APK.
     - Financial platforms: SBI, HDFC, ICICI, PNB, PhonePe, Google Pay, Paytm, Cred, Zerodha, Groww.
   - PII is preserved in structural form unless explicit anonymization is triggered during pipeline configuration.

3. **Linguistic Diversity:**
   - Incorporate a balanced mix of:
     - Formal English (corporate complaints, official bank disputes).
     - Informal English (casual social media reports).
     - Indian English idiom (e.g., *"amount was debited"*, *"amount got deducted"*, *"cheated me of"*, *"lakhs"*, *"crores"*).
     - Realistic Hinglish phrases where natural (e.g., *"paise cut gaye"*, *"call pe bola ki account band ho jayega"*).
   - Vary sentence structures: short terse reports (1-2 sentences) and comprehensive chronological statements (3-6 sentences).

4. **Multi-Label Realism:**
   - Real cybercrimes frequently span multiple categories. Label combinations must reflect real-world attack vectors:
     - `BUSINESS_EMAIL_COMPROMISE` + `PHISHING`
     - `ACCOUNT_TAKEOVER` + `SOCIAL_MEDIA_CRIME`
     - `IDENTITY_THEFT` + `ACCOUNT_TAKEOVER`
     - `SEXTORTION` + `CYBERSTALKING`
     - `LOAN_APP_FRAUD` + `CYBERSTALKING`
     - `INVESTMENT_SCAM` + `CRYPTO_FRAUD`
     - `PHISHING` + `BANKING_FRAUD`
     - `PHISHING` + `UPI_FRAUD`
     - `MALWARE_RANSOMWARE` + `ACCOUNT_TAKEOVER`

5. **Legitimate Control Isolation:**
   - Legitimate traffic (normal bank alerts, customer queries, general banter) must have:
     `"is_cybercrime": 0`, `"labels": []`.
   - `OTHER` is strictly a cybercrime catch-all; it must **NEVER** be applied to legitimate traffic.

---

## 2. Weak Class Definitions & Criteria

### 1. Business Email Compromise (BEC)
- **Criteria:** Impersonation of organizational executives (CEO, CFO, Director), vendors, suppliers, or HR to manipulate corporate payments, divert wire transfers, change vendor bank details on invoices, or intercept payroll.
- **Exclusion:** Generic phishing targeting individuals (e.g. personal Netflix/Amazon login) is NOT BEC.

### 2. Cyberstalking
- **Criteria:** Repeated, persistent, and unwanted online harassment, surveillance, tracking victim accounts, sending threats across platforms, or repeatedly creating new accounts after being blocked.
- **Exclusion:** A single isolated marketing spam or unsolicited message is NOT cyberstalking.

### 3. Malware / Ransomware
- **Criteria:** Installation of malicious software, ransomware file encryption, ransom notes demanding cryptocurrency/cash, Remote Access Trojans (AnyDesk/TeamViewer abuse for account control), or malicious Android APKs stealing SMS/banking credentials.
- **Exclusion:** Merely receiving a suspicious URL without malicious software execution/delivery narrative is regular Phishing.

### 4. Account Takeover
- **Criteria:** Unauthorized hijacking and loss of control of an existing user account (WhatsApp, Instagram, Facebook, email, netbanking, crypto exchange) through OTP theft, credential theft, session hijacking, or SIM swap.
- **Additional Label:** If the hijacked account is a social media profile, assign both `ACCOUNT_TAKEOVER` and `SOCIAL_MEDIA_CRIME`.

### 5. Sextortion
- **Criteria:** Extortion and blackmail involving real or manipulated intimate images, recorded video calls, or private photos, with threats to distribute them to family, colleagues, or social media unless money is paid.
- **Tone Guideline:** Keep complaints realistic and professional; avoid unnecessary graphic explicit descriptions.

### 6. Card Fraud
- **Criteria:** Unauthorized debit or credit card transactions, ATM cloning, card skimming at POS terminals, international card charges without OTP, or fraudulent card limit enhancement calls.

### 7. Loan App Fraud
- **Criteria:** Predatory instant loan apps, exorbitant deduction fees, harassment by recovery agents calling phone contacts, photo morphing, and coercive threats to repay unauthorized loans.

### 8. Online Shopping Fraud
- **Criteria:** Fake e-commerce websites, non-delivery of items ordered online, fake courier parcel customs fees, fraudulent marketplace buyers sending reverse QR codes, or counterfeit product scams.

### 9. Identity Theft
- **Criteria:** Unauthorized use of a victim's personal identification documents (Aadhaar, PAN, voter ID, passport) or biometrics to open fraudulent bank accounts, secure loans, or execute SIM swaps.

### 10. Job Scam
- **Criteria:** Fraudulent employment offers, part-time work-from-home tasks (YouTube video liking, hotel rating, crypto task completion), fake interview selection letters, or requiring registration fees to get a job.

### 11. Crypto Fraud
- **Criteria:** Fake cryptocurrency exchanges, fraudulent USDT mining pools, Telegram crypto investment signals, pump-and-dump schemes, or unauthorized draining of crypto wallets.

### 12. UPI Fraud
- **Criteria:** UPI collect-request deception, fake QR code scanning ("scan to receive money"), fraudulent UPI refund claims, or fake payment screenshots sent to merchants.

---

## 3. Provenance and Metadata Requirements

Every curated record must include:
- `id`: Stable deterministic hash.
- `text`: Clean, normalized complaint narrative.
- `is_cybercrime`: `1` (or `0` for curated negative controls).
- `labels`: List of valid CCIP labels.
- `source`: E.g. `"ccip_curated_corpus"`.
- `source_label`: Specific subcategory or scenario intent.
- `language`: `"en"` or `"hi-en"`.
- `synthetic`: `false` for real complaints; `true` for verified synthetic augmentations.
- `curation_batch`: Batch identifier (e.g. `"curated_batch_2026_09"`).
- `review_status`: `"AUTO_ACCEPTED_HIGH_CONFIDENCE"` or `"VERIFIED_MANUAL"`.
