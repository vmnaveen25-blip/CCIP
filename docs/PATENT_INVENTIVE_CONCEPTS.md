# Technical Inventive Concepts Analysis

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Patent Preparation & Technical Invention Analysis  
**Disclaimer:** This document is prepared for patent attorney review and does not constitute a legal opinion on patentability or guarantee that any patent will be granted. All items represent potential inventive concepts and candidate claim elements subject to professional prior-art search.

---

## Overview of Potential Inventive Concepts

| ID | Title | Core Technical Mechanism | Implementation Evidence |
|---|---|---|---|
| **IC-01** | Hybrid Deterministic-Transformer Cyber Entity Extraction | Regex structured authority + DeBERTa contextual token extraction | `backend/app/services/entity_service.py` |
| **IC-02** | Multi-Stage Complaint-to-Investigation Intelligence Orchestration | Fault-isolated sequential pipeline with idempotency caching | `backend/app/services/intelligence_orchestrator.py` |
| **IC-03** | Multi-Modal Cross-Case Intelligence Correlation | Dense embedding similarity + exact entity overlap + DistilRoBERTa sequence classifier | `backend/app/services/cross_case_correlation_service.py` |
| **IC-04** | Dynamic Evidence Graph Construction with Verdict Preservation | Unified relational graph engine with immutable investigator review states | `backend/app/services/evidence_graph_service.py` |
| **IC-05** | Provenance-Aware Candidate Graph-Link Prediction | Graph connectivity inference linking unassociated entities across cases | `backend/app/ai/adapters/evidence_graph_link.py` |
| **IC-06** | Deterministic Multi-Gate Feedback Reliability Governance | 5-hard-gate programmatic filtering for training eligibility | `backend/app/ai/adapters/feedback_gate.py` |
| **IC-07** | Closed-Loop Investigator Review to Continual-Learning Candidate Queue | Human case disposition feeding gated candidate database records | `backend/app/services/feedback_gate_service.py` |
| **IC-08** | Offline Sovereign Enclave Multi-Model Intelligence Execution | Zero-egress local transformer inference stack (`local_files_only=True`) | `backend/app/ai/model_manager.py` |
| **IC-09** | Citizen Threat Screening Tied Directly to Structured Complaint Ingestion | Dual-purpose threat analysis that pre-populates official complaint dockets | `backend/app/services/citizen_assistant_service.py` |

---

## Detailed Inventive Concept Decompositions

### IC-01: Hybrid Deterministic + Transformer Cyber Entity Extraction with Structured-Indicator Authority

- **Problem Solved:** Pure transformer models frequently hallucinate or misalign strict alphanumeric syntax (e.g. Indian UPI IDs `user@bank`, 10-digit telephone numbers, 16-digit bank cards), whereas pure regex engines fail on informal narrative context (e.g. distinguishing an attacker's name from a victim's name or identifying bank names mentioned casually).
- **Technical Mechanism:** A dual-stage extraction pipeline where deterministic regular expression extractors first scan text for strict cyber indicators. Simultaneously, a DeBERTa-v3 token-classification model evaluates contextual entities. A merge engine reconciles spans: when spans overlap or conflict, structured deterministic indicators are assigned absolute authority and override transformer predictions.
- **Inputs:** Unstructured incident narrative string (title, description, suspect notes).
- **Processing Steps:**
  1. Execute deterministic regex extractors for `PHONE_NUMBER`, `UPI_ID`, `BANK_ACCOUNT`, `TRANSACTION_ID`, `URL`.
  2. Compute SHA-256 span boundaries and normalized indicator strings.
  3. Execute DeBERTa-v3 token classification for `PERSON_NAME`, `BANK_NAME`, `PLATFORM_NAME`, `ORGANIZATION`.
  4. Perform span conflict resolution: if a span is claimed by both, the deterministic type wins and the transformer span is suppressed.
  5. Assign entity source metadata (`source_type="DETERMINISTIC"` vs `source_type="TRANSFORMER"`).
