# Astraea Enclave (CCIP) — One-Page Executive Summary

**Product:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP)  
**System Codename:** Astraea Enclave  
**Current Maturity:** Advanced Prototype / Pilot Preparation  
**Verified Baseline:** 137 / 137 Tests Passing, 0 Errors TypeScript Build, 100% Offline  

---

### The Problem
Cybercrime complaints are surging globally, but public reporting systems remain passive, disconnected dropboxes. Citizens receive no immediate guidance; technical indicators (UPI IDs, mule accounts, phone numbers) are manually transcribed; and police departments investigate complaints in isolation—failing to discover multi-jurisdictional fraud syndicates that reuse criminal infrastructure across thousands of victims. Crucially, public safety agencies cannot use commercial cloud AI APIs due to national data sovereignty and victim privacy regulations.

### The Solution
**Astraea Enclave** is an on-premise, sovereign cybercrime intelligence platform that bridges citizen intake and law-enforcement investigation. Operating 100% offline within a secure local enclave, it ingests conversational citizen reports, extracts technical cyber indicators using hybrid deterministic-transformer NER, links multi-case syndicates via tri-layered correlation, visualizes crime networks through interactive evidence graphs, and feeds vetted operational outcomes into a reliability-gated continual-learning queue.

### Who Uses It (Five Decoupled User Roles)
1. **Citizen:** Runs pre-incident threat checks on suspicious URLs/messages via Cyber Shield; files structured complaints; tracks case progress.
2. **Cybersecurity Specialist:** Evaluates technical indicators; executes Hybrid NER and Relation Extraction; activates official case dockets.
3. **Cybercrime Police:** Investigates assigned dockets; discovers cross-case correlations; reviews evidence graphs; advances legal case statuses to resolution.
4. **Platform Administrator:** Audits system diagnostics; manages users; reopens closed dockets with mandatory justification.
5. **AI/ML System Lead:** Inspects model registry metrics; monitors drift; curates the quarantined continual-learning candidate queue.

### Core Architecture & Key Differentiators
- **100% Offline Sovereign Inference:** 11 local models (transformers, XGBoost, Naive Bayes) execute with `local_files_only=True`—zero cloud egress.
- **Hybrid Cyber NER with Structured Authority:** Deterministic regex extractors strictly supersede transformer predictions, eliminating alphanumeric hallucinations in financial routing numbers while capturing informal context.
- **Tri-Layered Cross-Case Correlation:** Combines dense semantic vector embeddings (`all-MiniLM-L6`), exact entity overlap, and deep sequence classification (`distilroberta-base`) to identify syndicated campaigns.
- **Tamper-Evident Evidence Integrity:** Server-side SHA-256 cryptographic digests verify evidence files dynamically upon upload and download.
- **Immutable Investigator Verdict Locking:** Automated AI intelligence rescans are architecturally barred from overwriting recorded human findings.
- **Deterministic 5-Gate Continual Learning:** Operational decisions pass 5 programmatic quality gates into a quarantined queue under human AI Lead curation; automated self-deployment is strictly disabled.

### Current Validation & Empirical Metrics
- **Automated Verification:** 137 / 137 backend tests passing; 100% data persistence verified across cold restarts.
- **CPU Performance:** Average case intelligence refresh in 2.8s on standard multi-core CPU.
- **Zero Mock Data:** 100% of frontend views render real SQLite/SQLAlchemy data.
- **Transparent Baselines:** Cyber NER achieves 87.23% in-domain validation F1, with out-of-distribution challenge limitations fully documented to guide real-world pilot acquisition.

### Current Stage & Next Milestone
- **Current Status:** Advanced Prototype / Pilot Preparation (TRL 5–6 Equivalent).
- **Next Milestone (Phase M):** Supervised operational pilot in 1–2 designated cyber cells using de-identified real-world datasets to harden out-of-distribution entity extraction and calibrate correlation thresholds.
