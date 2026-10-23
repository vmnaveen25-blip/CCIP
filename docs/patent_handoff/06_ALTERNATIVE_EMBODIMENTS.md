# Patent Attorney Handoff: 06 — Alternative Embodiments Summary

**Reference:** Disclosure of Technical Equivalents for Claim Broadening  
**Master Document:** [PATENT_ALTERNATIVE_EMBODIMENTS.md](file:///C:/Users/Admin/Desktop/CCIP/docs/PATENT_ALTERNATIVE_EMBODIMENTS.md)  

---

## Technical Equivalents for Claim Drafting

### 1. Model Architecture Equivalents
- **Token Classification:** Baseline uses `deberta-v3-base`. Equivalents include `roberta-base`, `bert-base`, `electra-base`, or any bidirectional token classification network.
- **Sequence Classification:** Baseline uses 6-layer `distilroberta-base`. Equivalents include `roberta-large`, multi-head attention pooling, or domain-adapted sequence models.
- **Dense Embeddings:** Baseline uses `all-MiniLM-L6-v2`. Equivalents include BGE, E5, GTE, or quantized spherical embeddings.

### 2. Graph & Storage Equivalents
- **Relational vs Property Graph:** Baseline stores graph nodes/edges in relational tables (`evidence_graph_nodes`, `evidence_graph_edges`). Equivalent embodiments include native property graph databases (Neo4j, AWS Neptune, Memgraph) using Cypher graph traversal.
- **Vector Indexing:** Baseline uses in-memory dot product. Equivalent embodiments include pgvector, FAISS, Milvus, or Qdrant with HNSW indexing.
- **Evidence Integrity:** Baseline stores SHA-256 digests in SQLite/PostgreSQL. Equivalent embodiments include Merkle tree manifests, append-only cryptographic ledgers, or PKI digital signatures.

### 3. Compute & Deployment Equivalents
- **Processor Architectures:** Local CPU inference is equivalent to dedicated GPU (NVIDIA CUDA / TensorRT), Apple Silicon Metal, Intel OpenVINO, or specialized edge NPUs.
- **Enclave Hosting:** Local file system enclave (`local_files_only=True`) is equivalent to hardware confidential computing enclaves (Intel SGX, AMD SEV, AWS Nitro Enclaves) or air-gapped on-premise hardware appliances.
