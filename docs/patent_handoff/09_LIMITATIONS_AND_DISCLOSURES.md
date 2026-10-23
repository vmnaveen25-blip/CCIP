# Patent Attorney Handoff: 09 — Technical Limitations & Prior Disclosures

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Frank Disclosure of Technical Limitations, Dataset Biases, and Empirical Boundaries for Patent Counsel  
**Legal Context:** Compliance with Duty of Candor and Good Faith (e.g. 37 CFR § 1.56)  

---

## 1. Machine Learning Dataset & Benchmark Disclosures

### A. Synthetic and Bootstrap Data Dependence
- Current models were trained and fine-tuned using curated synthetic, augmented, and bootstrap datasets derived from publicly available cybersecurity incident taxonomies (e.g. Indian Cybercrime Reporting Portal guidelines, anti-phishing open corpuses, and synthetic conversational crime narratives).
- **Disclosure:** The models have not yet been trained on live production police departmental datasets due to privacy and security restrictions during the prototype phase. Real-world validation is planned under Phase M.

### B. Cyber NER Out-of-Distribution (OOD) Challenge Performance
The primary token-classification model (`ccip-cyber-ner-v1`, `deberta-v3-base`) exhibits significant performance variance across evaluation splits, documented transparently in `backend/ml_models/cyber_ner/metrics.json`:
- **In-Domain Validation F1:** 87.23% (Entity Micro F1: 93.50%)
- **Held-Out Test F1:** 58.41%
- **Adversarial / OOD Challenge F1:** 3.23%

**Technical Implication for Patent Counsel:**
This empirical boundary highlights the critical necessity and non-obviousness of the **Hybrid Architecture (IC-01)**: pure transformer models collapse on out-of-distribution adversarial cyber phrasings. It is precisely the **deterministic structured-indicator authority** that preserves system utility when the deep neural model fails.

---

## 2. Systems & Architectural Disclosures

### A. Current Prototype Infrastructure vs Production Pilot Target
- **Storage Engine:** The active prototype operates on **SQLite** with Write-Ahead Logging (WAL) enabled and asynchronous access via SQLAlchemy 2.0. While fully persistent across cold restarts, production multi-tenant deployment will transition to **PostgreSQL**.
- **Execution Hardware:** Current benchmarks reflect **single-machine local CPU inference**. Production scale targets GPU acceleration (NVIDIA CUDA / TensorRT) or hardware confidential enclaves (Intel SGX / AMD SEV).
- **Vector Indexing:** Current case similarity matching evaluates vector cosine distances in-memory across active dockets. Scaled deployment requires indexing via approximate nearest neighbors (HNSW / pgvector).

### B. Non-Autonomous Operational Guardrails
- **Human Authority Requirement:** The system is intentionally architected to prevent autonomous law-enforcement execution. All model predictions are advisory. Investigator reviews lock correlation states and graph edges, preventing automated overwrites.
- **Zero Self-Retraining:** The system strictly rejects online autonomous retraining. The `feedback_gate` writes candidate records to a quarantined database table, requiring manual inspection by an `AI_ML_SYSTEM_LEAD` prior to any offline model update.
