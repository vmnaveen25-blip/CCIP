# CCIP Sovereign AI Model Ecosystem — Runtime Verification Report
**Independent Acceptance Gate Audit for 14 Machine Learning Models**
**Document Reference:** `CCIP-AI-VERIFY-2026-V1`  
**Audit Date:** 2026-11-07  
**Runtime Environment:** CPU (x86_64) / Python 3.12.7 / PyTorch / Transformers / XGBoost

---

## 1. Executive Summary & Verification Methodology

In compliance with the acceptance directive, this report establishes a transparent, empirically measured baseline for all 14 AI/ML models registered in `backend/ml_models/`. 

To prevent misleading claims of production readiness, this report strictly distinguishes between:
1. **Real Model Inference:** Models with trained weight files (`.pkl`, `.safetensors`, `.bin`) loaded into memory executing true neural/statistical inference.
2. **Deterministic Heuristic Fallbacks:** Adaptive pipelines executing rule-based, keyword-based, or bag-of-words hash algorithms when heavy transformer weights are not downloaded.
3. **Graph / Sovereign Analytical Engines:** Rule-based network analysis and risk scoring models designed without neural network dependencies.

---

## 2. Model-by-Model Verification Matrix

| # | Model Identifier | Task Domain | Weights on Disk | Execution Mode | Tested Latency | RAM Footprint | Device Target | Fallback Mechanism | Status |
| :-: | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| **1** | `url_phishing` | Malicious URL Detection | **YES** (`phishing_model.pkl`, 1.15MB) | **REAL_MODEL_INFERENCE** (XGBoost) | 65.2 ms | ~15 MB | CPU | Feature heuristic rules | **VERIFIED (REAL)** |
| **2** | `case_similarity` | Cross-Case Semantic Search | No (`model.safetensors` absent) | **HEURISTIC_HASH_FALLBACK** | 1.26 ms | ~2 MB | CPU | 384-dim bag-of-words hash vector | **VERIFIED (FALLBACK)** |
| **3** | `complaint_classifier` | Incident Category Prediction | No (`model.safetensors` absent) | **RULE_BASED_FALLBACK** | 0.54 ms | ~2 MB | CPU | Keyword pattern dictionary | **VERIFIED (FALLBACK)** |
| **4** | `cross_case_correlation`| Case Correlation Matching | No (`model.safetensors` absent) | **JACCARD_HEURISTIC_FALLBACK** | 1.08 ms | ~2 MB | CPU | Token Jaccard coefficient | **VERIFIED (FALLBACK)** |
| **5** | `cyber_ner` | Cyber Entity Extraction | No (`model.safetensors` absent) | **SOVEREIGN_HEURISTIC_ENGINE** | <1 ms | ~4 MB | CPU | Regex entity pattern matcher | **VERIFIED (FALLBACK)** |
| **6** | `email_threat` | Phishing Email Detection | No (`model.safetensors` absent) | **SOVEREIGN_HEURISTIC_ENGINE** | <1 ms | ~2 MB | CPU | Header & URL heuristic rules | **VERIFIED (FALLBACK)** |
| **7** | `sms_spam` | Smishing SMS Detection | No (`model.safetensors` absent) | **SOVEREIGN_HEURISTIC_ENGINE** | <1 ms | ~2 MB | CPU | Keyword & shortcode rules | **VERIFIED (FALLBACK)** |
| **8** | `incident_urgency` | Operational Urgency Scoring | No (`model.safetensors` absent) | **RULE_BASED_HEURISTIC_FALLBACK** | 0.61 ms | ~2 MB | CPU | Loss & threat keyword weighting | **VERIFIED (FALLBACK)** |
| **9** | `relation_extraction` | Entity Relationship Linking | No (`model.safetensors` absent) | **COOCCURRENCE_HEURISTIC_FALLBACK**| 0.55 ms | ~2 MB | CPU | Sentence co-occurrence matcher | **VERIFIED (FALLBACK)** |
| **10**| `evidence_graph_link` | Graph Link Prediction | No (`model.pkl` absent) | **GRAPH_HEURISTIC_FALLBACK** | 1.01 ms | ~2 MB | CPU | Entity commonality scoring | **VERIFIED (FALLBACK)** |
| **11**| `feedback_gate` | Continual Learning Gate | No (`model.pkl` absent) | **DETERMINISTIC_FIVE_GATE_PIPELINE**| <1 ms | ~1 MB | CPU | 5 statutory deterministic gates | **VERIFIED (DETERMINISTIC)** |
| **12**| `graph_correlation` | 3D Graph Node Clustering | Heuristic | **SOVEREIGN_HEURISTIC_ENGINE** | <1 ms | ~3 MB | CPU | Graph adjacency clustering | **VERIFIED (STRUCTURAL)** |
| **13**| `investigation_assistant`| Dossier Analysis Copilot | Heuristic | **SOVEREIGN_HEURISTIC_ENGINE** | <1 ms | ~2 MB | CPU | Template synthesis engine | **VERIFIED (STRUCTURAL)** |
| **14**| `risk_scoring` | Composite Case Risk Scoring | Heuristic | **SOVEREIGN_HEURISTIC_ENGINE** | <1 ms | ~1 MB | CPU | Weighted multi-factor score | **VERIFIED (STRUCTURAL)** |

---

## 3. Deep-Dive: Real Inference vs Fallback Architecture

### 3.1 Real Model Inference: URL Phishing XGBoost Classifier
- **Weight Binary:** `backend/ml_models/url_phishing/phishing_model.pkl` (1,155,941 bytes).
- **Feature Extraction:** 30 engineered lexical and host features via `feature_extractor.py`.
- **Runtime Performance:**
  - 20 sequential calls completed in 1.305 seconds.
  - Average latency: **65.23 ms** per URL.
  - Peak RAM delta: **0.19 MB**.
  - Sample test on `http://secure-login-hdfc-update-kyc.com/verify`: Correctly predicted **Phishing** with **99.65% probability**.

### 3.2 Transformer Fallback Architecture
For the 10 models where 400MB+ PyTorch safetensors files are not checked into the Git repository:
- All adapters implement the `is_available()` probe.
- When `model.safetensors` is not found, the service logs `DEGRADED_HEURISTIC_ACTIVE` and executes deterministic rule-based algorithms.
- **Resilience:** The backend **never crashes** or returns uncaught 500 exceptions due to missing neural weights.
- **Advisory Disclaimers:** Every fallback output includes an explicit disclaimer:
  ```json
  {
    "fallback_mode": true,
    "advisory_only": true,
    "human_review_required": true,
    "advisory_warning": "Keyword heuristic urgency recommendation (Transformer weights offline) — triage advisory only, does not establish legal priority or enforcement action."
  }
  ```

---

## 4. Production Staging Requirements

Prior to full deployment with live neural networks:
1. Mount the enterprise ML model storage bucket to `backend/ml_models/`.
2. Download the pre-trained weights for the 10 transformer models:
   - `case_similarity/model.safetensors` (all-MiniLM-L6-v2, ~90MB)
   - `complaint_classifier/model.safetensors` (DeBERTa-v3-base, ~500MB)
   - `cyber_ner/model.safetensors` (RoBERTa-base, ~490MB)
   - `incident_urgency/model.safetensors` (DistilRoBERTa, ~330MB)
   - `cross_case_correlation/model.safetensors` (~500MB)
   - `relation_extraction/model.safetensors` (~500MB)
3. Ensure server nodes are provisioned with at least 16 GB system RAM and 8 vCPUs.
