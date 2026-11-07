# STAGE 6 & 7 IMPLEMENTATION MATRIX
## Citizen Portal Intake Workflow & Administrator Governance Refinement
**Generated:** 2026-11-07T09:34:00Z  
**Branch:** `main`  
**Latest Verified Commits:** `86a7c47` -> Working Tree Hardened  
**Clearance:** RESTRICTED AUDIT  

---

## 1. Feature Status & Verification Matrix

| Requirement / Module | Target Area | Implementation Details | Verification Status |
|---|---|---|---|
| **Anonymous Public Assistance** | Citizen Chatbot | `/api/v1/public-chat/session`, 24h TTL, salted IP hash, 50-turn limit | **Fully Implemented & Verified** |
| **Emergency 1930 Financial Guidance** | Citizen Chatbot | Heuristic detection of fraudulent debits, Golden Hours guidance, 1930 helpline banner | **Fully Implemented & Verified** |
| **Prompt Injection Defense** | Citizen Chatbot | Regex & keyword barrier neutralizing developer mode, jailbreaks, and password extraction | **Fully Implemented & Verified** |
| **5-Stage Complaint Intake Wizard** | Citizen Intake | `FileComplaintWizard.tsx`: Incident overview, financial impact, suspect indicators, evidence, review | **Fully Implemented & Verified** |
| **Dual-Casing Schema Resilience** | API Contract | `ComplaintCreateRequest` accepts both `camelCase` and `snake_case` via Pydantic model validator | **Fully Implemented & Verified** |
| **Elimination of Mock Fallbacks** | Frontend Client | Mock creation fallback removed from `FileComplaintWizard.tsx`; genuine server submission enforced | **Fully Implemented & Verified** |
| **Cryptographic Reference & Token** | Database / Core | Unpredictable reference (`CYBER-2026-XXXXXX-XXXX`) & high-entropy tracking token (`ccip_trk_...`) | **Fully Implemented & Verified** |
| **Idempotency Guard** | Complaints API | `X-Idempotency-Key` tracking preventing double-submissions during network retries | **Fully Implemented & Verified** |
| **Statutory Citizen Consent** | Database Model | `citizen_consents` table: SHA-256 terms hash, IP address, DPDP statutory declaration | **Fully Implemented & Verified** |
| **Structured Indicator (IOC) Extraction** | Database Model | `report_indicators` table: phone, email, URL, crypto wallet, bank UTR normalization | **Fully Implemented & Verified** |
| **Two-Tier Status Tracking** | Complaints API | Public unverified view hides all PII; verified view unlocks full timeline & evidence counts | **Fully Implemented & Verified** |
| **Investigator Handoff** | Intake Pipeline | Automatic linked `Case` creation, `CyberEntity` extraction, cross-case correlation graph | **Fully Implemented & Verified** |
| **Complainant Additional Info** | Complaints API | `POST /api/v1/complaints/{id}/additional-info` allowing citizens to supply requested docs | **Fully Implemented & Verified** |
| **User Directory Governance** | Admin Console | `GET /api/v1/admin/users`: Multi-field search, role filters, pagination (`X-Total-Count`) | **Fully Implemented & Verified** |
| **Investigator Profile Governance** | Admin Console | `GET /admin/investigators`, `POST /admin/investigators`: Specialization tagging & live workload tracking | **Fully Implemented & Verified** |
| **Dual-Authorization Engine** | Admin Console | `administrative_approvals`: Separation of duties, strict self-approval block (HTTP 403) | **Fully Implemented & Verified** |
| **Complaint Assignment Console** | Complaints API | `POST /api/v1/complaints/{id}/assign`: Assignment to unit and officer with audit logging | **Fully Implemented & Verified** |
| **State Machine Governance** | Core State Machine | Strict finite state transitions (`SUBMITTED` -> `UNDER_REVIEW` -> `ASSIGNED` -> `UNDER_INVESTIGATION`) | **Fully Implemented & Verified** |
| **Security Events Registry** | Admin Console | `security_events_registry`: Logging and querying authentication failures, rate limits, BOLA probes | **Fully Implemented & Verified** |
| **Evidence Legal Hold Governance** | Admin Console | `evidence_retention_records`: Toggling legal hold, preventing premature statutory pruning | **Fully Implemented & Verified** |

---

## 2. Technical Debt & Remediated Security Vulnerabilities

1. **Vulnerability Remediated (BFLA/IDOR):**
   - Unauthenticated callers can no longer view complainant names, financial amounts, or suspect details from `/complaints/track/{ref}`.
2. **Vulnerability Remediated (Privilege Escalation in Approvals):**
   - Administrators cannot approve their own high-risk actions. Dual authorization requires a distinct administrative account (`requested_by_id != current_user.id`).
3. **Defect Corrected (Frontend Schema Mismatch):**
   - Fixed `is_urgent_advisory` and `sources` field parsing in `FloatingChatbotWidget.tsx`, rendering emergency 1930 call buttons and knowledge source pills properly.
4. **Defect Corrected (FastAPI 422 Unprocessable Content on Complaint Creation):**
   - Added transparent key normalization in Pydantic schemas, eliminating the failure that previously caused `FileComplaintWizard.tsx` to drop into mock fallback mode.
5. **Defect Corrected (SQLAlchemy Async MissingGreenlet):**
   - Configured `lazy="selectin"` on `indicators` and `consents` relationships on `Complaint`, eliminating unawaited lazy I/O during schema serialization.
