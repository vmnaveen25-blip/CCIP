# Phase M — Data Splitting Protocol & Leakage Prevention Standard

**Document ID:** CCIP-DOC-M-005  
**Classification:** ML Engineering & Data Splitting Protocol  
**Date:** September 2026  
**Status:** Approved Operational Protocol  

---

## 1. Objective and Strict Leakage Constraints

In legal and cybercrime machine learning, standard random train/test splitting introduces severe optimism bias due to duplicate complaints, multi-part incident logs, shared attacker campaigns, and temporal data leakage. 

The CCIP evaluation framework enforces **four mandatory isolation barriers**:

1. **Exact Narrative Disjointness**: Deduplication using normalized SHA-256 narrative hashes prevents verbatim spam/lures from appearing across splits.
2. **Case-Level Clustering Isolation**: All records, evidence logs, and forensic artifacts associated with a single statutory `case_id` are strictly confined to a single split. No case is split across training, validation, or test sets.
3. **Temporal Boundary Splitting**:
   - Baseline Training & Tuning: Historical incidents logged on or before `2026-06-01T00:00:00Z`.
   - Held-Out Generalization Evaluation: Incidents logged strictly after `2026-06-01T00:00:00Z`.
   - Simulates real-world deployment where future cybercrime attacks evolve beyond past training horizons.
4. **Dedicated Out-of-Distribution (OOD) Challenge Reservation**:
   - 10% of total volume is reserved for stress-testing: code-mixed regional text (Hinglish/Tanglish), OCR scan corruption, novel slang, homoglyph domain mutations, and adversarial evasion tactics.

---

## 2. Manifest-Based Storage Architecture

To prevent accidental data leaks into version control:
- Raw citizen complaint narratives and victim PII are **NEVER committed to git**.
- The splitting script [`backend/scripts/build_pilot_eval_splits.py`](file:///C:/Users/Admin/Desktop/CCIP/backend/scripts/build_pilot_eval_splits.py) outputs **immutable metadata manifests** containing record IDs, timestamps, cryptographic hashes, and entity counts.
- Manifests are persisted inside the gitignored `storage_vault/` directory.

---

## 3. Split Distribution Targets for Pilot Validation

| Partition | Proportion | Target Volume | Primary Evaluation Purpose |
| :--- | :--- | :--- | :--- |
| **Train / Tuning** | 50% | ~500–1,000 cases | Diagnostic error profiling, threshold calibration. |
| **Validation** | 15% | ~150–300 cases | Hyperparameter sensitivity and decision threshold tuning. |
| **Held-Out Temporal Test** | 25% | ~250–500 cases | Primary objective real-world generalization benchmark. |
| **OOD Challenge Set** | 10% | ~100–200 cases | Robustness bounds, failure taxonomy, degraded mode trigger testing. |
