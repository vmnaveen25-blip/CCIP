# Phase M — Inter-Annotator Agreement Report

**Document ID:** CCIP-DOC-M-004  
**Classification:** Quality & Statistical Validation Report  
**Date:** September 2026  
**Status:** Validated Pilot Metric Report  

---

## 1. Methodology and Statistical Formulation

To ensure high-fidelity evaluation data and avoid subjective annotation noise, the enclave employs rigorous statistical agreement metrics:
- **Cohen's Kappa ($\kappa$)**: Used for pairwise categorical agreement between independent primary reviewers.
- **Fleiss' Kappa**: Used for multi-annotator legal offense consensus reviews.
- **Exact-Span vs. Partial-Span F1**: Used to quantify sequence tagging boundary alignment in Cyber Named Entity Recognition.

Calculations are performed by [`backend/scripts/compute_annotation_agreement.py`](file:///C:/Users/Admin/Desktop/CCIP/backend/scripts/compute_annotation_agreement.py).

---

## 2. Empirical Agreement Results across Evaluation Tasks

| Evaluation Task | Primary Metric | Observed Agreement ($P_o$) | Expected Agreement ($P_e$) | Calculated Value | Quality Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Complaint Classification (18 Classes)** | Cohen's $\kappa$ | `0.9000` (90.0%) | `0.2100` (21.0%) | **`0.8734`** | Strong Agreement |
| **Incident Urgency (4 Levels)** | Cohen's $\kappa$ | `0.8750` (87.5%) | `0.2656` (26.6%) | **`0.8298`** | Strong Agreement |
| **Cross-Case Correlation (3 Classes)** | Cohen's $\kappa$ | `0.8000` (80.0%) | `0.3200` (32.0%) | **`0.7059`** | Substantial Agreement |
| **Relation Extraction (9 Types)** | Cohen's $\kappa$ | `0.8800` (88.0%) | `0.1850` (18.5%) | **`0.8528`** | Strong Agreement |
| **Evidence Graph Candidate Edges** | Cohen's $\kappa$ | `0.9200` (92.0%) | `0.5000` (50.0%) | **`0.8400`** | Strong Agreement |
| **Cyber NER (Exact Span Boundaries)** | Exact-Match F1 | N/A | N/A | **`0.6667`** (66.7%) | Moderate (Boundary Shift) |
| **Cyber NER (Partial Token Overlap)** | Partial-Match F1 | N/A | N/A | **`1.0000`** (100.0%) | Perfect Semantic Overlap |

---

## 3. Detailed Diagnostic Findings

### 3.1 Cyber NER Token Boundary Divergence
- While partial semantic agreement is high (**100.0%**), exact span agreement drops to **66.67%**.
- **Root Cause**: Trailing punctuation, currency symbols (`Rs.` vs `₹`), and telephone country prefixes (`+91` vs raw 10-digit number) cause character offset mismatches between human reviewers.
- **Guideline Clarification**: Punctuation trailing an indicator must always be separated from the token span.

### 3.2 Cross-Case Correlation Adjudication
- Correlation agreement sits at $\kappa = 0.7059$ (substantial).
- The primary disagreement occurs between `POSSIBLY_RELATED` and `STRONGLY_RELATED` when cases share similar phishing kit lures but lack identical bank accounts or phone numbers.
- **Enclave Policy**: In case of disagreement, conservative default is applied: downgrade to `POSSIBLY_RELATED` until corroborated by a hard financial indicator.
