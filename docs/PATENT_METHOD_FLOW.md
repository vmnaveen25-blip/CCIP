# Patent Method Flow Specification

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Formal Process Flow Specification for Patent Claim Drafting  
**Disclaimer:** This technical method specification describes candidate process steps for patent drafting. No representation of guaranteed patentability or legal validity is made.

---

## 1. Primary Method Flow (Steps S101 – S119)

```
 [S101: Receive Incident Input]
              │
              ▼
 [S102: Threat Screening & Assistance] ──────► (Optional Branch: Direct Citizen Exit)
              │
              ▼
 [S103: Structured Complaint Ingestion]
              │
              ▼
 [S104: Cryptographic Evidence Sealing]
              │
              ▼
 [S105: Multi-Label Crime Classification]
              │
              ▼
 [S106: Deterministic Indicator Extraction]
              │
              ▼
 [S107: Contextual Transformer Extraction]
              │
              ▼
 [S108: Provenance Merge & Authority Resolution]
              │
              ▼
 [S109: Entity Pair Relation Inference]
              │
              ▼
 [S110: Official Case Docket Activation]
              │
              ▼
 [S111: Incident Urgency Evaluation]
              │
              ▼
 [S112: Dense Semantic Vector Embedding]
              │
              ▼
 [S113: Structured Overlap & Correlation Scoring]
              │
              ▼
 [S114: Evidence Graph Construction & Link Proposal]
              │
              ▼
 [S115: Presentation for Human Review]
              │
              ▼
 [S116: Investigator Disposition & Verdict Locking]
              │
              ▼
 [S117: Five-Gate Feedback Reliability Evaluation] ──► [S117a: Rejection & Archive]
              │ (All 5 Gates Pass)
              ▼
 [S118: Controlled Learning Candidate Quarantining]
              │
              ▼
 [S119: Role-Decoupled MLOps Curation]
```

---

## 2. Step-by-Step Technical Descriptions

### S101 — Receive Cybercrime Complaint Input
Receiving, via an encrypted network interface at a web server tier, an unstructured incident narrative from a reporting user (citizen), the input comprising textual narratives, suspected indicators, and optional media attachments.

### S102 — Perform Preliminary Threat Screening & Explainable Guidance
Optionally processing the unstructured input through a local, sovereign classifier (XGBoost for URLs, Naive Bayes for SMS, Linear Classifier for Email) to determine a threat probability score, returning explainable threat rationales and safety guidance to the user, and automatically serializing extracted threat parameters into a pre-populated complaint data structure.

### S103 — Structured Complaint Ingestion & Record Generation
Persisting the complaint payload into a relational database with a generated human-readable reference number (e.g. `CYBER-2026-XXXX`), assigning an initial canonical state of `SUBMITTED`.

### S104 — Cryptographic Evidence Integrity Sealing
Computing, at the application server upon file receipt, a cryptographic SHA-256 digest of each uploaded evidence file; storing the cryptographic digest, file size, and timestamp in an evidence ledger; and performing dynamic re-hashing upon subsequent retrieval to guarantee a tamper-evident evidence integrity trail.

### S105 — Multi-Label Crime Category Classification
Processing the complaint narrative through a fine-tuned DeBERTa-v3 sequence classification model (`ccip-complaint-classifier-v1`) executing strictly offline (`local_files_only=True`) to predict one or more of 18 cybercrime categories with corresponding confidence scores.

### S106 — Extract Deterministic Structured Cyber Indicators
Executing a programmatic lexical parsing engine comprising regular expressions and checksum algorithms over the complaint text to identify structured indicators including phone numbers, UPI identifiers, bank account numbers, IFSC codes, transaction IDs, and URLs.

### S107 — Extract Contextual Entities via Token-Classification Transformer
Processing the complaint narrative through a fine-tuned DeBERTa-v3 token-classification model (`ccip-cyber-ner-v1`) executing locally on compute processors to generate entity span token predictions across named entities including person names, bank names, and platform names.

### S108 — Merge Entities with Provenance & Enforce Structured Authority
Reconciling token spans between the deterministic indicators (S106) and transformer extractions (S107). Where token spans overlap or conflict:
- The deterministic structured classification is assigned absolute authority.
- The conflicting transformer prediction is suppressed.
- The resulting entities are persisted in a `cyber_entities` relational table annotated with source provenance (`DETERMINISTIC` vs `TRANSFORMER`), extraction timestamp, and model version.

### S109 — Infer Semantic Relations between Extracted Entity Pairs
Forming candidate pairs from the persisted cyber entities, filtering pairs by co-occurrence boundaries, and executing a 6-layer DistilRoBERTa sequence classification model (`ccip-cyber-relation-extraction-v1`) over the paired entity spans within the complaint context to predict one of 9 semantic relationship types (e.g. `USES_ACCOUNT`, `ASSOCIATED_WITH_BANK`) with an inference confidence probability.

