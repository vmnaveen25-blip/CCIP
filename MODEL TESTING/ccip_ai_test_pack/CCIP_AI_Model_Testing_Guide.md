# CCIP AI Model Testing Guide

**Purpose:** run a repeatable smoke-test campaign across the AI and intelligence components in CCIP, capture the observed `status`, availability/fallback mode, confidence/probability/score and threshold, and identify which components need deeper labelled-dataset evaluation.

**Repository inspected:** `vmnaveen25-blip/CCIP`, branch `main`, commit `f260be0a5f19b910ddf2ec9396134f8cbdcd9f37` (inspected 27 October 2026).

**Important limitation:** this package has not executed against the user's local CCIP runtime. It supplies a runnable API test harness and test matrix. Actual confidence values and statuses will be written only when the harness is run against a running local/staging instance.

## 1. Model and component inventory

| Component | Architecture / implementation described by source | Primary test condition | Output to capture | Runtime details |
|---|---|---|---|---|
| Email threat detector | DistilBERT sequence classifier | phishing-like email, benign email, ambiguous email, empty input | threat probability, predicted class, confidence, threshold, status | `/api/v1/ai/test/email`; default threshold reported by source is about `0.01133`, but prefer runtime model metadata |
| SMS spam / smishing detector | DistilBERT sequence classifier | suspicious OTP message, benign delivery message, ambiguous text, empty input | spam probability, class, confidence, threshold, status | `/api/v1/ai/test/sms`; default threshold reported by source is about `0.2685` |
| URL phishing detector | XGBoost classifier with extracted URL features | suspicious lookalike URL, benign example domain, IP-host URL, invalid URL | phishing/legitimate probability, prediction, confidence, threshold | `/api/v1/ai/test/url`; source threshold is `0.5` plus an implemented suspicious-feature rule |
| Complaint classifier | DeBERTa multi-label classifier | synthetic UPI fraud, benign control, ambiguous payment message, empty input | predicted labels, each label's probability and threshold, `is_cybercrime`, status | `/api/v1/ai/test/complaint`; per-label thresholds come from `thresholds.json` |
| Cyber entity extraction | Rule-based extractor, optionally combined with DeBERTa token-classification NER | synthetic URLs, emails, IPs, UPI, UTR, amounts; no-entity text | entity type, confidence, extraction mode, `transformer_available` | `POST /api/v1/ai/entities/extract`; mode should disclose hybrid vs rules-only operation |
| Case similarity | MiniLM sentence embeddings or deterministic n-gram fallback | known similar and unrelated synthetic case pair | `similarity_score`, threshold, `is_candidate_match`, model/fallback status | `GET /api/v1/cases/{case_id}/similar-cases`; default threshold `0.55` unless metadata overrides; score is not a calibrated probability |
| Incident urgency | DistilRoBERTa classifier or rule-based keyword fallback | urgent ongoing fraud/loss, low-urgency control, ambiguous case | urgency label, confidence, class probabilities, fallback flags | `GET /api/v1/cases/{case_id}/urgency`; advisory only, not legal guilt or person risk |
| Relation extraction | DistilRoBERTa or rule-based entity co-occurrence fallback | complaint with two known indicators, no relation, no entities | relation type, confidence, model/fallback status | `POST /api/v1/complaints/{complaint_id}/extract-relations`; service retains non-`NO_RELATION` relation where confidence is at least `0.50` |
| Cross-case correlation | DistilRoBERTa or shared-indicator fallback | two test cases share an IOC vs two cases with distinct indicators | correlation label, confidence, similarity score, human review status | trigger intelligence refresh, then `GET /api/v1/cases/{case_id}/correlations`; candidates should remain unreviewed until a human reviews them |
| Evidence graph linking | Optional PyTorch MLP plus graph service/records | case with known related entities vs unrelated entities | edge type, edge confidence, review status, model availability | `GET /api/v1/cases/{case_id}/evidence-graph`; may rebuild/persist graph records, so use only on test/staging data |
| Feedback reliability gate | 17-feature PyTorch MLP plus deterministic hard gates | unauthorized reviewer, failed integrity check, incomplete audit, appeal pending, all hard gates pass with model missing | decision, `gate_source`, confidence, probabilities, `fallback_mode` | `POST /api/v1/ai/feedback-gate/evaluate`; each evaluation creates a learning-candidate record, so run only when explicitly enabled on staging |
| Investigation assistant | Local generative LLM runtime (configured as Qwen/Ollama by default) | runtime up/down, a short grounded procedural prompt, unavailable-runtime fallback | `available`, status, provider/model; response status/error | Prefer `GET /api/v1/investigation-assistant/status` with staff token. Do not treat the legacy synchronous `/api/v1/ai/assistant/status` as a definitive live health check; source hardcodes its connected state |
| Document intelligence | Google Gemini service invoked on redacted evidence text; offline fallback | synthetic evidence with readable text, unreadable/scanned file, no API key/network | `gemini_status`, processing status, summary/analysis shape, error/fallback | `POST /api/v1/evidence/{evidence_id}/process`; requires a synthetic evidence record and staff token; writes processing data and may call an external API |
| Citizen assistant router | Routes URL/SMS/email requests to local classifiers and portal questions to deterministic help | `url`, `sms`, `email`, `portal_help` modality | selected model, prediction, confidence if applicable, response status | `POST /api/v1/ai/citizen/assist`; router is not a separate trained model |
| Malware scanning (not an AI model) | ClamAV or development/mock adapter | known safe synthetic file and EICAR test string in isolated test environment only | scanner mode and verdict such as clean/infected/blocked | Do not use real malware; a mock result is not evidence of live ClamAV scanning |

