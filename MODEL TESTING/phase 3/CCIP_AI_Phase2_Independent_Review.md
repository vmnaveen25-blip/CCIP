# CCIP AI Validation — Phase 2 Independent Review

**Review date:** 27 October 2026  
**Basis:** The Phase 2 execution summary supplied in the conversation, checked against the publicly visible `main` commit metadata. The underlying 49-row CSV, JSON responses, diff, and raw logs were not supplied with this summary; therefore this is a report-level audit, not an independent rerun of the local staging tests.

## Executive assessment

The Phase 2 report describes meaningful engineering progress: expected missing-weight conditions are now handled explicitly, email/SMS fallback execution is disclosed, empty/malformed input regression tests are reported as passing, and synthetic authenticated entity-extraction testing is reported. The report's release determination — **CONDITIONAL GO; NOT CLEARED FOR LIVE DEPLOYMENT** — remains appropriate.

However, the report should not be interpreted as proving that all 12 neural/intelligence capabilities are validated or production-ready. Several components operated only in fallback mode or were unavailable. “PASS (Handled)” appears to mean that the API handled an unavailable condition safely, not that the intended model successfully performed inference. Those are separate test dimensions and should be reported separately.

## Findings

### F1 — Source identity and reproducibility need reconciliation (HIGH)
The report says the remediation files were updated and new regression tests were created, but it records commit `f260be0a5f19b910ddf2ec9396134f8cbdcd9f37`. The publicly visible `main` branch currently resolves to that same commit. The repository commit metadata therefore does not by itself contain proof of the reported Phase 2 code changes. They may be in an uncommitted local working tree or another local state.

**Required evidence:** `git status --short`, `git diff --stat`, full patch, SHA-256 of the patch, hashes of changed files, and the exact test command/output. Preserve the baseline commit and identify the execution source as `commit + patch` until changes are committed.

### F2 — Neural thresholds must not be applied to fallback heuristic scores (HIGH)
The report compares email fallback score `0.555` with the DistilBERT threshold `0.01133`, and SMS fallback score `0.99` with the DistilBERT threshold `0.2685`. If email/SMS are now running `sovereign_heuristic_fallback`, those are different scoring functions and their scales are not interchangeable. A threshold calibrated for neural probabilities cannot be assumed valid for a fallback heuristic.

**Required action:** Return a separate `engine`, `score_type`, and `threshold_source` for fallback mode. Either calibrate a separate heuristic threshold on a labelled set or omit the model threshold for fallback results. Label heuristic scores as uncalibrated unless calibration evidence exists.

### F3 — Model metrics in persisted artifacts are not runtime validation of unavailable models (HIGH)
The benchmark table lists Email, SMS and Complaint Classifier accuracy/precision/recall/F1, while the Phase 2 runtime table says their neural weights are missing. Persisted metrics may describe prior training or evaluation artifacts, but they do not prove the weights are deployed or that the current serving path achieves those numbers.

**Required action:** Label these as historical/persisted artifact metrics, include artifact hashes, dataset/version, split methodology, class balance, and exact evaluation command. Do not present them as live runtime performance until the matching model weights and evaluation procedure are reproducibly available.

### F4 — Separate endpoint safety from model capability (HIGH)
The Complaint Classifier returns HTTP 200 with `status=MODEL_NOT_DEPLOYED`, and the investigation assistant returns `AI_ASSISTANT_UNAVAILABLE` while Ollama is offline. These can pass an API-unavailability-handling test, but they are not successful model inference.

**Required action:** Report two verdicts per condition: (1) API contract / failure handling; (2) model capability. For example: `API_HANDLING_PASS` and `MODEL_CAPABILITY_BLOCKED`. Likewise, fallback components should be `FALLBACK_FUNCTIONAL` rather than a neural model PASS.

### F5 — URL probability calibration claim is not established by a few smoke tests (HIGH)
The report calls the XGBoost score a calibrated probability and lists a 0.50 action threshold. A model's `predict_proba` value is not automatically calibrated merely because it is numeric or produced by a logistic objective. The three examples are smoke tests and do not establish probability calibration or broad detection performance.

**Required action:** Confirm whether a calibration procedure was fitted and retained. Evaluate on a held-out set using reliability plots and calibration metrics (e.g. Brier score and expected calibration error), alongside precision/recall/F1, confusion matrix and false-positive rate. Keep the 0.50 threshold provisional unless justified by validation and operating costs.

### F6 — NER “5/5” is a single synthetic example, not broad entity-extraction validation (HIGH)
The report says the actual engine was `CYBER_ENTITY_EXTRACTOR_V1` in `RULES_ONLY_DEGRADED` mode and extracted five synthetic entities. This is useful evidence that the rule extractor works on that example; it does not validate the absent DeBERTa token classifier. The displayed entity confidence range should be documented as rule-assigned confidence if produced by deterministic extraction, not represented as a calibrated neural probability.

**Required action:** Report rule-extractor and transformer NER results separately. Use a labelled test set with varied formats, negative examples, offsets, normalization, false positives, and per-entity-type precision/recall/F1. State explicitly that transformer NER remains unavailable until weights are present and load-tested.

