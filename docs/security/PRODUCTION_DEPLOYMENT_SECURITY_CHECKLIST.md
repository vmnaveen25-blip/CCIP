# CCIP Production Deployment Security Checklist
**Pre-Flight Security & Infrastructure Hardening Standards**
**Document Reference:** `CCIP-DEPLOY-CHECKLIST-2026-V1`  
**Classification:** Sovereign Cloud & Enterprise Deployment

---

## 1. Environment & Authentication Hardening

- [ ] **Enforce Production Mode:** Verify `.env` contains `APP_ENV=production` and `ENVIRONMENT=production`.
- [ ] **Disable Dev Auth Bypass:** Verify `ALLOW_DEV_AUTH_BYPASS=False` is set in production configuration.
- [ ] **Rotate JWT Signing Secret:** Replace default/development `JWT_SECRET_KEY` with a cryptographically generated 256-bit entropy secret (`openssl rand -hex 32`).
- [ ] **Argon2id Parameters:** Confirm password hashing uses time cost $t \ge 3$, memory cost $m \ge 65536$ KiB, parallelism $p \ge 4$.
- [ ] **Cookie Security:** Ensure all auth session cookies have `Secure=True`, `HttpOnly=True`, and `SameSite=Strict`.

---

## 2. Reverse Proxy & Network Perimeter

- [ ] **Strict TLS Termination:** Terminate TLS 1.3 with forward secrecy ciphers at Nginx / Caddy / Cloudflare perimeter.
- [ ] **Header Scrubbing:** Explicitly strip and sanitize untrusted client headers:
  ```nginx
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  ```
- [ ] **Security Headers:** Enforce `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- [ ] **Rate Limiting:** Enforce token-bucket limits on sensitive routes:
  - `/api/v1/auth/login`: Max 5 attempts per IP per 5 minutes.
  - `/api/v1/auth/otp/send`: Max 3 attempts per phone per 15 minutes.
  - `/api/v1/evidence/upload`: Max 10 uploads per user per minute.
  - `/api/v1/public-chat/message`: Max 30 queries per session.

---

## 3. Malware & Ingestion Infrastructure

- [ ] **ClamAV Daemon Container:** Deploy a dedicated ClamAV daemon sidecar container on `localhost:3310` with hourly signature updates (`freshclam`).
- [ ] **Scanner Routing:** Set `MALWARE_SCANNER_TYPE=clamav`, `CLAMAV_HOST=clamav-service`, `CLAMAV_PORT=3310`.
- [ ] **Quarantine Storage Mount:** Mount `storage/quarantine/` with `noexec` and `nosuid` flags.
- [ ] **File Size Gate:** Verify reverse-proxy `client_max_body_size` is aligned with application limit (`25M`).

---

## 4. Digital Evidence & Custody Storage

- [ ] **WORM Storage:** Back `storage/evidence/` with an S3-compatible object store configured with Object Lock (Compliance Mode) and Legal Hold APIs.
- [ ] **SHA-256 Validation:** Ensure on-demand hash verification runs nightly via scheduled automated audit worker.
- [ ] **Section 65B Certification:** Confirm certifying officer names and digital signatures are verified against personnel clearance directory.
- [ ] **Statutory Retention:** Verify purge routines strictly respect active legal holds (`is_legal_hold == True`).

---

## 5. AI Models & Inference Runtime

- [ ] **Model Asset Verification:** Ensure production model registry mounts weights (`model.safetensors` and `phishing_model.pkl`) with read-only permissions.
- [ ] **Degraded Fallback Monitoring:** Configure Prometheus telemetry alerting if any model falls back to heuristic execution in production.
- [ ] **Memory & Resource Caps:** Allocate minimum 8 GB RAM and 4 CPU cores for worker nodes running local transformer inference.

---

## 6. Database & Persistence Hardening

- [ ] **Foreign Key Enforcement:** Confirm `PRAGMA foreign_keys = ON;` is executed on SQLite connection checkout, or migrate to PostgreSQL with foreign key constraints.
- [ ] **Connection Pooling:** Configure async connection pool with `pool_size=20`, `max_overflow=10`, and `pool_timeout=30`.
- [ ] **Automated Backups:** Implement point-in-time recovery (PITR) with encrypted offsite snapshots.