## 2. What the public repository tells us about weights

The inspected `main` tree contains the URL-phishing artifact files `backend/ml_models/url_phishing/phishing_model.pkl` and `feature_names.pkl`. The public tree does **not** show the key model-weight files used by the neural components (such as `model.safetensors` or the `*_model.pt` files) for email, SMS, complaint classification, cyber NER, case similarity, urgency, relation extraction, cross-case correlation, evidence-graph linking, and feedback gate.

This is a **repository snapshot observation, not proof about your local deployment**: your machine or model volume might have ignored/external weight files mounted. The authoritative runtime check is `/api/v1/ai/models/status` plus the direct inference result. The runner writes each model's status as a separate row so one missing model cannot be hidden by an overall top-level `healthy` field.

## 3. How to run it on Windows / Antigravity

1. Start CCIP locally or in a dedicated staging environment. Confirm the API responds at `http://127.0.0.1:8000/health`.
2. Copy `ccip_ai_model_test_runner.py` into your project root (or a QA folder). It uses only the Python standard library, so it does not require `requests`.
3. Open PowerShell in the folder containing the script.
4. Run the no-write smoke tests:

```powershell
$env:CCIP_BASE_URL = "http://127.0.0.1:8000"
python .\ccip_ai_model_test_runner.py
```

