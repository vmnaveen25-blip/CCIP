# Phase M — Model Baseline Audit & Ground Truth Resolution

**Document ID:** CCIP-DOC-M-001  
**Classification:** Internal Technical Baseline & Pilot Audit  
**Date:** September 2026  
**Status:** Canonical & Audited Against Physical Enclave Artifacts  

---

## 1. Executive Authority Statement

Before commencing Phase M pilot operations, a complete physical audit of all model artifacts resident in `backend/ml_models/` was conducted. This audit establishes the exact physical files on disk as the **sole ground-truth authority** for model versions, architectures, dataset provenance, and historical metrics.

### 1.1 Resolution of Cyber NER Metric Discrepancy

> [!IMPORTANT]
> **Definitive Reconciliation of Cyber NER Metrics**:
> In prior documentation and development cycles, differing figures were intermittently cited for Cyber NER. Specifically:
> - Initial training runs and C5 development references noted synthetic template validation F1 of ~93.5% and held-out F1 of ~58.4%.
> - Certain Phase L summaries erroneously cited a 99.4% figure (conflated with Complaint Classifier or Urgency synthetic test sets).
>
> **The physical artifact on disk (`backend/ml_models/cyber_ner/metrics.json` and `metadata.json`) is the definitive authority:**
> - **Model Version:** `cyber-ner-bootstrap-v4.0.0`
> - **Base Model:** `microsoft/deberta-v3-base` (Token Classification, 11 entity types, 23 BIO labels)
> - **Synthetic Validation Set (130 samples):**
>   - Loss: `0.1720`
>   - Entity Precision: `83.41%` (`0.8341`)
>   - Entity Recall: `91.41%` (`0.9141`)
>   - Entity F1 Score: **`87.23%`** (`0.8723`)
>   - Token Accuracy: `95.52%` (`0.9552`)
> - **Held-Out Template Test Set (317 samples, disjoint templates):**
>   - Loss: `0.1617`
>   - Entity Precision: `51.72%` (`0.5172`)
>   - Entity Recall: `67.08%` (`0.6708`)
>   - Entity F1 Score: **`58.41%`** (`0.5841`)
>   - Token Accuracy: `93.24%` (`0.9324`)
> - **Out-of-Distribution Challenge Set (Hand-authored edge cases):**
>   - Precision: `3.03%` (`0.0303`)
>   - Recall: `3.45%` (`0.0345`)
>   - F1 Score: **`3.23%`** (`0.0323`)
>   - True Positives: `1`, False Positives: `32`, False Negatives: `28`
>
> **Operational Finding:** Contextual entity extraction (e.g., extracting person names, organizations, or banks from free-flowing colloquial text) suffers severe degradation on out-of-distribution syntax. The hybrid architecture (where deterministic regex rules maintain statutory authority over structured indicators like URLs, domains, emails, IPs, IFSCs, hashes, and wallets) protects system integrity, but the transformer component requires formal real-world pilot evaluation and planned offline retraining (Phase M-R1).

---

## 2. Comprehensive Inventory of Model Artifacts

