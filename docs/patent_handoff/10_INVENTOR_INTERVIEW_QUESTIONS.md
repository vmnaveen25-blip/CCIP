# Patent Attorney Handoff: 10 — Inventor Interview Questionnaire

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Structured Technical Questionnaire for Patent Attorney / Agent Pre-Filing Interview  

---

## Technical Clarification Guide for Patent Counsel

This questionnaire is designed to guide the patent practitioner’s interview with the system inventors, focusing on technical hurdles, unexpected results, and essential vs optional elements.

---

### Section 1: Technical Difficulties & Engineering Hurdles
1. **What was the hardest technical challenge in making the hybrid entity extractor work reliably?**
   *Inventor Context:* Standard NER models struggle with Indian payment formats (e.g. `merchant@upi`) and multi-token alphanumeric identifiers. When tokenizers split these strings across subwords (e.g. `mer`, `##chant`, `@`, `up`, `##i`), boundaries break. Reconciling byte-level regex spans with token-level DeBERTa predictions required custom span alignment and strict priority rules.
2. **Why could you not simply use an off-the-shelf SIEM or police RMS system?**
   *Inventor Context:* SIEMs expect structured machine logs (syslog/JSON); they completely fail on conversational, informal citizen complaints written in colloquial language. Police RMS systems are static relational databases without active machine learning, correlation engines, or interactive evidence graph generation.
3. **What happens if a transformer model experiences latency spikes or crashes during an intelligence refresh?**
   *Inventor Context:* A monolithic execution would crash the entire request. We designed the `IntelligenceOrchestrator` with stage-isolated `try/except` blocks and database caching so that an urgency or correlation failure does not block case creation or entity storage.

---

### Section 2: Intentional Combinations & Synergies
4. **Why combine dense vector similarity with exact entity overlap and sequence classification in cross-case correlation?**
   *Inventor Context:* Pure vector similarity flags any two investment scams as related, causing severe false positives. Pure entity matching misses syndicates using new burner phones or accounts. Combining vector proximity + physical indicator overlap + cross-encoder sequence classification filters out noise while catching coordinated campaigns.
5. **Why is the Feedback Gate designed with 5 deterministic hard gates instead of another ML classifier?**
   *Inventor Context:* Using an ML model to judge whether data is good enough to train ML models creates a self-reinforcing bias loop. Deterministic gates (confidence thresholds, PII sanitization checks, consensus rules, statistical drift bounds) provide an objective, tamper-proof quality barrier.

---

### Section 3: Essential vs Optional Features (Claim Broadening)
6. **Which components are absolutely essential to the core invention?**
   *Essential Elements:*
   - Ingestion of unstructured cyber incident narratives.
   - Dual-stage extraction enforcing structured deterministic indicator authority over transformer tokens.
   - Cross-case linkage combining semantic proximity with structured entity evidence.
   - Human review locking against automated AI recalculation.
7. **Which components are optional implementation features that can be relegated to dependent claims?**
   *Optional / Dependent Elements:*
   - Pre-incident citizen threat screening and complaint pre-filling.
   - Specific model architectures (`deberta-v3`, `distilroberta-base`, `all-MiniLM-L6-v2`).
   - SQLite relational storage (can be PostgreSQL, Neo4j, etc.).
   - Five specific role definitions (can be generalized to reporting user, triage analyst, and lead investigator).
   - Candidate graph link prediction.

---

### Section 4: Anticipated Competitor Workarounds & Alternative Embodiments
8. **How might a competitor attempt to bypass the Hybrid NER claims?**
   *Alternative:* A competitor might use a large multimodal LLM (e.g. GPT-4) with prompt engineering instead of local token classification.
   *Counsel Advice:* Ensure claims recite "extracting candidate entity spans via a neural network and resolving span conflicts using predetermined structured indicator rules," regardless of whether the neural network is an encoder or generative model.
9. **How might a competitor implement the Evidence Graph without infringing?**
   *Alternative:* Using a standalone external graph database (Neo4j) with Cypher queries.
   *Counsel Advice:* Draft claims to recite constructing a graph data structure representing cases, entities, and relations, wherein edges store provenance and human review status, independent of whether the underlying storage engine is relational or a native property graph.
