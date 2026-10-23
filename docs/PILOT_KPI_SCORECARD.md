# Pilot KPI Scorecard: Operational & Quality Benchmarks

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Standardized Evaluation Metrics for Pilot Performance Tracking  
**Status:** Advanced Prototype / Pilot Preparation  

---

## 1. Multi-Dimensional Pilot Scorecard

```
+-----------------------------------------------------------------------------------+
|                        ASTRAEA ENCLAVE PILOT EVALUATION SCORECARD                  |
+-----------------------------------------------------------------------------------+
| 1. Operational Efficiency   | 2. Quality & Accuracy       | 3. Security & Control |
| - Time to First Triage      | - Entity Extraction Prec.   | - Zero Integrity Violations |
| - Processing Throughput     | - Correlation Confirmation  | - 100% RBAC Denial Checks |
| - Cross-Case Link Speed     | - Urgency Stability         | - 100% Audit Coverage |
+-----------------------------------------------------------------------------------+
| 4. User Experience (UX)                                                           |
| - Citizen Filing Completion Rate   | - Investigator Satisfaction Score            |
+-----------------------------------------------------------------------------------+
```

---

## 2. Detailed Performance Metric Targets

### Category A: Operational Efficiency KPIs

| KPI Code | Metric Name | Baseline (Manual Legacy RMS) | CCIP Pilot Target | Measurement Method |
|---|---|---|---|---|
| **OP-01** | **Time to First Triage** | 24–72 hours | **< 2 hours** (avg) | Timestamp difference: Complaint `SUBMITTED` $\rightarrow$ `CASE_CREATED`. |
| **OP-02** | **Technical Indicator Extraction Time** | 15–30 minutes per docket | **< 30 seconds** (total) | Execution time of `EntityService` and `relation_extraction`. |
| **OP-03** | **Cross-Case Link Discovery Time** | Days to weeks (often never found) | **< 5 seconds** (instant suggestion) | Search latency on `CaseCorrelationService.correlate_case`. |
| **OP-04** | **Evidence Network Assembly Time** | 2–4 hours manual chart drafting | **< 3 seconds** (interactive load) | `evidence_graph_service.build_or_refresh_graph_for_case`. |
| **OP-05** | **Overall Case Processing Throughput** | 5 cases / analyst / day | **15+ cases / analyst / day** | Total cases triaged and assigned per 8-hour shift. |

---

### Category B: Intelligence Quality & Accuracy KPIs

| KPI Code | Metric Name | Pilot Target | Minimum Acceptable Threshold | Measurement Method |
|---|---|---|---|---|
| **QU-01** | **Structured Indicator Precision** | **$\ge 98.0\%$** | $\ge 95.0\%$ | Verified by manual analyst spot-checks on payment/phone entities. |
| **QU-02** | **Contextual Entity Precision** | **$\ge 85.0\%$** | $\ge 80.0\%$ | Analyst verification on extracted suspect and bank names. |
| **QU-03** | **Candidate Correlation Confirmation Rate** | **$\ge 75.0\%$** | $\ge 65.0\%$ | Percentage of proposed correlations marked `CONFIRMED_RELEVANT`. |
| **QU-04** | **False Correlation Rate** | **$< 5.0\%$** | $< 10.0\%$ | Proposed correlations marked `DISMISSED` due to improper linkage. |
| **QU-05** | **Investigator Urgency Override Rate** | **$< 15.0\%$** | $< 25.0\%$ | Frequency of officers changing AI suggested priority scores. |
| **QU-06** | **Feedback Gate Rejection Accuracy** | **100%** | 100% | Rejection of poisoned/incomplete feedback across the 5 hard gates. |

---

### Category C: Security, Integrity & Compliance KPIs

| KPI Code | Metric Name | Target | Method / Verification |
|---|---|---|---|
| **SEC-01** | **Evidence Integrity Violations** | **0 (Zero)** | 100% dynamic match between stored and re-computed SHA-256 digests. |
| **SEC-02** | **Unauthorized Access Attempts Blocked** | **100%** | Zero successful cross-citizen IDOR access or privilege escalation events. |
| **SEC-03** | **Audit Log Completeness** | **100%** | Every state transition, triage event, and reopen request recorded in `audit_logs`. |
| **SEC-04** | **Cloud Telemetry Leakage** | **0 bytes** | Zero outbound network packets to public internet AI endpoints. |

---

### Category D: User Experience (UX) & Adoption KPIs

| KPI Code | Metric Name | Pilot Target | Measurement Method |
|---|---|---|---|
| **UX-01** | **Citizen Filing Completion Rate** | **$\ge 85.0\%$** | Ratio of complaint drafts started vs successfully submitted. |
| **UX-02** | **Pre-Incident Shield Engagement** | **$\ge 40.0\%$** | Percentage of citizen filers who ran threat check prior to filing. |
| **UX-03** | **Investigator Usability Score (SUS)** | **$\ge 75 / 100$** | Standardized System Usability Scale survey administered post-pilot. |
| **UX-04** | **Net Feature Usefulness (Graph Canvas)** | **$\ge 80.0\%$** | Percentage of officers rating evidence graphs as "High Investigative Value". |
