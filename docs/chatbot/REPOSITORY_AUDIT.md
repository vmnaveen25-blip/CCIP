# CCIP Repository Audit: Chatbot & Knowledge Materials Baseline

**Project:** Citizen Cybercrime Intelligence Platform (CCIP)  
**Date:** 2026-11-06  
**Auditor:** Senior Full-Stack & RAG Architect  
**Objective:** Baseline audit of existing repository architecture prior to implementing the Public AI Citizen Chatbot, Admin Knowledge Materials, and RAG Pipeline.

---

## 1. Frontend Audit

- **Framework:** React 19 + TypeScript + Vite 6
- **Styling System:** Tailwind CSS with custom Enclave emerald theme (`#00e676`, `#030706`, `#04120a`, `#061c10`, dark glassmorphic cards).
- **Icon Library:** `lucide-react`
- **Routing & Navigation:** State-based single-page multi-portal routing (`App.tsx` orchestrating `landing`, `citizen`, `specialist`, `aiml`, `admin`).
- **Existing Relevant Components:**
  - `LandingPage.tsx`: Public landing page hosting the floating chatbot trigger.
  - `FloatingChatbotWidget.tsx`: Floating cyber-shield chatbot widget with online indicator, message composer, and conversation thread.
  - `AdminPortal.tsx`: System administration hub containing Governance and System & Infrastructure tabs.
  - `KnowledgeMaterialsView.tsx`: Locked design view for managing chatbot documents with statistics, table, and upload/preview modals.
  - `api/client.ts`: Central HTTP client using standard `fetch` with token listener and error propagation.

---

## 2. Backend Audit

- **Framework:** FastAPI with Python 3.12, Uvicorn, Pydantic v2, and Pydantic-Settings.
- **Database Engine:** SQLAlchemy 2.0 (AsyncSession) targeting SQLite in WAL mode (`ccip.db`) with asyncpg/PostgreSQL support.
- **Authentication & RBAC:** Argon2id password hashing, PyJWT bearer token authorization with strict role verification (`CITIZEN`, `CYBERSECURITY_SPECIALIST`, `AI_ML_SYSTEM_LEAD`, `SYSTEM_ADMIN`, `ADMIN_LEAD`).
- **Installed Parsers & NLP Libraries:**
  - `pypdf` (installed & verified)
  - `python-docx` (installed & verified)
  - `torch` & `transformers` (installed & verified)
  - `numpy`, `scipy`, `sklearn` (installed & verified)
  - `httpx`, `python-multipart` (installed & verified)
- **Existing Knowledge & Document Services:**
  - `app/services/investigation_knowledge_service.py`: Contains authoritative Indian cyber SOPs (Financial Interdiction 1930 / I4C NCRP, Digital Evidence Section 94 BNSS).
  - `app/services/document_processor_service.py`: Handles evidence file extraction and local redaction.
  - `app/services/storage_service.py`: Local encrypted file storage vault.

---

## 3. Infrastructure & Vector Architecture Decision

- **Storage Vault:** `backend/storage/knowledge_materials/` (private, non-static, server-controlled).
- **Vector Storage:** SQLite-backed vector persistence with cosine similarity calculation in NumPy/Python. Zero external cloud service dependencies required; runs entirely inside the sovereign enclave.
- **Background Tasks:** Native `fastapi.BackgroundTasks` for asynchronous text extraction, semantic chunking, and embedding generation.
- **Security Guardrails:**
  - Anonymous session management with signed session tokens and salted SHA-256 IP hashing.
  - 1930 Helpline golden-hours keyword detection.
  - Strict RAG access boundary (only `AVAILABLE` admin documents are retrieved for citizen queries).

