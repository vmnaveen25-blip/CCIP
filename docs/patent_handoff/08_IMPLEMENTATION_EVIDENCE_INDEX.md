# Patent Attorney Handoff: 08 — Implementation Evidence Index

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Detailed Code, Database, Test, and Artifact Mapping for Invention Substantiation  
**Key Commit References:**  
- Phase J Baseline: `af59ce6` ("feat(ml): integrate Phase J multi-model intelligence and citizen AI assistant")  
- Phase K Hardened Baseline: `deb533c` ("feat(phase-k): end-to-end intelligence hardening, real prototype validation and demo readiness")  
*(Note: Git commit references establish verified technical reduction to practice in the repository; they do not constitute legal patent priority).*

---

## 1. Inventive Concept Implementation Mapping

| Concept ID & Title | Backend Service / Module | Model Adapter / Architecture | Database Schema Models | REST API Endpoints | Automated Pytest Verification |
|---|---|---|---|---|---|
| **IC-01: Hybrid Cyber NER** | `backend/app/services/entity_service.py` | `cyber_ner_transformer.py` (`deberta-v3-base`) | `app/models/cyber_entity.py` (`CyberEntity`) | `POST /api/v1/entities/extract`, `GET /api/v1/entities/case/{case_id}` | `backend/tests/test_hybrid_cyber_ner.py` (12 tests) |
| **IC-02: Multi-Stage Orchestrator** | `backend/app/services/intelligence_orchestrator.py` | Coordinates all 11 model adapters | Operates across all relational tables | `POST /api/v1/cases/{case_id}/intelligence/refresh` | `backend/tests/test_intelligence_idempotency.py` (2 tests) |
| **IC-03: Cross-Case Correlation** | `backend/app/services/cross_case_correlation_service.py` | `cross_case_correlation.py` (`distilroberta-base`) + `case_similarity.py` (`all-MiniLM-L6-v2`) | `app/models/case_correlation.py` (`CaseCorrelation`) | `GET /api/v1/cases/{case_id}/correlations`, `POST /api/v1/case-correlations/{id}/review` | `backend/tests/test_intelligence_idempotency.py`, `test_multi_model_adapters.py` |
| **IC-04: Evidence Graph Engine** | `backend/app/services/evidence_graph_service.py` | Relational network builder | `app/models/evidence_graph.py` (`EvidenceGraphNode`, `EvidenceGraphEdge`) | `GET /api/v1/cases/{case_id}/evidence-graph`, `POST /api/v1/evidence-graph/edges/{id}/review` | `backend/tests/test_evidence_graph_integrity.py` (2 tests) |
| **IC-05: Graph Link Prediction** | `backend/app/ai/adapters/evidence_graph_link.py` | Proximity & jaccard heuristic inference | `app/models/evidence_graph.py` (`EvidenceGraphEdge`) | Integrated into evidence graph payload | `backend/tests/test_multi_model_adapters.py` |
| **IC-06: 5-Gate Feedback Filter** | `backend/app/ai/adapters/feedback_gate.py` | Programmatic deterministic validator | In-memory evaluation | `POST /api/v1/feedback-gate/evaluate` | `backend/tests/test_feedback_gate_governance.py` (2 tests) |
| **IC-07: Continual-Learning Queue**| `backend/app/services/feedback_gate_service.py` | Quarantined candidate lifecycle | `app/models/learning_candidate.py` (`LearningCandidate`) | `GET /api/v1/learning-candidates`, `POST /api/v1/learning-candidates/{id}/review` | `backend/tests/test_feedback_gate_governance.py` |
| **IC-08: Sovereign Enclave Execution** | `backend/app/ai/model_manager.py` | Local loader (`local_files_only=True`) | Local directory metadata | `GET /api/v1/models/status` | `backend/tests/test_real_data_flow.py`, `test_model_degraded_modes.py` |
| **IC-09: Citizen Threat Intake** | `backend/app/services/citizen_assistant_service.py` | XGBoost (URL) + MNB (SMS) + SGD (Email) | Serializes into `ComplaintCreateRequest` | `POST /api/v1/ai/citizen/assist` | `backend/tests/test_citizen_ai_api.py`, `test_citizen_ai_assistant.py` |

---

## 2. Evidence Integrity & Cryptographic Seal Mapping

- **Evidence Ingestion Service:** `backend/app/services/evidence_service.py`
- **Tamper-Evident Storage Handler:** `backend/app/services/storage_service.py`
- **Database Model:** `backend/app/models/evidence.py` (`Evidence.sha256_hash`, `Evidence.integrity_status`)
- **API Endpoints:** `POST /api/v1/evidence/upload`, `GET /api/v1/evidence/{evidence_id}/verify`
- **Verification Tests:** `backend/tests/test_phase_k_e2e.py`, `backend/tests/test_production_hardening.py`

---

## 3. UI Component Mapping (Frontend Evidence)

- **Citizen Cyber Shield:** `frontend/src/views/CitizenPortal.tsx`
- **Specialist Triage Workbench:** `frontend/src/views/SpecialistPortal.tsx`
- **Police Investigation & Graph:** `frontend/src/views/PolicePortal.tsx`, `frontend/src/components/EvidenceGraph.tsx`
- **Administrative Governance:** `frontend/src/views/AdminPortal.tsx`
- **AI/ML MLOps Operations Hub:** `frontend/src/views/AIMLLeadPortal.tsx`
