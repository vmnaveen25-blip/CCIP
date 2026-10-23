# Patent Attorney Handoff: 01 — Executive Invention Summary

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Recipient:** Patent Attorney / Intellectual Property Counsel  
**Prepared By:** Senior Systems Architect & ML Governance Lead  
**Status:** Advanced Prototype / Pilot Preparation  
**Baseline Git Commit:** `deb533c` ("feat(phase-k): end-to-end intelligence hardening, real prototype validation and demo readiness")  

---

## 1. Invention Title
**System and Method for AI-Assisted Sovereign Cybercrime Intelligence Orchestration, Hybrid Entity Extraction, and Gated Continual Learning Governance**

---

## 2. Field of the Invention
The present disclosure relates generally to data processing, cybersecurity intelligence, and applied machine learning systems, and more specifically to automated cybercrime complaint ingestion, hybrid deterministic-transformer technical indicator extraction, multi-layered cross-case correlation, tamper-evident evidence graph construction, and reliability-gated continual-learning candidate pipelines operating within an offline sovereign enclave.

---

## 3. High-Level Problem Statement
Modern cybercrime investigations suffer from severe operational fragmentation:
1. **Citizen Reporting Disconnect:** Victims lack real-time threat screening tools; by the time an incident is formally reported, technical indicators have expired.
2. **Extraction Failure Modes:** Pure transformer models hallucinate or corrupt strict alphanumeric indicators (UPI IDs, phone numbers, bank accounts), while pure rule systems fail to interpret conversational context or relationships.
3. **Siloed Investigations:** Police departments investigate complaints in isolation, failing to detect inter-jurisdictional cyber syndicates that reuse infrastructure across multiple victims.
4. **Data Sovereignty & Privacy Constraints:** Public-safety data cannot be sent to commercial cloud AI APIs due to national data sovereignty and victim privacy regulations.
5. **The Retraining Dilemma:** Operational law-enforcement decisions are lost to machine learning models, yet autonomous self-learning models risk adversarial data poisoning and catastrophic distribution drift.

---

## 4. Technical Summary of the Invention
The disclosed CCIP / Astraea Enclave platform provides an end-to-end technical system solving these problems through a unified architecture:
- **Offline Sovereign Enclave:** Executes a heterogeneous stack of 11 local machine learning models (transformers, gradient-boosted decision trees, linear classifiers) entirely on local compute with `local_files_only=True` and zero third-party API egress.
- **Dual-Purpose Threat Intake:** A citizen-facing screening assistant (Cyber Shield) analyzes URLs, SMS, and emails, provides explainable safety guidance, and automatically pre-populates structured complaint dockets.
- **Hybrid Cyber NER:** Enforces strict deterministic authority for structured cyber indicators while capturing contextual entities through DeBERTa-v3 token classification, resolving span conflicts in favor of verified syntax.
- **Tri-Layered Cross-Case Correlation:** Evaluates historical case pairs across dense vector semantic embeddings (`all-MiniLM-L6-v2`), deterministic entity overlap counts, and fine-tuned sequence classification (`distilroberta-base`).
- **Evidence Graph with Verdict Preservation:** Automatically builds a force-directed relational evidence network where human investigator review states (`CONFIRMED_RELEVANT`, `DISMISSED`) are permanently locked against automated AI recalculation.
- **Five-Gate Reliability Governance:** Evaluates all operational feedback instances against five deterministic hard gates (Confidence, PII Anonymization, Human Review, Prediction Agreement, Anti-Drift) before staging approved instances into a quarantined `learning_candidates` queue for human AI Lead curation without autonomous retraining.
- **Decoupled Five-Role RBAC:** Enforces strict role boundaries (`CITIZEN`, `CYBERSECURITY_SPECIALIST`, `CYBERCRIME_POLICE`, `ADMIN`, `AI_ML_SYSTEM_LEAD`) ensuring that operational case authority and model governance remain separated.

---

## 5. Scope of Patent Filing Recommendations
Patent counsel is encouraged to explore independent and dependent claim structures covering:
1. The **Method** of hybrid entity extraction with structured-indicator conflict resolution.
2. The **System** comprising the tri-layered cross-case correlation engine.
3. The **Non-Transitory Computer-Readable Medium** embodying the 5-hard-gate feedback reliability filter and quarantined learning candidate pipeline.
4. The **Combination** of pre-incident screening with automated complaint docket configuration and cryptographic evidence sealing.
