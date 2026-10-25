# AI Cybercrime Intelligence Platform (CCIP / Astraea Enclave)

A unified sovereign cybercrime reporting, judicial triage, SOC digital forensics, and MLOps ecosystem.

---

## ⚡ Quick Start (One Command)

To run both the **FastAPI Backend** and the **React + Vite Frontend** concurrently:

```bash
npm run dev
```

This single command automatically:
1. Detects Python virtual environment (`backend/venv`, `.venv`, or system python).
2. Performs port availability pre-checks (ports `8000` and `5173`).
3. Launches the FastAPI backend on `http://localhost:8000`.
4. Launches the React/Vite frontend on `http://localhost:5173`.
5. Probes backend health (`/health`) and prints service status.
6. Gracefully handles `Ctrl+C` termination without leaving orphaned processes.

---

## 🌐 URLs & Access

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
- **Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🛠 Project Controller Commands

All operations run from the **project root**:

| Command | Action |
| :--- | :--- |
| `npm run dev` | **Start Frontend + Backend concurrently** |
| `npm run setup` | Initial setup: installs npm deps, creates Python venv, installs requirements, seeds DB |
| `npm run frontend` | Start only the React / Vite frontend |
| `npm run backend` | Start only the FastAPI backend |
| `npm run build` | Build the production frontend bundle |
| `npm run test` | Run the backend pytest test suite |

---

## 📁 Unified Project Structure

```
CCIP/
│
├── frontend/                     # React 18 + TypeScript + TailwindCSS + Vite
│   ├── src/                      # UI components, portals, and API client
│   ├── public/                   # Static assets
│   ├── index.html                # Single-page app root
│   ├── package.json              # Frontend-specific dependencies
│   ├── vite.config.ts            # Vite server & proxy (/api -> :8000)
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.js        # Design tokens and styles
│   ├── postcss.config.js         # PostCSS plugins
│   ├── .env                      # Local frontend environment
│   └── .env.example              # Frontend environment template
│
├── backend/                      # FastAPI Python Application
│   ├── app/                      # Application source
│   │   ├── api/                  # 16+ REST & WebSocket routers
│   │   ├── core/                 # Config, logging, security (Argon2id + JWT)
│   │   ├── db/                   # Async SQLAlchemy engine & base
│   │   ├── models/               # 33+ Database models
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/             # Evidence vault, OTP, notifications
│   │   └── main.py               # Application entrypoint & /health
│   │
│   ├── alembic/                  # Database migrations
│   ├── scripts/                  # Seed scripts (seed.py)
│   ├── tests/                    # Pytest test suite
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Backend container definition
│   ├── .env                      # Local backend environment
│   └── .env.example              # Backend environment template
│
├── scripts/                      # Orchestration & automation
│   ├── dev.mjs                   # Unified concurrent startup & health probe
│   ├── setup.mjs                 # One-command dependency installer
│   └── test.mjs                  # Pytest launcher
│
├── package.json                  # SINGLE ROOT CONTROLLER
├── docker-compose.yml            # Multi-service production stack
├── .gitignore                    # Git ignore patterns
├── .env                          # Centralized root environment
├── .env.example                  # Environment template
└── README.md                     # Documentation
```

---

## 🔑 Development & Local Testing Accounts

For isolated local testing, initial development roles can be initialized using the backend seed utility:
```bash
# In local development mode:
npm run setup
# Or directly via Python venv:
python backend/scripts/seed.py
```

> **Security Notice:** Demo-account seeding is strictly prohibited in production environments. Passwords for local development accounts are defined via local environment variables or generated during setup. In production, administrative and specialist accounts must be provisioned through secure role-based enrollment with multi-factor authentication (MFA).

| Operational Role | Local Dev Identifier | Clearance Level | Purpose |
| :--- | :--- | :--- | :--- |
| **System Admin** | `root@astraea.internal` | ROOT ENCLAVE | System governance & access control |
| **Verified Citizen** | `elena.rostova@cyberdefense.org` | CITIZEN TIER | Citizen complaint intake & status tracking |
| **Cybercrime Police** | `s.chen@police.gov` | LEO TIER 2 | Law enforcement dispatch (Future module) |
| **SOC Specialist** | `a.thorne@astraea.gov` | TIER-3 FORENSICS | Forensic analysis & cross-case correlation |
| **AI/ML System Lead** | `m.vance@ai-ops.gov` | ML-OPS LEVEL 4 | Model registry & continual learning governance |

---

## 🐳 Production Deployment (Docker Compose)

For multi-container deployment with PostgreSQL, Redis, and MinIO:

```bash
docker compose up --build
```
