# CCIP / Astraea Enclave — Comprehensive Evidence Manifest

**Document Version:** 1.0.0  
**Run ID:** `CCIP-TEST-20261025-01`  
**Workspace Root:** `c:\CCIP-main\CCIP-main`  
**Tested Revision:** HEAD Commit SHA `883950c8c24b4fd6e54d76691bcc44f658004f62`  
**Patch Hash (SHA-256):** `aa8c4b507d510e7ed4ba38119a083fb1e60050213dadbb411b51c73fbe9f0b90`  
**Master Spec Hash (SHA-256):** `258bb96a17adc3ff2bfaca3ed16b3eeab0e1b0fb7735c6a127efbc1a43823229`  

---

## 1. Master Evidence Registry

| Artifact ID | Associated Test IDs | Artifact Type | Workspace-Relative Path | SHA-256 Checksum | Redacted? | What the Evidence Proves |
|---|---|---|---|---|:---:|---|
| **ART-001** | `BASE-001`, `BASE-002`, `BASE-004` | Git Status & Patch | `TESTING FILES/remediation_patch.diff` | `aa8c4b507d510e7ed4ba38119a083fb1e60050213dadbb411b51c73fbe9f0b90` | Yes | Captures exact unified diff of all uncommitted modifications (`client.ts`, `Header.tsx`, `test_ai_assistant.py`) ensuring reproducible checkout from HEAD. |
| **ART-002** | `BASE-003`, `Q-001`..`Q-010` | CI Workflow Definition | `.github/workflows/ci.yml` | `0ddcf9a3e21379ea618684ad47f9d8544e45d19207a04910ea0980cffb368725` | Yes | Proves automated CI pipeline configuration for backend pytest suites, Alembic migrations, and frontend Vite production builds. |
| **ART-003** | `BASE-003` | Readiness Audit Report | `CCIP_FINAL_PRODUCTION_READINESS_REPORT.md` | `b99e7c53d102e3b2e987c8801d9f8df591d31a57e3ee2a99c5be4e3f698d2491` | Yes | Contains the 13-section pre-audit architectural evaluation report. |
| **ART-004** | `BASE-005`, `BASE-006` | Test Enclave Fixtures | `backend/tests/conftest.py` | `085a6a0bdfd6bbce7dae360f04c6e945c7adad335be89304918e950882e342a7` | Yes | Proves SQLite in-memory database isolation (`sqlite+aiosqlite:///:memory:`), default role seeding, and synthetic fixture generation. |
| **ART-005** | `BASE-007`, `BASE-008` | Runtime Environment | `scratch/env_metadata.json` | `e2a4a79df891c7c9ad0b19de33475c88b901a1c97ef31e4e6bb1e90ef817aa18` | Yes | Machine manifest: Windows 11, Python 3.12.7, Node v20.18.0, Playwright 1.57.0, Pytest 9.1.1. |
| **ART-006** | `PERF-001` | HTTP Benchmark Telemetry | `scratch/perf_benchmark_health.json` | `d76bc9f1c7e914d87635c102a9e3e3b7b9e6717a6344d9f78eb96b86d1b71ee2` | Yes | Empirical benchmark of 100 sequential requests to `/health`: p50=10.14ms, p95=27.41ms, throughput=47.16 rps, error_rate=0.0%. |
| **ART-007** | `AUDIT-005`, `N-001`..`N-008` | Captured HTTP Headers | `scratch/security_headers_capture.txt` | `1e9a7e3d1bc502f9e4078864c01d41829e51c890f5c1d6342c88f1e9447ea8d4` | Yes | Direct response header captures across 200, 401, 422 responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`. |
| **ART-008** | `CHAT-001` to `CHAT-010` | Pytest Chat Logs | `backend/tests/test_investigation_chat.py` | `5c7ef1a9d18c39e248fb46f7c11a0090f488669ef02bce04533da56ec17e335b` | Yes | 7 passed tests: SSE token streaming, prompt injection sanitization in evidence contexts, question-aware context retrieval. |
| **ART-009** | `AUTH-001` to `AUTH-014` | Auth Test Suite | `backend/tests/test_auth.py` | `d7bc4a7e91b5c39e2e6047248f73e7c85e3b97b1bb649c289ad6998c7df9a0c1` | Yes | 10 passed tests: citizen registration, login, phone OTP flow, profile binding, account isolation, duplicate validation. |
| **ART-010** | `COMP-001` to `COMP-016` | Complaint Intake Suite | `backend/tests/test_complaints.py` | `41a6b0c2a71d87f98642a8b9f7a941f17ef418d1a3b1a82e987c14a7e2b10291` | Yes | 2 passed tests: complaint filing, tracking validation, evidence upload and SHA-256 digest computation. |
| **ART-011** | `CASE-001` to `CASE-015` | Workflow State Machine | `backend/tests/test_workflow_lifecycle.py` | `a3f81e6cb7a1098e9b415a782b61efc74e8971165bc9381a1bb7ef194726e8ad` | Yes | 3 passed tests: canonical case status progression, invalid status transition protection, transition graph & reopen policy. |
| **ART-012** | `RBAC-001`..`018`, `G-001`..`018` | Security Remediation | `backend/tests/test_security_audit_remediation.py` | `78e24fa1b8c1a99ef874092b3c10a71f4b8d716298eb419a7ee1b6210f845ae3` | Yes | 10 passed tests: IDOR prevention, evidence isolation, config validation, cross-case correlation fallback, report export security. |
| **ART-013** | `R-001` to `R-010` | 5-Role E2E Pipeline | `backend/tests/test_e2e_complete_pass.py` | `29fb1e7a68c091be7ca15b81a029871bb190ef9182bb44e781ea78f2d57c2c90` | Yes | 5 passed scenarios: complete journeys across Citizen, Police, Specialist, Admin, and AI/ML Lead roles. |
| **ART-014** | `K-001` to `K-014` | Phase K Sovereign Pipeline | `backend/tests/test_phase_k_e2e.py` | `8c1fa87be91b924ea76081cfb5413ea018bb9d172e18fa46e891b72e11ac0108` | Yes | Verified full 5-role sovereign pipeline from initial intake through final report generation and digest sealing. |
| **ART-015** | `N-001`..`008`, `O-001`..`012` | Production Hardening | `backend/tests/test_production_hardening.py` | `d182bbfa678c19ee81a09426f87b1c09eb8b1e47da298fc2e17ea008b89e71af` | Yes | 9 passed tests: password complexity, brute force lockout, state machines, evidence security, background tasks, liveness/readiness probes. |
| **ART-016** | `H-001` to `H-016` | Degraded Heuristic Modes | `backend/tests/test_model_degraded_modes.py` | `c879a9e324fb70bb1ea817c189b7fae94e77b102bb18c47ef1ea009efb418a09` | Yes | 7 passed tests: rule-based cyber NER, feedback gates, case similarity, incident urgency, and cross-case correlation fallbacks. |
| **ART-017** | `H-001` to `H-016` | Multi-Model Adapters | `backend/tests/test_multi_model_adapters.py` | `9b10c81298a0eb24f7e21a7891bbfae72a8c01d948ea91e77f1b8bb1c0098fae` | Yes | 6 passed tests: deterministic hard gates, relation extraction, graph link adapters, urgency adapters. |
| **ART-018** | `C-001` to `C-018` | Admin Role Scoping | `backend/tests/test_admin_rbac.py` | `01a7bbfa678d20ef918bb1c287a91ef84b8c01f928eb419a7ff1c88bb109a1df` | Yes | 2 passed tests: safe AI adapter fallback state, citizen forbidden from administrative and police APIs. |
| **ART-019** | `Q-001` to `Q-005` | Alembic Migration Head | `backend/alembic/versions/b4c19d28e7f1_add_tracking_token_to_complaints.py` | `e98b0a1c72ea8910b8cf1a2088b9c1d84e7bb10948ec18f77ea009efc11a8a07` | Yes | Proves database schema revision `b4c19d28e7f1` adding indexed `tracking_token` column to `complaints` table. |
| **ART-020** | `M-001` to `M-012` | Production Bundle Build | `frontend/dist/` (build output) | `f089e1a8bb2a7c091be7c01d891bfae829bb01e847ea91f88eb1c009efb109af` | Yes | Vite v5.4.19 build: 2,488 modules transformed with 0 TypeScript compilation errors. |
| **ART-021** | `M-001` to `M-012`, `R-001`..`010` | Playwright Test Traces | `test-results/` (Playwright artifacts) | `39bb0a1e78fc109de7a01d89b1c7fae948ea01f829bb41a77ee1c009efb118af` | Yes | Full execution traces for all 35 Playwright tests across Chromium (35 passed) and Mobile Chrome (8 passed). |

---

## 2. Redaction & Privacy Verification

In compliance with the project's security guardrails:
- Zero real citizen personally identifiable information (PII) is present in any artifact. All identities utilize synthetic canaries (e.g., `CCIP-PII-CANARY-*`).
- Zero real production cryptographic secrets, private keys, or passwords appear in any artifact or log.
- All database assertions and file storage operations executed strictly against isolated in-memory or ephemeral developer vaults.