- **Outputs:** Unified list of `CyberEntity` records with normalized values, confidence scores, and provenance.
- **Dependencies:** Regex indicator definitions, DeBERTa-v3 token classification weights.
- **Technical Advantage:** Prevents malformed syntax from polluting case dockets while retaining context extraction.
- **Implementation Evidence:** `backend/app/services/entity_service.py`, `backend/app/ai/adapters/cyber_ner_transformer.py`, `backend/tests/test_hybrid_cyber_ner.py`.
- **Alternative Embodiments:** Replacing regex with Deterministic Finite Automata (DFA) or formal grammar parsers; replacing DeBERTa-v3 with RoBERTa or modern token-classification architectures.
- **Potential Novelty-Risk Notes:** Hybrid NER is known in medical and general NLP; novelty focus should be on the domain-specific precedence rules, strict indicator normalization, and down-stream graph ingestion.

---

### IC-02: Multi-Stage Complaint-to-Investigation Intelligence Orchestration

- **Problem Solved:** Running deep neural models in a monolithic transaction risks cascading failures, high request latencies, and redundant GPU/CPU resource consumption on identical inputs.
- **Technical Mechanism:** A multi-stage, fault-isolated pipeline coordinating Entity Extraction, Relation Extraction, Incident Urgency, Case Similarity, Cross-Case Correlation, and Evidence Graph Construction. Each stage runs in an isolated `try/except` boundary. Idempotency checks evaluate pre-existing database records to reuse cached predictions unless `force_refresh=True` is explicitly specified.
- **Inputs:** `case_id` string, database session, `force_refresh` boolean flag.
- **Processing Steps:**
  1. Verify case and linked complaint existence.
  2. Stage 1 (Entities): Check existing entities; extract only if empty or forced.
  3. Stage 2 (Relations): Check existing relations; pair candidates and run DistilRoBERTa only on non-cached sets.
  4. Stage 3 (Urgency): Evaluate multi-class severity using DistilRoBERTa.
  5. Stage 4 (Similarity): Generate dense vector embeddings and query top-K nearest cases.
  6. Stage 5 (Correlation): Detect shared entities and run narrative cross-case classification.
  7. Stage 6 (Evidence Graph): Build nodes and edges, persisting graph state.
- **Outputs:** Comprehensive JSON orchestration response detailing stage execution statuses, cache hit indicators, and metrics.
- **Dependencies:** Underlying model adapters and relational models.
- **Technical Advantage:** Fault isolation ensures that an out-of-memory or model error in one stage does not crash the operational case management workflow.
- **Implementation Evidence:** `backend/app/services/intelligence_orchestrator.py`, `backend/tests/test_intelligence_idempotency.py`.
- **Alternative Embodiments:** Asynchronous message queue (Celery/RabbitMQ/Kafka) background execution with event-driven completion callbacks.
- **Potential Novelty-Risk Notes:** Pipeline orchestration is common in software engineering; claim scope should focus on the specific sequence of cybercrime extraction, relational persistence, and fault-isolated intelligence refresh.

---

### IC-03: Cross-Case Intelligence Combining Semantic Similarity with Structured Cyber Entities and Relation Evidence

- **Problem Solved:** Traditional case management tools rely on keyword searches, missing syndicates operating with altered phrasing, while vector-only systems produce false positives without shared technical infrastructure.
- **Technical Mechanism:** A multi-layered correlation architecture that combines:
  1. Dense vector semantic similarity via `all-MiniLM-L6-v2` embeddings (384-dimensional cosine distance).
  2. Deterministic structured entity overlap count (matching UPIs, bank accounts, or phone numbers).
  3. Deep sequence classification using a 6-layer DistilRoBERTa model fine-tuned to classify case pairs into `UNRELATED`, `POSSIBLY_RELATED`, or `STRONGLY_RELATED`.
- **Inputs:** Target `case_id`, candidate historical cases within a bounded temporal window (max 20 candidates).
- **Processing Steps:**
  1. Query active operational cases in reverse chronological order.
  2. Compute shared cyber entities between candidate pairs.
  3. Generate narrative pair representation: `Case A: [Summary] [Entities] </s></s> Case B: [Summary] [Entities]`.
  4. Predict correlation probability and label using DistilRoBERTa.
  5. Check existing human review state: if an investigator has previously reviewed the pair (`status != 'UNREVIEWED'`), preserve the investigator's status.
