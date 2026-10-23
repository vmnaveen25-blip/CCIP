# Patent Attorney Handoff: 04 — Formal Method Flow

**Reference:** Supporting Specification for Method Claims  
**Master Document:** [PATENT_METHOD_FLOW.md](file:///C:/Users/Admin/Desktop/CCIP/docs/PATENT_METHOD_FLOW.md)  

---

## Technical Method Claim Skeleton (Drafting Reference)

A computer-implemented method for cybercrime intelligence orchestration and evidence-linked case management, comprising:

1. **Receiving Incident Input (S101–S103):**
   - Receiving an unstructured cybercrime complaint narrative and optional evidence media from a reporting user.
   - Optionally performing preliminary local threat screening to return explainable safety guidance and pre-fill complaint parameters.
   - Storing the complaint in a relational database with a generated human-readable reference identifier.
2. **Cryptographic Evidence Sealing (S104):**
   - Computing a cryptographic SHA-256 digest of received evidence files.
   - Storing the digest in an evidence ledger to establish a tamper-evident evidence integrity trail.
3. **Hybrid Indicator Extraction & Authority Resolution (S106–S108):**
   - Extracting structured technical indicators using deterministic regular expression and checksum algorithms.
   - Extracting contextual named entities using a fine-tuned token-classification transformer executing locally.
   - Reconciling token spans by enforcing strict authority of deterministic structured indicators over transformer tokens, suppressing conflicting transformer predictions, and persisting verified entities with extraction provenance.
4. **Semantic Relation Inference & Docket Activation (S109–S110):**
   - Pairing persisted entities and executing a sequence classification transformer to infer semantic relationship types with confidence scores.
   - Activating a unique operational case docket linked to the complaint in response to an authorized specialist review.
5. **Urgency Scoring & Cross-Case Correlation (S111–S113):**
   - Computing an advisory incident urgency rating using a multi-class transformer classifier.
   - Generating dense semantic vector embeddings of case narratives and computing nearest neighbors.
   - Computing structured cyber entity overlap counts and classifying concatenated case pairs using a transformer cross-encoder to propose candidate correlations.
6. **Evidence Graph Generation & Link Proposal (S114–S115):**
   - Constructing an interactive evidence graph comprising case nodes, entity nodes, deterministic edges, model-derived relation edges, and candidate cross-case links.
   - Rendering the synthesized intelligence to an authorized investigator via an interactive graphical interface.
7. **Verdict Locking & Gated Learning Governance (S116–S119):**
   - Recording an investigator's review action regarding proposed correlations or edges, and locking the recorded disposition against automated pipeline updates.
   - Passing reviewed instances through a programmatic governance filter enforcing five deterministic hard gates (Confidence, PII Anonymization, Human Review, Prediction Agreement, Anti-Drift).
   - Writing approved instances to a quarantined learning candidate database table accessible solely to an AI Lead role, while strictly preventing automated retraining or autonomous model redeployment.
