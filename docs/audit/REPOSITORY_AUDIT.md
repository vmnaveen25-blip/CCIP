# CCIP – Complete Repository Forensic Audit
## Comprehensive Forensic Discovery & Inventory Report

**Date of Audit:** November 7, 2026  
**Auditor:** CCIP Principal Software Architect & DevSecOps Lead  
**Scope:** Full-stack codebase (`c:\CCIP-main\CCIP-main`), including backend, frontend, database, AI models, test suites, and deployment infrastructure.

---

### 1. Technology Stack & Framework Inventory

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Runtime** | React | 18.3.1 | Core UI rendering engine |
| **Frontend Language** | TypeScript | 5.7.2 | Static typing and interfaces |
| **Build Tool** | Vite | 6.0.5 / 6.4.3 | High-speed ESM bundler and dev server |
| **CSS Framework** | Tailwind CSS | 3.4.17 | Utility-first glassmorphic styling |
| **3D Graph Engine** | Three.js & react-force-graph-3d | 0.186.0 / 1.29.1 | Cross-case IOC correlation visualization |
| **Backend Framework** | FastAPI | 0.115.0+ | Asynchronous REST API gateway |
| **ASGI Server** | Uvicorn | 0.32.0+ | High-concurrency Python server |
| **Backend Language** | Python | 3.12+ | Core backend logic & AI inference |
| **ORM / Data Access** | SQLAlchemy | 2.0.36 | Database abstraction & query engine |
| **DB Migrations** | Alembic | 1.14.0 | Schema migration versioning |
| **Async Drivers** | aiosqlite / asyncpg | 0.20.0 / 0.30.0 | Async SQLite & PostgreSQL support |
| **Password Hashing** | Argon2id (argon2-cffi) | 23.1.0 | Quantum-resistant password hashing |
| **Token Crypto** | PyJWT | 2.10.0 | Cryptographic JWT access & refresh tokens |
| **ML / Deep Learning**| PyTorch (torch) | 2.0.0+ | Model tensor computation & embeddings |
| **Transformers** | Hugging Face Transformers | 4.40.0+ | DeBERTa & BERT NLP inference |
| **Tabular Models** | XGBoost / Joblib | 2.0.0 / 1.3.0 | Zero-hour URL phishing classifier |
| **File Parsing** | PyPDF / python-docx / BeautifulSoup | 5.0.0+ / 1.1.0+ | Document text extraction & RAG ingestion |
| **Test Framework** | Pytest & Playwright | 8.3.0 / 1.64.1 | Unit, integration & E2E browser tests |

---

### 2. Complete Directory Structure Mapping

```
CCIP-main/
├── .github/                   # GitHub Actions CI/CD workflows
├── backend/                   # Python FastAPI Backend
│   ├── alembic/               # Database migrations & versions
│   ├── app/
│   │   ├── ai/                # AI Model Manager & Classifiers
│   │   │   ├── adapters/      # Multi-model inference adapters
│   │   │   ├── extractors/    # IOC & Cyber entity extractors
│   │   │   ├── trainers/      # Model training & fine-tuning pipelines
│   │   │   ├── model_manager.py # Thread-safe singleton model lifecycle
│   │   │   └── complaint_classifier.py
│   │   ├── api/               # 28 REST API Routers
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── cases.py
│   │   │   ├── complaints.py
│   │   │   ├── evidence.py
│   │   │   ├── intelligence.py
│   │   │   ├── knowledge_materials.py # Sovereign RAG upload & index API
│   │   │   ├── public_chat.py         # Citizen AI Chatbot endpoints
│   │   │   ├── specialist.py
│   │   │   └── websocket.py
│   │   ├── core/              # Security, Config & Permissions
│   │   │   ├── config.py
│   │   │   ├── exceptions.py
│   │   │   ├── model_config.py
│   │   │   ├── permissions.py # Centralized RBAC enforcement
│   │   │   └── security.py    # Argon2id & JWT token operations
│   │   ├── db/                # Database engine & session setup
│   │   ├── models/            # 43 SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic v2 validation contracts
│   │   └── services/          # 32 Business logic service modules
│   ├── ml_models/             # 14 Trained machine learning model weights
│   ├── tests/                 # 48 Automated test suites
│   ├── ccip.db                # SQLite database (53 tables)
│   └── requirements.txt
├── docs/                      # Architectural, compliance & user documentation
│   ├── architecture/
│   ├── audit/
│   └── chatbot/
├── frontend/                  # React 18 + Vite frontend
│   ├── src/
│   │   ├── api/client.ts      # Unified typed API client
│   │   ├── components/
│   │   │   ├── admin/         # KnowledgeMaterialsView, Admin governance
│   │   │   ├── citizen/       # FileComplaintWizard, FloatingChatbotWidget
│   │   │   ├── intelligence/  # 3D CorrelationGraph, DetectionLab, etc.
│   │   │   └── ui/            # Reusable buttons, cards, modals
│   │   ├── views/             # 5 Main Portal Views
│   │   │   ├── LandingPage.tsx
│   │   │   ├── CitizenPortal.tsx
│   │   │   ├── SpecialistPortal.tsx
│   │   │   ├── AIPortal.tsx
│   │   │   └── AdminPortal.tsx
│   │   ├── types/             # Domain TypeScript definitions
│   │   └── App.tsx            # Main portal router and state coordinator
│   └── package.json
├── LOGO/                      # High-resolution brand assets & logos
├── scripts/                   # Seeding, migration & maintenance scripts
└── docker-compose.yml         # Containerized production orchestrator
```

---

### 3. Core Subsystem Inspection Findings

1. **Authentication Subsystem:**
   - Employs Argon2id password hashing with configurable time and memory costs.
   - Issues short-lived JWT access tokens and rotatable refresh tokens stored in database `refresh_tokens`.
   - Supports Google OAuth exchange; validates tokens and resolves user email into active database user records.
   - **Vulnerability Found:** Access token fallback in local development allowed expired tokens to silently resolve to administrator fallback, which must be strictly gated by `ENVIRONMENT == 'production'`.

2. **Authorization & RBAC:**
   - Roles are defined via `RoleEnum` with explicit permission decorators (`require_admin`, `require_specialist`, `require_role`).
   - Resource-level checks in `evidence_service.py` prevent cross-citizen IDOR/BOLA attacks.
   - **Fixed Issue:** Database role mismatch where portal switching changed visual state while JWT remained assigned to `CITIZEN`, causing 403 errors on admin endpoints. Resolved via role promotion and staff override rules.

3. **Digital Evidence Pipeline:**
   - Computes SHA-256 hash upon ingestion to guarantee evidence integrity.
   - Scans uploaded files through `malware_service.py` before quarantine release.
   - Derived forensic artifacts (OCR, text extraction, extracted entities) are saved in `document_processing_results` without altering original raw bytes.

4. **Sovereign RAG Chatbot Pipeline:**
   - Public chat endpoints (`/api/v1/public-chat/session`, `/api/v1/public-chat/message`) allow unauthenticated citizens to ask safety questions without credentials.
   - Material upload and indexing restricted strictly to Administrators via `POST /api/v1/admin/knowledge-materials`.
   - Cosine similarity vector search retrieves only approved chunks (`chatbot_status == 'AVAILABLE'`).
   - Hardcoded prompt guardrails trigger instant 1930 Helpline advice for financial frauds.

