# Real-Data Validation & Dataset Acquisition Plan

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Methodology for Transitioning from Synthetic/Bootstrap Baselines to Real-World Operational Datasets  
**Status:** Advanced Prototype / Pilot Preparation  

---

## 1. Context & Motivation

Current machine learning models in CCIP were trained and evaluated on curated synthetic, augmented, and bootstrap datasets. While in-domain validation metrics are high, empirical evaluations reveal significant performance drops on held-out and out-of-distribution (OOD) data.

### Transparent Baseline Performance Disclosure (Cyber NER)
As cataloged in `backend/ml_models/cyber_ner/metrics.json`:
- **In-Domain Validation F1:** 87.23% (Micro F1: 93.50%)
- **Held-Out Test F1:** 58.41%
- **Adversarial / OOD Challenge F1:** 3.23%

> [!WARNING]
> The steep decline from 87.23% validation F1 to 3.23% on adversarial challenge splits indicates **poor robustness to novel, informal, and out-of-distribution phrasing** in deep neural token extraction. This gap establishes **real-world departmental data acquisition and annotation as an urgent, top-priority milestone** before any full operational deployment.

---

## 2. Dataset Acquisition & Legal Protocol

### A. Legal Basis & Consent
- Acquisition of historical police complaints requires formal authorization under relevant national cybercrime and criminal procedure laws (e.g. Section 91 of the Indian Code of Criminal Procedure or equivalent departmental data-sharing agreements).
- All personal complainant and witness identities must undergo **automated and manual de-identification** prior to ingestion into the annotation pipeline.

### B. Two-Tier De-Identification Pipeline
1. **Automated Redaction:** Regex and NER scrubbing of citizen names, personal residential addresses, private mobile numbers, and non-evidentiary personal emails.
2. **Investigative Preservation:** Crucial suspect indicators (fraudulent UPI IDs, mule bank accounts, phishing URLs, attacker phone numbers) are **preserved and pseudonymized** using consistent hashing (`MULE_ACC_HASH_01`, `UPI_ID_HASH_02`) to maintain relational network structures without exposing raw PII.

---

## 3. Module-by-Module Annotation & Validation Plans

### A. Multi-Label Complaint Classification (`ccip-complaint-classifier-v1`)
- **Target Size:** 10,000 real-world incident narratives across 18 legal categories.
- **Annotation Schema:** Multi-label binary presence across 18 classes (e.g. `UPI_FRAUD`, `DIGITAL_ARREST`, `SEXTORTION`, `LOAN_APP_FRAUD`).
- **Reviewer Requirements:** 2 independent legally trained legal/cyber analysts per complaint.
- **Agreement Metric:** Inter-annotator agreement measured via Fleiss' Kappa ($\kappa \ge 0.80$ required). Conflicted cases arbitrated by a Senior Cyber Inspector.
- **Data Splitting:** Temporal split (Train: Months 1–8, Validation: Months 9–10, Test: Months 11–12) to prevent temporal leakage of seasonal scam campaigns.

### B. Hybrid Cyber NER (`ccip-cyber-ner-v1`) — Critical Focus Area
- **Target Size:** 5,000 diverse regional narratives containing localized slang, transliterated text (e.g. Hinglish / regional colloquial phrasing), and emerging scam scripts.
- **Annotation Schema:** BIO-tagging over 11 entity types (`UPI_ID`, `PHONE_NUMBER`, `BANK_ACCOUNT`, `BANK_NAME`, `TRANSACTION_ID`, `UTR`, `AMOUNT`, `ORGANIZATION`, `PLATFORM_NAME`, `PERSON_NAME`, `SOCIAL_HANDLE`).
- **Reviewer Requirements:** Certified cybersecurity analysts specializing in payment fraud indicators.
- **Agreement Metric:** Span-level Cohen's Kappa ($\kappa \ge 0.85$).
- **OOD Hardening Strategy:** Specifically collect 1,000 "adversarial/noisy" complaints with typos, obfuscated numbers (e.g. "nine eight seven 6 5..."), and fragmented URLs to bridge the 3.23% challenge gap.

### C. Cyber Relation Extraction (`ccip-cyber-relation-extraction-v1`)
- **Target Size:** 8,000 annotated entity pairs from confirmed multi-entity complaints.
- **Annotation Schema:** Directed relationship classification across 9 types (`TRANSFERRED_TO`, `CONTACTED_VIA`, `IMPERSONATES`, `ASSOCIATED_WITH_BANK`, `PAID_AMOUNT`, `USES_ACCOUNT`, `SENT_MESSAGE_TO`, `OWNS_OR_CONTROLS`, `NO_RELATION`).
- **Reviewer Requirements:** Cybercrime investigators with financial tracking experience.
- **Quality Gate:** Cohen's Kappa $\ge 0.82$.

### D. Incident Urgency Scoring (`ccip-incident-urgency-v1`)
- **Target Size:** 4,000 historical dockets with recorded police response times and outcomes.
- **Annotation Schema:** 4-point ordinal scale (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) grounded in financial loss magnitude, vulnerable victim status, and ongoing threat status.
- **Calibration Check:** Expected Calibration Error (ECE) target $< 0.05$.

### E. Case Semantic Similarity (`all-MiniLM-L6-v2`)
- **Target Size:** 3,000 triplet pairs (Anchor, Positive Similar Case, Negative Unrelated Case).
- **Reviewer Requirements:** Analysts evaluate whether suggested positive cases involve the same modus operandi.
- **Evaluation Metric:** Mean Reciprocal Rank (MRR) and NDCG@5 on held-out incident pools.

### F. Cross-Case Correlation (`ccip-cross-case-correlation-v1`)
- **Target Size:** 5,000 case pairs across multiple police stations.
- **Ground Truth:** Confirmed multi-case syndicate dockets identified during historical police charge-sheeting.
- **Labels:** `UNRELATED`, `POSSIBLY_RELATED`, `STRONGLY_RELATED`.
- **Quality Gate:** Precision on `STRONGLY_RELATED` must exceed 90% to prevent misdirection of investigative resources.

### G. Evidence Graph Link Prediction (`ccip-evidence-graph-link-v1`)
- **Target Size:** 50 multi-case enterprise fraud networks.
- **Evaluation Metric:** Edge Precision@K (measuring how many predicted candidate edges represent real operational co-conspirators or shared infrastructure).

### H. Feedback Reliability Gate (`ccip-feedback-gate-v1`)
- **Target Size:** 2,000 real investigator feedback submissions.
- **Validation Objective:** Verify that the 5 deterministic hard gates successfully reject 100% of synthetic poisoning attempts, incomplete reviews, and out-of-boundary feature vectors.

---

## 4. Leakage Prevention & Bias Mitigation

1. **Strict Case-Level Separation:** Training, validation, and test splits are strictly separated by **complainant and syndicate IDs**. Multiple complaints belonging to the same criminal group must never appear in both train and test splits.
2. **Temporal Validation:** Evaluating models on future time windows guarantees that models generalize to emerging scam variants rather than memorizing historical buzzwords.
3. **Dialect & Geographic Bias Auditing:** Complaints from diverse rural, semi-urban, and metropolitan jurisdictions must be balanced to ensure fair performance across linguistic proficiencies.
