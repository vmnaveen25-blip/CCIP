# Patent Alternative Embodiments & Technical Equivalents

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Disclosure of Alternative Technical Implementations for Patent Scope Broadening  
**Disclaimer:** This document describes technical equivalences for patent drafting purposes. These embodiments represent architectural variants within the inventive scope and do not imply that all described variations are currently active in the baseline prototype.

---

## 1. Machine Learning & Transformer Model Equivalents

| Primary Prototype Model | Current Implementation | Technical Equivalent Embodiments | Equivalence Rationale |
|---|---|---|---|
| **Cyber NER** | `deberta-v3-base` (Token Classification) | `roberta-base`, `bert-base-cased`, `electra-base`, `xlm-roberta`, quantized ONNX / TensorRT models, parameter-efficient adapters (LoRA) | Any deep transformer capable of bidirectional token classification over variable-length sequence spans can perform contextual cyber entity tagging. |
| **Complaint Classification** | `deberta-v3-base` (Multi-Label Classification) | `distilroberta-base`, `bert-base-uncased`, fastText embeddings, hierarchical multi-label classifiers, multi-head attention ensembles | The task requires mapping text tokens into a probability distribution over 18 or more discrete crime taxonomies. |
| **Relation Extraction** | `distilroberta-base` (6 layers, Sequence Classifier) | `roberta-large`, dependency-tree Graph Convolutional Networks (GCN), OpenIE parsers, SpanBERT, T5 / sequence-to-sequence relational predictors | Any model that accepts two entity spans within a context sentence and predicts relationship labels with confidence probabilities is technically equivalent. |
| **Incident Urgency Scoring** | `distilroberta-base` (4-class Urgency) | Gradient-boosted decision trees (XGBoost / LightGBM) over tabular + text features, ordinal regression transformers, Bayesian risk estimators | The underlying technical objective is computing an ordinal urgency index from narrative and structured loss parameters. |
| **Case Semantic Similarity** | `all-MiniLM-L6-v2` (Dense Embeddings, Cosine Distance) | `bge-small-en-v1.5`, `gte-small`, `text-embedding-ada-002`, `e5-small-v2`, spherical vector quantization, approximate nearest neighbor (ANN) indices | The technical mechanism converts narrative text into fixed-dimension dense vector representations for vector-space similarity computation. |
| **Cross-Case Correlation** | `distilroberta-base` (Cross-Encoder) + Entity Matching | Bi-encoder similarity ranking, Graph Neural Networks (GNN / GraphSAGE), Siamese neural networks, weighted multi-criteria algorithmic score fusion | Combining structured entity co-occurrence with deep narrative semantic alignment can be achieved via cross-encoders, dual bi-encoders, or graph-link prediction. |
| **Citizen Threat Screening** | XGBoost (URL) + MNB (SMS) + SGD (Email) | Random Forests, Deep Neural Networks (CNN/LSTM for character-level URL inspection), heuristic regex rule trees, sandboxed dynamic analysis | Any local model scoring structural, lexical, or token-frequency anomalies against known malicious baselines satisfies the technical screening requirement. |

---

## 2. Data Persistence & Graph Topology Equivalents

| Prototype Component | Current Implementation | Technical Equivalent Embodiments | Equivalence Rationale |
|---|---|---|---|
| **Primary Relational Store** | SQLite (WAL mode, async via SQLAlchemy) | PostgreSQL, CockroachDB, MySQL / MariaDB, Oracle Database, Microsoft SQL Server | Relational persistence provides ACID-compliant transaction safety, foreign key referential integrity, and structured querying for complaints and dockets. |
| **Evidence Graph Representation** | Relational tables (`evidence_graph_nodes`, `evidence_graph_edges`) | Native Property Graph Databases (Neo4j, AWS Neptune, Memgraph, ArangoDB), GraphML / RDF Triplestore engines | The evidence network can be persisted either as relational foreign-key joins or as native directed property graph nodes and edges with attribute key-value pairs. |
| **Vector Storage & Indexing** | In-memory embedding matrix with dot product calculation | Vector databases (pgvector, FAISS, Milvus, Qdrant, Pinecone, ChromaDB) | Large-scale deployment replaces linear in-memory scan with indexed Hierarchical Navigable Small World (HNSW) or Inverted File with Flat (IVFFlat) indices. |

---

## 3. Execution Topology & Infrastructure Equivalents

| Dimension | Current Implementation | Technical Equivalent Embodiments | Equivalence Rationale |
|---|---|---|---|
| **Compute Acceleration** | Multi-core x86 CPU inference | Dedicated GPU (NVIDIA CUDA / TensorRT), Apple Silicon Metal, Intel OpenVINO, dedicated NPU/TPU edge accelerators | The neural networks can be compiled and executed on any hardware architecture supporting standard tensor linear algebra operations. |
| **Enclave Security Posture** | Sovereign Local Enclave (`local_files_only=True` on filesystem) | Hardware-enforced Confidential Computing (Intel SGX, AMD SEV, AWS Nitro Enclaves), air-gapped on-premise rack servers, private government cloud | The sovereign offline requirement is satisfied whenever inference runs without exposing plain-text complaint data to untrusted public cloud APIs. |
| **Service Decoupling** | Monolithic FastAPI process with modular services | Microservices with asynchronous message brokers (gRPC, Celery, RabbitMQ, Apache Kafka), event-driven serverless functions | Orchestration steps S101–S119 can be distributed across decoupled microservices communicating over encrypted internal message buses. |

---

## 4. Evidence Integrity & Storage Equivalents

| Dimension | Current Implementation | Technical Equivalent Embodiments | Equivalence Rationale |
|---|---|---|---|
| **Cryptographic Evidence Sealing** | Single SHA-256 digest stored in relational database | SHA-512, BLAKE3, Merkle-tree rooted multi-file manifests, digital signatures via PKI X.509 certificates | Any cryptographically secure one-way hashing function that uniquely binds evidence bytes to an immutable integrity digest provides equivalent verification. |
| **Storage Medium** | Secure local filesystem folder with access control | Private object storage (MinIO, S3-compliant private bucket), Write-Once-Read-Many (WORM) compliant optical/cloud storage, immutable blob storage | Storing encrypted evidence payloads in physically write-restricted or access-monitored storage satisfies the tamper-evident preservation mandate. |
| **Audit Logging** | Relational `audit_logs` table | Append-only cryptographic ledger, OpenSearch / Elasticsearch with WORM retention, distributed blockchain ledger | Tamper-evident operational logging can be implemented using database tables, signed log files, or distributed consensus ledgers. |

---

## 5. Governance & Continual-Learning Feedback Equivalents

| Dimension | Current Implementation | Technical Equivalent Embodiments | Equivalence Rationale |
|---|---|---|---|
| **Feedback Gating Engine** | Deterministic 5-hard-gate programmatic validator | Bayesian belief networks, Reinforcement Learning with Human Feedback (RLHF) preference filters, rule-based expert systems | Programmatic filtering of operational decisions before granting candidate training status can use deterministic boolean gates or probabilistic scoring. |
| **Learning Candidate Queue** | Relational database table (`learning_candidates`) | Quarantined data lake bucket, dedicated training staging schema, Airflow MLOps pipeline queue | Staging approved data instances separately from active model training ensures human oversight and prevents automated retraining runaway. |
