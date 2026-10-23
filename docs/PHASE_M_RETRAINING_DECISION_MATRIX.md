# Phase M — Model Retraining Decision Matrix & Subphase Proposals

**Document ID:** CCIP-DOC-M-023  
**Classification:** Strategic AI Lifecycle & Retraining Governance  
**Date:** September 2026  
**Status:** Canonical Decision Matrix  

---

## 1. Decision Categories

Every model in the CCIP sovereign enclave is evaluated under five definitive lifecycle categories:
- **`KEEP`**: Model meets or exceeds all operational KPIs on real-world data; no modifications required.
- **`RECALIBRATE_ONLY`**: Core representation is robust, but decision threshold needs tuning for production safety.
- **`RETRAIN`**: Model representation suffers distribution gap; requires offline training with expanded real/de-identified data.
- **`REARCHITECT`**: Foundational model capacity or tokenization architecture is insufficient for the task.
- **`INSUFFICIENT_DATA`**: Real-world evaluation support is too low to make a statistically valid determination.

---

## 2. Comprehensive Model-by-Model Retraining Matrix

| Model Name | Current Artifact | Real Pilot F1 | Target F1 | Decision | Urgency | Data Gaps / Deficiencies | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cyber NER** | `deberta-v3-base` (`v4.0.0`) | `58.4%` (Held-out) / `3.23%` (OOD) | $\ge 80.0\%$ | **`RETRAIN`** | **CRITICAL (High)** | Indian names, transliterated vernacular, cooperative banks, terse syntax | Offline fine-tuning with 5k+ real de-identified Indian complaint texts (Phase M-R1). |
| **Complaint Classifier** | `deberta-v3-base` (`v1.1.0`) | `81.31%` (Real Test Macro F1) | $\ge 85.0\%$ | **`RECALIBRATE_ONLY`** | **MEDIUM** | Under-represented tail classes (`DATA_LEAK`, `DENIAL_OF_SERVICE`) | Calibrate per-label thresholds (`0.28`–`0.72`); schedule tail-class augmentation for Phase N. |
| **URL Phishing** | XGBoost (`v2.0.0-xgboost`) | `97.99%` (F1) | $\ge 95.0\%$ | **`RECALIBRATE_ONLY`** | **LOW** | False alarms on complex banking payment gateways | Shift threshold from `0.50` to `0.65` in `pilot_threshold_recommendations.json`. |
| **Email Threat** | DistilBERT (`v1.0.0`) | `97.83%` (F1) | $\ge 95.0\%$ | **`KEEP`** | **NONE** | Minimal | Maintain calibrated threshold `0.045`. |
| **SMS Threat** | DistilBERT (`v1.0.0`) | `95.14%` (F1) | $\ge 92.0\%$ | **`RECALIBRATE_ONLY`** | **LOW** | False alarms on statutory bank OTPs | Shift threshold to `0.58`. |
| **Incident Urgency** | DistilRoBERTa (`v3.0.0`) | `91.09%` (Macro F1) | $\ge 90.0\%$ | **`KEEP`** | **LOW** | False lows on small test debits with credential theft | Retain model; enforce deterministic override rule for screen-share malware keywords. |
| **Case Similarity** | MiniLM-L6-v2 (`v1.0.0`) | `80.9%` (Recall@5) | $\ge 75.0\%$ | **`RECALIBRATE_ONLY`** | **MEDIUM** | Semantic matches on standard banking intro templates | Raise cosine retrieval inclusion threshold from `0.55` to `0.68`. |
| **Cross-Case Correlation** | DistilRoBERTa (`v1.0.0`) | `94.12%` (Strong Precision)| $\ge 90.0\%$ | **`RECALIBRATE_ONLY`** | **LOW** | Lacks multi-entity co-occurrence weighting | Raise `STRONGLY_RELATED` threshold to `0.75`; mandate at least 1 hard identifier match. |
| **Relation Extraction** | DistilRoBERTa (`v1.0.0`) | `89.18%` (Macro F1) | $\ge 85.0\%$ | **`KEEP`** | **NONE** | Directionality ambiguity in 4% of cases | Add grammatical source/target enforcement in post-processing. |
| **Evidence Graph Linker**| Custom Neural Linker (`v1.0.0`)| `93.2%` (Precision) | $\ge 85.0\%$ | **`RECALIBRATE_ONLY`** | **LOW** | Over-dense graphs on high-cardinality nodes | Raise candidate link threshold to `0.70`. |
| **Feedback Gate** | 5 Hard Gates + Neural Gate | `99.19%` (Precision) | $\ge 98.0\%$ | **`KEEP`** | **NONE** | None | 100% inviolable programmatic hard gates remain active. |
| **Investigation Assistant**| Deterministic Engine (`v1.0.0`)| `4.76 / 5.00` (Mean Rubric) | $\ge 4.20$ | **`KEEP`** | **NONE** | None | Rule-grounded traceability prevents hallucination. |

---

## 3. Proposal: Controlled Subphase PHASE M-R1 (Offline Cyber NER Retraining)

> [!NOTE]
> **Subphase M-R1 Specification**:
> - **Objective**: Close the 3.23% OOD challenge gap on contextual Indian entities in Cyber NER.
> - **Candidate Architecture**: DeBERTa-v3-base with character-aware subword regularization (BPE dropout $p=0.10$).
> - **Target Dataset**: 5,000 de-identified real complaints + 2,500 synthetic Hinglish/regional templates.
> - **Execution Posture**: Prepared as a formal specification only; will NOT be executed autonomously in Phase M. Requires separate authorized subphase invocation.
