# CCIP – AI Model Ecosystem & Inference Audit
## Complete Evaluation of Machine Learning Models, MLOps Lifecycle, and RAG Architecture

**AI/ML Architecture:** Sovereign Enclave Model Management (PyTorch + Hugging Face Transformers + XGBoost + Scikit-Learn)  
**Location:** `backend/ml_models/` and `backend/app/ai/`  
**Auditor:** CCIP AI/ML & LLM Lead Engineer  

---

### 1. Model Registry & Asset Inventory

| # | Model Identifier | Task / Purpose | Architecture & Framework | Weight Location | Artifact Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `complaint_classifier` | 18-class cybercrime category prediction | DeBERTa-v3 / PyTorch | `ml_models/complaint_classifier/` | **Verified & Deployed** |
| **2** | `url_phishing` | Zero-hour malicious domain scoring | XGBoost Classifier / Joblib | `ml_models/url_phishing/` | **Verified & Deployed** |
| **3** | `sms_spam` | Smishing & SMS scam detection | RoBERTa / PyTorch | `ml_models/sms_spam/` | **Verified & Deployed** |
| **4** | `email_threat` | Spear-phishing & header anomaly detection | BERT-mini / PyTorch | `ml_models/email_threat/` | **Verified & Deployed** |
| **5** | `cyber_ner` | IOC & Cyber Entity Extraction | TokenClassification Transformer | `ml_models/cyber_ner/` | **Verified & Deployed** |
| **6** | `case_similarity` | Cross-case semantic embedding clustering | Dense Embedding Model / PyTorch | `ml_models/case_similarity/` | **Verified & Deployed** |
| **7** | `cross_case_correlation` | Graph node correlation & syndicate link | Graph Neural Network (GNN) | `ml_models/cross_case_correlation/`| **Verified & Deployed** |
| **8** | `incident_urgency` | Golden Hours financial fraud scorer | Logistic / Ensemble Scorer | `ml_models/incident_urgency/` | **Verified & Deployed** |
| **9** | `relation_extraction` | Threat actor to infrastructure mapping | Span-based Relation Extractor | `ml_models/relation_extraction/` | **Verified & Deployed** |
| **10**| `evidence_graph_link` | Evidence artifact link prediction | Link-prediction GNN | `ml_models/evidence_graph_link/` | **Verified & Deployed** |
| **11**| `feedback_gate` | Continual learning candidate gatekeeper | Calibrated Uncertainty Scorer | `ml_models/feedback_gate/` | **Verified & Deployed** |
| **12**| `graph_correlation` | High-order graph community detection | NetworkX / GNN Clusterer | `ml_models/graph_correlation/` | **Verified & Deployed** |
| **13**| `risk_scoring` | Multimodal threat score generator | Calibrated Ensemble Scorer | `ml_models/risk_scoring/` | **Verified & Deployed** |
| **14**| `investigation_assistant`| Dossier summarization & query assistant | Local Transformer / Gemini LLM | `ml_models/investigation_assistant/`| **Verified & Deployed** |

---

### 2. Model Lifecycle & Lazy Loading Architecture

In `backend/app/ai/model_manager.py`, model loading is managed via a singleton pattern with strict lazy loading:
- **Startup Overhead:** 0 MB GPU/CPU RAM allocated during application boot.
- **On-Demand Loading:** Thread locks ensure a model is loaded into memory only on its first inference call.
- **Memory Footprint:** Each transformer bundle consumes 250 MB – 600 MB of host RAM when active.
- **Thread Safety:** Dedicated per-model locks (`_complaint_lock`, `_url_lock`, `_sms_lock`, `_email_lock`) prevent race conditions during concurrent inference requests.

---

### 3. Sovereign RAG Retrieval Pipeline

The CCIP Chatbot RAG pipeline (`knowledge_materials_service.py` & `public_chat.py`) enforces:
1. **Document Text Extraction:** Multi-format parser handles `.pdf` (via `pypdf`), `.docx` (via `python-docx`), `.txt`, and `.md`.
2. **Text Normalization:** Whitespace cleaning, PII redaction (masking Aadhaar, PAN, phone numbers, and bank account numbers per the DPDP Act 2023).
3. **Semantic Chunking:** 500-token chunks with 75-token overlap to maintain contextual continuity.
4. **Vector Embedding:** Dense 384/768-dimensional semantic embeddings stored directly in SQLite BLOB column `knowledge_chunks.embedding_vector`.
5. **Retrieval & Filtering:**
   - Pre-retrieval filter: Query strictly matches documents where `processing_status == 'AVAILABLE'` and `chatbot_status == 'AVAILABLE'`.
   - Distance Metric: Cosine similarity ($\ge 0.55$ cut-off threshold).
   - Citation Provenance: Returns document title, chunk index, and page number for verified attribution.
6. **Guardrails & Safety:**
   - Statutory 1930 Helpline trigger intercepts queries involving urgent financial cyber fraud.
   - Prompt injection defense prevents user prompts or document text from overriding the system persona.

---

### 4. AI Quality & Uncertainty Standards
- **Forensic Disclaimer:** Every AI classification and extracted entity is marked with a confidence score and explicitly labeled as an algorithmic indicator requiring human specialist review.
- **Zero Hallucination Policy:** If RAG vector similarity fails to exceed the 0.55 threshold, the assistant states: *"The requested topic is not covered in our approved knowledge materials. Please contact the National Cybercrime Reporting Portal at 1930."*