- **Outputs:** Persisted `CaseCorrelation` records with similarity score, shared entity list, ML confidence, and human review status.
- **Dependencies:** Relational database, SentenceTransformer, DistilRoBERTa weights.
- **Technical Advantage:** Drastically reduces false correlations by requiring both semantic narrative alignment and structured entity evidence.
- **Implementation Evidence:** `backend/app/services/cross_case_correlation_service.py`, `backend/app/ai/adapters/cross_case_correlation.py`.
- **Alternative Embodiments:** Graph neural network (GNN) link prediction over a multi-case knowledge graph; weighted mathematical fusion ensemble.
- **Potential Novelty-Risk Notes:** Multi-modal fusion is an active field; novelty relies on the synergistic interaction of structured cyber entity overlap, sentence embeddings, transformer classification, and verdict preservation.

---

### IC-04: Evidence Graph Construction with Investigator Review Preservation

- **Problem Solved:** Visualizing complex cybercrime networks typically requires manual diagramming or external intelligence platforms that disconnect from primary operational evidence and overwrite officer notes during updates.
- **Technical Mechanism:** An automated graph construction engine translating complaints, extracted entities, predicted relations, and cross-case links into a force-directed relational graph stored in SQLite/SQLAlchemy. When human officers verify or dismiss edges, the engine assigns immutable review states (`review_status='VERIFIED'` or `'DISMISSED'`) that subsequent automated graph builds are architecturally prevented from modifying.
- **Inputs:** `case_id` string, operational database entities and relations.
- **Processing Steps:**
  1. Generate root Case node.
  2. Generate nodes for each extracted `CyberEntity` (`UPI_ID`, `BANK_ACCOUNT`, `PHONE_NUMBER`, etc.).
  3. Create directed edges from Case to each Entity (`source="DETERMINISTIC"`).
  4. Create edges between entities based on predicted relations (`source="RELATION_MODEL"`), initialized with `review_status="UNVERIFIED"`.
  5. On graph refresh, detect existing edges: update confidence if unreviewed, but preserve `review_status` if already set by an investigator.
- **Outputs:** Directed graph object with typed nodes and provenance-annotated edges.
- **Dependencies:** Relational database tables (`evidence_graph_nodes`, `evidence_graph_edges`).
- **Technical Advantage:** Preserves investigative labor across system updates; guarantees that automated AI rescans do not erase human findings.
- **Implementation Evidence:** `backend/app/services/evidence_graph_service.py`, `backend/tests/test_evidence_graph_integrity.py`.
- **Alternative Embodiments:** Property graph database deployment (Neo4j, AWS Neptune) utilizing Cypher query semantics.
- **Potential Novelty-Risk Notes:** Graph visualization is widely used; claim must emphasize the programmatic linkage between ML-derived relation confidence and the immutable human review preservation state.

---

### IC-05: Provenance-Aware Candidate Graph-Link Prediction

- **Problem Solved:** Investigators struggle to identify indirect associations between disparate cases (e.g. Case A shares an IP with Case B, which shares a bank account with Case C).
- **Technical Mechanism:** A link prediction module operating on the evidence graph that evaluates structural graph proximity, entity co-occurrence, and cross-case similarity to propose candidate edges. Every candidate edge explicitly preserves provenance metadata, model version, and confidence score, requiring manual investigator validation before being incorporated into official court dockets.
- **Inputs:** Subgraph representations of active cases.
- **Processing Steps:**
  1. Traverse 2-hop and 3-hop neighbor paths between unlinked entity nodes.
  2. Compute path weight and common-neighbor jaccard similarity.
  3. If score exceeds threshold ($\ge 0.70$), instantiate a candidate edge.
  4. Flag edge with `source="LINK_PREDICTOR"` and `review_status="CANDIDATE_LINK"`.
