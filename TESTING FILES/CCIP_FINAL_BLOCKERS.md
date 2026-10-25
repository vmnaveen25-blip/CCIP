# CCIP / Astraea Enclave — Outstanding Release Blockers & Operational Gates

**Document Version:** 1.0.0  
**Current Release Status:** `CONDITIONAL GO — NOT CLEARED FOR LIVE DEPLOYMENT`  
**Purpose:** Enumerate all outstanding deployment gates, operational prerequisites, responsible owners, associated risks, and exact closure criteria required prior to live production deployment.

---

## 1. Primary Deployment Blockers

| Blocker ID | Name & Scope | Responsible Owner | Severity / Risk | Required Owner Action | Exact Validation Needed to Close | Target Environment |
|---|---|---|---|---|---|---|
| **BLK-001** | Production Secrets Provisioning | Cloud Infrastructure & SecOps Lead | **P0 (Critical)** — Running production with default or developer keys compromises JWT tokens, session cookies, and database authentication. | Provision high-entropy, cryptographically secure keys in Cloud Key Vault / AWS Secrets Manager (`SECRET_KEY`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`). Inject via Kubernetes secrets / container environment. | Execute backend startup configuration validator in staging environment. Confirm that application initializes cleanly, rejects default secrets, and outputs zero secret values in stdout/logs. | Staging / Production Cluster |
| **BLK-002** | ClamAV Antivirus Daemon Service | DevOps & Platform Engineering Lead | **P0 (Critical)** — Uploaded citizen evidence files cannot receive real anti-malware definition scans while the scanner container is offline, leaving files in unverified quarantine. | Deploy official ClamAV container service (`clamav/clamav:latest`) alongside the backend stack. Expose TCP port 3310. Set `MALWARE_SCANNER_TYPE=clamav` and configure `CLAMAV_HOST` / `CLAMAV_PORT`. | 1. Execute health probe against ClamAV daemon.<br>2. Upload safe synthetic EICAR test file and verify automatic quarantine with verdict `INFECTED`.<br>3. Upload clean PDF/image and verify status `MALWARE_SCAN_CLEAN`. | Staging / Production Container Stack |
| **BLK-003** | Neural Model Weights Provisioning | AI/ML Operations (MLOps) Lead | **P1 (High)** — If advanced transformer-based NER, relation extraction, and contextual embeddings are required, the platform currently operates in fallback mode. | Download approved neural model weights (DeBERTa / BERT / LLM checkpoints) from the private model registry into the persistent `/models` directory. Set `ENABLE_NEURAL_MODELS=true`. *(Note: If stakeholder formally approves rule-based heuristic-only mode, this blocker is reclassified as Not Applicable).* | Run model loader self-test script. Verify that model weights load into memory without OOM exceptions and health telemetry reports `NEURAL_INFERENCE_ACTIVE`. | AI/ML GPU Node / Staging Cluster |

---

## 2. Secondary Operational Readiness Gates

In accordance with finding `AUD-013`, resolving the three primary infrastructure blockers above is necessary but not sufficient for live production rollout. The following operational gates must also be satisfied:

### Gate OP-001: Automated Backup & Disaster Recovery Drill
- **Responsible Owner:** Database Administrator (DBA)
- **Risk:** Unrecoverable data loss in the event of hardware failure, database corruption, or ransomware attack.
- **Action Required:** Configure daily automated PostgreSQL WAL archiving and pg_dump snapshots to encrypted, immutable cloud object storage. Execute a mock disaster recovery drill restoring data to an isolated target database.
- **Closure Evidence:** Signed Disaster Recovery Drill Report confirming recovery point objective (RPO < 1 hour) and recovery time objective (RTO < 4 hours).

### Gate OP-002: CI Pipeline Code Coverage Enforcement
- **Responsible Owner:** QA Automation Lead
- **Risk:** Regressions introduced into untested branches without developer awareness.
- **Action Required:** Update `.github/workflows/ci.yml` line 49–60 to append `--cov=app --cov-report=term-missing --cov-fail-under=80`.
- **Closure Evidence:** Successful GitHub Actions run output demonstrating branch coverage $\ge 80\%$ to close test case `CI-008`.

### Gate OP-003: Reverse-Proxy TLS & Security Header Auditing
- **Responsible Owner:** Network & Edge Security Engineer
- **Risk:** Man-in-the-middle attacks, clickjacking, or MIME sniffing if TLS proxy misconfigured.
- **Action Required:** Configure production reverse proxy (Nginx / Cloudflare) to terminate TLS 1.3, emit `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, and inject strict `Content-Security-Policy`.
- **Closure Evidence:** SSL Labs A+ rating report and automated curl header capture verifying HSTS and CSP presence on all public routes.

### Gate OP-004: Multi-User Concurrency & Capacity Benchmarking
- **Responsible Owner:** Performance Engineering Lead
- **Risk:** Service degradation or timeouts under simultaneous citizen reporting spikes.
- **Action Required:** Execute Locust / k6 load tests against staging environment simulating 250 concurrent citizens and 50 investigators for 30 minutes.
- **Closure Evidence:** Performance benchmark report demonstrating p95 API latency $< 250\text{ ms}$ and error rate $< 0.1\%$ to satisfy test cases `PERF-002` through `PERF-008`.

---

## 3. Summary & Release Recommendation

The software prototype is functionally sound, bug-remediated, and fully verified across all unit, integration, and browser workflows within the developer enclave. However, live deployment is strictly conditional upon closing the above gates.

**Current Verdict:** `CONDITIONAL GO — NOT CLEARED FOR LIVE DEPLOYMENT`  
**Next Evaluation Point:** Following staging cluster deployment and verification of BLK-001, BLK-002, and BLK-003.
