# CCIP AI Validation — Phase 3 Audit Resolution Report
**Independent Review Reconciliation, Dual-Verdict Taxonomy, and Evidence Package**

**Execution Timestamp:** 2026-10-27T15:30:00Z (UTC) / 2026-10-27T21:00:00+05:30 (Local)  
**Target Runtime:** `http://127.0.0.1:8000` (Local Enclave Staging)  
**Baseline Git Commit:** `f260be0a5f19b910ddf2ec9396134f8cbdcd9f37`  
**Execution Patch Hash (SHA-256):** `fef6bcbca21d85a29f24b6097d31e5ece61f3f4fea7cb65906d6b002eb1071b6`  
**Authenticated Operator:** Cyber Inspector Sarah Chen (`s.chen@police.gov` / Enclave Test Fixture)  
**Evidence Artifact Directory:** [`c:\CCIP-main\CCIP-main\MODEL TESTING\phase 3\evidence`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence)

---

## 1. Executive Assessment & Audit Disposition

This Phase 3 validation campaign directly executes the recommendations and requirements established in [`CCIP_AI_Phase2_Independent_Review.md`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/CCIP_AI_Phase2_Independent_Review.md). All 11 findings (**F1 through F11**) identified in the independent review have been fully addressed with code modifications, regression tests, held-out evaluations, and a reproducible evidence package.

### Summary of Audit Finding Dispositions
| Finding ID | Severity | Finding Topic | Phase 3 Resolution Status | Evidence Reference |
| :---: | :---: | :--- | :---: | :--- |
| **F1** | **HIGH** | Source identity & reproducibility reconciliation | **RESOLVED_VERIFIED** | [`remediation_file_hashes.sha256`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/remediation_file_hashes.sha256), [`CCIP_AI_Phase2_Remediation.patch`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/CCIP_AI_Phase2_Remediation.patch) |
| **F2** | **HIGH** | Decouple fallback heuristic scores from neural thresholds | **RESOLVED_VERIFIED** | [`email_classifier.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/email_classifier.py), [`sms_classifier.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/sms_classifier.py) |
| **F3** | **HIGH** | Distinguish persisted artifact metrics from live serving | **RESOLVED_VERIFIED** | [`persisted_model_artifacts_audit.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/persisted_model_artifacts_audit.json) |
| **F4** | **HIGH** | Dual-verdict taxonomy (API Contract vs Model Capability) | **RESOLVED_VERIFIED** | [`CCIP_AI_Phase3_Results.csv`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/CCIP_AI_Phase3_Results.csv), [`ccip_ai_phase3_runner.py`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/ccip_ai_phase3_runner.py) |
| **F5** | **HIGH** | URL probability calibration, ECE, Brier score, FPR | **RESOLVED_VERIFIED** | [`url_calibration_evaluation.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/url_calibration_evaluation.json) |
| **F6** | **HIGH** | Cyber NER multi-sample evaluation across 11 entity types | **RESOLVED_VERIFIED** | [`cyber_ner_evaluation.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/cyber_ner_evaluation.json) |
| **F7** | **MEDIUM** | Case similarity duplicate, paraphrase, and hard negatives | **RESOLVED_VERIFIED** | [`case_similarity_evaluation.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/case_similarity_evaluation.json) |
| **F8** | **MEDIUM** | Feedback Gate hard rule override deterministic semantics | **RESOLVED_VERIFIED** | [`feedback_gate.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/adapters/feedback_gate.py) |
| **F9** | **MEDIUM** | Raw per-condition HTTP responses & execution logs | **RESOLVED_VERIFIED** | [`sanitized_raw_responses.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/sanitized_raw_responses.json) |
| **F10** | **HIGH** | Credential redaction & environment secret isolation | **RESOLVED_VERIFIED** | Full redaction across all test artifacts (`[REDACTED_LOCAL_TEST_CREDENTIAL]`) |
| **F11** | **MEDIUM** | Formalize 12-model vs composite orchestration boundary | **RESOLVED_VERIFIED** | Section 10 Architecture Mapping Table |

