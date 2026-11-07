# AI MODEL HARDWARE & FRAMEWORK COMPATIBILITY MATRIX
## Architectural Requirements, Quantization & Memory Footprint
**Platform:** Cyber Crime Intelligence Platform (CCIP)  
**Security Clearance:** ENCLAVE RESTRICTED / AI MLOPS  
**Version:** 2.0.0  

---

## 1. Hardware & Execution Compatibility

All 14 models deployed in the CCIP Sovereign Enclave are validated for execution on both CPU-only nodes and CUDA-accelerated hardware. The platform enforces PyTorch thread limiting (`torch.set_num_threads(4)`) to avoid CPU resource starvation on shared servers.

| # | Model Name | CPU Compatible | CUDA GPU Compatible | Precision / Quantization | Min RAM | VRAM (if GPU) | Inference Latency (CPU) |
|---|---|---|---|---|---|---|---|
| 1 | `complaint_classifier` | YES | YES | FP32 / Dynamic INT8 | 1.0 GB | 1.5 GB | ~85 ms |
| 2 | `url_phishing` | YES | N/A (Scikit) | Pickle / Native Scikit | 256 MB | N/A | ~8 ms |
| 3 | `sms_spam` | YES | YES | FP32 / INT8 | 512 MB | 1.0 GB | ~42 ms |
| 4 | `email_threat` | YES | YES | FP32 / INT8 | 512 MB | 1.0 GB | ~45 ms |
| 5 | `cyber_ner` | YES | YES | FP32 / Token Classification | 1.2 GB | 2.0 GB | ~110 ms |
| 6 | `case_similarity` | YES | YES | FP32 (MiniLM-L6-v2) | 512 MB | 1.0 GB | ~38 ms |
| 7 | `incident_urgency` | YES | YES | FP32 / DistilRoBERTa | 600 MB | 1.0 GB | ~48 ms |
| 8 | `relation_extraction` | YES | YES | FP32 / DistilRoBERTa | 600 MB | 1.0 GB | ~55 ms |
| 9 | `cross_case_correlation` | YES | YES | FP32 / RoBERTa | 600 MB | 1.0 GB | ~60 ms |
| 10 | `evidence_graph_link` | YES | YES | PyTorch Tensor JIT | 256 MB | 512 MB | ~12 ms |
| 11 | `feedback_gate` | YES | YES | PyTorch Tensor JIT | 128 MB | 256 MB | ~5 ms |
| 12 | `graph_correlation` | YES | N/A (Graph) | NetworkX Graph Engine | 256 MB | N/A | ~18 ms |
| 13 | `investigation_assistant` | YES | YES | Local RAG Vector Embeddings | 512 MB | 1.0 GB | ~95 ms |
| 14 | `risk_scoring` | YES | N/A (Ensemble) | Python Mathematical Matrix | 128 MB | N/A | ~3 ms |

---

## 2. Resource Management & Zero-Overhead Guarantees

- **Max Memory Cap:** Total working set for active models is bounded at 2.5 GB.
- **Dynamic Eviction:** If idle for > 15 minutes, models in cache transition from `READY` to `READY_FOR_LAZY_LOAD` and release tensor memory.
- **Safe Concurrent Inference:** Thread locks (`_email_lock`, `_sms_lock`, `_url_lock`, `_complaint_lock`) guarantee race-condition-free inference.

