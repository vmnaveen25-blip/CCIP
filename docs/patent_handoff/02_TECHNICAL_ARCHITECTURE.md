# Patent Attorney Handoff: 02 — Technical Architecture

**Reference:** Supporting Document for Patent Application Drafting  
**Source Baseline:** [PHASE_L_PRODUCT_ARCHITECTURE.md](file:///C:/Users/Admin/Desktop/CCIP/docs/PHASE_L_PRODUCT_ARCHITECTURE.md)  
**System Title:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  

---

## 1. System Structural Overview

The system comprises three physical and logical computing tiers executing within an air-gapped or private sovereign enclave:

```
+-----------------------------------------------------------------------------------+
| 1. Client Presentation Tier                                                       |
|    Single Page Application (SPA) providing role-specific dashboards:              |
|    - Citizen Portal & Pre-Incident Threat Screening Assistant                     |
|    - Cybersecurity Specialist Technical Triage Workbench                          |
|    - Cybercrime Police Docket Command & Interactive Graph Canvas                  |
|    - Administrative Platform Integrity & Reopen Oversight Dashboard              |
|    - AI/ML System Lead MLOps Model Registry & Governance Hub                      |
+-----------------------------------------------------------------------------------+
                                         │ HTTPS / Bearer JWT
                                         ▼
+-----------------------------------------------------------------------------------+
| 2. Server Application & Orchestration Tier                                        |
|    FastAPI Asynchronous Web Framework:                                            |
|    - Role-Based Access Control (RBAC) Dependency Interceptors                     |
|    - State Machine Engine enforcing canonical linear transitions                  |
|    - Intelligence Orchestrator managing fault-isolated execution stages           |
|    - Cryptographic Storage Service computing SHA-256 evidence digests             |
|    - Audit Service writing immutable operational logs                             |
+-----------------------------------------------------------------------------------+
                  │                                               │
                  ▼                                               ▼
+------------------------------------+   +------------------------------------------+
| 3A. Relational Data Tier           |   | 3B. Local Intelligence Engine Tier       |
|     SQLAlchemy ORM (Async):        |   |     Zero Cloud Egress (local_files_only) |
|     - complaints, cases, users     |   |     - Complaint Classifier (DeBERTa-v3)  |
|     - cyber_entities               |   |     - Hybrid Cyber NER (DeBERTa-v3+Rules)|
|     - cyber_entity_relations       |   |     - Relation Extractor (DistilRoBERTa) |
|     - case_correlations            |   |     - Incident Urgency (DistilRoBERTa)   |
|     - evidence_graph_nodes/edges   |   |     - Case Similarity (all-MiniLM-L6)    |
|     - learning_candidates          |   |     - Cross-Case Correlator (DistilRoBERT|
|     - audit_logs, evidence         |   |     - Citizen Threat Classifiers         |
|                                    |   |     - 5-Gate Feedback Filter Adapter     |
+------------------------------------+   +------------------------------------------+
```

---

## 2. Hardware and Network Boundaries
- **No External Cloud AI APIs:** All neural network weights, tokenizers, and configuration files reside on the local persistent filesystem (`backend/ml_models/`).
- **Cryptographic Evidence Sealing:** Files uploaded by users are received in-memory, hashed immediately using SHA-256, and written to disk with hash validation. The computed hash is stored in `evidence.sha256_hash` and dynamically re-verified upon download.
- **Strict Role Decoupling:** Authentication tokens encode cryptographic claims mapping to one of five discrete roles. Routes in `backend/app/api/` enforce permission checks via FastAPI dependencies (`require_staff`, `require_admin`, `require_aiml`), strictly isolating operational case management from model governance.
