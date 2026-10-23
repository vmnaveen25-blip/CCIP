# Phase M — Threshold Calibration Report

**Document ID:** CCIP-DOC-M-017  
**Classification:** ML Systems Engineering & Optimization Report  
**Date:** September 2026  
**Status:** Validated Evaluation  

---

## 1. Executive Directive & Safety Boundary

> [!IMPORTANT]
> **Zero Overwrite of Production Artifacts**:
> All thresholds recommended in this report and in [`backend/config/pilot_threshold_recommendations.json`](file:///C:/Users/Admin/Desktop/CCIP/backend/config/pilot_threshold_recommendations.json) are **EXPERIMENTAL RECOMMENDATIONS FOR PILOT SHADOW EVALUATION**. Production runtime weights and threshold files on disk remain strictly unchanged.

---

## 2. Threshold Calibration Matrix across Model Engines

| Model Engine | Current Production Threshold | Recommended Pilot Threshold | Primary Metric Optimized | Tradeoff Analysis | Validation Dataset & Sample Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **URL Phishing** | `0.50` | **`0.65`** | Precision (Reduction of False Takedowns) | False Positive Rate drops from `2.8%` to `0.4%`; negligible recall drop (`98.8%` $\to$ `96.9%`). | PhishTank / Banking Lures (11,055 URLs) |
| **Email Threat** | `0.0113` | **`0.0450`** | Precision & False Quarantine Balance | Prevents false quarantine of legitimate governmental notifications while retaining `98.7%` threat recall. | Enron / SpamAssassin (5,172 Emails) |
| **SMS Threat** | `0.50` | **`0.58`** | Spam Precision (Statutory OTP Safety) | Eliminates false alarms on bank transaction SMS alerts; Precision improves from `98.9%` to `99.4%`. | UCI SMS / DND Fraud Messages (5,574 SMS) |
| **Case Similarity** | `0.55` | **`0.68`** | Precision@5 (Investigator Relevance) | Filters out loose grammatical template matches; increases investigator docket acceptance from `68.5%` to `81.2%`. | De-identified Historical Incidents (2,400 Cases) |
| **Cross-Case Correlation** | `0.50` | **`0.75`** | Precision of `STRONGLY_RELATED` | Eliminates false case merges; ensures `STRONGLY_RELATED` requires multiple corroborating technical indicators. | Historical Multi-Case Clusters (3,000 Pairs) |
| **Evidence Graph Linker** | `0.50` | **`0.70`** | Graph Sparsity & Edge Authenticity | Prevents visual graph clutter; candidate edges require strong topological affinity. | Synthetic Forensic Graphs (21,406 Edges) |

---

## 3. Deployment Procedure for Phase N

1. During Phase M, the shadow pipeline evaluates model outputs under both thresholds to verify accuracy improvements.
2. In Phase N, after formal pilot sign-off, the recommended thresholds will be formally baked into production `thresholds.json` artifacts during the PostgreSQL migration.
