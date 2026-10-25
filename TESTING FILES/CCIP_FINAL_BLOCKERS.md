# CCIP / Astraea Enclave — Consolidated Release Gate Register

**Document Version:** 2.0.0 (Post-Second-Pass Audit Reconciliation)  
**Current Release Status:** `CONDITIONAL GO — NOT CLEARED FOR LIVE DEPLOYMENT`  
**Purpose:** Consolidated release gate register encompassing all primary deployment blockers and secondary operational readiness gates, responsible owners, risks, and exact closure criteria required prior to live production deployment (addressing finding `REV-013`).

---

## 1. Consolidated Release Gate Register

Every gate in this register must be formally validated and signed off before live production traffic can be authorized:

| Gate ID | Category | Requirement | Severity / Priority | Responsible Owner | Risk Assessment | Exact Owner Action Required | Validation Needed to Close | Target Environment | Current Status |
|---|---|---|---|---|---|---|---|---|:---:|
| **BLK-001** | Primary Infrastructure | Production Secrets Provisioning | **P0 (Critical)** | Cloud Infrastructure Lead | Running production with default or developer keys compromises JWT tokens, session cookies, and database authentication. | Provision high-entropy keys in Cloud Key Vault / AWS Secrets Manager (`SECRET_KEY`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`). Inject via Kubernetes secrets / container environment. | Execute backend startup configuration validator in staging. Confirm application initializes cleanly, rejects default secrets, and outputs zero secret values in stdout/logs. | Staging / Production | **PENDING** |
| **BLK-002** | Primary Infrastructure | Live ClamAV Daemon Deployment | **P0 (Critical)** | DevOps Platform Lead | Evidence files cannot receive real anti-malware definition scans while the scanner container is offline, leaving files in unverified quarantine. | Deploy official ClamAV container service (`clamav/clamav:latest`) exposing TCP port 3310. Set `MALWARE_SCANNER_TYPE=clamav` and configure `CLAMAV_HOST` / `CLAMAV_PORT`. | 1. Execute health probe against ClamAV daemon.<br>2. Upload safe synthetic EICAR test file and verify automatic quarantine with verdict `INFECTED`.<br>3. Upload clean PDF/image and verify status `MALWARE_SCAN_CLEAN` to close `E2E-003`. | Staging / Production | **PENDING** |
| **BLK-003** | Primary Infrastructure | Neural Model Weights Provisioning | **P1 (High)** | MLOps Lead | If advanced transformer-based NER, relation extraction, and contextual embeddings are required, the platform currently operates in fallback mode. | Mount approved neural model weights (DeBERTa / BERT / LLM checkpoints) from private model registry into `/models`. Set `ENABLE_NEURAL_MODELS=true`. *(Or formally approve rule-based heuristic-only mode).* | Run model loader self-test script. Verify that model weights load into GPU/memory without OOM exceptions and health telemetry reports `NEURAL_INFERENCE_ACTIVE` to close `AI-003`. | AI GPU Node / Staging | **PENDING** |
| **OP-001** | Secondary Operational | Automated Disaster Recovery & Backup Drill | **P1 (High)** | Database Administrator | Unrecoverable data loss in the event of hardware failure, database corruption, or ransomware attack. | Configure daily automated PostgreSQL WAL archiving and pg_dump snapshots to encrypted, immutable cloud object storage. Execute a mock disaster recovery drill. | Signed Disaster Recovery Drill Report confirming recovery point objective (RPO < 1 hour) and recovery time objective (RTO < 4 hours). | Staging Database | **PENDING** |
| **OP-002** | Secondary Operational | CI Code Coverage Threshold Enforcement | **P2 (Medium)** | QA Automation Lead | Regressions introduced into untested branches without developer awareness. | Update `.github/workflows/ci.yml` line 49–60 to append `--cov=app --cov-report=term-missing --cov-fail-under=80`. | Successful GitHub Actions run output demonstrating branch coverage $\ge 80\%$ to close test case `CI-008`. | CI Workflow | **PENDING** |
| **OP-003** | Secondary Operational | TLS Proxy & Security Header Audit | **P1 (High)** | Edge Security Engineer | Man-in-the-middle attacks, clickjacking, or MIME sniffing if TLS reverse proxy is misconfigured. | Configure production reverse proxy (Nginx / Cloudflare) to terminate TLS 1.3, emit `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, and inject strict `Content-Security-Policy`. | SSL Labs A+ rating report and automated curl header capture verifying HSTS and CSP presence on all public routes. | Reverse Proxy | **PENDING** |
| **OP-004** | Secondary Operational | Multi-User Concurrency & Capacity Benchmarking | **P1 (High)** | Performance Engineering Lead | Service degradation or worker exhaustion under simultaneous citizen reporting spikes. | Execute Locust / k6 load tests against staging environment simulating 250 concurrent citizens and 50 investigators for 30 minutes. | Performance benchmark report demonstrating p95 API latency $< 250\text{ ms}$ and error rate $< 0.1\%$ to satisfy test cases `PERF-002` through `PERF-008`. | Staging Cluster | **PENDING** |

---

## 2. Release Gate Verification Protocol

1. **Staging Environment Prerequisite:** Gating validation must occur in an isolated staging environment mirroring production topology, never in the developer local enclave.
2. **Sequential Verification:**
   - Step 1: Inject secrets (`BLK-001`) and start ClamAV container (`BLK-002`).
   - Step 2: Validate live EICAR scan and close `E2E-003`.
   - Step 3: Mount model weights (`BLK-003`) and close `AI-003`.
   - Step 4: Execute load tests (`OP-004`) and close `PERF-002`..`008`.
   - Step 5: Update CI with coverage flags (`OP-002`) and close `CI-008`.
   - Step 6: Verify reverse proxy TLS/HSTS (`OP-003`) and DR backup restore (`OP-001`).
3. **Formal Sign-off:** Following closure of all 7 gates, a formal joint sign-off by the Security Lead, DevOps Lead, and Product Owner transitions the release verdict from `CONDITIONAL GO` to unqualified `GO`.