| Directory | Model Name | Version | Architecture | Base Model | Dataset Type | Primary Metrics | Threshold |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cyber_ner` | Cyber NER Transformer | `v4.0.0` | `DebertaV2ForTokenClassification` | `deberta-v3-base` | Synthetic / Bootstrap | Val F1: 87.23%, Held-out F1: 58.41%, Challenge F1: 3.23% | Argmax / BIO |
| `complaint_classifier` | Complaint Classifier | `v1.1.0` | `DebertaV2ForSequenceClassification` | `deberta-v3-base` | Mixed (Synthetic + Real Benchmark) | Val Macro F1: 98.40%, Real Test Macro F1: **81.31%**, Synthetic Test Macro F1: 96.37% | Multi-label 0.50 |
| `incident_urgency` | Incident Urgency | `v3.0.0` | `RobertaForSequenceClassification` | `distilroberta-base` | Synthetic Template | Val Macro F1: 99.75%, Held-out Macro F1: 100.0%, Challenge: 100.0% | Softmax Argmax |
| `case_similarity` | Case Similarity | `v1.0.0` | `BertModel` (Embedding) | `all-MiniLM-L6-v2` | Synthetic Pairs | Val F1: 100.0%, Held-out F1: 100.0%, ROC-AUC: 1.000 | Cosine Sim: `0.55` |
| `cross_case_correlation`| Cross-Case Correlation| `v1.0.0` | `RobertaForSequenceClassification` | `distilroberta-base` | Synthetic Pairs | Val Macro F1: 100.0%, Held-out Macro F1: 100.0%, Challenge: 100.0% | Softmax Argmax |
| `relation_extraction` | Relation Extraction | `v1.0.0` | `RobertaForSequenceClassification` | `distilroberta-base` | Synthetic Triples | Val Macro F1: 100.0%, Held-out Macro F1: 100.0%, Challenge: 100.0% | Softmax Argmax |
| `email_threat` | Email Threat Detector | `v1.0.0` | `DistilBertForSequenceClassification` | `distilbert-base-uncased` | Real Benchmark (Enron/SpamAssassin) | Test Acc: 98.36%, Prec: 96.99%, Rec: 98.67%, F1: 97.83%, PR-AUC: 0.9972 | Calibrated: `0.0113` |
| `sms_spam` | SMS Threat Detector | `v1.0.0` | `DistilBertForSequenceClassification` | `distilbert-base-uncased` | Real Benchmark (UCI SMS) | Test Acc: 98.84%, Prec: 98.88%, Rec: 91.67%, F1: 95.14%, PR-AUC: 0.9984 | Sigmoid: `0.50` |
| `url_phishing` | URL Phishing Detector | `v2.0.0-xgboost` | `XGBClassifier` (30 features) | Gradient Boosted Trees | Real Benchmark (PhishTank/Alexa) | Test Acc: 97.74%, Prec: 97.20%, Rec: 98.78%, F1: 97.99% | Probability: `0.50` |
| `evidence_graph_link` | Evidence Graph Linker | `v1.0.0` | Neural Link Scorer | Custom Bootstrap | Synthetic Graphs | Val Macro F1: 100.0%, Held-out Macro F1: 100.0% | Binary: `0.50` |
| `feedback_gate` | Feedback Reliability Gate | `v1.0.0` | 5 Hard Gates + Neural Gate | Custom Bootstrap | Synthetic Governance | Hard Rules: 100.0%, ML Held-out Macro F1: 99.96% | Multi-class Softmax |
| `investigation_assistant`| Investigation Assistant| `v1.0.0` | Structured Reasoning Engine | Local Deterministic / Rule-based | Operational Enclave | N/A (Evaluated via Human Rubric) | Deterministic |

---

## 3. Key Observations and Vulnerability Analysis

1. **Synthetic Saturation in Narrative Models**:
   - `incident_urgency`, `relation_extraction`, `cross_case_correlation`, `case_similarity`, and `evidence_graph_link` demonstrate 99.7%–100.0% validation and held-out scores.
   - **Diagnosis**: This is a classic hallmark of synthetic template saturation, where the underlying generative grammar lacks the morphological entropy, misspellings, transliterations, and colloquial brevity of actual citizen complaint narratives.
   - **Phase M Mandate**: These models must be evaluated against real/de-identified evaluation splits without conflating their high synthetic benchmark scores with real field performance.

2. **Real vs. Synthetic Test Divergence in Complaint Classifier**:
   - In `backend/ml_models/complaint_classifier/metrics.json`, the multi-label model scored **96.37%** Macro F1 on synthetic test examples, but dropped to **81.31%** Macro F1 on real test examples (`real_test` support: 1620).
   - This provides empirical proof of distribution shift and confirms that real-world legal triage accuracy requires calibrated thresholds per category.

3. **Public Benchmark Detectors**:
   - `url_phishing`, `email_threat`, and `sms_spam` were trained on genuine public benchmarks (PhishTank, SpamAssassin, UCI SMS) and exhibit strong baseline performance (>95% F1).
   - However, Indian context (Hinglish/Tanglish messages, local bank names, dynamic UPI lure strings) requires specific regional robustness evaluation.

---

## 4. Remediation & Pilot Execution Directives

1. All downstream Phase M documentation, scripts, and evaluation runs must reference the audited metrics above.
2. In all investor and patent documentation, the distinction between **Synthetic Bootstrap Evaluation** and **Observed Pilot Metrics** must be maintained with 100% transparency.
3. Controlled offline retraining for `cyber_ner` will be prepared as a proposal (`PHASE M-R1`) for Phase N consideration.
