# Pilot Program Plan: Controlled Validation Framework

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Target Entities:** State Cyber Crime Police Stations, Regional Cyber Cells, University Security Operations Centers (SOC), Financial Crime Units  
**Document Purpose:** Structured Pilot Deployment Roadmap & Operational Protocols  
**Status:** Advanced Prototype / Pilot Preparation  

---

## 1. Executive Summary

This document establishes a phased, risk-controlled pilot framework for validating the CCIP / Astraea Enclave platform within an operational cybercrime investigation unit. To eliminate operational, legal, and privacy risks, the pilot enforces strict boundaries:
- **No Autonomous Enforcement:** All AI outputs are advisory. Investigators maintain 100% legal decision authority.
- **Controlled Phase Gates:** Progression from historical back-testing (sandbox) to live shadow evaluation requires explicit milestone sign-off.
- **Sovereign Execution:** All model inference runs strictly inside on-premises hardware without cloud API dependencies.

---

## 2. Four-Stage Pilot Methodology

```
+-----------------------------------------------------------------------------+
| Phase P0: Sandbox Validation (Weeks 1–4)                                    |
| - Synthetic, historical, and de-identified benchmark datasets               |
| - Technical installation, RBAC verification, throughput benchmarking        |
+-----------------------------------------------------------------------------+
                                       │ Milestone Review
                                       ▼
+-----------------------------------------------------------------------------+
| Phase P1: Shadow-Mode Pilot (Weeks 5–10)                                    |
| - Live real-world complaint feeds ingested in parallel (read-only mirror)   |
| - AI suggestions generated silently without influencing live cases          |
| - Precision, recall, and entity extraction accuracy measured by auditors    |
+-----------------------------------------------------------------------------+
                                       │ Safety & Accuracy Gate
                                       ▼
+-----------------------------------------------------------------------------+
| Phase P2: Supervised Operational Pilot (Weeks 11–18)                         |
| - Assigned to a dedicated cohort of 5–10 certified cybercrime investigators |
| - AI extracts, urgency scores, and evidence graphs exposed with disclaimers |
| - Officers actively confirm/dismiss candidate correlations and edges        |
+-----------------------------------------------------------------------------+
                                       │ Operational Impact Gate
                                       ▼
+-----------------------------------------------------------------------------+
| Phase P3: Limited Production Evaluation (Weeks 19–24)                        |
| - Full multi-role lifecycle operational across designated jurisdiction      |
| - Gated learning candidate queue active under human AI Lead curation        |
| - Formal evaluation report generated for leadership decision-making         |
+-----------------------------------------------------------------------------+
```

---

## 3. Phase Details & Governance Controls

### Phase P0: Sandbox Validation (Weeks 1–4)
- **Cohort:** IT Systems Engineers, Security Leads, Pilot Liaison.
- **Data Ingestion:** 500 historical closed cases (anonymized) + 1,000 synthetic multi-lingual attack narratives.
- **Permitted Actions:** System deployment, user provisioning, pipeline load testing, failover drills.
- **Model Output Restrictions:** Internal testing only; zero operational exposure.
- **Success Criteria:** 100% uptime over 14 consecutive days; zero unhandled pipeline exceptions; CPU/GPU inference latency within budget (avg < 1500ms per case).
- **Exit Gate:** Signed technical validation certificate by IT and Security Leads.

### Phase P1: Shadow-Mode Pilot (Weeks 5–10)
- **Cohort:** 3 Senior Technical Analysts (Evaluation Reviewers).
- **Data Ingestion:** Real incoming citizen complaints mirrored via read-only database replica.
- **Permitted Actions:** Analysts review AI predictions against existing manual police dockets.
- **Model Output Restrictions:** Outputs visible *only* in the evaluation portal; live case officers have zero visibility.
- **Success Criteria:** Entity extraction precision $\ge 85\%$; multi-label category classification macro F1 $\ge 88\%$; zero PII data leaks to logs.
- **Exit Gate:** Written audit confirming model outputs did not contaminate live legal investigations.

### Phase P2: Supervised Operational Pilot (Weeks 11–18)
- **Cohort:** 10 Certified Cyber Police Investigators, 3 Cybersecurity Specialists, 1 Unit Administrator.
- **Data Ingestion:** Active complaints filed within the pilot district.
- **Permitted Actions:** Case creation, entity verification, correlation review, evidence graph inspection, legal status updates (`UNDER_INVESTIGATION` to `CLOSED`).
- **Model Output Restrictions:** All AI outputs stamped with mandatory disclaimers (*"Candidate Correlation — Investigator Review Required"*, *"AI-assisted incident priority"*).
- **Success Criteria:** $\ge 25\%$ reduction in manual docket triage time; $\ge 70\%$ investigator acceptance rate on confirmed correlations.
- **Exit Gate:** Zero legal or procedural challenges arising from AI-assisted evidence.

### Phase P3: Limited Production Evaluation (Weeks 19–24)
- **Cohort:** Full pilot station (Citizens in pilot zone, Specialists, Police Officers, Admin, AI Lead).
- **Data Ingestion:** Complete operational intake.
- **Permitted Actions:** Full 5-role lifecycle; feedback gating active; learning candidates staged for curation.
- **Model Output Restrictions:** Continual learning candidates strictly quarantined; zero autonomous retraining.
- **Success Criteria:** Investigator satisfaction score $\ge 80\%$; tamper-evident evidence integrity 100% verified without hash mismatches.
- **Exit Gate:** Final Pilot Evaluation Dossier presented to government / agency leadership.

---

## 4. Operational Boundaries & Safety Protocols

1. **Investigator Precedence Policy:** Any discrepancy between an officer's assessment and a model prediction is resolved automatically in favor of the human officer.
2. **Data Retention & Purging:** All pilot data is stored on encrypted, dedicated storage partitions. Upon pilot completion, non-evidentiary test logs are purged in accordance with departmental data policies.
3. **Incident Escalation:** If a suspected false correlation causes an improper investigation direction, the liaison officer can trigger an immediate system freeze via `ADMIN` override, reverting the case docket to manual handling.