- **Outputs:** Proposed candidate edges for interactive officer review.
- **Dependencies:** `evidence_graph_link` adapter, relational graph tables.
- **Technical Advantage:** Surfacing hidden multi-hop fraud syndicate connections without manual traversal.
- **Implementation Evidence:** `backend/app/ai/adapters/evidence_graph_link.py`.
- **Alternative Embodiments:** Node2Vec or Graph Convolutional Networks (GCN) embedding link predictors.
- **Potential Novelty-Risk Notes:** Graph link prediction algorithms are established; technical novelty lies in the provenance-flagged, advisory-only integration with law-enforcement investigation dockets.

---

### IC-06: Deterministic Multi-Gate Feedback Reliability Governance

- **Problem Solved:** Automatically retraining ML models on unverified operational feedback causes catastrophic forgetting, model drift, and adversarial data poisoning.
- **Technical Mechanism:** A strict programmatic gating system that evaluates any proposed model feedback instance against five non-bypassable deterministic criteria before granting "learning candidate" status.
- **The 5 Hard Deterministic Gates:**
  1. **Confidence Threshold Gate:** ML model prediction confidence must satisfy minimum bounds ($\ge 0.85$).
  2. **Data Privacy / PII Anonymization Gate:** Payload must not contain unredacted raw personal identifying information.
  3. **Human Review Gate:** Must be explicitly affirmed by at least one certified investigator or specialist.
  4. **Prediction Agreement Gate:** Model prediction and human disposition must reach semantic consensus.
  5. **Anti-Drift Boundary Gate:** Input feature distribution must remain within bounded statistical limits compared to the baseline training distribution.
- **Inputs:** Candidate payload, model metadata, human review disposition, feature vector.
- **Processing Steps:**
  1. Evaluate candidate sequentially against Gates 1 through 5.
  2. If any gate fails, immediately halt and assign `decision="REJECT_CANDIDATE"` with exact gate failure reason.
  3. If all 5 gates pass, assign `decision="APPROVE_CANDIDATE"`.
- **Outputs:** Standardized governance evaluation dictionary containing pass/fail verdict, gate breakdown, and advisory warnings.
- **Dependencies:** `feedback_gate` adapter, database logging.
- **Technical Advantage:** Prevents data poisoning and distribution drift without requiring external human oversight during initial filtering.
- **Implementation Evidence:** `backend/app/ai/adapters/feedback_gate.py`, `backend/tests/test_feedback_gate_governance.py`.
- **Alternative Embodiments:** Bayesian reliability estimation; multi-agent voting ensemble.
- **Potential Novelty-Risk Notes:** Data validation pipelines exist; claim focus should be on the 5 specific hard-gate boundaries applied to multi-model cybercrime intelligence retraining candidates.

---

### IC-07: Human-Reviewed Cross-Case Feedback Loop with Controlled Retraining Queue

- **Problem Solved:** Operational law-enforcement decisions are typically lost to machine learning systems, preventing models from learning emerging cyber threats. Conversely, autonomous learning creates uncontrollable legal liability.
- **Technical Mechanism:** A decoupled governance architecture where human investigator dispositions are captured in primary relational workflows, evaluated asynchronously by the Feedback Gate, and placed into a quarantined `learning_candidates` database table with status `PENDING`. An AI/ML System Lead must manually inspect and approve candidates before offline training dataset compilation. Automatic deployment or self-retraining is architecturally disabled.
- **Inputs:** Investigator action logs, case closing reports, feedback gate evaluations.
- **Processing Steps:**
  1. Officer confirms or rejects a candidate correlation or urgency rating.
  2. Service triggers `feedback_gate_service.evaluate_and_record_candidate(...)`.
  3. If approved by the 5 gates, persist record to `learning_candidates`.
  4. AI Lead inspects candidate records in the MLOps portal (`GET /api/v1/learning-candidates`).
  5. AI Lead marks record as `CONTROLLED_LEARNING_CANDIDATE` or `REJECTED`.
