# CCIP / Astraea Enclave — Machine Learning Model Metrics Inventory

**Document Version:** 1.0.0  
**Phase:** Phase K — End-to-End Intelligence Hardening, Real Prototype Validation & Demo Readiness  
**Target:** 100% Artifact-Derived Truthful Machine Learning Metrics  
**Principle:** Zero fabricated metrics. Preserves exact evaluation methodology (real, synthetic, bootstrap, mixed).  
**Date:** 2026-09-12  

---

## 1. Executive Summary

This inventory catalogs the performance, architecture, threshold calibration, and validation lineage for all 11 models operating inside the sovereign CCIP / Astraea Enclave runtime.

All figures in this document are extracted directly from the signed disk artifacts (`metrics.json`, `metadata.json`, `labels.json`, `feature_schema.json`, and `version.txt`).

---

## 2. Master Model Metrics Table

| Model Target | Architecture | Evaluation Type | Primary Validation Metric | Test / Held-out Metric | Challenge / Stress Metric | Calibrated Threshold | Dataset Source |
|---|---|---|---|---|---|---|---|
| **1. URL Phishing** | `XGBClassifier` (30 features, 300 estimators) | Mixed (Real + Synthetic) | **F1: 97.99%**, Acc: 97.74% | Precision: 97.20%, Recall: 98.78% | Not recorded in artifact | `0.50` | 11,055 balanced phishing & legitimate domain samples |
| **2. SMS Spam** | `DistilBertForSequenceClassification` | Real | **F1: 95.14%**, Acc: 98.84% | Precision: 98.88%, Recall: 91.67% | PR-AUC: 0.9984 | `0.2685` | Curated telecom smishing & legitimate SMS corpus |
| **3. Email Threat** | `DistilBertForSequenceClassification` | Real | **Val F1: 97.87%** | **Test Acc: 98.36%**, F1: 97.83% | PR-AUC: 0.9972, Recall: 98.67% | `0.01133` | Real spear-phishing, credential harvesting & benign corporate emails |
| **4. Complaint Classifier** | `DeBERTa-v3-base` multi-label sequence classification | Mixed (Real + Synthetic) | **Macro F1: 98.40%**, Subset Acc: 97.57% | **Real Test Macro F1: 81.31%**, Subset Acc: 98.09% | Synthetic Test Macro F1: 96.37% | `0.50` | 2,384 validation / 2,271 test cybercrime complaint narratives |
| **5. Cyber NER** | `DeBERTa-v3` token classification + Deterministic Regex Engine | Mixed / Hybrid | **Validation F1: 87.23%** (Precision: 83.41%, Recall: 91.41%) | **Held-out Test F1: 58.41%** (Precision: 51.72%, Recall: 67.08%) | **Challenge F1: 3.23%** (Precision: 3.03%, Recall: 3.45%) | Token Argmax | Synthetic training corpus with held-out realistic incident reports |
| **6. Case Similarity** | `sentence-transformers/all-MiniLM-L6-v2` (384-dim) | Bootstrap Pair Evaluation | **Validation F1: 100%**, Acc: 100% | **Held-out Acc: 100%**, F1: 100% | Challenge Acc: 100% | `0.55` | Paired narrative similarity corpus (curated bootstrap pairs) |
| **7. Incident Urgency** | `RobertaForSequenceClassification (distilroberta-base)` | Bootstrap / Synthetic | **Validation Macro F1: 99.75%**, Acc: 99.75% | Class F1: LOW: 100%, MED: 100%, HIGH: 99.50%, CRIT: 99.50% | Not recorded in artifact | Softmax Argmax | 800 balanced emergency & routine incident narratives |
| **8. Cyber Relation Extraction** | `RobertaForSequenceClassification (distilroberta-base)` | Bootstrap / Synthetic | **Validation Macro F1: 100%**, Acc: 100% | 9 relation classes: 100% precision & recall across 1,350 evaluated pairs | Not recorded in artifact | Softmax Argmax | 1,350 entity-pair contextual relations |
| **9. Cross-Case Correlation** | `RobertaForSequenceClassification (distilroberta-base)` | Bootstrap / Synthetic | **Validation Macro F1: 100%**, Acc: 100% | Held-out Test Macro F1: 100%, Acc: 100% | Loss: 0.000246 | Softmax Argmax | 1,200 paired case summaries with shared indicator vectors |
| **10. Evidence Graph Link** | `EvidenceGraphLinkMLP` (80-dim input, PyTorch) | Bootstrap / Synthetic | **Validation Macro F1: 100%**, Acc: 100% | Held-out Test Macro F1: 100%, Acc: 100% | 21,406 evaluated link candidate pairs | Sigmoid `0.50` | 21,406 synthetic & semi-synthetic graph link candidates |
| **11. Feedback Reliability Gate** | `FeedbackGateMLP` (17-dim input, PyTorch + 5 Hard Gates) | Bootstrap / Synthetic + Deterministic Rules | **Validation Macro F1: 100%**, Acc: 100% | **Held-out Test Macro F1: 99.96%**, Acc: 99.96% | 5 Deterministic Hard Gates strictly override ML | Calibrated Gate Thresholds | 1,800 feedback candidate feature snapshots |

---

## 3. Critical Model Limitations & Transparency Disclosures

### 3.1 Cyber NER Generalization Limitation (DeBERTa-v3)
- **Observed Behavior:** The transformer token classifier achieves **87.23% entity F1** on in-distribution synthetic data, drops to **58.41% entity F1** on realistic held-out incident reports, and degrades to **3.23% entity F1** on adversarial challenge distributions.
- **Architectural Safeguard:** This generalization drop is why CCIP **NEVER** relies solely on the neural model. The **Deterministic Regex Engine is authoritative** for all structured indicators (`URL`, `DOMAIN`, `EMAIL_ADDRESS`, `IP_ADDRESS`, `IFSC_CODE`, `FILE_HASH`, `CRYPTO_WALLET`, `UPI_ID`, `PHONE_NUMBER`). The transformer acts strictly as an augmenting suggester for unstructured text.

### 3.2 Bootstrap & Synthetic Dataset Lineage
- Models 6, 7, 8, 9, 10, and 11 were evaluated against calibrated bootstrap/synthetic datasets.
- Their 99%+ metrics reflect high discrimination on the curated evaluation splits, but **DO NOT** imply 100% infallible production accuracy in the wild.
- All outputs are labeled with mandatory human-in-the-loop warnings:
  - *"Semantic similarity does not establish a common offender."*
  - *"Candidate correlation — investigator review required."*
  - *"AI Suggested Entity — verify indicator in evidence locker."*

### 3.3 No Autonomous Enforcement
- No model in this stack possesses autonomous decision authority.
- Police dispatches, fund freezing, case closures, and candidate learning dataset approvals require explicit manual action by authorized human officers and leads.
