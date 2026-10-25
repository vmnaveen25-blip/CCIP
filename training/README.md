# CCIP / Astraea Enclave — Machine Learning Training Modules

## 1. Overview & Architecture Status

The Citizen Cybercrime Intelligence Platform (CCIP) utilizes a multi-model architecture combining fine-tuned transformer networks, gradient-boosted trees, and deterministic forensic heuristic rules.

This directory tracks the offline training pipelines, data preprocessing routines, evaluation benchmarks, and artifact export scripts for each sovereign model component.

| Model / Pipeline Name | Task Description | Architecture | Status | Offline Weights |
| :--- | :--- | :--- | :--- | :--- |
| **complaint_classifier** | 18-Category Cybercrime Legal Triage | DeBERTa-v3 Multi-Label | **Fully Implemented** | `backend/ml_models/complaint_classifier` |
| **url_phishing** | Zero-Hour URL & Domain Analysis | XGBoost (30 Heuristic Features) | **Fully Implemented** | `backend/ml_models/url_phishing` |
| **email_threat** | Malicious Phishing & Header Detection | DistilBERT Binary Sequence Classification | **Model Deployed** | `backend/ml_models/email_threat` |
| **sms_spam** | Smishing & Financial Fraud Detection | DistilBERT Binary Sequence Classification | **Model Deployed** | `backend/ml_models/sms_spam` |
| **cyber_ner** | Cyber Entity Token Extraction (11 classes) | DeBERTa-v2 Token Classification | **Bootstrap Artifact** | `backend/ml_models/cyber_ner` |
| **case_similarity** | Cross-Case Semantic Embeddings | sentence-transformers/all-MiniLM-L6-v2 | **Specification / Blueprint** | Pending GPU cluster training |
| **incident_urgency** | Narrative Urgency Triage (LOW/MED/HIGH/CRIT) | DistilRoBERTa Sequence Classification | **Specification / Blueprint** | Pending dataset annotation |
| **relation_extraction** | Cyber Entity Pair Relationship Extraction | RoBERTa-base Relation Classification | **Specification / Blueprint** | Pending annotated relation corpus |
| **cross_case_correlation** | Paired Narrative & Indicator Overlap | DistilRoBERTa Paired Sequence Classification | **Specification / Blueprint** | Fallback to Rule-Based Overlap |
| **evidence_graph_link** | Multi-Hop Forensic Graph Link Prediction | PyTorch 80-dim Link Predictor MLP | **Specification / Blueprint** | Fallback to Entity Graph Links |
| **feedback_gate** | Continual Learning & Investigator Feedback | PyTorch 17-dim MLP + Hard Heuristic Gates | **Specification / Blueprint** | Enforces Deterministic Gates |
| **investigation_assistant** | Procedural SOP & Statutory Guidance | Astraea Forensic RAG + Gemini | **Operational Engine** | Grounded in Approved SOPs |

---

## 2. Implemented Training Pipelines

### 2.1 Complaint Classifier (`training/complaint_classifier/`)
- **Dataset:** Stratified cybercrime complaints covering 18 legal and statutory categories (financial fraud, identity theft, unauthorized access, ransomware, social engineering, sextortion, etc.).
- **Architecture:** Pretrained DeBERTa-v3 with per-label calibrated sigmoid decision thresholds.
- **Reproducible Pipeline:**
  1. `data_generation.py`: Controlled synthetic incident scenario generation with balanced label distribution.
  2. `train.py`: PyTorch Hugging Face Trainer loop with AdamW optimizer, linear warmup, and BCEWithLogitsLoss.
  3. `evaluate.py`: Multi-label macro/micro F1, subset accuracy, confusion matrices, and precision-recall calibration.
  4. `export_model.py`: Strips optimizer states and exports weights, tokenizers, calibrated thresholds, and `metadata.json` directly to `backend/ml_models/complaint_classifier`.

---

## 3. Pending Training Pipelines & Developer Blueprint

The following directories represent structured architectural blueprints. The actual model training scripts require access to external annotated citizen datasets and GPU infrastructure. When models are offline, the runtime enclave engine utilizes deterministic heuristic fallbacks without fabricating predictions or metrics.

- `training/case_similarity/`: Pairwise contrastive learning using MultipleNegativesRankingLoss on cybercrime incident pairs.
- `training/cyber_ner/`: BIO token tagging on IP addresses, bank accounts, UPI IDs, crypto wallets, phone numbers, and suspect aliases.
- `training/graph_correlation/`: Graph neural network / paired transformer evaluating technical indicator overlaps.
- `training/risk_scoring/`: Multi-factor risk scoring model based on victim vulnerability, financial velocity, and threat severity.
- `training/mlops/`: Automated MLflow tracking, data drift monitoring, model registry hooks, and canary evaluation pipelines.

---

## 4. Governance, Privacy & Ethical Compliance

1. **No Untrusted Retraining:** Citizen complaint data and investigator feedback are **never** automatically ingested into training loops.
2. **Data Minimization & Redaction:** All PII (names, phone numbers, bank account numbers, physical addresses) must be sanitized and replaced with synthetic surrogates prior to inclusion in training datasets.
3. **Advisory Semantics:** AI models in CCIP provide advisory decision support for human investigators only. Model outputs never constitute legal proof of guilt, conspiracy, or criminal responsibility.