---

## 2. Source Identity & Reproducibility Package (Finding F1)

To ensure complete reproducibility between the published repository commit and the executed test environment:
- **Baseline Commit:** `f260be0a5f19b910ddf2ec9396134f8cbdcd9f37`
- **Execution Source:** `Baseline Commit + Remediation Working Tree Patch`
- **Patch Location:** [`CCIP_AI_Phase2_Remediation.patch`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/CCIP_AI_Phase2_Remediation.patch)
- **Patch SHA-256:** `fef6bcbca21d85a29f24b6097d31e5ece61f3f4fea7cb65906d6b002eb1071b6`

### Modified Source File Hashes
| File Path | SHA-256 Hash | Purpose of Remediation |
| :--- | :--- | :--- |
| [`backend/app/ai/model_manager.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/model_manager.py) | `2a63a0450e8ddaf388a73102efd1e343c57e17de792a85d039f2789215c654cd` | Clean FileNotFoundError propagation; prevents HTTP 500 |
| [`backend/app/api/ai_verification.py`](file:///c:/CCIP-main/CCIP-main/backend/app/api/ai_verification.py) | `e6ffcaa1639a9ddc46c3857bc97bd5a9c62e2baa4d80d19dcef36d7d7cf72635` | Returns structured HTTP 200 `MODEL_NOT_DEPLOYED` |
| [`backend/app/ai/email_classifier.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/email_classifier.py) | `0658b3d4712cb8b7f41472829db50eb2e8061a51dd290bd664a6706cc63683f0` | Decouples fallback score from DistilBERT threshold (F2) |
| [`backend/app/ai/sms_classifier.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/sms_classifier.py) | `8edd0ba921cdb34f8c0cd8e243f8c33b6df80260db4a25be43f0228c40759e39` | Decouples fallback score from DistilBERT threshold (F2) |
| [`backend/app/ai/url_classifier.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/url_classifier.py) | `06477a39707685bb856cd18064c499d5e956cb49a6a5623ad796c170134da3eb` | Labels raw XGBoost probability and exposes engine |
| [`backend/app/ai/adapters/feedback_gate.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/adapters/feedback_gate.py) | `8d7217b7275cbdd06a051816a262be4db253701b0624e85489ddafbcde76d53a` | Emits `confidence_semantics=DETERMINISTIC_RULE_OUTCOME` (F8) |
| [`backend/app/ai/adapters/citizen_assistant.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/adapters/citizen_assistant.py) | `73b1742775db71e160dc16904c7abfe96e83f88ff77dfde3f321d8b98b3aa380` | Passthrough of engine provenance and fallback mode |
| [`backend/app/ai/adapters/complaint_classifier.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/adapters/complaint_classifier.py) | `009d6d8a24b8c980a6c56ccf39db76c4d451f1117d338b8f885bfbc3c0f5c1a0` | Pre-inference availability guardrail |
| [`backend/tests/test_model_unavailability_and_fallback_regression.py`](file:///c:/CCIP-main/CCIP-main/backend/tests/test_model_unavailability_and_fallback_regression.py) | `6da763a3b14a2f4f3d92bc3c59a3ede7b87757e1c735356176ab2ddf637fb79d` | 9 regression tests covering F2, F8, and unavailability |

---

## 3. Decoupled Fallback Heuristics & Score Semantics (Findings F2 & F8)

### 3.1 Resolving Email & SMS Fallback Threshold Mismatch (F2)
In Phase 2, email fallback score `0.555` was mistakenly compared against the DistilBERT neural threshold `0.01133`, and SMS fallback score `0.99` against `0.2685`.
- **Remediation:** Both [`email_classifier.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/email_classifier.py) and [`sms_classifier.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/sms_classifier.py) were updated to decouple the fallback scoring function:
  - In fallback mode (`sovereign_heuristic_fallback`), the endpoint returns:
    - `engine`: `"sovereign_heuristic_fallback"`
    - `score_type`: `"UNCALIBRATED_HEURISTIC_SCORE"`
    - `score_semantics`: `"UNCALIBRATED_RULE_HEURISTIC"`
    - `threshold`: `0.50` (heuristic decision boundary)
    - `threshold_source`: `"HEURISTIC_RULE_DECISION_BOUNDARY"`
    - `neural_threshold`: `None` (omitted to prevent invalid comparison)
  - DistilBERT thresholds (`0.01133` and `0.2685`) are reserved exclusively for when the transformer weights are deployed and loaded.

### 3.2 Feedback Gate Deterministic Semantics (F8)
- In [`feedback_gate.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/adapters/feedback_gate.py), hard-rule overrides now explicitly output:
  - `decision_source`: `"HARD_RULES_OVERRIDE"`
  - `model_inference_used`: `False`
  - `confidence_semantics`: `"DETERMINISTIC_RULE_OUTCOME"`
  - `confidence`: `1.0` (reflecting deterministic logical certainty, not Bayesian model posterior)

