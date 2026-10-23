# Data Governance & Privacy Management Plan

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Data Protection, PII Minimization, and Information Lifecycle Governance  
**Compliance Disclaimer:** This plan outlines architectural and technical data protection controls. It does not constitute formal legal counsel and *requires comprehensive legal/privacy review before deployment* under applicable national and regional data privacy legislation (e.g. India DPDP Act 2023, GDPR, or relevant state public-records acts).

---

## 1. Data Classification Taxonomy

| Sensitivity Level | Data Categories | Examples | Storage Location | Access Controls |
|---|---|---|---|---|
| **Level 4: Critical PII** | Complainant personal identities, national IDs, passwords, plain-text OTPs | Aadhar / PAN numbers, citizen home addresses, login passwords | `users`, `complaints` (encrypted / hashed) | Restricted to Complainant and Assigned Investigator (`CITIZEN`, `CYBERCRIME_POLICE`). |
| **Level 3: Evidentiary Media** | Bank statements, transaction receipts, chat transcripts, media files | PDF statements, screenshot images, audio clips | Local Enclave Vault / Private Object Store | Cryptographically sealed via SHA-256; accessible only by case team. |
| **Level 2: Technical Indicators** | Cyber indicators, attacker identifiers, domain names, mule accounts | UPI IDs, phone numbers, email addresses, IP addresses | `cyber_entities`, `evidence_graph_nodes` | Accessible by `CYBERSECURITY_SPECIALIST`, `CYBERCRIME_POLICE`, `ADMIN`. |
| **Level 1: Operational Metadata** | Case numbers, timestamps, status transitions, model versions | Reference numbers, audit timestamps, model metrics | `cases`, `audit_logs`, `model_registry` | System-wide access based on RBAC permissions. |

---

## 2. Technical Data Protection & PII Minimization

### A. Strict Data Minimization at Ingestion
- Only data elements strictly required for criminal investigation are solicited during complaint filing.
- Passwords, debit card CVV codes, and sensitive personal health information are strictly excluded via frontend validation warnings.

### B. Two-Tier Storage Architecture & Cryptographic Sealing
- All uploaded evidence is stored separately from transactional database records.
- Server-side SHA-256 digests are computed dynamically upon upload and checked dynamically on read requests.
- Direct filesystem path references are hidden behind UUID-mapped endpoints (`/api/v1/evidence/{evidence_id}/download`), mitigating Insecure Direct Object References (IDOR).

### C. Offline Inference Isolation (Zero Cloud Telemetry)
- All 11 machine learning models execute locally inside the enclave using `local_files_only=True`.
- Complaint descriptions, victim details, and evidence attachments are **never transmitted to external cloud AI APIs, third-party analytics trackers, or public logging endpoints**.

---

## 3. Access Boundaries & Role-Based Enforcement (RBAC)

1. **Citizen Ownership Isolation:** Citizens can only query complaints matching their verified `citizen_id` or authenticated email. Cross-citizen docket enumeration returns HTTP 404/403.
2. **Specialist Triage Scope:** Cybersecurity Specialists can inspect technical indicators and complaints to perform triage, but cannot alter police legal statuses (`LAW_ENFORCEMENT_DISPATCHED`, `RESOLVED`, `CLOSED`).
3. **Police Investigation Scope:** Cybercrime Police Officers have full operational command over assigned cases, but cannot register, deploy, or alter AI model weights.
4. **AI Lead Governance Boundary:** AI Leads inspect model registry cards, drift events, and learning candidate queues, but are strictly read-only regarding operational case files.
5. **Admin Override Audit:** Case reopenings by Administrators mandate recorded justifications and generate immutable audit events.

---

## 4. Lifecycle Retention, Deletion, and Training Data Quarantining

### A. Retention and Statutory Archival
- Active investigation dockets are retained throughout the active statutory period.
- Resolved and closed dockets transition to cold archival partitions after 180 days.
- Inactive temporary upload caches are purged on a 24-hour automated cycle.

### B. Right to Erasure / Rectification Protocols
- Citizens may request complaint withdrawal or data rectification prior to case docket activation (`DRAFT` or `SUBMITTED` state).
- Once a complaint is activated into an official criminal investigation docket (`CASE_CREATED`), statutory criminal procedure rules supersede individual erasure requests, requiring formal administrative authorization.

### C. Quarantining of Continual-Learning Data
- Operational data **never flows automatically into training datasets**.
- Operational decisions must pass the 5 deterministic hard gates (including explicit PII anonymization) before landing in the `learning_candidates` table.
- Learning candidates remain in an inactive `PENDING` state until curated by an authorized AI Lead.
- Models are trained exclusively on de-identified, pseudonymized offline datasets with certified data lineage.

---

## 5. Security Incident & Data Breach Response Protocol

1. **Immediate Quarantine:** If an unauthorized data access attempt or integrity seal mismatch is detected, the affected evidence file or docket is immediately locked.
2. **Forensic Audit Examination:** Automated query of the `audit_logs` table identifies all user sessions interacting with the compromised resource within the preceding 72 hours.
3. **Regulatory Notification:** Formal notification to the relevant Data Protection Authority within statutory windows (e.g. 72 hours under DPDP / GDPR guidelines), following formal departmental legal review.
