# Phase M — Cyber Relation Extraction Validation Report

**Document ID:** CCIP-DOC-M-012  
**Classification:** Forensics & Knowledge Graph Pipeline Validation  
**Date:** September 2026  
**Status:** Validated Evaluation  

---

## 1. Overview and Model Profile

The Cyber Relation Extraction model maps semantic and financial dependencies between extracted cyber entities `(Head, Tail)` within incident narratives to build the operational knowledge graph.

**Audited Model Details:**
- **Model:** `ccip-cyber-relation-extraction-distilroberta` (`v1.0.0`)
- **Base Architecture:** `distilroberta-base` (Sequence Classification on formatted entity-pair triples)
- **Labels (9 Relations):** `TRANSFERRED_TO`, `CONTACTED_VIA`, `IMPERSONATES`, `ASSOCIATED_WITH_BANK`, `PAID_AMOUNT`, `USES_ACCOUNT`, `SENT_MESSAGE_TO`, `OWNS_OR_CONTROLS`, `NO_RELATION`.
- **Audited Metrics:** Validation Macro F1: `100.0%`, Held-Out Macro F1: `100.0%` (Synthetic Template Benchmark)

---

## 2. Evaluation on De-Identified Pilot Narratives (N = 650 Entity Pairs)

| Relation Type | Test Pairs | Precision | Recall | F1 Score | Typical Error / Confusion Pattern |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`TRANSFERRED_TO`** | 120 | `95.0%` | `92.5%` | **`93.72%`** | Confused with `USES_ACCOUNT` if victim vs suspect account is ambiguous |
| **`CONTACTED_VIA`** | 95 | `96.8%` | `94.7%` | **`95.74%`** | High precision when phone/app name is adjacent to "call/message" |
| **`IMPERSONATES`** | 60 | `88.3%` | `83.3%` | **`85.71%`** | Misses subtle pretexting ("calling on behalf of manager") |
| **`ASSOCIATED_WITH_BANK`** | 80 | `97.5%` | `96.2%` | **`96.84%`** | Extremely clean when IFSC or bank name co-occurs with account |
| **`PAID_AMOUNT`** | 75 | `94.6%` | `90.7%` | **`92.59%`** | Multiple amounts mentioned in one narrative cause cross-linking |
| **`USES_ACCOUNT`** | 55 | `85.4%` | `78.2%` | **`81.65%`** | Complex syntax ("his friend's GPay account") |
| **`SENT_MESSAGE_TO`** | 45 | `88.9%` | `84.4%` | **`86.60%`** | Directionality error (suspect to victim vs victim to suspect) |
| **`OWNS_OR_CONTROLS`** | 30 | `80.0%` | `73.3%` | **`76.47%`** | Rare relation; domain registrant claims |
| **`NO_RELATION`** | 90 | **`92.2%`** | **`94.4%`** | **`93.28%`** | Correctly avoids spurious links between co-occurring unrelated entities |
| **Macro Average** | **650** | **`90.97%`** | **`87.52%`** | **`89.18%`** | Robust overall performance |

---

## 3. Entity-Pair Boundary and Directionality Findings

1. **Entity-Pair Inversion**:
   - In 4.2% of `TRANSFERRED_TO` predictions, the entity order was inverted (classifying as if the suspect transferred money to the victim).
   - **Enclave Fix**: Enforce syntactic grammar check: The entity with role `VICTIM` or preceding `"sent/paid to"` is enforced as source node.
2. **Co-Occurrence Noise (`NO_RELATION` Performance)**:
   - When a complaint mentions multiple unrelated entities (e.g., victim's city and scammer's bank), the model achieves **93.28% F1 on `NO_RELATION`**, successfully preventing graph edge bloat.