---

## 4. Persisted Artifact Metrics vs. Live Runtime Performance (Finding F3)

All model directories under `backend/ml_models/` were audited and exported to [`persisted_model_artifacts_audit.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/persisted_model_artifacts_audit.json):

| Model Name | Intended Architecture | Persisted Artifact Metrics | Artifact SHA-256 (`metrics.json`) | Physical Weights on Disk | Runtime Serving Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **`url_phishing`** | XGBoost (30 feats) | Acc: 97.74%, Prec: 97.20%, Rec: 98.78%, F1: 0.9799 | N/A (`version.txt`) | **YES** (`phishing_model.pkl`) | **LIVE_OPERATIONAL** |
| **`email_threat`** | DistilBERT | Acc: 98.36%, Prec: 96.99%, Rec: 98.67%, F1: 0.9783 | `5cf9a9a...` | **NO** | **MODEL_UNMOUNTED** (Fallback Active) |
| **`sms_spam`** | DistilBERT | Acc: 98.84%, Prec: 98.88%, Rec: 91.67%, F1: 0.9514 | `a31db87...` | **NO** | **MODEL_UNMOUNTED** (Fallback Active) |
| **`complaint_classifier`** | DeBERTa-v3 Multi-Label | Acc: 96.79%, Prec: 97.78%, Rec: 97.71%, F1: 0.9767 | `e47820b...` | **NO** | **MODEL_UNMOUNTED** (Unavailable Handled) |
| **`cyber_ner`** | DeBERTa Token Classifier | Acc: 95.52%, Prec: 83.41%, Rec: 91.41%, F1: 0.8723 | `30d8920...` | **NO** | **MODEL_UNMOUNTED** (Rule Extractor Active) |

> [!IMPORTANT]
> **Audit Clarification:** The metrics listed above describe *historical evaluation metrics* from training splits retained in disk metadata. They do **not** represent live serving performance for unmounted models. Live serving performance for unmounted models is truthfully recorded as `NOT_APPLICABLE / MODEL_UNMOUNTED`.

---

## 5. Dual-Verdict Taxonomy Specification & Results (Findings F4 & F9)

Every test condition is now evaluated along two independent dimensions:
1. **`api_handling_verdict`**: Evaluates whether the HTTP endpoint fulfilled its API contract (expected HTTP status code, structured error handling, zero unhandled 500 exceptions).
2. **`model_capability_verdict`**: Evaluates whether the underlying AI model performed neural inference (`MODEL_CAPABILITY_PASS`), safely executed rule fallbacks (`FALLBACK_FUNCTIONAL`), or was blocked by missing weights (`MODEL_CAPABILITY_BLOCKED`).

### Aggregated Test Results (46 Evaluated Conditions)
- **API Handling Passes:** **46 / 46 (100.0%)**
- **Unhandled HTTP 500 Failures:** **0 (0.0%)**
- **Model Capability Breakdown:**
  - `MODEL_CAPABILITY_PASS` (Trained Neural Inference): **5**
  - `FALLBACK_FUNCTIONAL` (Sovereign Heuristic Fallbacks): **14**
  - `DEGRADED_RULES_FUNCTIONAL` (Deterministic Regex Extractor): **1**
  - `MODEL_CAPABILITY_BLOCKED` (Missing Physical Weights): **20**
  - `VALIDATION_REJECTED` (Negative / Empty Input Enforcement): **5**
  - `ACCESS_CONTROL_ENFORCED` (RBAC Protected Endpoints): **1**
  - `NEEDS_LABEL_REVIEW` (Boundary String Cases): **1**

*Complete per-condition results are recorded in [`CCIP_AI_Phase3_Results.csv`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/CCIP_AI_Phase3_Results.csv), and all raw HTTP payloads are preserved in [`sanitized_raw_responses.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/sanitized_raw_responses.json).*

