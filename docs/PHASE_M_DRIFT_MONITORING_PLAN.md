# Phase M — Model Drift Monitoring & Governance Plan

**Document ID:** CCIP-DOC-M-022  
**Classification:** MLOps, Model Governance & Drift Architecture  
**Date:** September 2026  
**Status:** Approved Operational Protocol  

---

## 1. Governance Principles & Strict Auto-Retraining Prohibition

> [!IMPORTANT]
> **No Autonomous Retraining Loop**:
> While CCIP continuously logs telemetry to detect data, concept, and performance drift, **THE PLATFORM FORBIDS AUTONOMOUS RETRAINING**.
> The drift lifecycle strictly follows:
> `DETECT` $\to$ `REPORT` $\to$ `REVIEW` $\to$ `APPROVE` $\to$ `OFFLINE RETRAIN LATER`.
> No model weights are ever overwritten or hot-swapped autonomously in the enclave.

---

## 2. Monitored Drift Dimensions & Telemetry Metrics

| Drift Category | Monitored Parameter | Detection Metric / Test | Alert Threshold | Remediation Action |
| :--- | :--- | :--- | :--- | :--- |
| **1. Input Text Distribution** | Narrative length, character entropy, vocabulary shift | Population Stability Index (PSI), Wasserstein Distance | $\text{PSI} > 0.25$ | Inspect new complaint templates; review tokenizer OOV rates |
| **2. Entity Distribution** | Frequency of entity types (`UPI_ID`, `CRYPTO_WALLET`, `URL`) | Chi-Square Goodness-of-Fit vs. Baseline | $p < 0.01$ | Identify emerging scam vectors (e.g., sudden surge in crypto lures) |
| **3. Category Label Drift** | Proportions of 18 cybercrime legal categories | Category distribution divergence (Jensen-Shannon) | $\text{JSD} > 0.20$ | Alert SOC Commander to new regional threat wave |
| **4. Prediction Confidence Drift**| Average model confidence over rolling 7-day window | Mean confidence delta ($\Delta \mu_{\text{conf}}$) | Drop $> 15.0\%$ | Model encountering unseen attack pretexts; flag for retraining queue |
| **5. Performance & Override Drift**| Human investigator override rate in `pilot_human_reviews` | Daily override percentage | Override $> 15.0\%$ | Trigger forensic review of recent cases; evaluate threshold recalibration |
| **6. Decision Threshold Drift** | Empirical optimal threshold movement on validation splits | F1-optimal threshold delta | $\vert \Delta T \vert > 0.10$ | Update recommended thresholds in `pilot_threshold_recommendations.json` |

---

## 3. Drift Telemetry Persistence (`drift_events` Table)

Drift events detected by the background worker are logged to `drift_events` with:
- `model_id`: Identifier of affected model.
- `drift_type`: `DATA_DRIFT`, `CONCEPT_DRIFT`, or `ACCURACY_DROP`.
- `drift_score`: Calculated quantitative distance metric.
- `threshold`: Pre-configured alert bound.
- `status`: Set to `MONITORED` (requires AI Lead sign-off to move to `TRIGGERED_RETRAINING` or `RESOLVED`).
- `details`: Diagnostic JSON summarizing shifted tokens or feature bounds.

---

## 4. Retraining Trigger Protocol

When a drift event is confirmed by the AI/ML System Lead:
1. Candidate records are exported from `learning_candidates` (having already cleared all 5 feedback gate hard rules).
2. A formal offline training subphase (e.g. `PHASE M-R1`) is scheduled on isolated compute.
3. The new candidate artifact undergoes full shadow validation before any deployment consideration.