The output files are written to `ccip_ai_test_results\` as timestamped CSV and JSON files. The script does not record access tokens, full model responses, complaint narratives, case text, or extracted entity values.

To include authenticated NER and live investigation-LLM health tests, set a valid **test/staff** bearer token:

```powershell
$env:CCIP_BEARER_TOKEN = "<STAFF_TEST_JWT>"
python .\ccip_ai_model_test_runner.py
```

To include case/complaint/evidence-dependent tests, prepare synthetic records in a test database, then provide their IDs:

```powershell
$env:CCIP_TEST_CASE_ID = "<SYNTHETIC_CASE_ID>"
$env:CCIP_TEST_COMPLAINT_ID = "<SYNTHETIC_COMPLAINT_ID>"
$env:CCIP_TEST_EVIDENCE_ID = "<SYNTHETIC_EVIDENCE_ID>"
```

Read-only case similarity, urgency and existing correlation queries can then run where applicable. Tests that rebuild/persist intelligence, extract/persist relations, evaluate the feedback gate, rebuild the evidence graph, or process evidence are considered mutating. Only run them on disposable test/staging data after you deliberately opt in:

```powershell
python .\ccip_ai_model_test_runner.py --include-mutating
```

**Never run `--include-mutating` on production data.** The feedback gate test deliberately creates a learning-candidate record. The document-processing test may call Google Gemini if a valid key is configured. Use a synthetic evidence record and review external-call costs/policies first.

You can also supply options explicitly instead of environment variables:

```powershell
python .\ccip_ai_model_test_runner.py --base-url http://127.0.0.1:8000 --case-id <SYNTHETIC_CASE_ID> --complaint-id <SYNTHETIC_COMPLAINT_ID>
```

## 4. How to interpret results

- **`STATUS_REPORTED_NEEDS_INFERENCE_CHECK`** — files/config are reported ready or present; this is not proof that inference works. Run positive and negative inputs.
- **`BLOCKED_OR_UNAVAILABLE`** — the API returned a response but said weights/runtime are not deployed or available. Record as blocked/degraded, not a successful neural-model inference.
- **`RESPONDED_DEGRADED_FALLBACK`** — a rules-only or heuristic path answered. It may be a useful fallback, but must not be described as transformer/ML inference.
- **`RESPONDED_NEEDS_LABEL_CHECK`** — the endpoint responded. You still need to compare its prediction against a labelled expected result before marking correctness.
- **`AUTH_REQUIRED_OR_FORBIDDEN`** — provide a valid test token with the proper role; do not change authorization to get a test to pass.
- **`SKIPPED`** — the necessary synthetic ID/token is not set or the test was intentionally excluded because it writes data.

## 5. Confidence, score, threshold and status are different

1. **Confidence / probability** is the model's output for this particular item. It is not the same as test accuracy, and it may be uncalibrated.
2. **Similarity score** measures text/embedding similarity. It does not establish that two cases share a perpetrator or that any person committed a crime.
3. **Threshold** is the cutoff used by a model or service to decide which outputs to return. Record the live threshold; do not invent one in the report.
4. **Runtime status** tells you whether assets/runtime are ready, loaded, degraded, unavailable or failed. HTTP 200 alone does not imply an available neural model.
5. **Performance metrics** such as precision, recall, F1 and false-positive/false-negative rates require a labelled evaluation dataset. This runner is an API smoke test, not a full accuracy benchmark.
6. **Hard-gate `confidence: 1.0`** in the feedback gate means a deterministic rule fired; it is not learned model certainty.
7. **No confidence field** is an acceptable outcome for generative text. Do not request or display a fabricated percentage from an LLM.

## 6. Minimum evaluation conditions before declaring an AI model validated

For each classifier, prepare a labelled test set with enough positive, negative, ambiguous, and adversarial/borderline examples. Lock the dataset version and split. Record confusion matrix, precision, recall, F1, false-positive rate, false-negative rate, inference latency, model/version hash, configured threshold, missing-weight behavior, and fallback behavior. Review threshold calibration and per-class performance. A handful of smoke-test strings cannot establish accuracy.

For entity extraction, evaluate entity-type precision/recall and span-level exact match; for relation/correlation/graph components evaluate pair-level precision/recall and human-review outcomes; for similarity evaluate precision@k / recall@k against adjudicated pairs; for urgency evaluate per-class metrics and confusion matrices; for LLM/document analysis, use a grounded rubric, hallucination checks, PII-redaction tests, prompt-injection cases, and explicit refusal/unavailable checks.

## 7. Current guardrail

Until the real outputs are captured and the relevant model assets and release gates are verified, report each component as one of `PASS`, `PASS_WITH_LIMITATIONS`, `BLOCKED`, `FAILED`, or `NOT_RUN`. Do not assign made-up confidence values. Keep CCIP's release recommendation at **CONDITIONAL GO — NOT CLEARED FOR LIVE DEPLOYMENT** until all required security, infrastructure, malware-scanning, model, backup, CI-coverage, and staging-load gates are actually closed.