---

## 6. URL Phishing Detector Calibration & Evaluation (Finding F5)

To address Finding F5, a deep evaluation of [`phishing_model.pkl`](file:///c:/CCIP-main/CCIP-main/backend/ml_models/url_phishing/phishing_model.pkl) was conducted:
1. **Inspection of Model Artifact:** Confirmed that `phishing_model.pkl` is an `xgboost.sklearn.XGBClassifier`. No `CalibratedClassifierCV` wrapper (Platt scaling or isotonic regression) is present.
2. **Held-Out Labeled Evaluation Set:** Evaluated 60 diverse, held-out URLs (30 Phishing, 30 Legitimate):
   - **Accuracy:** `100.00%` (60/60)
   - **Precision:** `100.00%`
   - **Recall:** `100.00%`
   - **F1 Score:** `1.0000`
   - **False Positive Rate (FPR):** `0.00%` (0 legitimate URLs flagged as phishing)
   - **Brier Score:** `0.0011`
   - **Expected Calibration Error (ECE):** `0.0137` (across 10 probability bins)
3. **Operational Threshold Guidance:** The 0.50 decision threshold is officially documented as a **Provisional Operating Threshold**. Scores are reported to investigators as **Estimated Risk Scores**, not statistical Bayesian posteriors.
4. **Artifact:** Full evaluation details are preserved in [`url_calibration_evaluation.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/url_calibration_evaluation.json).

---

## 7. Cyber NER Multi-Sample Evaluation & Degradation Audit (Finding F6)

To resolve Finding F6, [`CyberEntityExtractor`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/extractors/cyber_entity_extractor.py) (`CYBER_ENTITY_EXTRACTOR_V1`) was evaluated across 13 diverse scenarios covering 11 entity types, negative controls, and malformed boundary cases:
- **Transformer NER State:** `MODEL_CAPABILITY_BLOCKED` (DeBERTa weights absent in enclave).
- **Active Fallback Engine:** `FALLBACK_FUNCTIONAL` (`CYBER_ENTITY_EXTRACTOR_V1` in `RULES_ONLY_DEGRADED` mode).
- **Observed Metrics on Multi-Sample Corpus:**
  - **Overall Precision:** `100.00%` (0 false alarms on benign texts or malformed indicators)
  - **Overall Recall:** `61.11%` (extracts canonical regex-matchable formats, but misses unnormalized natural language variations without transformer)
  - **Overall F1 Score:** `0.7586`
- **Confidence Semantics Notice:** Extracted entity confidence values (`0.94 - 0.98`) represent *deterministic rule assignment weights* based on regex matching. They are strictly documented as non-Bayesian.
- **Artifact:** Full evaluation details are preserved in [`cyber_ner_evaluation.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/cyber_ner_evaluation.json).

---

## 8. Case Similarity Controls & Lexical Fallback Bounds (Finding F7)

To resolve Finding F7, the fallback n-gram text similarity engine in [`case_similarity.py`](file:///c:/CCIP-main/CCIP-main/backend/app/ai/adapters/case_similarity.py) was benchmarked against controlled test pairs:
- **Neural State:** `MODEL_CAPABILITY_BLOCKED` (SentenceTransformer all-MiniLM-L6-v2 unmounted).
- **Active Engine:** `deterministic-ngram-similarity-fallback` (MD5 bag-of-words hashed cosine similarity).
- **Observed Fallback Scores:**
  - **Exact Duplicate Positive:** Score = `1.0000` (Candidate Match: `True`)
  - **Paraphrase Positive (Same Modus Operandi, Different Words):** Score = `0.2236` (Candidate Match: `False` at 0.55 threshold)
  - **Lexical Overlap Hard Negative (Different Crimes Sharing Police/Bank Words):** Score = `0.1879` (Candidate Match: `False`)
  - **Common Entity Hard Negative (Different Crimes Sharing "WhatsApp"):** Score = `0.1491` (Candidate Match: `False`)
  - **True Negative Disparate:** Score = `0.0000` (Candidate Match: `False`)
- **Key Finding & Semantics:** The fallback engine trivially yields 1.0 on identical wording, but drops to 0.22 on semantic paraphrases. The score is strictly defined as `LEXICAL_OVERLAP_SIMILARITY_INDEX` and must not be interpreted as proving a common offender syndicate.
- **Artifact:** Full evaluation details are preserved in [`case_similarity_evaluation.json`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/evidence/case_similarity_evaluation.json).

---

## 9. Credential Safety Verification (Finding F10)

- **Sanitization Complete:** Plaintext credentials have been removed and redacted across all report files, runner scripts, and saved evidence (`[REDACTED_LOCAL_TEST_CREDENTIAL]`).
- **Configurable Secrets:** Test scripts now ingest credentials via `CCIP_TEST_STAFF_PASSWORD`.
- **Environment Isolation:** Confirmed that the test account exists solely within the local development SQLite test fixture and cannot authenticate against external or production systems.

---

## 10. Architectural Boundary & Inventory Denominator Mapping (Finding F11)

The system boundary is formally defined as:
- **12 Core Model Engines** (registered in `ModelManager`)
- **2 Orchestration & Composite Services** (`citizen_assistant` and `document_processor`)
- **1 Generative Copilot Subsystem** (Local Ollama LLM)

| Category | Component Name | Stated Model Architecture | Module Serving Route | Model Asset Path | Active Mode | Test Scenario IDs |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Core Model 1** | `url_phishing` | XGBoost (30 feats) | `POST /api/v1/ai/test/url` | `ml_models/url_phishing/phishing_model.pkl` | `LOADED` | `INV-URL`, `URL-POS`, `URL-NEG`, `URL-IP`, `URL-AMB`, `URL-EMPTY`, `URL-MALFORMED` |
| **Core Model 2** | `email_threat` | DistilBERT | `POST /api/v1/ai/test/email` | `ml_models/email_threat/` | `FALLBACK` | `INV-EMAIL`, `EMAIL-POS`, `EMAIL-NEG`, `EMAIL-AMB`, `EMAIL-EMPTY` |
| **Core Model 3** | `sms_spam` | DistilBERT | `POST /api/v1/ai/test/sms` | `ml_models/sms_spam/` | `FALLBACK` | `INV-SMS`, `SMS-POS`, `SMS-NEG`, `SMS-AMB`, `SMS-EMPTY` |
| **Core Model 4** | `complaint_classifier` | DeBERTa-v3 Multi-Label | `POST /api/v1/ai/test/complaint` | `ml_models/complaint_classifier/` | `DEGRADED` | `INV-COMPLAINT`, `COMPLAINT-MISSING-1`, `COMPLAINT-MISSING-2`, `COMPLAINT-EMPTY`, `COMPLAINT-WHITESPACE` |
| **Core Model 5** | `cyber_ner` | DeBERTa Token Classifier | `POST /api/v1/ai/entities/extract` | `ml_models/cyber_ner/` | `DEGRADED` | `INV-NER`, `NER-UNAUTH`, `NER-AUTH` |
| **Core Model 6** | `case_similarity` | MiniLM-L6-v2 Embeddings | `GET /api/v1/cases/{id}/similar-cases` | `ml_models/case_similarity/` | `FALLBACK` | `INV-SIM`, `SIM-CASE` |
| **Core Model 7** | `incident_urgency` | DistilRoBERTa | `GET /api/v1/cases/{id}/urgency` | `ml_models/incident_urgency/` | `FALLBACK` | `INV-URGENCY`, `URGENCY-EVAL` |
| **Core Model 8** | `relation_extraction` | DistilRoBERTa | `POST /api/v1/complaints/{id}/extract-relations` | `ml_models/relation_extraction/` | `FALLBACK` | `INV-RELATION` |
| **Core Model 9** | `cross_case_correlation` | DistilRoBERTa | `POST /api/v1/cases/{id}/intelligence/refresh` | `ml_models/cross_case_correlation/` | `FALLBACK` | `INV-CORR`, `CORR-REFRESH` |
| **Core Model 10** | `evidence_graph_link` | PyTorch MLP (80-dim) | `GET /api/v1/cases/{id}/evidence-graph` | `ml_models/evidence_graph_link/` | `FALLBACK` | `INV-GRAPH`, `GRAPH-QUERY` |
| **Core Model 11** | `feedback_gate` | PyTorch MLP (17-dim) | `POST /api/v1/ai/feedback-gate/evaluate` | `ml_models/feedback_gate/` | `HARD_GATE` | `INV-GATE`, `GATE-UNAUTH`, `GATE-UNCLOSED` |
| **Core Model 12** | `investigation_assistant` | Astraea Forensic Rules | `GET /api/v1/investigation-assistant/status` | `ml_models/investigation_assistant/` | `LOADED` | `INV-ASSISTANT` |
| **Orchestrator 1** | `citizen_assistant` | Multi-Modal Router | `POST /api/v1/ai/citizen/assist` | Multiple sub-adapters | `ROUTER` | `CITIZEN-URL`, `CITIZEN-SMS`, `CITIZEN-EMAIL`, `CITIZEN-PORTAL` |
| **Orchestrator 2** | `document_processor` | Gemini Doc AI + PDF Parser | `POST /api/v1/evidence/{id}/process` | Local text parsers + offline rules | `FALLBACK` | `DOC-PROCESS` |
| **Copilot Subsystem** | `generative_llm` | Ollama `qwen2.5:7b` | `POST /api/v1/ai/assistant/query` | Local port 11434 daemon | `OFFLINE` | `LLM-STATUS`, `LLM-QUERY` |

---

## 11. Final Release Determination & Blocker Register

**OVERALL RELEASE STATUS: CONDITIONAL GO — NOT CLEARED FOR LIVE DEPLOYMENT**

The complete blocker register is exported to [`CCIP_AI_Phase3_Blockers.csv`](file:///c:/CCIP-main/CCIP-main/MODEL%20TESTING/phase%203/CCIP_AI_Phase3_Blockers.csv):
1. **`complaint_classifier` (HIGH):** DeBERTa-v3 weights absent. Must train or mount weights from [`CCIP_complaint_classifier_training.zip`](file:///c:/CCIP-main/CCIP-main/CCIP_complaint_classifier_training.zip).
2. **`cyber_ner` (HIGH):** DeBERTa token classifier weights absent. Must mount transformer weights to achieve hybrid NER capabilities.
3. **`email_threat` (MEDIUM):** DistilBERT weights absent. Operates in sovereign heuristic fallback.
4. **`sms_spam` (MEDIUM):** DistilBERT weights absent. Operates in sovereign heuristic fallback.
5. **`investigation_assistant` (LOW):** Local Ollama runtime offline on port 11434. Generative copilot unavailable.

### Sign-off Checklist
- [x] All 11 independent review findings resolved and verified.
- [x] Dual-verdict taxonomy adopted across all reports and test outputs.
- [x] Full source code diff and SHA-256 hashes published.
- [x] Decoupled heuristic fallback thresholds implemented and regression-tested.
- [x] URL phishing calibration metrics and ECE evaluated on held-out samples.
- [x] Case similarity semantic limitations rigorously demonstrated.
- [x] Credentials completely sanitized.
- [x] Zero unhandled HTTP 500 errors across all 46 test conditions.
