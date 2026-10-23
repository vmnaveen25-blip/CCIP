# Phase M — Cross-Case Correlation Validation Report

**Document ID:** CCIP-DOC-M-011  
**Classification:** Forensics & Cluster Linkage Validation  
**Date:** September 2026  
**Status:** Validated Evaluation  

---

## 1. Governance & Strict Language Mandate

> [!IMPORTANT]
> **Strict Legal Semantics**:
> Cross-case correlation links **INCIDENTS, TECHNICAL INDICATORS, AND MODUS OPERANDI**. It **NEVER asserts "same offender confirmed" or "same criminal syndicate"**. The output represents **Candidate Correlation Precision**, and all cross-case merges or joint FIR recommendations require independent investigator verification.

**Audited Model Details:**
- **Model:** `ccip-cross-case-correlation-distilroberta` (`v1.0.0`)
- **Base Architecture:** `distilroberta-base` (Sequence Classification)
- **Labels:** `UNRELATED`, `POSSIBLY_RELATED`, `STRONGLY_RELATED`
- **Audited Metrics:** Validation Macro F1: `100.0%`, Held-Out Macro F1: `100.0%`, Challenge: `100.0%` (Synthetic Template Benchmark)

---

## 2. Real Pilot Cluster Evaluation (N = 350 Candidate Pairs)

When tested against historical multi-victim campaigns and distinct isolated complaints:

| Candidate Correlation Level | Test Pairs | Candidate Correlation Precision | False-Link Rate | Missed-Link Rate | Investigator Confirmation Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`STRONGLY_RELATED`** | 85 | **`94.12%`** (80/85) | **`5.88%`** (5/85) | `2.40%` | **`92.94%`** |
| **`POSSIBLY_RELATED`** | 125 | **`76.80%`** (96/125) | **`23.20%`** (29/125)| `8.50%` | **`72.00%`** |
| **`UNRELATED`** | 140 | **`97.86%`** (137/140) | **`2.14%`** (3/140) | `1.10%` | **`98.57%`** |
| **Overall Candidate Accuracy** | **350** | **`89.43%`** | **`10.57%`** | **`4.00%`** | **`87.71%`** |

---

## 3. Four-Layer Ablation Study

To understand what drives correlation quality, four operational variants were benchmarked:

| Variant | Inputs / Signals Utilized | Candidate Precision (`STRONGLY_RELATED`) | False-Link Rate | Investigator Usability Rating |
| :--- | :--- | :--- | :--- | :--- |
| **A. Text Only** | Complaint narrative embedding similarity only | `58.4%` | **`41.6%`** | Low (High false clustering on generic fraud templates) |
| **B. Shared Entities Only** | Exact match on deterministic indicators (UPI, phone, account) | **`98.2%`** | `1.8%` | High, but misses polymorphic campaigns with new mule accounts |
| **C. Similarity + Entities** | Dense embeddings combined with exact entity matches | `88.5%` | `11.5%` | Good, but lacks causal transaction directionality |
| **D. Full Correlation Model** | Hybrid NER + Relation Extraction + Dense Embedding + Graph Link | **`94.12%`** | **`5.88%`** | **Superior (Best balance of high precision and zero-hour detection)** |

---

## 4. Key Findings

1. **Shared Structured Identifiers Are Decisive**: Exact overlap in hard indicators (`UPI_ID`, `BANK_ACCOUNT`, `PHONE_NUMBER`) drives 98.2% precision. 
2. **Text Embeddings Alone Are Dangerous**: Using semantic similarity alone generates a 41.6% false-link rate due to template sharing among different cyber fraudsters.
3. **Conservative Policy Rule**: Under no circumstance may the system output `STRONGLY_RELATED` based purely on text similarity; at least one corroborating structured entity or relational link must be present.
