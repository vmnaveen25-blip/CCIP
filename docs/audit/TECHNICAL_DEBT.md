# CCIP – Technical Debt & Code Hygiene Audit
## Identified Technical Debt, Refactoring Priorities & Architecture Backlog

**Auditor:** Principal Software Architect & QA Lead  

---

### 1. High-Priority Technical Debt

| Priority | Item | Description | Impact | Target Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **High** | **Large Frontend Components** | `AdminPortal.tsx` (687 KB, ~15,000 lines), `CitizenPortal.tsx` (149 KB), `FileComplaintWizard.tsx` (118 KB) contain multiple sub-views inline. | High bundle chunk size; slower Hot Module Replacement; maintenance complexity. | Decompose `AdminPortal.tsx` into modular domain subcomponents under `src/components/admin/`. |
| **High** | **Development Auth Fallback Guard** | `permissions.py` falls back to `root@astraea.internal` / `vijay@gmail.com` if no token provided during prototype testing. | Inadvertent admin privilege escalation if deployed in production without environment flags. | Strict conditional guard: enable fallback **only** if `settings.ENVIRONMENT in ("development", "test")`. |
| **Medium** | **In-Memory Background Worker vs Celery** | Background text extraction currently runs via `asyncio.create_task` / thread executor instead of Celery/Redis queue. | If server restarts during heavy document embedding, processing must be manually retried. | Implement Celery + Redis task worker with persistent state in `background_tasks` table. |
| **Medium** | **External Threat Feed Keys** | `threat_intelligence.py` connectors for AbuseIPDB, VirusTotal, and URLhaus require live API credentials. | Endpoints currently return simulated or cached feeds if external keys are missing. | Provide secure vault credential manager and graceful degraded indicators in UI. |
| **Medium** | **PDF Report Generation Engine** | Case report export in `reports.py` returns JSON structures; court-admissible PDF rendering is simulated. | Investigation officers require downloadable PDF dossiers with official watermarks. | Integrate `weasyprint` or `reportlab` to render styled court-admissible forensic PDF reports. |
| **Low** | **Redundant Root Wrapper Scripts** | Root `package.json` in `C:\CCIP-main` acts as an orchestrator for nested `CCIP-main/` folder. | Causes confusion when developers run git commands from the root directory. | Resolved via `.git` pointer; maintain unified entrypoint scripts. |

---

### 2. Code Smells & Deprecation Backlog

1. **Inline Type Casting (`(res as any)`):**
   - Certain frontend API calls use `as any` due to partial schema alignment.
   - **Remediation:** Generate end-to-end TypeScript interfaces directly from FastAPI OpenAPI schema (`openapi-typescript`).
2. **Mock Fallback Handling in UI:**
   - When network requests fail in `FileComplaintWizard.tsx`, the UI generates a mock complaint ID to prevent citizen data loss.
   - **Remediation:** Distinguish between genuine server failure and offline draft storage; provide explicit offline badge and retry queue.
3. **Database Foreign Key Pragmas:**
   - SQLite requires explicit `PRAGMA foreign_keys = ON;` per connection.
   - **Remediation:** Add SQLAlchemy event listener `connect` to execute the pragma on every database connection.

