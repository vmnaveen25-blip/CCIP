# Phase M — Evidence Graph Validation Report

**Document ID:** CCIP-DOC-M-013  
**Classification:** Forensics & Graph Topologies Validation  
**Date:** September 2026  
**Status:** Validated Evaluation  

---

## 1. Two-Layer Graph Architecture

The CCIP Evidence Graph operates in two strictly separated layers:
1. **Layer A: Deterministic Topological Graph Construction** (Built from sealed evidence, extracted entities, and verified database relations).
2. **Layer B: Candidate Link Prediction** (`evidence_graph_link` neural link prediction engine).

---

## 2. Layer A: Deterministic Graph Quality Metrics (N = 45 Case Graphs)

| Graph Health Metric | Observed Metric | Operational Target | Status | Failure / Anomaly Diagnosis |
| :--- | :--- | :--- | :--- | :--- |
| **Node Correctness** | **`99.4%`** | $\ge 99.0\%$ | **PASS** | Exact alignment with sealed evidence hashes and extracted entities |
| **Edge Correctness** | **`98.8%`** | $\ge 98.0\%$ | **PASS** | Verified against explicit relationship records |
| **Entity Duplicate Rate** | **`0.6%`** | $\le 1.0\%$ | **PASS** | Managed via case-scoped canonical entity normalization |
| **Orphan Node Rate** | **`2.1%`** | $\le 5.0\%$ | **PASS** | Nodes with zero connections (e.g. unreferenced file hashes) |
| **Graph Generation Latency** | **`14.2 ms`** | $\le 50.0 ms$ | **PASS** | In-memory NetworkX serialization |

---

## 3. Layer B: Candidate Link Prediction Metrics (N = 250 Candidate Edges)

| Candidate Link Metric | Baseline Threshold (0.50) | Recommended Threshold (0.70) | Target KPI | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Candidate-Edge Precision** | `81.4%` | **`93.2%`** | $\ge 85.0\%$ | **PASS** |
| **Candidate-Edge Recall** | **`92.8%`** | `86.4%` | $\ge 80.0\%$ | **PASS** |
| **Investigator Accept Rate** | `74.0%` | **`88.5%`** | $\ge 75.0\%$ | **PASS** |
| **Investigator Reject Rate** | `26.0%` | **`11.5%`** | $\le 25.0\%$ | **PASS** |
| **False-Link Rate** | `18.6%` | **`6.8%`** | $\le 10.0\%$ | **PASS** |

---

## 4. Operational Safety Controls

1. **Visual Distinction**: In the Specialist UI graph view, deterministic edges are rendered as **solid green lines**, while predicted candidate links are rendered as **dashed amber lines with confidence badges**.
2. **One-Click Human Confirmation**: Candidate links never become authoritative evidence unless explicitly confirmed by an assigned forensic investigator.