### S110 — Create or Activate Official Investigation Case Docket
Invoking an idempotent case activation service by an authorized user having a `CYBERSECURITY_SPECIALIST` role, creating exactly one unique operational case docket linked to the complaint, assigning status `CASE_CREATED`, and transitioning the complaint status to match.

### S111 — Determine Incident Urgency Score
Processing the case summary through a 6-layer DistilRoBERTa incident urgency classifier (`ccip-incident-urgency-v1`) to compute an advisory priority category (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), presenting the advisory score to human investigators with an explicit disclaimer that investigator disposition supersedes model output.

### S112 — Generate Dense Vector Semantic Embeddings
Generating a 384-dimensional dense semantic embedding of the case narrative using an `all-MiniLM-L6-v2` transformer model, and computing cosine distances against historical case vectors within a bounded temporal window to identify semantically proximate historical incidents.

### S113 — Compute Structured Overlap & Cross-Case Correlation Score
Evaluating candidate case pairs identified in S112 by:
- Programmatically calculating exact match counts across structured cyber entities (shared UPIs, phone numbers, bank accounts).
- Formatting a structured cross-case sequence prompt.
- Classifying the prompt through a 6-layer DistilRoBERTa model (`ccip-cross-case-correlation-v1`) to assign a correlation label (`UNRELATED`, `POSSIBLY_RELATED`, `STRONGLY_RELATED`).
- Checking existing database records: if a human investigator has previously reviewed the correlation, retaining the human verdict and suppressing automated status changes.

### S114 — Construct Evidence Graph & Propose Candidate Links
Translating active cases, complaints, entities, and relations into an interactive, force-directed evidence graph:
- Instantiating Case and Entity nodes.
- Generating deterministic edges connecting cases to their extracted entities.
- Generating model-derived edges connecting entity pairs with initial status `UNVERIFIED`.
- Executing a graph proximity link predictor to propose candidate cross-case edges marked as `CANDIDATE_LINK`.

### S115 — Present Synthesized Intelligence for Human Investigation
Rendering the synthesized intelligence—comprising complaint details, extracted entities, relations, urgency scores, similar cases, candidate correlations, and evidence graphs—on an interactive graphical user interface strictly restricted to users possessing verified `CYBERCRIME_POLICE` or `CYBERSECURITY_SPECIALIST` credentials.

### S116 — Record Human Investigator Disposition & Lock Verdict
Receiving an explicit review action from an investigator (confirming, dismissing, or modifying a correlation or graph edge), persisting the human disposition in the relational database, recording an immutable audit event, and locking the disposition such that subsequent automated intelligence refreshes cannot overwrite it.

### S117 — Evaluate Feedback Reliability through Five Deterministic Hard Gates
Upon recording a human review disposition, passing the candidate instance into a deterministic governance evaluation adapter applying five mandatory hard gates:
1. **Confidence Gate:** Prediction confidence $\ge 0.85$.
2. **PII Anonymization Gate:** Confirmation that raw personal identifying data has been sanitized.
3. **Human Review Gate:** Verification of at least one certified investigator disposition.
4. **Prediction Agreement Gate:** Consensus between model prediction and human verdict.
5. **Anti-Drift Gate:** Feature vector distribution within pre-established statistical boundaries.
If any gate fails, the instance is rejected from future training queues (`decision="REJECT_CANDIDATE"`).

### S118 — Queue Approved Feedback into Quarantined Learning Candidates
If all five gates pass, writing a new record into a dedicated `learning_candidates` database table with `decision="APPROVE_CANDIDATE"` and `review_status="PENDING"`. The candidate is quarantined from the active model runtime; automated retraining and autonomous model redeployment are strictly blocked.

### S119 — Role-Decoupled MLOps Curation & Offline Dataset Assembly
Restricting access to the `learning_candidates` queue exclusively to users with the `AI_ML_SYSTEM_LEAD` role, allowing technical leads to inspect gate failure logs, verify data distributions, approve candidates as `CONTROLLED_LEARNING_CANDIDATE`, and export curated datasets for scheduled offline re-evaluation.

---

## 3. Method Variants & Optional Branches

- **Variant A (Direct Ingestion Bypass):** Where a complaint is received via law-enforcement dispatch rather than direct citizen submission, steps S101–S102 are bypassed, and ingestion commences directly at S103.
- **Variant B (Degraded Rules-Only Fallback):** If local transformer model weights are missing or corrupted during S107, S109, S111, or S113, the system automatically falls back to deterministic rule engines (`RULES_ONLY_DEGRADED`) without interrupting the case management state machine.
- **Variant C (Batch Asynchronous Execution):** Steps S105 through S114 execute asynchronously in worker threads or task queues with progressive UI status polling.
