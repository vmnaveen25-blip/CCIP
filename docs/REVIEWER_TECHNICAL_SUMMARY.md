# CCIP / Astraea Enclave — Technical Summary for Reviewers

**Document Version:** 1.0.0  
**Phase:** Phase K — End-to-End Intelligence Hardening, Real Prototype Validation & Demo Readiness  
**Target Audience:** Technical Reviewers, MLOps Architects, Law Enforcement Technologists  
**Date:** 2026-09-12  

---

## 1. The Core Problem & Philosophy

Modern cybercrime investigation in India and global jurisdictions faces three critical systemic bottlenecks:
1. **The "Golden Hour" Interdiction Gap:** Victims face long delays between incident occurrence and formal police filing; initial fund freeze opportunities (e.g. 1930 / I4C protocols) are missed because victims cannot immediately assess malicious links, smishing SMS, or fake investment schemes.
2. **Unstructured Narrative Overload:** Cybercrime complaints arrive as informal, noisy human text containing critical indicators (UPI IDs, phone numbers, mule bank accounts, phishing domains, transaction UTRs) buried within conversational prose.
3. **Siloed Investigations & Syndicate Blindness:** Fraud syndicates operate distributed campaigns across state and district boundaries. Isolated police desks investigate single complaints without realizing that an identical UPI ID or phone number was used in 20 complaints across other jurisdictions.

### CCIP Architectural Answer: The Sovereign Enclave Philosophy
CCIP (**Citizen Cybercrime Interdiction Platform**) / Astraea Enclave is an offline-capable, sovereign intelligence platform combining **deterministic cryptographic and indicator extraction authority** with **targeted, local neural machine learning**.

**Core Philosophy:**
- **Deterministic indicators overrule probabilistic ML.** When regex extracts an authoritative URL or UPI, neural models cannot hallucinate or discard it.
- **Human-in-the-loop decision making.** AI assists with triage, clustering, and correlation signals, but **never exercises autonomous enforcement, automated police dispatch, or unsupervised model retraining**.
- **100% Offline Local Inference.** Zero evidence, complaint text, or citizen data leaves the sovereign runtime. No third-party LLM APIs are called.

---

## 2. Five Strict Operational Roles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CCIP USER ROLES                                 │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ CITIZEN           │ Pre-incident threat screening (Citizen Cyber Shield),   │
│                   │ complaint filing, SHA-256 evidence integrity tracking   │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ CYBERSECURITY     │ Forensic intake, Hybrid Cyber NER, Relation Extraction, │
│ SPECIALIST        │ complaint triage, Case creation, Urgency advisory review│
├───────────────────┼─────────────────────────────────────────────────────────┤
│ CYBERCRIME POLICE │ Investigation, Cross-case syndicate correlation,        │
│                   │ Evidence Graph review, Authoritative Case Lifecycle     │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ ADMIN             │ Platform health monitoring, user account governance,    │
│                   │ Case reopening with mandatory audit justification       │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ AI/ML SYSTEM LEAD │ Truthful model registry inspection, Feedback Gate       │
│                   │ qualification, Curated learning dataset governance      │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 3. The 12-Model Machine Learning Stack

All models run offline on local CPU (`local_files_only=True`):

1. **URL Phishing Classifier** (`XGBClassifier`, 30 features): Detects fraudulent banking and investment domains on Citizen Cyber Shield.
2. **SMS Spam / Smishing Classifier** (`DistilBERT`): Classifies smishing texts, lottery scams, and urgent banking alerts.
3. **Email Threat Classifier** (`DistilBERT`): Detects spear-phishing, credential harvesting, and spoofed netbanking notices.
4. **Complaint Multi-Label Classifier** (`DeBERTa-v3`): Automatically tags incoming complaints into cybercrime categories (Financial Fraud, Extortion, Identity Theft, etc.).
5. **Hybrid Cyber NER Engine** (`DeBERTa-v3` Token Classifier + Sovereign Regex): Extracts structured indicators (UPI, phone, domain, IP, IFSC, crypto) deterministically, augmented by transformer entity tagging for person names and bank names.
6. **Cyber Relation Extractor** (`distilroberta-base`, 9 classes): Predicts relationships between extracted entity pairs (`TRANSFERRED_TO`, `IMPERSONATES`, `USES_ACCOUNT`, etc.).
7. **Incident Urgency Scorer** (`distilroberta-base`, 4 classes): Evaluates ongoing narrative financial threat (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) as an advisory triage signal.
8. **Case Semantic Similarity** (`all-MiniLM-L6-v2`, 384-dim embeddings): Computes cosine similarity between case narratives with threshold 0.55.
9. **Cross-Case Correlation Engine** (`distilroberta-base`): Evaluates pairwise case texts combined with shared indicator vectors to surface candidate syndicate connections.
10. **Evidence Graph Link Predictor** (`PyTorch MLP`, 80-dim): Predicts candidate links between unlinked graph nodes.
11. **Feedback Reliability Gate** (`PyTorch MLP`, 17-dim + 5 Hard Gates): Enforces deterministic hard gates and neural scoring to qualify reviewed cases for curated dataset queues.
12. **Investigation Assistant / Citizen Cyber Shield Router**: Directs citizen inputs to the appropriate threat model and provides structured golden-hour checklists.

---

## 4. Key Differentiators

1. **Hybrid Provenance Tracking:**
   Every extracted cyber entity explicitly carries its provenance: `DETERMINISTIC`, `TRANSFORMER`, or `HYBRID_MERGED`.
2. **Cryptographic Evidence Sealing:**
   Uploaded evidence files are hashed with SHA-256 upon stream reception. The hash is sealed in the relational store and verified against storage, ensuring tamper evidence.
3. **Zero Continuous Learning Contamination:**
   CCIP does **not** implement autonomous online retraining. Candidate data must pass 5 deterministic legal and audit hard gates, followed by explicit approval by the AI/ML System Lead for offline evaluation dataset curation.
4. **Mandatory Non-Accusatory Semantics:**
   Outputs explicitly warn investigators: *"AI candidate correlation — semantic similarity does not establish a common offender. Investigator review required."*

---

## 5. Honest Current Prototype Limitations

- **Cyber NER Domain Shift:** The neural token classifier exhibits lower recall on novel, unstandardized Indian slang or code-mixed Hinglish phrases; deterministic indicator regex rules provide the primary safety net.
- **CPU Inference Overhead:** URL lexical feature extraction takes ~1.2s on CPU; full multi-stage case refresh requires ~2.0s. It operates near-real-time but is not sub-millisecond.
- **Single Enclave Sandbox:** The current prototype uses local storage and SQLite/in-memory PostgreSQL emulation; production law enforcement deployment requires clustered deployment with hardware security modules (HSM).
