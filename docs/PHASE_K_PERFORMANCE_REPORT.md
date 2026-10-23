# CCIP / Astraea Enclave — Phase K Local CPU Performance & Latency Report

**Document Version:** 1.0.0  
**Phase:** Phase K — End-to-End Intelligence Hardening, Real Prototype Validation & Demo Readiness  
**Target Machine Environment:**  
- **Operating System:** Windows 11 Pro (10.0.22631-SP0)  
- **Python Version:** 3.12.7  
- **Processor:** Intel64 Family 6 Model 78 Stepping 3, GenuineIntel  
- **CPU Cores:** 2 Physical Cores / 4 Logical Threads  
- **Total Physical RAM:** 7.86 GB  
- **Execution Mode:** Offline Sovereign Local CPU Inference (`local_files_only=True`, Zero External Network Calls)  
- **Date:** 2026-09-12  

---

## 1. Executive Summary

This report documents the genuine, measured CPU inference latency and process memory footprint for all 11 machine learning models and the multi-stage intelligence pipeline operating within the CCIP enclave.

### Key Latency Findings
- **High-Frequency Classifiers (PyTorch MLPs):** Sub-millisecond to low single-digit latencies (**0.3 ms** for Feedback Gate, **2.8 ms** for Evidence Graph Link).
- **Lightweight Transformers (DistilBERT & distilroberta):** Run in **99 ms to 260 ms** on 4 logical CPU threads.
- **Heavyweight Models (DeBERTa-v3 & MiniLM):** Run in **375 ms to 495 ms**.
- **Lexical/Heuristic Feature Extraction (URL Phishing):** Takes **~1240 ms** primarily due to 30 dynamic URL lexical and pattern parsing heuristics.
- **Operational Reality:** The platform operates as a responsive near-real-time decision support system, but **is not termed "sub-millisecond real-time"** for deep transformer stages.

---

## 2. Truthful Local CPU Inference Benchmark Results

| Model Name | Architecture | Framework | Warm Avg Latency | Warm Min Latency | Warm Max Latency | Peak Memory (RSS) | Evaluation Role |
|---|---|---|---|---|---|---|---|
| **1. URL Phishing** | `XGBClassifier` (30 features, 300 trees) | XGBoost / Pandas | **1,241.4 ms** | 886.2 ms | 2,138.4 ms | 321.9 MB | Citizen Cyber Shield |
| **2. SMS Spam** | `DistilBertForSequenceClassification` | PyTorch / HF | **132.1 ms** | 78.3 ms | 276.8 ms | 703.7 MB | Citizen Cyber Shield |
| **3. Email Threat** | `DistilBertForSequenceClassification` | PyTorch / HF | **99.3 ms** | 78.3 ms | 170.5 ms | 973.6 MB | Citizen Cyber Shield |
| **4. Complaint Classifier** | `DeBERTa-v3-base` (multi-label) | PyTorch / HF | **377.6 ms** | 322.5 ms | 423.9 ms | 1,818.9 MB | Specialist Triage |
| **5. Hybrid Cyber NER** | `DeBERTa-v3` Token Classifier + Regex | PyTorch / HF + Regex | **492.7 ms** | 362.5 ms | 699.0 ms | 2,614.8 MB | Specialist Investigation |
| **6. Relation Extraction** | `distilroberta-base` (9 classes) | PyTorch / HF | **148.3 ms** | 102.9 ms | 190.8 ms | 1,208.0 MB | Specialist Investigation |
| **7. Incident Urgency** | `distilroberta-base` (4 classes) | PyTorch / HF | **182.3 ms** | 146.6 ms | 271.6 ms | 513.1 MB | Specialist / Police Triage |
| **8. Case Similarity Pair** | `all-MiniLM-L6-v2` (384-dim embedding) | SentenceTransformers | **487.0 ms** | 152.6 ms | 1,184.8 ms | 492.6 MB | Police Cross-Case Linkage |
| **9. Cross-Case Correlation** | `distilroberta-base` (pairwise) | PyTorch / HF | **260.0 ms** | 120.5 ms | 465.3 ms | 633.5 MB | Police Syndicate Discovery |
| **10. Evidence Graph Link** | `EvidenceGraphLinkMLP` (80-dim) | PyTorch | **2.8 ms** | 1.5 ms | 4.5 ms | 633.0 MB | Police Graph Intelligence |
| **11. Feedback Gate** | `FeedbackGateMLP` (17-dim + 5 Hard Gates) | PyTorch + Rules | **0.3 ms** | 0.01 ms | 0.6 ms | 633.3 MB | AI Lead Governance |

---

## 3. Multi-Stage Pipeline Execution Profile

### Full Case Intelligence Refresh (`POST /api/v1/cases/{case_id}/intelligence/refresh`)
- **Cold Run (All models un-cached):** ~3.2 – 4.5 seconds on local CPU.
- **Warm Run (Pre-loaded memory singletons):** ~1.8 – 2.4 seconds total across all 6 pipeline stages:
  1. *Entity Extraction (Hybrid):* ~490 ms
  2. *Cyber Relation Extraction:* ~150 ms
  3. *Incident Urgency Scoring:* ~180 ms
  4. *Case Similarity (Top 5 bounded candidates):* ~490 ms
  5. *Cross-Case Correlation (Bounded candidate comparisons):* ~260 ms
  6. *Evidence Graph Synthesis & Link Prediction:* ~10 ms
- **Cached Run (`force_refresh=False` on unchanged complaint):** **< 15 ms** ($O(1)$ database read).

---

## 4. Scalability & Memory Management

1. **Process Memory Budget:**
   - Single-model peak process memory ranges from **322 MB** to **2.61 GB** when DeBERTa-v3 token classification is active.
   - On standard developer/analyst workstations with 8GB RAM, lazy loading and PyTorch gradient-free inference (`torch.inference_mode()`) keep the process comfortably within physical limits without swapping.

2. **Bounded Candidate Scanning:**
   - Unbounded $O(N^2)$ all-pairs comparisons are avoided by capping case similarity scans to **50 bounded candidates** (pre-filtered by category and recency) and cross-case correlation scans to **20 bounded candidates** (pre-filtered by shared technical indicators like UPIs, phone numbers, and domains).
