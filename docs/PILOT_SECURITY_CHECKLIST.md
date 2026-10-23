# Pilot Security & Compliance Hardening Checklist

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Benchmark:** OWASP Top 10 (2021) / OWASP ASVS Level 2 Baseline  
**Status Legend:**  
- **`IMPLEMENTED`**: Fully active and verified in current prototype codebase.  
- **`PARTIAL`**: Present in prototype architecture; requires production infrastructure configuration for pilot.  
- **`REQUIRED FOR PILOT`**: Mandatory pre-deployment configuration prior to connecting to live network feeds.  

---

## 1. Comprehensive Security & Infrastructure Audit Checklist

| Security Control Category | Specific Requirement | Current Status | Prototype Code Evidence | Pilot Production Implementation Requirement |
|---|---|---|---|---|
| **1. Authentication & Session** | Strong password complexity (12+ chars, upper, lower, digit, special) | `IMPLEMENTED` | `backend/app/core/security.py` | Enforce across all departmental active directory accounts. |
| | Brute-force account lockout policy (5 failed attempts = 15m lockout) | `IMPLEMENTED` | `backend/app/services/auth_service.py` | Integrate with centralized Redis cache in multi-instance clusters. |
| | Cryptographic JWT signing with algorithm enforcement (HS256/RS256) | `IMPLEMENTED` | `backend/app/core/security.py` | Migrate from static enclave secret to automated HashiCorp Vault key rotation. |
| | Multi-Factor Authentication (MFA / TOTP) for Staff Roles | `PARTIAL` | Schema support in `users.mfa_secret` | Mandate hardware security keys (FIDO2/WebAuthn) or departmental authenticator apps. |
| **2. Authorization & RBAC** | Strict 5-role RBAC enforcement across all API endpoints | `IMPLEMENTED` | `backend/app/core/permissions.py` | Maintain automated daily CI/CD permission regression testing. |
| | IDOR prevention on complaint and evidence endpoints | `IMPLEMENTED` | `backend/app/services/complaint_service.py` | Verify zero public access without authenticated ownership. |
| | State machine transition validation | `IMPLEMENTED` | `backend/app/core/state_machine.py` | Maintain non-bypassable transition graph. |
| **3. Evidence & Data Security** | Cryptographic SHA-256 evidence integrity sealing | `IMPLEMENTED` | `backend/app/services/evidence_service.py` | Write cryptographic digest to write-restricted database schema. |
| | Evidence file upload type, MIME, and size validation | `IMPLEMENTED` | `backend/app/api/evidence.py` | Max 25MB per file, restricted to PDF, PNG, JPG, TXT. |
| | Antivirus / Malware scanning on incoming evidence uploads | `REQUIRED FOR PILOT` | None (handled via OS during prototype) | Integrate ClamAV / ICAP daemon to scan files before writing to enclave storage. |
| | Local enclave filesystem isolation | `IMPLEMENTED` | `backend/app/services/storage_service.py` | Mount evidence storage volume with `noexec` flags and restricted POSIX permissions. |
| **4. Network & Communication** | TLS 1.3 encryption for all HTTP traffic | `PARTIAL` | Enforced at reverse proxy level | Configure Nginx / Traefik with automated TLS cert renewal and HSTS headers. |
| | Zero external cloud AI API egress | `IMPLEMENTED` | `local_files_only=True` in all 11 adapters | Firewall outbound network egress; enforce air-gap on production enclave hosts. |
| | Global API Rate Limiting & Throttling | `PARTIAL` | Middleware stub in FastAPI | Configure Redis-backed rate limiting at API gateway (100 req/min per IP). |
| | CORS policy restriction | `IMPLEMENTED` | `backend/app/main.py` | Restrict `allow_origins` strictly to designated departmental hostnames. |
| **5. Database & Storage** | Asynchronous ORM query parameterization (Zero SQLi) | `IMPLEMENTED` | `backend/app/services/` (SQLAlchemy 2.0) | Enforce 100% parameterized queries; forbid raw string SQL concatenation. |
| | Database migration to high-availability RDBMS | `REQUIRED FOR PILOT` | SQLite WAL active in prototype | Migrate from SQLite to PostgreSQL with read replicas and automated WAL archiving. |
| | Automated Encrypted Daily Database Backups | `REQUIRED FOR PILOT` | Manual file copy in prototype | Configure automated pg_dump with GPG encryption to isolated offline backup target. |
| | Ransomware-resistant air-gapped backup snapshotting | `REQUIRED FOR PILOT` | None in prototype | Implement 3-2-1 backup strategy with immutable WORM cloud or tape backups. |
| **6. Audit & Logging** | Immutable operational audit logging (`audit_logs`) | `IMPLEMENTED` | `backend/app/services/audit_service.py` | Forward audit events to append-only syslog or central SIEM (Splunk/ELK). |
| | Sensitive data log sanitization (Zero PII / credentials in logs) | `IMPLEMENTED` | `backend/app/core/logging.py` | Automated log scrubbing pipeline ensuring tokens/passwords never touch disk. |
| **7. AI/ML Governance** | Deterministic 5-hard-gate feedback filtering | `IMPLEMENTED` | `backend/app/ai/adapters/feedback_gate.py` | Programmatic barrier active across all candidate creation endpoints. |
| | Quarantined learning candidate queue (Zero auto-retraining) | `IMPLEMENTED` | `backend/app/models/learning_candidate.py` | Staging schema isolated from production inference weights. |
| | Model artifact cryptographic integrity verification | `PARTIAL` | In-memory hash checks | Verify SHA-256 hash of `model.safetensors` against certified release manifest on load. |
| | Model rollback capability | `IMPLEMENTED` | Supported via `model_registry` schema | Implement one-click version rollback in MLOps portal. |
| **8. Vulnerability Management**| Automated dependency vulnerability scanning | `IMPLEMENTED` | `pip-audit` / `npm audit` clean | Integrate continuous Snyk / Dependabot vulnerability scanning in deployment CI/CD. |
| | Professional third-party penetration testing | `REQUIRED FOR PILOT` | Internal security review complete | Contract external CREST-certified penetration testing firm prior to Phase P2. |

---

## 2. Pre-Pilot Mandatory Sign-Off Gates

Prior to authorizing Phase P1 (Shadow-Mode Pilot) or Phase P2 (Supervised Operational Pilot), the Pilot Lead and Chief Information Security Officer (CISO) must sign off on three mandatory gates:

1. **Gate A: Network Isolation Sign-Off:** Confirmation that the enclave host has no outbound internet route to external AI services.
2. **Gate B: Antivirus & Storage Hardening Sign-Off:** ClamAV daemon active and scanning all evidence uploads prior to ingestion.
3. **Gate C: PostgreSQL & Backup Hardening Sign-Off:** Production PostgreSQL database running with encrypted daily backups and verified restore capability.
