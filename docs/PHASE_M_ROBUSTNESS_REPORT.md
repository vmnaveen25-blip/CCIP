# Phase M — Adversarial Robustness & Perturbation Report

**Document ID:** CCIP-DOC-M-021  
**Classification:** Defensive Security & ML Robustness Validation  
**Date:** September 2026  
**Status:** Validated Evaluation  

---

## 1. Scope and Threat Model

Cyber adversaries actively attempt to evade automated intake filters through safe input perturbations:
- Modifying phone and UPI formatting to bypass regex rules.
- Inserting Unicode homoglyphs (e.g. Cyrillic characters) into phishing URLs.
- Deliberately padding text with excessive whitespace, line breaks, or repeated noise.
- Submitting oversized payloads to cause denial-of-service memory exhaustion.

Automated verification is conducted by [`backend/tests/test_phase_m_robustness.py`](file:///C:/Users/Admin/Desktop/CCIP/backend/tests/test_phase_m_robustness.py).

---

## 2. Robustness Test Results across Perturbation Vectors

| Perturbation Attack Vector | Test Methodology | Enclave Component | Pass / Fail Status | Defensive Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Phone Number Punctuation Variants** | Tested `+91-98765-43210`, `(091)`, spaced | Hybrid Entity Extractor | **PASSED (100%)** | Canonical E.164 sanitization removes non-digits |
| **UPI ID Punctuation Variants** | Underscores, hyphens, periods in handles | Hybrid Entity Extractor | **PASSED (100%)** | Robust VPA grammar matching |
| **Defanged URLs & IP Ports** | `https://domain[.]xyz/auth`, `192.168.1.1:8080` | Hybrid Entity Extractor | **PASSED (100%)** | Pattern normalizer strips defanged brackets |
| **Unicode Homoglyph Substitution** | Cyrillic `а` replacing Latin `a` in domain | URL Phishing Classifier | **PASSED (100%)** | Feature extractor normalizes IDN/Punycode safely |
| **Excessive Whitespace & Newlines** | Arbitrary line breaks and spacing blocks | Urgency & NER | **PASSED (100%)** | Whitespace normalization pre-processing |
| **Oversized Narrative Injection** | 15,000+ character repeated text blocks | Complaint Classifier | **PASSED (100%)** | Enforces 10,000 character maximum truncate guard |

---

## 3. Key Findings

1. **Defanging Resilience**: Security professionals and victims frequently write defanged indicators (`domain[.]com`). The hybrid extractor successfully recognizes and normalizes these without dropping evidence.
2. **Denial-of-Service Immunization**: The 10,000-character truncation guard in the Complaint Classifier and the 512-token max length in DeBERTa prevent GPU/CPU memory exhaustion attacks.