### F7 — Similarity score 1.0 needs negative and near-duplicate controls (MEDIUM)
The reported case-similarity engine is a token-overlap fallback, not MiniLM. A score of 1.0 indicates overlap under the fallback scoring function; it is not a calibrated probability that cases are related. Synthetic cases with duplicated wording may trivially produce a perfect score.

**Required action:** Add labelled hard negatives that share generic words, near-duplicate positives with paraphrases, and unrelated cases sharing only common entities. Report fallback score distributions and false-match rates. Keep `similarity_score` distinct from `confidence`.

### F8 — Confidence 1.0 from Feedback Gate hard rules is deterministic, not statistical confidence (MEDIUM)
The report properly identifies this as a hard-rule override. Preserve that distinction in any dashboard or CSV; a hard-gate decision must not be shown as a model probability or model quality metric.

**Required action:** Emit `decision_source=HARD_RULES_OVERRIDE`, `model_inference_used=false`, and `confidence_semantics=DETERMINISTIC_RULE_OUTCOME` for hard-gated outputs.

### F9 — Zero-HTTP-500 claim needs raw per-condition evidence (MEDIUM)
The supplied summary reports 49 conditions and zero unhandled HTTP 500 responses, and lists eight regression tests. Without the 49-row CSV, full JSON output, and raw logs, this claim cannot be independently checked from the supplied summary alone. Expected unavailable cases returning 200 or 503 should be documented as such, not collapsed into model success.

**Required evidence:** Full CSV and JSON outputs, sanitized raw HTTP responses, test runner version/hash, start/end time, and exact test commands. Ensure every one of the 49 conditions maps to a stable test ID and a verdict.

### F10 — Seeded staff credential is printed in the supplied report (HIGH)
The report contains a plaintext seeded staff password. Treat it as exposed even if it was intended for local testing.

**Required action:** Rotate the test account password if it exists, confirm it cannot authenticate outside the isolated local environment, and remove credentials from reports, source files, logs, and handoff packages. Use an environment variable or secret manager for future runs; never print the token or signing key.

### F11 — “All 12 components” needs a clear inventory boundary (MEDIUM)
The report has 12 rows, but other sections also discuss document intelligence, citizen AI routing, and the local LLM runtime. Make it clear whether these are subcomponents included under one of the 12 rows or extra components outside the 12-model denominator. Avoid implying a separately tested component is covered by another row unless a test ID establishes that mapping.

**Required action:** Add an inventory table mapping every repository component to its owner module, endpoint or direct test, mode, model asset requirement, scenario IDs, and evidence file.

## Current interpretation of the 12-row summary

| Component | Interpretation from the supplied report | Model validation status |
|---|---|---|
| URL phishing | XGBoost inference reported available; initial examples returned expected-looking scores | Functional smoke test reported; calibration and generalization not established |
| Email threat | Heuristic fallback, neural weights missing | Fallback response tested; DistilBERT blocked |
| SMS spam | Heuristic fallback, neural weights missing | Fallback response tested; DistilBERT blocked |
| Complaint classifier | Model weights missing; unavailable state handled | API handling tested; DeBERTa blocked |
| Cyber NER | Rule-based extractor active | Degraded extractor smoke test; transformer NER blocked |
| Case similarity | Token-overlap heuristic | Fallback smoke test; MiniLM blocked |
| Incident urgency | Rule-based heuristic | Fallback smoke test; transformer blocked |
| Relation extraction | Co-occurrence heuristic | Fallback path reported; transformer blocked |
| Cross-case correlation | Shared-indicator rules | Fallback path reported; transformer blocked |
| Evidence graph linking | Evidence service/rule linker | Runtime path reported; neural MLP blocked |
| Feedback gate | Deterministic hard rules | Rule gates exercised; neural MLP blocked |
| Investigation assistant | Forensic rules active; Ollama unavailable | Rule path/availability handling tested; generative LLM blocked |

## Next actions, in order

1. Preserve a reproducible source snapshot: commit the remediation or package the exact diff and file hashes.
2. Review the 49-row CSV/JSON and raw sanitized outputs; reconcile the displayed email/SMS score-threshold mismatches.
3. Correct result taxonomy so API handling, fallback functionality, and intended neural model availability are separately reported.
4. Treat the plaintext test credential as exposed and rotate/remove it.
5. Obtain or train missing model weights only after inspecting the training ZIP, dataset provenance, licensing, label quality, split design, and reproducible metrics.
6. Re-run labelled evaluation on isolated staging data; calibrate scores only where evidence supports it.
7. Keep overall deployment at **CONDITIONAL GO — NOT CLEARED FOR LIVE DEPLOYMENT** until security, model asset, CI, production infrastructure and load-test gates are independently satisfied.

## Evidence needed for the next review

Please provide the actual `CCIP_AI_Phase2_Results.csv`, `CCIP_AI_Phase2_Results.json`, `CCIP_AI_Phase2_Blockers.csv`, `CCIP_AI_Phase2_Report.md`, raw regression-test log, and the remediation diff or `git diff` output. This review intentionally does not claim to have independently rerun the local staging service.