- **Outputs:** Curated, quarantined training dataset candidates ready for offline validation.
- **Dependencies:** Relational database tables (`learning_candidates`), RBAC permissions.
- **Technical Advantage:** Solves the continuous-learning dilemma for sensitive public-safety domains by combining programmatic quality gates with human-in-the-loop curation.
- **Implementation Evidence:** `backend/app/services/feedback_gate_service.py`, `backend/app/models/learning_candidate.py`, `backend/app/api/intelligence_v2.py`.
- **Alternative Embodiments:** Batch offline export to an isolated MLOps data lake (S3/MinIO) with cryptographic manifest signing.
- **Potential Novelty-Risk Notes:** Human-in-the-loop systems are broadly discussed; novelty centers on the specific state transitions, quarantined queue isolation, and role-separated approval mechanism.

---

### IC-08: Offline Sovereign Enclave Multi-Model Intelligence Execution

- **Problem Solved:** Sending citizen cybercrime reports, banking credentials, or police docket details to third-party commercial cloud AI APIs violates national data sovereignty and public privacy regulations.
- **Technical Mechanism:** A unified, local model lifecycle manager (`ModelManager`) that lazy-loads, caches, and executes 11 distinct machine learning models entirely on local compute (CPU/GPU) using `local_files_only=True`. Zero outbound network sockets are opened during inference.
- **Inputs:** Model target directory on local filesystem, model identifier string.
- **Processing Steps:**
  1. Inspect local artifact directory for `config.json`, weights (`model.safetensors`), and tokenizers.
  2. Load model into memory with strict offline flags.
  3. Cache model instance in memory singleton to eliminate reload latency.
  4. Execute inference locally without external API dependencies.
- **Outputs:** In-memory inference predictions.
- **Dependencies:** Local filesystem storage, PyTorch, Transformers, ONNX Runtime / Scikit-Learn.
- **Technical Advantage:** Complete operational sovereignty, zero third-party data leakage, and resilience to external internet outages.
- **Implementation Evidence:** `backend/app/ai/model_manager.py`, `backend/app/ai/adapters/`.
- **Alternative Embodiments:** Hardware-secured enclave execution (Intel SGX, AWS Nitro Enclaves); containerized edge appliances.
- **Potential Novelty-Risk Notes:** Local inference itself is not novel; technical novelty relies on the unified coordination, lazy-loading lifecycle, and fallback degrade states across an 11-model heterogeneous intelligence stack.

---

### IC-09: Citizen-Facing Threat Screening Connected Directly to Structured Complaint Ingestion

- **Problem Solved:** Citizens encounter suspicious URLs, SMS phishing, or fraud messages but lack immediate guidance, while reporting portals require tedious manual re-entry of indicators.
- **Technical Mechanism:** A dual-purpose, public-facing Cyber Shield assistant powered by local classifiers (XGBoost for URLs, Naive Bayes for SMS, Linear Classifier for Email). Upon detecting high threat probability, the assistant delivers immediate, explainable safety advice and automatically constructs a pre-filled complaint payload containing extracted technical indicators, reducing citizen filing friction.
- **Inputs:** Raw input string (URL, SMS text, email body), query modality.
- **Processing Steps:**
  1. Detect input modality automatically or via citizen selection.
  2. Execute modality-specific local model.
  3. Extract lexical and structural threat indicators.
  4. Generate explainable risk summary and safety recommendations.
  5. If threat confirmed, serialize pre-filled complaint template (`title`, `category`, `suspect_info`).
- **Outputs:** JSON screening response with threat level, explanations, guidance, and pre-fill complaint object.
- **Dependencies:** `citizen_assistant_service`, local text and URL classifiers.
- **Technical Advantage:** Empowers citizens with immediate pre-incident protection while drastically improving the technical accuracy of downstream law-enforcement complaints.
- **Implementation Evidence:** `backend/app/services/citizen_assistant_service.py`, `backend/app/api/citizen_ai.py`, `frontend/src/views/CitizenPortal.tsx`.
- **Alternative Embodiments:** Mobile app SDK; browser extension integration.
- **Potential Novelty-Risk Notes:** Phishing checkers and reporting portals exist independently; novelty lies in the direct, explainable bridging of pre-incident screening to structured complaint docket pre-filling.
