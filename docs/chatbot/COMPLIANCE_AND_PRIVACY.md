# CCIP Public AI Assistant: Compliance & Privacy Framework

**Document ID:** CCIP-DOC-CB-008  
**Version:** 1.0.0 (Production)  
**Jurisdiction:** Republic of India  
**Statutory References:** DPDP Act 2023, IT Act 2000, CERT-In Directions 2022, BNSS 2023  

---

## 1. Statutory Alignment & Regulatory Scope

The CCIP AI Assistant and Knowledge Materials platform are engineered in strict conformance with the laws, rules, and executive cybersecurity directions of the Republic of India.

```
+--------------------------------------------------------------------------------------------------+
|                                     INDIAN REGULATORY MATRIX                                     |
|                                                                                                  |
|   1. Digital Personal Data Protection Act, 2023 (DPDP Act)                                       |
|      - Principle of Purpose Limitation & Data Minimisation                                       |
|      - Non-authenticated anonymous public citizen guidance                                      |
|      - Zero retention of biometric, Aadhaar, or financial account credentials                   |
|                                                                                                  |
|   2. Information Technology Act, 2000 & Intermediary Rules 2021                                  |
|      - Section 43A: Sensitive Personal Data / Information (SPDI) rules                           |
|      - Section 66C / 66D: Identity Theft and Cheating by Personation Remediation                |
|      - Section 79: Due diligence and non-liability for public guidance advisories                |
|                                                                                                  |
|   3. Ministry of Home Affairs (MHA) & I4C Citizen Financial Fraud Protocol                       |
|      - 'Golden Hours' emergency trigger for Citizen Financial Cyber Fraud Helpline (1930)       |
|      - Immediate routing advice to National Cyber Crime Reporting Portal (NCRP)                  |
|                                                                                                  |
|   4. CERT-In Directions (No. 20(3)/2022-CERT-In)                                                 |
|      - 180-day secure server-side system log retention                                           |
|      - Cryptographic time synchronization with National Physical Laboratory (NPL) UTC servers     |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Digital Personal Data Protection Act (DPDP Act, 2023) Alignment

### 2.1 Data Minimisation & Anonymous Interaction
- Under the DPDP Act 2023, personal data must be collected only to the extent necessary for the specified purpose.
- The CCIP AI Assistant functions **without requiring citizen authentication**. No name, email, phone number, PAN, or Aadhaar number is requested, recorded, or required to interact with the assistant.
- Temporary conversation states are indexed by an ephemeral UUID (`session_id`) that self-terminates after 24 hours.

### 2.2 Right to Erasure & Purpose Limitation
- A citizen may click the **Close / End Session** button at any time, which triggers `DELETE /api/v1/public-chat/session/{id}`, wiping the session transcript from memory.
- Public chat sessions are strictly quarantined from model retraining pipelines unless manually scrubbed, reviewed, and authorized under an official DPDP Consent Framework.

---

## 3. Financial Cyber Fraud Interdiction: The 1930 Helpline & Golden Hours Protocol

In accordance with directives issued by the **Indian Cyber Crime Coordination Centre (I4C)**, Ministry of Home Affairs:

### 3.1 The "Golden Hours" Window
Financial cyber fraud (UPI scams, phishing, SIM swapping, fake customer care) relies on rapid multi-hop mule account transfers. The first **2 to 3 hours** after a fraudulent transaction represent the "Golden Hours" during which funds can be frozen before extraction at ATMs or crypto conversions.

### 3.2 Automated Assistant Response Protocol
When a citizen query matches financial loss keywords (`debited`, `deducted`, `scammed`, `sent money`, `UPI fraud`, `fake call`, `OTP shared`):
1. The assistant flags the inquiry with `"is_urgent": true` and `"urgent_action": "DIAL_1930"`.
2. A prominent visual emergency banner is displayed on the frontend widget with a direct **Call 1930** button.
3. The response text immediately prioritizes:
   - Dialing **1930** (National Cyber Financial Fraud Helpline).
   - Calling the bank's emergency customer care to block cards and net-banking credentials.
   - Recording the UTR / Transaction Reference Number.
   - Filing an official complaint at `https://cybercrime.gov.in`.

---

## 4. Evidentiary Integrity & BNSS 2023

In alignment with **Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)** regarding electronic records and admissibility:
- Chat logs generated by the public assistant are explicitly watermarked as *Public Informational Guidance* and do not constitute an official First Information Report (FIR) until the citizen formally submits a structured complaint through the authenticated Citizen Portal.
- All knowledge materials uploaded by system administrators are digitally fingerprinted using `SHA-256` to establish an unbroken chain of custody for official advisory circulars.

