# Patent Attorney Handoff: 03 — Inventive Concepts Summary

**Reference:** Technical Invention Breakdown for Claim Structuring  
**Master Document:** [PATENT_INVENTIVE_CONCEPTS.md](file:///C:/Users/Admin/Desktop/CCIP/docs/PATENT_INVENTIVE_CONCEPTS.md)  

---

## High-Level Summary of Inventive Concepts (IC-01 through IC-09)

### 1. IC-01: Hybrid Cyber NER with Structured-Indicator Authority
- **Technical Problem:** Transformer hallucinations corrupting strict alphanumeric syntax (UPI, accounts, phone numbers) while rules fail on informal conversational context.
- **Novel Combination:** Programmatic regex extractors take deterministic precedence over DeBERTa-v3 token spans; conflicting spans are suppressed in favor of structured syntax.
- **Claim Focus:** Conflict arbitration method and provenance-annotated entity generation.

### 2. IC-02: Multi-Stage Fault-Isolated Intelligence Orchestrator
- **Technical Problem:** Monolithic AI executions crashing operational case workflows upon individual model failure.
- **Novel Combination:** Isolated sequential execution stages with programmatic caching and idempotency checks preventing redundant inference.
- **Claim Focus:** Multi-model pipeline orchestration and transaction isolation.

### 3. IC-03: Multi-Modal Cross-Case Correlation Engine
- **Technical Problem:** Keyword search misses syndicates; pure vector matching produces false links without shared technical infrastructure.
- **Novel Combination:** Tri-layered evaluation: dense vector embeddings (`all-MiniLM-L6-v2`) + exact structured entity overlap + DistilRoBERTa sequence classification.
- **Claim Focus:** Combination of narrative embedding distance with physical indicator co-occurrence.

### 4. IC-04: Evidence Graph Construction with Verdict Locking
- **Technical Problem:** Automatic graph recalculation overwriting human investigator notes and edge dismissals.
- **Novel Combination:** Relational-backed evidence graph where human review states (`CONFIRMED_RELEVANT`, `DISMISSED`) are permanently preserved against subsequent automated rescans.
- **Claim Focus:** Graph generation method preserving human disposition states.

### 5. IC-05: Provenance-Aware Candidate Graph-Link Prediction
- **Technical Problem:** Multi-hop syndicate associations invisible to human investigators.
- **Novel Combination:** Proximity-based candidate edge generation explicitly flagged with `source="LINK_PREDICTOR"` and `review_status="CANDIDATE_LINK"`.
- **Claim Focus:** Automated proposal of multi-hop links with mandatory advisory review gating.

### 6. IC-06: Deterministic Five-Gate Feedback Reliability Filter
- **Technical Problem:** Adversarial data poisoning and catastrophic drift from retraining on operational decisions.
- **Novel Combination:** Programmatic 5-hard-gate filter (Confidence, PII, Human Review, Agreement, Anti-Drift) acting as a non-bypassable pre-condition.
- **Claim Focus:** Programmatic quality gates governing retraining eligibility.

### 7. IC-07: Human-Reviewed Closed-Loop Continual-Learning Pipeline
- **Technical Problem:** The tension between continuous model learning and law-enforcement liability.
- **Novel Combination:** Quarantined `learning_candidates` queue requiring human AI Lead curation; automated self-deployment is architecturally disabled.
- **Claim Focus:** Decoupled governance architecture for staged model retraining.

### 8. IC-08: Sovereign Enclave Multi-Model Execution
- **Technical Problem:** Sovereign data compliance preventing third-party cloud API usage.
- **Novel Combination:** Unified lazy-loading model manager executing 11 heterogeneous models locally with `local_files_only=True`.
- **Claim Focus:** Sovereign enclave execution topology and lazy-load lifecycle.

### 9. IC-09: Citizen Threat Screening Directly Linked to Docket Intake
- **Technical Problem:** Friction between public phishing detection and formal law-enforcement complaint filing.
- **Novel Combination:** Local classifiers provide instant safety advice and automatically serialize extracted threat parameters into pre-filled complaint records.
- **Claim Focus:** Dual-purpose screening and automated docket pre-population.
