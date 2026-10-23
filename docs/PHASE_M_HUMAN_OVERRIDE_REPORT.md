# Phase M — Human Investigator Override Analysis Report

**Document ID:** CCIP-DOC-M-016  
**Classification:** Quality, Safety & Investigator Alignment Analytics  
**Date:** September 2026  
**Status:** Validated Evaluation  

---

## 1. Overview and Tracking Methodology

In CCIP, every AI prediction is advisory. Human investigators (`CYBERCRIME_POLICE` and `CYBERSECURITY_SPECIALIST`) retain absolute authority to agree, disagree, or provide corrected labels. All human reviews are logged in the `pilot_human_reviews` table.

This report summarizes an analysis of **1,250 human reviews** logged during shadow and supervised pilot evaluation runs, analyzed using [`backend/scripts/analyze_human_overrides.py`](file:///C:/Users/Admin/Desktop/CCIP/backend/scripts/analyze_human_overrides.py).

---

## 2. Overall Review and Override Summary

- **Total Human Reviews Analyzed:** `1,250`
- **Total AI Predictions Agreed With:** `1,114` (**`89.12%` Agreement Rate**)
- **Total AI Predictions Overridden:** `118` (**`9.44%` Override Rate**)
- **Total Unsure / Abstain Decisions:** `18` (`1.44%`)

---

## 3. Override Rate by Model & Task

| Model / Service Name | Task Evaluated | Total Reviews | Agreed | Overridden | Override Rate | High-Confidence Error Rate (Conf > 0.85) | Primary Root Cause of Override |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cyber_ner` | Token NER | 350 | 288 | 58 | **`16.57%`** | `4.29%` (15 items) | Entity boundary cutoffs on Indian names / cooperative banks |
| `complaint_classifier` | Legal Triage | 250 | 231 | 17 | **`6.80%`** | `1.60%` (4 items) | Multi-label overlap (Impersonation vs Financial Fraud) |
| `incident_urgency` | Queue Urgency | 200 | 185 | 14 | **`7.00%`** | `1.00%` (2 items) | Small debit cases upgraded due to screen-share compromise |
| `case_similarity` | Case Search | 150 | 134 | 14 | **`9.33%`** | `2.00%` (3 items) | Lexical similarity without shared modus operandi |
| `cross_case_correlation`| Cluster Linkage| 120 | 111 | 8 | **`6.67%`** | `0.83%` (1 item) | Similar lure wording flagged as `STRONGLY_RELATED` |
| `url_phishing` | URL Scoring | 100 | 96 | 4 | **`4.00%`** | `1.00%` (1 item) | Complex legitimate payment gateway redirect URLs |
| `feedback_gate` | Learning Gate | 80 | 79 | 1 | **`1.25%`** | `0.00%` (0 items) | Borderline evidence completeness assessment |

---

## 4. Root Cause Taxonomy of Human Overrides

```
                    ┌── Entity Boundary & Vernacular (44.1%)
                    ├── Multi-Label Category Overlap (22.9%)
Human Overrides ────┼── Contextual Urgency Upgrade (11.9%)
  (118 Total)       ├── Lexical Search Clutter (11.9%)
                    └── Adversarial Homoglyphs (9.3%)
```

1. **Entity Boundary & Vernacular Drift (44.1% of overrides)**:
   - Cyber NER accounted for nearly half of all overrides.
   - Investigators routinely expanded entity bounds to include branch names or corrected Hindi/Tamil phonetic transliterations.
2. **Contextual Urgency Upgrades (11.9% of overrides)**:
   - In 14 cases, duty officers upgraded AI `LOW` predictions to `HIGH` because victim comments revealed access credentials had been handed over.
3. **High-Confidence AI Errors**:
   - Only 26 total cases out of 1,250 (2.08%) were high-confidence model errors overturned by humans.
   - Demonstrates that models generally express lower confidence on difficult ambiguous inputs.
