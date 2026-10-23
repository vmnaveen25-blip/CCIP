# Patent Attorney Handoff: 05 — Claim Support Matrix Summary

**Reference:** Direct Code & Database Evidence Mapping  
**Master Document:** [PATENT_CLAIM_SUPPORT_MATRIX.md](file:///C:/Users/Admin/Desktop/CCIP/docs/PATENT_CLAIM_SUPPORT_MATRIX.md)  

---

## Direct Code & Verification Evidence Mapping

| Candidate Claim Element | Key Code Location | Database Model | Automated Test Verification |
|---|---|---|---|
| **Deterministic Indicator Extraction** | `backend/app/services/entity_service.py` | `cyber_entities` (`source_type="DETERMINISTIC"`) | `backend/tests/test_hybrid_cyber_ner.py` |
| **Contextual Token Classification** | `backend/app/ai/adapters/cyber_ner_transformer.py` | `cyber_entities` (`source_type="TRANSFORMER"`) | `backend/tests/test_hybrid_cyber_ner.py` |
| **Structured Authority Overwrite** | `backend/app/services/entity_service.py` | Conflict resolution logic | `backend/tests/test_hybrid_cyber_ner.py` |
| **Relation Inference** | `backend/app/services/relation_extraction_service.py` | `cyber_entity_relations` | `backend/tests/test_multi_model_adapters.py` |
| **Incident Urgency Scoring** | `backend/app/services/incident_urgency_service.py` | `cases.priority`, `cases.risk_score` | `backend/tests/test_multi_model_adapters.py` |
| **Case Semantic Similarity** | `backend/app/services/case_similarity_service.py` | In-memory cosine matching | `backend/tests/test_multi_model_adapters.py` |
| **Cross-Case Correlation** | `backend/app/services/cross_case_correlation_service.py`| `case_correlations` | `backend/tests/test_intelligence_idempotency.py` |
| **Evidence Graph Generation** | `backend/app/services/evidence_graph_service.py` | `evidence_graph_nodes`, `evidence_graph_edges` | `backend/tests/test_evidence_graph_integrity.py` |
| **Investigator Verdict Locking** | `backend/app/services/cross_case_correlation_service.py`| `case_correlations.status` | `backend/tests/test_intelligence_idempotency.py` |
| **5-Hard-Gate Feedback Filter**| `backend/app/ai/adapters/feedback_gate.py` | Evaluated in memory | `backend/tests/test_feedback_gate_governance.py` |
| **Quarantined Learning Queue** | `backend/app/services/feedback_gate_service.py` | `learning_candidates` | `backend/tests/test_feedback_gate_governance.py` |
| **Sovereign Offline Execution** | `backend/app/ai/model_manager.py` | Local disk (`local_files_only=True`) | `backend/tests/test_real_data_flow.py` |
| **Role-Decoupled RBAC** | `backend/app/core/permissions.py` | `users.role_id` mapping | `backend/tests/test_security_rbac_phase_k.py` |
| **Tamper-Evident Evidence Seal**| `backend/app/services/evidence_service.py` | `evidence.sha256_hash` | `backend/tests/test_phase_k_e2e.py` |
| **Pre-Incident Threat Screening**| `backend/app/services/citizen_assistant_service.py`| Modality dispatch | `backend/tests/test_citizen_ai_api.py` |
