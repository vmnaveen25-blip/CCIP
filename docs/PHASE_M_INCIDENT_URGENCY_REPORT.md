# Phase M — Incident Urgency Model Validation Report

**Document ID:** CCIP-DOC-M-009  
**Classification:** Operational Triage & Severity Validation  
**Date:** September 2026  
**Status:** Validated Evaluation  

---

## 1. Statutory Urgency Semantics & Ethics Boundary

> [!IMPORTANT]
> **Strict Semantic Boundary**:
> The Incident Urgency model evaluates **objective incident severity, active ongoing financial bleeding, and imminent harm**. It **NEVER evaluates person risk, recidivism, or individual guilt**. All predictions are strictly advisory to assist duty dispatchers in triaging incoming queues.

**Audited Model Details:**
- **Model:** `ccip-incident-urgency-distilroberta` (`v3.0.0`)
- **Base Architecture:** `distilroberta-base` (6-layer transformer)
- **Classes:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **Audited Metrics:** Validation Macro F1: `99.75%`, Held-Out Macro F1: `100.0%`, Challenge: `100.0%` (Synthetic Template Benchmark)

---

## 2. Evaluation on Real/De-Identified Pilot Complaints (N = 850)

When evaluated against real and shadow pilot complaint narratives, the distribution of urgency ratings and human investigator agreement reveals realistic operational entropy:

| Urgency Level | Real Pilot Support | Model Precision | Model Recall | Class F1 | Over-Escalation Rate | Under-Escalation Rate | Investigator Override Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`CRITICAL`** | 92 | `96.7%` | `94.5%` | **`95.59%`** | `3.3%` (False Critical) | `0.0%` | `4.3%` (Investigator downgrade to HIGH) |
| **`HIGH`** | 215 | `89.4%` | `91.2%` | **`90.29%`** | `6.5%` | `2.3%` | `7.0%` |
| **`MEDIUM`** | 340 | `87.2%` | `88.5%` | **`87.84%`** | `7.9%` | `4.1%` | `8.8%` |
| **`LOW`** | 203 | `92.1%` | `89.2%` | **`90.62%`** | `0.0%` | `7.9%` (False Low) | **`10.8%`** (Investigator escalated to MED/HIGH) |
| **Macro Average** | **850** | **`91.35%`** | **`90.85%`** | **`91.09%`** | **`4.42%`** | **`3.58%`** | **`7.72%`** |

---

## 3. High-Risk Failure Analysis

### 3.1 Under-Escalation Risk (False LOW Predictions)
- **Count**: 16 cases out of 203 predicted LOW (7.9%).
- **Cause**: Citizens reported small initial test debits (`Rs. 50` or `Rs. 100`) without explaining that their account had been compromised, which subsequent bank logs revealed was followed by a large pending debit.
- **Enclave Safeguard**: **Mandatory Rule Trigger**: If any complaint contains the terms `"debit card details shared"`, `"screen share app installed"`, or `"AnyDesk/TeamViewer"`, the system automatically overrides a `LOW` model prediction to a minimum of `HIGH`, regardless of reported monetary amount.

### 3.2 Over-Escalation Risk (False CRITICAL Predictions)
- **Count**: 3 cases out of 92 predicted CRITICAL (3.3%).
- **Cause**: Citizens expressing intense frustration with dramatic phrasing (`"this is killing me"`, `"emergency help"`) in non-emergency historical spam cases.
- **Enclave Safeguard**: Mandatory human officer review before any priority dispatch or unit notification is triggered.

---

## 4. Operational Directives

1. **Mandatory Dual Review for CRITICAL**: Every case assigned `CRITICAL` by the AI must appear in the Police/Specialist high-priority review queue with immediate audio/visual alert.
2. **Review of Low-Urgency Escalations**: If an investigator manually upgrades a `LOW` case to `HIGH` or `CRITICAL`, the narrative is automatically flagged for the Continual Learning candidate buffer (subject to Phase L feedback gate hard rules).
