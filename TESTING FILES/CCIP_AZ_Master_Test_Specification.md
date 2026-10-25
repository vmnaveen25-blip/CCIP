# CCIP / Astraea Enclave — A–Z Master Test Specification

**Document version:** 1.0  
**Prepared:** 2026-10-25  
**Purpose:** Drive evidence-based implementation verification, automated testing, UI testing, API/security testing, regression, and release-readiness assessment for the Citizen Cybercrime Intelligence Platform (CCIP / Astraea Enclave).  
**Execution target:** The exact local workspace currently open in Antigravity.  
**Important:** This specification is a test plan, not proof that tests have passed. The execution report must be generated from real test runs and captured evidence.

## 1. Mission and testing principle

Use Antigravity as a QA orchestrator across the entire stack. Use **Playwright where browser behavior is the thing being tested**, not as a replacement for API tests, backend unit/integration tests, database assertions, authorization testing, migration checks, model-adapter tests, static analysis, scanner checks, or deployment verification. This plan aims for broader evidence-backed coverage than a browser-only suite; it does not claim that a Markdown file or AI agent is intrinsically better than Playwright.

**Evidence earns PASS.** The existence of code, a green build, a passing subset of tests, screenshots alone, or an AI-generated statement is not sufficient proof of a behavior. Each `PASS` requires the observed result and linked evidence.

## 2. Baseline evidence received from project owner

The following results were reported by the project owner and are **not independently reproduced by this document's author**:

| Reported check | Reported result | How to treat it |
|---|---:|---|
| `tests/test_investigation_chat.py` | 7/7 passed | Reported pass; verify exact workspace SHA and output file |
| Combined core security/workflow/E2E list, including `test_investigation_chat.py` | 46/46 passed in 35.82s | Reported pass; do not add this to the 7 test count because the chat file is listed in this combined suite |
| Degraded modes + multi-model adapters + admin RBAC | 15/15 passed in 16.07s | Reported pass; independently rerun and inspect skips/xfails |
| Frontend `npm run build` | 0 TypeScript errors; 2,488 modules transformed | Reported build success; rerun in clean checkout and retain full log |
| `python -m alembic upgrade head` | `2a9dad9c139f -> b4c19d28e7f1` | Reported migration success; verify the migration file and inspect schema/data preservation |
| `.github/workflows/ci.yml` | Reported created | Verify file exists in current workspace, parses, and actually runs |
| `CCIP_FINAL_PRODUCTION_READINESS_REPORT.md` | Reported created, 13 sections | Read it, reconcile each claim with source/tests/evidence |
| Release determination | `GO — Conditionally Production Ready` | Treat as an assertion to audit, not an accepted independent conclusion |

### 2.1 Important workspace-versus-remote drift check

A read-only inspection of the GitHub default-branch snapshot available during preparation did **not** find `CCIP_FINAL_PRODUCTION_READINESS_REPORT.md` or `.github/workflows/ci.yml`. In that remotely visible snapshot, `backend/app/api/evidence.py` still used `get_optional_current_user` for evidence upload, `backend/app/api/cases.py` case listing/detail appeared broadly staff-gated without an explicit object-level assignment check in those handlers, and `backend/app/main.py` still performed `Base.metadata.create_all` plus a swallowed direct `ALTER TABLE` attempt at startup. This could simply mean the reported remediation is local/uncommitted or that the remote snapshot is stale; it is **not** proof that the active Antigravity workspace is unremediated.

**Mandatory first action:** record active `git status`, branch, HEAD SHA, relevant diff, and file existence. Run tests against the active workspace, never silently switch branches/pull/reset, and never overwrite uncommitted remediation. If the active workspace still has the old behavior, record a mismatch and test/fix the code there before declaring the requirement passed.

## 3. Release prerequisites already reported

The owner's completion message explicitly lists these remaining requirements before live deployment:

1. Supply strong production values for `SECRET_KEY`, `POSTGRES_PASSWORD`, and `REDIS_PASSWORD` via the deployment secret mechanism.
2. Start and verify the ClamAV container before enabling `MALWARE_SCANNER_TYPE=clamav`.
3. Install the required large model artifacts from the private registry before claiming neural inference. Until then, verify truthful offline heuristic behavior and the absence of avoidable HTTP 500 failures.

These are release gates, not optional cleanup. Add any further blockers found by testing. Do not copy secrets into this Markdown, Git, screenshots, logs, or report artifacts.

## 4. Execution safety and guardrails

1. **Never** point tests at production databases, live evidence storage, real citizen accounts, real cases, or an external production model endpoint.
2. Use a dedicated test database, synthetic users/data/files, scanner test adapter or EICAR test string, and provider stubs. Do not execute real malware.
3. Do not run `git reset --hard`, `git clean`, destructive database commands, migrations against production, mass-deletion scripts, secret rotation, or deploy/push actions without explicit owner authorization.
4. Never use actual PII. Use synthetic canary strings such as `CCIP-PII-CANARY-TEST-7f19` and fake names/emails/phone numbers.
5. Redact tokens, OTPs, API keys, passwords, private keys, database URLs, and sensitive case text from test artifacts.
6. Do not weaken authorization or scanning controls just to make tests pass. A failing security test is a defect or a documented policy mismatch, not a reason to reduce the expected protection.
7. Test against the application's documented routes/contracts discovered from the current checkout. Do not invent endpoints. If a named capability does not exist, record `BLOCKED` or `NOT APPLICABLE` with a reason and identify the missing implementation.
8. Keep test runs bounded. Performance and abuse tests must be run only in isolated test environment with conservative volumes.

## 5. Required outputs from Antigravity

Save artifacts under a dedicated path such as `artifacts/ccip-test-run/<run-id>/` or a similarly safe, non-production location. Required deliverables:

- `CCIP_TEST_EXECUTION_REPORT.md` — summary, environment, suite totals, per-test statuses, defect register, release gates, and evidence links.
- `CCIP_TEST_RESULTS.csv` or JSON — one row/object per executed case, including ID/status/timestamp/duration/evidence/defect.
- Raw logs for each command, including exit code and start/end time.
- Playwright HTML report, trace/video/screenshots/HAR for meaningful UI failures (redact before sharing).
- API request/response artifacts with secrets and sensitive content removed.
- Alembic history/schema evidence and synthetic data preservation checks.
- Model inventory and actual runtime status; clearly distinguish weights present, weights loadable, fallback active, and provider reachable.
- Defect records with severity, reproduction steps, expected/actual, root cause, fix reference, and retest result.

## 6. Test status definitions

- **PASS:** Test executed on the recorded workspace, expected behavior observed, and evidence attached.
- **FAIL:** Test executed; observed behavior contradicts the expected result.
- **BLOCKED:** Execution was attempted or planned but a required test environment/service/credential/artifact is unavailable. State the exact blocker and owner action.
- **NOT RUN:** Not executed. This is not a pass.
- **NOT APPLICABLE:** Requirement demonstrably does not apply to the current product/configuration; explain why and obtain owner confirmation for release-critical items.
- **REPORTED PASS:** A previous report claims success but current run evidence has not independently reproduced it. This status is permitted only in the baseline comparison, not counted as a current-run PASS.

Do not mark `SKIPPED`, `XFAIL`, `WARN`, or `BLOCKED` tests as PASS. Keep skipped/xfail counts separate in the suite summary.

## 7. Severity and release gate policy

- **P0 / Critical:** authentication bypass, object-level access failure, cross-citizen data leak, narrative leak to restricted model, unauthorized evidence/report download, false malware-clean status, fake digital signature/seal, destructive data loss, exposed secret, or false production readiness claim. Must be fixed and retested before a release GO.
- **P1 / High:** major lifecycle failure, incorrect state, missing audit trail, migration/data integrity issue, false report/AI result, or critical workflow blocked. Must be fixed or explicitly accepted by owner with documented risk before release.
- **P2 / Medium:** non-critical usability/performance/accessibility issue or supported-format edge case. Track and make a release decision based on impact.
- **P3 / Low:** cosmetic issue with no material accessibility, privacy, security, or workflow impact.

A `GO` requires all P0 tests passed, all P1 failures fixed or formally accepted, no unresolved release blocker, migrations verified on a disposable prior-schema database, and live-deployment prerequisites complete. If any required condition is unmet, use `NO-GO` or `CONDITIONAL GO — NOT CLEARED FOR LIVE DEPLOYMENT`, never an unqualified GO.

## 8. Test tools — select by what needs proof

| Concern | Primary method | Additional evidence |
|---|---|---|
| Pure logic, validators, services, model adapters | pytest/unit tests | Coverage, fixtures, deterministic stubs |
| API contract, auth, IDOR, input validation | pytest + HTTPX/TestClient or the repo's existing API client | Status/body, request IDs, DB assertions |
| Browser routing/forms/role leakage/loading/empty states | Playwright | Trace, screenshot, console, network/HAR |
| Persistence, uniqueness, migrations, audit trail | SQL assertions against isolated test DB | Before/after row counts, schema diff |
| File integrity and quarantine | pytest + synthetic fixtures + ClamAV/EICAR in isolated stack | SHA-256 recomputation, scanner verdict, object-store state |
| Model availability/fallback/provider routing | adapter tests with stubs + local runtime probes | model manifest, runtime status, captured provider target |
| Frontend types and bundle | package scripts (`npm run build` if present) | full clean-build log |
| Container wiring/readiness | Docker Compose / container health | service status/logs, readiness probes |
| Performance | bounded Locust/k6/pytest benchmark or installed tool | test population, config, p50/p95/p99, resource use |

## 9. Preconditions and synthetic role/data matrix

Create synthetic identities through supported test fixtures or approved test setup; do not hardcode working passwords in the report.

| Identity alias | Intended test role | Data ownership/scope |
|---|---|---|
| `citizen_a` | Citizen | Complaint/case A only |
| `citizen_b` | Citizen | Complaint/case B only |
| `officer_a` | Police/investigator role defined by code | Case A assignment |
| `officer_b` | Same broad role as A, distinct assignment | Case B assignment |
| `specialist_a` | Forensic/cyber specialist | Explicitly assigned permitted scope only |
| `ai_ml_lead` | AI/ML System Lead | Restricted narratives must be masked/minimized by policy |
| `admin_a` | Administrator | Approved administrative operations and audit access |
| `anonymous` | No authenticated identity | Public-only operations explicitly documented by product |

Seed only synthetic cases and indicators. Each case must include distinct canary strings so accidental cross-case retrieval is detectable. Record test record IDs in a separate protected artifact; avoid placing sensitive tokens in general logs.

## 10. Coverage execution order

Run in this order unless a dependency makes it impossible:

1. Baseline and environment safety (`BASE-*`).
2. Fast backend checks: auth, RBAC/object authorization, complaint/tracking, case workflow, evidence safety, reports, AI/degraded modes, chat, correlation, admin/audit.
3. Database/migration and CI checks.
4. Frontend build and browser smoke/role matrix.
5. End-to-end journeys with synthetic data.
6. Bounded performance/reliability checks.
7. Regression rerun after any fix.
8. Final release gate review.

If a P0 test fails, preserve its evidence, report it immediately, and continue independent tests only when safe. Do not stop at the first red test if the remaining run can be safely completed. After fixes, rerun the exact failed test and every test sharing the changed authorization/service/state path.

## 11. Test cases

This specification contains **219 test cases** across 18 domains. Every case must be individually recorded in the execution report; suite-level green output does not replace per-case traceability.


### A. Baseline, test safety, and repository truth


#### BASE-001 — Capture repository identity and revision

- **Priority:** P0  
- **Type/tool:** Terminal/Git  
- **Tags:** general  
- **Preconditions:** Local Antigravity workspace is open.  
- **Steps:** Run `git rev-parse --show-toplevel`, `git branch --show-current`, `git rev-parse HEAD`, and `git status --short`. Save the outputs before running tests.  
- **Expected result:** Repository root, branch, commit SHA, and dirty-file list are recorded; no existing work is discarded.  
- **Evidence to attach:** Terminal output; SHA; status output.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### BASE-002 — Preserve uncommitted implementation changes

- **Priority:** P0  
- **Type/tool:** Terminal/Git  
- **Tags:** general  
- **Preconditions:** Workspace may contain uncommitted remediation.  
- **Steps:** Review `git status --short` and `git diff --stat`; do not checkout, reset, clean, stash, or overwrite files unless the owner explicitly directs it.  
- **Expected result:** All pre-existing modifications remain intact; test outputs are placed in a dedicated artifacts folder.  
- **Evidence to attach:** Before/after git status and diff stat.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### BASE-003 — Verify claimed report and CI files exist in workspace

- **Priority:** P0  
- **Type/tool:** Terminal/Git  
- **Tags:** general  
- **Preconditions:** Post-remediation report claims the files were created.  
- **Steps:** Check the exact paths `CCIP_FINAL_PRODUCTION_READINESS_REPORT.md` and `.github/workflows/ci.yml`; inspect their contents and timestamps.  
- **Expected result:** Files exist in the active workspace and content matches the reported implementation; if missing, record discrepancy without fabricating success.  
- **Evidence to attach:** File paths, content excerpt, git status.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### BASE-004 — Check workspace versus remote snapshot drift

- **Priority:** P0  
- **Type/tool:** Terminal/Git  
- **Tags:** general  
- **Preconditions:** Git remote is configured.  
- **Steps:** Record `git remote -v`; compare current branch/HEAD and relevant changed paths against remote tracking branch, without pulling or switching branches.  
- **Expected result:** It is clear whether remediation is local/uncommitted, committed locally, or present remotely; no automatic synchronization occurs.  
- **Evidence to attach:** HEAD SHAs; `git diff <remote>/<branch>...HEAD --stat`; note remote status.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### BASE-005 — Confirm isolated test environment

- **Priority:** P0  
- **Type/tool:** Terminal/config  
- **Tags:** general  
- **Preconditions:** Test configuration is available.  
- **Steps:** Inspect effective environment variable names and test DB/cache/storage endpoints without printing secret values. Confirm the app cannot point at production resources.  
- **Expected result:** Tests target an isolated test database and test storage; secret values are not written to logs or artifacts.  
- **Evidence to attach:** Redacted config summary; test DB name/host.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### BASE-006 — Confirm safe test-data policy

- **Priority:** P0  
- **Type/tool:** Static review  
- **Tags:** general  
- **Preconditions:** Test fixtures can be created.  
- **Steps:** Search fixture data and test scripts for real citizen PII, real credentials, production endpoints, or genuine evidence files. Replace any accidental real data with synthetic values.  
- **Expected result:** Only synthetic test identities and files are used; no real cases or user data are changed.  
- **Evidence to attach:** Fixture inventory; redacted scan output.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### BASE-007 — Verify deterministic test execution instructions

- **Priority:** P1  
- **Type/tool:** Terminal/static review  
- **Tags:** general  
- **Preconditions:** Dependencies are installed in the workspace.  
- **Steps:** Read `pyproject.toml`/requirements, frontend package scripts, pytest configuration, and README instructions. Resolve exact commands from current repository rather than assuming these docs are current.  
- **Expected result:** Each planned command is supported by this checkout and its runtime; absent dependencies are reported as blockers.  
- **Evidence to attach:** Command inventory and versions.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### BASE-008 — Record test environment/version metadata

- **Priority:** P1  
- **Type/tool:** Terminal  
- **Tags:** general  
- **Preconditions:** Test runner is available.  
- **Steps:** Capture OS, Python version, Node/npm version, browser versions, database version, Redis/storage state, and model artifact inventory. Redact secrets.  
- **Expected result:** A reproducible environment manifest is saved with the run.  
- **Evidence to attach:** Environment manifest.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### B. Authentication, sessions, and identity lifecycle


#### AUTH-001 — Valid login succeeds

- **Priority:** P0  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth  
- **Preconditions:** Active test user exists for each supported role.  
- **Steps:** Submit valid credentials through the supported login API/UI.  
- **Expected result:** A session/token is issued with the intended identity and role; no password or secret appears in response/logs.  
- **Evidence to attach:** Redacted response; status code; UI screenshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-002 — Invalid password is rejected

- **Priority:** P0  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth,negative  
- **Preconditions:** Active test account exists.  
- **Steps:** Submit correct identifier with an incorrect password.  
- **Expected result:** Authentication fails with generic safe error; no token/session is created and no user existence leak is introduced.  
- **Evidence to attach:** Response status/body; session absence.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-003 — Unknown account login is rejected safely

- **Priority:** P1  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth,negative  
- **Preconditions:** No account exists for synthetic email.  
- **Steps:** Attempt login with the nonexistent identifier.  
- **Expected result:** Authentication fails without exposing account-enumeration details beyond approved policy.  
- **Evidence to attach:** Response comparison for unknown vs wrong password.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-004 — Missing credential fields are rejected

- **Priority:** P1  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth,negative  
- **Preconditions:** Login endpoint is reachable.  
- **Steps:** Send request with missing username/email, missing password, empty strings, and malformed body.  
- **Expected result:** Validation rejects invalid bodies predictably; no traceback or 500 response.  
- **Evidence to attach:** Each request/status/body.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-005 — Inactive or disabled account cannot authenticate

- **Priority:** P0  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth  
- **Preconditions:** Create a disabled test account.  
- **Steps:** Attempt login with correct credentials.  
- **Expected result:** Login is denied and no active session is issued.  
- **Evidence to attach:** Fixture state and response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-006 — Expired access token is rejected

- **Priority:** P0  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth,negative  
- **Preconditions:** Obtain a token with controlled short expiry or use a safe expired fixture.  
- **Steps:** Call a protected endpoint after expiration.  
- **Expected result:** Request is denied with the documented authentication status; protected data is not returned.  
- **Evidence to attach:** Request/response and token metadata with secret redacted.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-007 — Tampered token signature is rejected

- **Priority:** P0  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth,negative  
- **Preconditions:** A valid test token is available.  
- **Steps:** Change one token byte/claim without signing and call protected endpoint.  
- **Expected result:** Request is rejected; no identity or privilege escalation occurs.  
- **Evidence to attach:** Request/response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-008 — Token claim tampering does not elevate role

- **Priority:** P0  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth,negative  
- **Preconditions:** Role-based tokens are in use.  
- **Steps:** Attempt to alter role/user ID claims in a token without the signing key.  
- **Expected result:** Tampered token is rejected; server-side role is not trusted from unsigned client input.  
- **Evidence to attach:** Request/response and relevant auth implementation reference.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-009 — Logout invalidates session when designed to do so

- **Priority:** P1  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth  
- **Preconditions:** Logged-in test user and logout path exist.  
- **Steps:** Logout; then replay token/session against a protected endpoint.  
- **Expected result:** Session is invalidated according to the documented strategy; if JWTs are stateless, documented expiry/revocation behavior is verified instead.  
- **Evidence to attach:** Before/after protected request.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-010 — Refresh token rotation/reuse behavior

- **Priority:** P1  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth  
- **Preconditions:** Refresh flow exists and test client has a refresh token.  
- **Steps:** Refresh once; attempt reuse of prior refresh token; replay the new token.  
- **Expected result:** Refresh policy is enforced, old-token reuse is rejected if rotation is specified, and token values are never logged.  
- **Evidence to attach:** Redacted responses; session store evidence.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-011 — Password reset or OTP flow boundary checks

- **Priority:** P1  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth  
- **Preconditions:** Password recovery/OTP is enabled in this deployment.  
- **Steps:** Test wrong OTP, expired OTP, reused OTP, too many attempts, and successful one-time use with test provider.  
- **Expected result:** Invalid/replayed codes fail, expiry/cooldown is enforced, and success changes only the intended account.  
- **Evidence to attach:** Provider sandbox output; responses; timestamps.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-012 — OAuth callback validates state and redirect

- **Priority:** P1  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth  
- **Preconditions:** Google OAuth is configured for a test client.  
- **Steps:** Test valid callback, missing/invalid state, invalid code, and unapproved redirect URI.  
- **Expected result:** Only valid flow completes; state/redirect validation blocks CSRF/open-redirect paths.  
- **Evidence to attach:** Callback requests and config with secrets redacted.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-013 — Authentication errors do not leak secrets

- **Priority:** P0  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth  
- **Preconditions:** Auth logs and error middleware are observable in test environment.  
- **Steps:** Trigger invalid credentials and malformed auth token; inspect client response and logs.  
- **Expected result:** No password, full token, OTP, API key, or secret appears in response/logs.  
- **Evidence to attach:** Redacted logs and response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUTH-014 — Rate limit or abuse controls on authentication

- **Priority:** P1  
- **Type/tool:** pytest/API; UI where applicable  
- **Tags:** auth  
- **Preconditions:** Test environment has auth abuse controls enabled.  
- **Steps:** Submit a controlled series of failed logins from a test client within the configured window.  
- **Expected result:** Rate limits/lockout/step-up policy triggers as documented without locking unrelated users.  
- **Evidence to attach:** Request series; limiter logs/metrics.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### C. Role-based access control and object-level authorization


#### RBAC-001 — Anonymous caller cannot read protected case

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** A case with synthetic data exists.  
- **Steps:** Call case list and direct case detail APIs with no token.  
- **Expected result:** Both are denied; no case or linked complaint data is returned.  
- **Evidence to attach:** Status/body for list and detail.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-002 — Citizen cannot read another citizen case

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Citizen A and Citizen B have separate synthetic complaints/cases.  
- **Steps:** Login as A; request B case by internal ID and case number.  
- **Expected result:** Access is denied or resource is consistently hidden per policy; B data is not disclosed.  
- **Evidence to attach:** Requests; identities; response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-003 — Citizen cannot use list filters to enumerate others

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Multiple synthetic users/cases exist.  
- **Steps:** As citizen, vary case IDs, complaint IDs, status, priority, and pagination/filter values.  
- **Expected result:** Only authorized personal records are returned; total counts do not leak inaccessible records.  
- **Evidence to attach:** Requests and response comparisons.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-004 — Unassigned staff cannot read restricted case

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Case has assignment to Staff A; Staff B has same broad role but no assignment.  
- **Steps:** As B, request case detail through every alias/identifier and any linked complaint route.  
- **Expected result:** Object-level case policy is enforced consistently on each endpoint.  
- **Evidence to attach:** API results for IDs, case number, linked resource.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-005 — Assigned specialist reads permitted case

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Specialist A is explicitly assigned to a synthetic case.  
- **Steps:** Request case detail and approved linked evidence/complaint fields.  
- **Expected result:** Only the scope approved for that specialist is returned; required operational fields remain usable.  
- **Evidence to attach:** API response and assignment record.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-006 — Specialist cannot change assignment or privilege

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Specialist has access to one case.  
- **Steps:** Attempt to assign another staff member, alter role, change protected case fields, and call admin-only endpoints.  
- **Expected result:** Forbidden operations fail; no partial mutation occurs.  
- **Evidence to attach:** Status/body plus before/after DB snapshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-007 — Police/investigator access follows assignment policy

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Two officers with distinct assignments exist.  
- **Steps:** Run identical read/write operations on assigned and unassigned cases under both accounts.  
- **Expected result:** Only operations allowed by role and assignment policy succeed.  
- **Evidence to attach:** Role/assignment matrix results.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-008 — Administrator rights are intentional and audited

- **Priority:** P1  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Admin test account exists.  
- **Steps:** Perform an approved administrative user/role/assignment action.  
- **Expected result:** Action succeeds only via approved admin path and creates an audit record.  
- **Evidence to attach:** Response and audit row.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-009 — AI/ML System Lead cannot read raw citizen narrative by default

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Complaint includes unique synthetic canary text and identifiable-looking fake fields.  
- **Steps:** As AI/ML System Lead, inspect case list/detail, model endpoints, correlation data, logs, report preview, and exports.  
- **Expected result:** Narrative is masked or withheld on all restricted paths; no canary/raw content leaks unless an explicit, approved, audited permission grants it.  
- **Evidence to attach:** Response field scan; UI screenshots; logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-010 — Narrative masking occurs server-side before model call

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** A test instrument can capture model inputs in a local test adapter.  
- **Steps:** Submit synthetic complaint with fake name/email/phone and canary token; trigger AI triage.  
- **Expected result:** Model adapter receives masked/minimized text before the network/model boundary, not merely a masked UI rendering.  
- **Evidence to attach:** Captured test-adapter prompt/input, redacted.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-011 — Report access inherits case permission

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Report A relates to case A; user cannot access case A.  
- **Steps:** Attempt report metadata, detail, preview, export/download, and report generation referencing case A.  
- **Expected result:** All paths consistently deny access; report IDs cannot be used to bypass case permission.  
- **Evidence to attach:** Requests and before/after state.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-012 — Evidence read/download inherits complaint/case permission

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Evidence A belongs to protected complaint/case A.  
- **Steps:** As unauthorized user, request evidence metadata, processing status, download, and direct object/storage path if exposed.  
- **Expected result:** All unauthorized paths fail without revealing file bytes, hash, filename, or sensitive metadata beyond approved denial details.  
- **Evidence to attach:** Responses and storage access log.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-013 — Evidence processing actions require authority

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Evidence A exists; caller is authenticated but unassigned/role-restricted.  
- **Steps:** Invoke processing/reprocess/cancel/verify endpoints where available.  
- **Expected result:** Unauthorized actions are rejected and processing state remains unchanged.  
- **Evidence to attach:** Responses; DB state before/after.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-014 — Role cannot be changed through request payload

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Citizen and staff test users exist.  
- **Steps:** Submit registration/profile update payloads containing role/admin flags or user IDs for another person.  
- **Expected result:** Protected role/identity fields are ignored or rejected; persisted role remains unchanged.  
- **Evidence to attach:** Request/response and DB row.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-015 — Role-scoped model operations deny disallowed role

- **Priority:** P1  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** AI model endpoints exist.  
- **Steps:** Call each model inference/management route under citizen, specialist, police, and admin roles.  
- **Expected result:** Allowed matrix is enforced consistently; no hidden inference route bypasses checks.  
- **Evidence to attach:** Endpoint-by-role matrix.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-016 — Cross-case correlation review requires authorized reviewer

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Correlation candidate links two cases; user is not permitted to review one or both.  
- **Steps:** Attempt to approve, reject, mark duplicate, edit relation, or force refresh candidate.  
- **Expected result:** Disallowed review/update operations fail without changing decision or case data.  
- **Evidence to attach:** Requests; DB decision before/after.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-017 — Direct object IDs cannot bypass API scoping

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** IDs and case numbers for inaccessible records are known in a safe test fixture.  
- **Steps:** Replace visible IDs in URLs and JSON bodies with inaccessible IDs across read/write endpoints.  
- **Expected result:** Every endpoint performs authorization at object access; no IDOR.  
- **Evidence to attach:** Endpoint list and responses.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RBAC-018 — Authorization failure has no side effect

- **Priority:** P0  
- **Type/tool:** pytest/API + DB assertions; UI smoke  
- **Tags:** security,rbac,negative  
- **Preconditions:** Prepare target record and snapshot its relevant fields.  
- **Steps:** Attempt a forbidden write or state transition; compare DB and audit events.  
- **Expected result:** No unauthorized mutation or misleading success audit is created.  
- **Evidence to attach:** Before/after DB snapshot and logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### D. Citizen complaint intake and lifecycle


#### COMP-001 — Citizen submits valid complaint

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Citizen is authenticated or an explicitly approved guest submission path is configured.  
- **Steps:** Submit complaint with valid title, description, category, contact consent, and only required fields.  
- **Expected result:** Complaint is stored once, receives stable reference/state, and displays truthful confirmation.  
- **Evidence to attach:** Response; DB row; UI screenshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-002 — Guest complaint flow matches documented policy

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Guest intake is intended by product design or is explicitly disabled.  
- **Steps:** Submit without a login; verify required guest verification/consent controls and record ownership strategy.  
- **Expected result:** Guest submission is either correctly supported with safe anti-abuse/ownership controls or rejected if guest intake is not allowed; no invented citizen identity is silently treated as verified.  
- **Evidence to attach:** UI/API response; DB fields.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-003 — Required fields are enforced

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Complaint form/API is available.  
- **Steps:** Submit with each required field missing, empty, null, whitespace, and invalid type.  
- **Expected result:** Validation explains correctable errors and writes no incomplete complaint.  
- **Evidence to attach:** Payload/status; DB count delta.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-004 — Length and boundary validation

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Complaint schemas and limits are discoverable.  
- **Steps:** Test min/max lengths, one character below/above bounds, Unicode, newline, and large body.  
- **Expected result:** Inputs inside policy bounds persist accurately; out-of-range inputs fail safely without 500 or truncation surprises.  
- **Evidence to attach:** Payloads; response; stored value lengths.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-005 — Malicious markup is safely rendered

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** A complaint can be viewed in a UI.  
- **Steps:** Submit escaped HTML/script/event-handler payloads in title and narrative; open all relevant views.  
- **Expected result:** Payload is rendered as text or safely sanitized; no script executes and no stored/reflected XSS occurs.  
- **Evidence to attach:** Playwright screenshot/trace and console.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-006 — Duplicate submit does not create accidental duplicate

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Complaint form/API allows submit.  
- **Steps:** Double-click submit and replay the same request using supported idempotency behavior.  
- **Expected result:** UI prevents accidental double submission; backend behavior is deterministic and dedupe is applied when the contract supports it.  
- **Evidence to attach:** Request IDs; DB record count.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-007 — Complaint reference is unique under concurrency

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Test DB only; reference creation is supported.  
- **Steps:** Create a burst of synthetic complaints concurrently and check unique constraint/collision handling.  
- **Expected result:** No two persisted complaints share a reference; conflicts are retried or returned safely.  
- **Evidence to attach:** Concurrent test output; uniqueness query.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-008 — Status transition follows allowed state graph

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Complaint lifecycle transitions are documented from current code.  
- **Steps:** Attempt each allowed transition and representative disallowed jumps through UI/API.  
- **Expected result:** Only permitted transitions occur; invalid transition is rejected with no partial update.  
- **Evidence to attach:** Transition matrix and DB audit trail.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-009 — Complaint status persists after reload

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Complaint has moved to a new state.  
- **Steps:** Reload UI and query the backing API after a fresh session/request.  
- **Expected result:** Persisted status/timestamps match the successful operation.  
- **Evidence to attach:** Before/after response and DB row.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-010 — Citizen sees own complaint only

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Two citizen users own distinct complaints.  
- **Steps:** Login as A and query list/detail/search/timeline for B.  
- **Expected result:** No B record or metadata leaks.  
- **Evidence to attach:** Endpoint results per user.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-011 — Citizen complaint edits are limited by lifecycle

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Complaint exists in pre- and post-review states.  
- **Steps:** Attempt permitted edits before review and prohibited edits after lifecycle lock.  
- **Expected result:** Edits are limited exactly as policy specifies and audit history records permitted changes.  
- **Evidence to attach:** Responses and audit rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-012 — Complaint category/severity values validated

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Valid enum values are confirmed in schema/UI.  
- **Steps:** Submit valid category/severity and unknown, lower/upper-case, forged risk/triage values.  
- **Expected result:** Only allowed client-supplied fields are accepted; server-calculated fields cannot be spoofed.  
- **Evidence to attach:** Responses and stored field values.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-013 — Triage fallback is truthful

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Model unavailable mode can be simulated safely.  
- **Steps:** Submit synthetic complaint while classifier service/assets are unavailable.  
- **Expected result:** Complaint intake remains available if designed to; triage is identified as fallback/unavailable and does not claim neural inference occurred.  
- **Evidence to attach:** Logs, result source/engine field, UI.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-014 — Attachment relationship is complaint-bound

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Two synthetic complaints and their upload sessions exist.  
- **Steps:** Try attaching evidence via another complaint ID and change request fields between upload and submission.  
- **Expected result:** Evidence belongs only to authorized intended complaint; mismatched relationship is rejected.  
- **Evidence to attach:** DB relation; API responses.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-015 — Concurrent status updates do not silently overwrite

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Two test staff accounts can update a synthetic complaint.  
- **Steps:** Read same state in two sessions and attempt concurrent conflicting transitions.  
- **Expected result:** Conflict/ordering behavior is deterministic; invalid stale update is reported or versioned safely.  
- **Evidence to attach:** Concurrent requests; history rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### COMP-016 — Complaint deletion/retention follows policy

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for form  
- **Tags:** complaint,workflow  
- **Preconditions:** Retention/deletion controls exist or policy specifies no physical delete.  
- **Steps:** Attempt citizen delete, admin delete, and retention expiry in test data.  
- **Expected result:** Only authorized policy-supported action occurs; evidence/audit dependencies and legal hold rules are respected.  
- **Evidence to attach:** Before/after rows and audit log.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### E. Complaint tracking and reference protection


#### TRACK-001 — Tracking requires appropriate verification

- **Priority:** P0  
- **Type/tool:** API + pytest; Playwright for UI  
- **Tags:** tracking,security  
- **Preconditions:** Complaint and its high-entropy tracking credential exist in test DB.  
- **Steps:** Request the tracking endpoint with reference only and with valid reference plus token.  
- **Expected result:** Unauthenticated detail/status exposure follows explicit policy; detailed/trusted data requires valid verification token where designed.  
- **Evidence to attach:** Response field inventory for both variants.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### TRACK-002 — Wrong tracking token is rejected

- **Priority:** P0  
- **Type/tool:** API + pytest; Playwright for UI  
- **Tags:** tracking,security  
- **Preconditions:** Known synthetic reference exists.  
- **Steps:** Submit wrong token, truncated token, and token for another complaint.  
- **Expected result:** Verification fails without exposing protected status or confirming a valid token.  
- **Evidence to attach:** Responses.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### TRACK-003 — Tracking token cannot be guessed from reference

- **Priority:** P0  
- **Type/tool:** API + pytest; Playwright for UI  
- **Tags:** tracking,security  
- **Preconditions:** At least one synthetic tracking reference exists.  
- **Steps:** Inspect token generation and issue low-volume bounded guesses with test rate limit.  
- **Expected result:** Token is high entropy, not derived from reference; guessing attempts are limited and audited.  
- **Evidence to attach:** Code reference; bounded rate-limit result.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### TRACK-004 — Reference enumeration is rate-limited

- **Priority:** P0  
- **Type/tool:** API + pytest; Playwright for UI  
- **Tags:** tracking,security  
- **Preconditions:** Tracking endpoint uses synthetic records only.  
- **Steps:** Issue controlled sequence of invalid refs from a test client.  
- **Expected result:** Abuse controls apply; responses do not leak whether refs are valid beyond approved policy.  
- **Evidence to attach:** Response pattern and limiter logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### TRACK-005 — Public tracking response minimizes data

- **Priority:** P0  
- **Type/tool:** API + pytest; Playwright for UI  
- **Tags:** tracking,security  
- **Preconditions:** Complaint contains synthetic PII/narrative/evidence filename.  
- **Steps:** Fetch public tracking response with permitted credential; inspect all nested fields.  
- **Expected result:** No raw narrative, contact details, evidence URLs, internal IDs, assignments, notes, or investigator identities leak unless explicitly approved.  
- **Evidence to attach:** Automated response field scan.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### TRACK-006 — Tracking token storage/use is safe

- **Priority:** P1  
- **Type/tool:** API + pytest; Playwright for UI  
- **Tags:** tracking,security  
- **Preconditions:** DB schema and service are accessible in test.  
- **Steps:** Inspect storage/transmission approach and logs; exercise token in query/body/header as designed.  
- **Expected result:** Token does not appear in logs/analytics/referrer; storage follows declared threat model and token values are not returned casually.  
- **Evidence to attach:** Schema and redacted log review.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### TRACK-007 — Tracking token rotates or revokes if supported

- **Priority:** P2  
- **Type/tool:** API + pytest; Playwright for UI  
- **Tags:** tracking,security  
- **Preconditions:** Token rotation/revocation policy exists.  
- **Steps:** Rotate/revoke a test token and replay old token.  
- **Expected result:** Old token no longer verifies if rotation/revocation is promised.  
- **Evidence to attach:** Before/after result.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### TRACK-008 — Tracking UI handles invalid and expired state

- **Priority:** P1  
- **Type/tool:** API + pytest; Playwright for UI  
- **Tags:** tracking,security  
- **Preconditions:** Tracking screen exists.  
- **Steps:** Enter malformed reference, wrong token, expired token (if applicable), and valid values.  
- **Expected result:** Accessible, non-enumerating error is shown; no stale data remains on screen after failure.  
- **Evidence to attach:** Playwright screenshots/trace.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### F. Case management, assignment, and investigation workflow


#### CASE-001 — Authorized staff creates case from complaint

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Validated synthetic complaint exists and actor has required role.  
- **Steps:** Invoke create-from-complaint once.  
- **Expected result:** One case links to the complaint, correct fields are populated, and an audit/timeline record is created.  
- **Evidence to attach:** Response; DB relationship; audit event.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-002 — Case creation is idempotent

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Complaint has a case or is eligible for case creation.  
- **Steps:** Call create-from-complaint repeatedly and concurrently.  
- **Expected result:** Exactly one official case remains linked to the complaint; retries do not create duplicate cases.  
- **Evidence to attach:** DB uniqueness query and concurrent test.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-003 — Case detail endpoint enforces object scope

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Case assigned to Staff A; Staff B unauthorized.  
- **Steps:** As B call detail by internal ID, external case number, and alternate accepted identifier.  
- **Expected result:** All identifiers enforce the same object authorization policy.  
- **Evidence to attach:** Responses for each identifier.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-004 — Case list is scoped by assignment/policy

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Cases are assigned to distinct staff and departments.  
- **Steps:** Query default case list, all filters, assigned-to-me true/false, and pagination.  
- **Expected result:** Default query cannot expose unassigned/inaccessible cases; filter toggles cannot bypass scope.  
- **Evidence to attach:** API response IDs vs expected access set.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-005 — Assignment requires authorized role

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Case and candidate users exist.  
- **Steps:** Attempt assignment as citizen, unauthorized specialist, assigned staff, and admin as policy allows.  
- **Expected result:** Only authorized assignment operations succeed.  
- **Evidence to attach:** Response and DB assignment before/after.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-006 — Assignment target must be valid and eligible

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** A case and user IDs exist; include nonexistent and wrong-role users.  
- **Steps:** Assign nonexistent, disabled, citizen, or ineligible user.  
- **Expected result:** Invalid assignments are rejected without corrupting relationship.  
- **Evidence to attach:** Response and assignment rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-007 — Assignment change is audited

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Actor can assign case.  
- **Steps:** Change assignment from Staff A to Staff B.  
- **Expected result:** Previous and new assignee, actor, time, and case are traceable in audit history.  
- **Evidence to attach:** Audit event and DB changes.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-008 — Unauthorized case status transition is rejected

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Case status graph and role permissions are known.  
- **Steps:** Attempt status changes as each role, including invalid transitions.  
- **Expected result:** Only allowed actors/transitions succeed; no partial state or misleading UI success.  
- **Evidence to attach:** Role-transition matrix.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-009 — Priority/risk values cannot be forged

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Case exists.  
- **Steps:** Submit impossible priority/risk scores and client-supplied risk flags.  
- **Expected result:** Server validates or recalculates protected fields; unauthorized arbitrary risk changes fail.  
- **Evidence to attach:** Request, response, DB snapshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-010 — Case reopen/close requires reason and permission

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Case is closed/resolved in test fixture.  
- **Steps:** Attempt reopen/close with no reason, invalid reason, and valid reason as roles.  
- **Expected result:** Policy is enforced and reopening creates a visible history/audit record.  
- **Evidence to attach:** Requests and timeline.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-011 — Case status history is append-only/traceable

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Multiple valid transitions completed.  
- **Steps:** Query status history, compare actor/time/order, attempt alteration where endpoint exists.  
- **Expected result:** Historical transitions remain ordered and protected against ordinary mutation.  
- **Evidence to attach:** History rows; negative mutation response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-012 — Investigation activity creation is scoped

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Case assigned to investigator A.  
- **Steps:** Create activity/note as A then attempt as unrelated user; try forged actor ID.  
- **Expected result:** Allowed activity persists with authenticated actor; unauthorized insert is rejected and actor cannot be spoofed.  
- **Evidence to attach:** Response and activity row.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-013 — Investigation finding links to source evidence

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Evidence and case are valid and authorized.  
- **Steps:** Create finding referencing evidence; then attempt foreign case/evidence ID.  
- **Expected result:** Valid finding preserves traceability; invalid relationship is rejected.  
- **Evidence to attach:** Finding/evidence foreign-key relations.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-014 — Cross-case action cannot silently modify source case

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** Correlation candidate connects cases A/B.  
- **Steps:** Review/refresh correlation, then compare source-case status/assignment and audit data.  
- **Expected result:** Correlation action does not make unapproved changes to cases; all side effects are explicit and audited.  
- **Evidence to attach:** Before/after DB diff.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CASE-015 — Case data persists across process restart

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; UI smoke  
- **Tags:** case,workflow,authorization  
- **Preconditions:** A test case and investigation activity have been created.  
- **Steps:** Restart only the test app process; retrieve case and activity again.  
- **Expected result:** Durable data remains available and consistent.  
- **Evidence to attach:** Before/after IDs and DB query.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### G. Evidence upload, quarantine, processing, integrity, and download


#### EVID-001 — Unauthenticated upload is denied or tightly scoped

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Evidence upload endpoint and guest policy are confirmed from current code/design.  
- **Steps:** Attempt upload with no credentials; then test the documented guest-upload credential if such a path exists.  
- **Expected result:** Anonymous upload is rejected unless a deliberate, narrowly scoped guest capability exists; no anonymous arbitrary complaint attachment is allowed.  
- **Evidence to attach:** HTTP response; complaint/evidence DB records.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-002 — Authenticated uploader must own or be authorized for complaint

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Complaints A/B belong to separate test citizens.  
- **Steps:** Upload to own complaint; then use same user/session to upload to another citizen’s complaint.  
- **Expected result:** Own authorized upload succeeds; cross-citizen upload is denied with no stored evidence row/object.  
- **Evidence to attach:** API responses; DB/object-store count.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-003 — File type allowlist enforced server-side

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Evidence upload accepts test files.  
- **Steps:** Try allowed document/image/archive formats and disallowed executable/script/unknown extensions with spoofed MIME.  
- **Expected result:** Policy is enforced using server-side content/extension checks; dangerous files are rejected or quarantined.  
- **Evidence to attach:** Payloads; scan results; response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-004 — File size boundary enforced

- **Priority:** P1  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Configured upload limit is identified.  
- **Steps:** Upload just below, at, and above max size; also send oversized chunked request if supported.  
- **Expected result:** Accepted sizes follow configuration; oversize uploads fail before excessive resource use.  
- **Evidence to attach:** Size values and responses.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-005 — Filename traversal and special names are neutralized

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Upload endpoint active.  
- **Steps:** Use `../`, absolute paths, Unicode separators, long filenames, reserved device names, and CRLF characters.  
- **Expected result:** Storage path is generated safely; original display name is escaped/normalized; no filesystem traversal or header injection.  
- **Evidence to attach:** Storage path listing; metadata; headers.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-006 — SHA-256 matches received bytes

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Use a known synthetic file with known bytes.  
- **Steps:** Upload file; independently compute SHA-256 of original bytes and compare API/DB digest.  
- **Expected result:** Digest exactly matches the uploaded byte stream and is consistent wherever displayed.  
- **Evidence to attach:** Computed hash; API response; DB row.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-007 — Evidence bytes cannot be changed without detection

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Evidence is stored with integrity hash.  
- **Steps:** In isolated test storage, mutate stored bytes; download/verify.  
- **Expected result:** Integrity verification detects mismatch and marks/reports evidence as tampered or invalid; it does not claim verified.  
- **Evidence to attach:** Before/after hash and verification response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-008 — Malware-infected file is rejected/quarantined

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** ClamAV or test scanner adapter is available in non-production test.  
- **Steps:** Upload the standard EICAR test string/file, not real malware.  
- **Expected result:** File is blocked or quarantined; content is not processed/downloaded as clean; event is auditable.  
- **Evidence to attach:** Scanner verdict; state transition; response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-009 — Scanner unavailable produces explicit NOT_SCANNED state

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Use test adapter or stop only the isolated scanner service.  
- **Steps:** Upload harmless synthetic file while scan service is unreachable.  
- **Expected result:** State is NOT_SCANNED/QUARANTINED per policy; UI never marks scan as passed or verified clean.  
- **Evidence to attach:** Scanner error; evidence status; UI.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-010 — Unscanned files are not processed as trusted

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Evidence in NOT_SCANNED state exists.  
- **Steps:** Attempt OCR/parser/AI extraction, export, and ordinary download.  
- **Expected result:** Unscanned evidence is blocked or limited to explicit safe/quarantined handling; no downstream processor runs as if clean.  
- **Evidence to attach:** Processing queue logs; DB status.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-011 — Scanner clean verdict is distinguished from integrity digest

- **Priority:** P1  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Harmless file and online scanner are available.  
- **Steps:** Upload clean file and inspect verification fields.  
- **Expected result:** Hash integrity, malware verdict, forensic verification, and human validation remain distinct concepts; no field conflates them.  
- **Evidence to attach:** API/DB field mapping.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-012 — Malformed or empty file is handled safely

- **Priority:** P1  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Upload endpoint active.  
- **Steps:** Upload zero-byte file, corrupt PDF, invalid image, malformed archive, and incorrect MIME.  
- **Expected result:** File is rejected or stored in explicit invalid state; parser exceptions do not cause 500 or leave partial objects.  
- **Evidence to attach:** Responses; storage cleanup check.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-013 — Evidence metadata is owner/role scoped

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Evidence A is attached to a protected complaint.  
- **Steps:** Call metadata endpoint as owner, authorized staff, and unrelated citizen.  
- **Expected result:** Response follows policy; inaccessible metadata is not disclosed.  
- **Evidence to attach:** Responses by role.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-014 — Evidence download rechecks authorization

- **Priority:** P0  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** A valid download URL exists.  
- **Steps:** Access as owner/authorized staff then replay URL as unrelated user and without token.  
- **Expected result:** Download endpoint reauthorizes every request; URL alone does not become a bearer secret unless explicitly designed and bounded.  
- **Evidence to attach:** HTTP status; bytes received.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-015 — Download response prevents content sniffing and unsafe inline execution

- **Priority:** P1  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** A test file can be downloaded.  
- **Steps:** Download HTML/SVG or another active content type; inspect content disposition and security headers.  
- **Expected result:** Potentially active evidence is served as attachment or safe MIME policy; nosniff and relevant security headers are present.  
- **Evidence to attach:** Response headers and browser behavior.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-016 — Evidence processing state machine is valid

- **Priority:** P1  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Test adapter can simulate queued, processing, completed, failed, quarantined, and not-scanned states.  
- **Steps:** Drive each supported transition and retry from failure.  
- **Expected result:** Only documented transitions occur; invalid transition does not mark a failed/unsafe object clean.  
- **Evidence to attach:** Transition table; DB state.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-017 — Parser resource limits prevent archive bombs

- **Priority:** P1  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Safe bounded test fixtures prepared.  
- **Steps:** Test nested archives, excessive entry count, path traversal entries, and expansion size within isolated resource limits.  
- **Expected result:** Parser enforces limits and blocks traversal/bomb behavior without exhausting host resources.  
- **Evidence to attach:** Resource metrics; parser response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### EVID-018 — Failed upload cleans partial DB/object state

- **Priority:** P1  
- **Type/tool:** pytest/API + DB/object store; scanner adapter  
- **Tags:** evidence,security  
- **Preconditions:** Fault injection available in test.  
- **Steps:** Cause failure after object upload but before DB commit, then failure after DB insert if test hooks permit.  
- **Expected result:** No orphaned object or inconsistent evidence row remains; retry is safe.  
- **Evidence to attach:** DB/object-store before/after inventory.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### H. AI models, privacy masking, provider routing, and safe degradation


#### AI-001 — Model readiness reflects actual required weight files

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Model configuration and model directories exist.  
- **Steps:** For every registered model compare status API output with required config/tokenizer/weight files and runtime-load probe.  
- **Expected result:** Availability is not inferred from config/metrics/tokenizer alone; missing weights are reported unavailable or fallback-only.  
- **Evidence to attach:** Status API plus file manifest.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-002 — Missing neural model weights trigger explicit fallback

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Run in fixture/environment with selected weights absent.  
- **Steps:** Invoke affected inference endpoint.  
- **Expected result:** Safe heuristic/rule-based fallback is explicitly labeled; no neural model success is claimed and no avoidable 500 occurs.  
- **Evidence to attach:** Response engine/source flag; logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-003 — Present weights are loadable, not just present

- **Priority:** P1  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** At least one model artifact set is installed in test.  
- **Steps:** Run a cold-load inference test and one repeated inference.  
- **Expected result:** Model loads from expected path and returns schema-valid output; load errors are surfaced as unavailable rather than masked as success.  
- **Evidence to attach:** Load logs; timing; output.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-004 — Model output schema is validated

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Inference adapter is reachable.  
- **Steps:** Feed representative valid, empty, boundary, and malformed inputs.  
- **Expected result:** Outputs satisfy schema/range constraints; malformed provider output is rejected or safely normalized.  
- **Evidence to attach:** Input/output fixtures.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-005 — Low confidence is represented without overclaiming

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Model can emit low-confidence output via fixture.  
- **Steps:** Invoke with ambiguous input and inspect response/UI.  
- **Expected result:** Uncertainty/low confidence is visible; system does not present uncertain inference as fact or automated final determination.  
- **Evidence to attach:** API/UI output.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-006 — AI fallback mode is transparent in UI and API

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Disable optional model or provider only in test environment.  
- **Steps:** Use email/SMS/URL/complaint/correlation paths that use the model.  
- **Expected result:** System reports active engine or degradation state and does not show fabricated neural metrics/results.  
- **Evidence to attach:** Status endpoints; UI screenshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-007 — Provider routing matches configured provider

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Provider config can be set in test environment; use fake/stub endpoint.  
- **Steps:** Run with each supported provider setting; capture outbound adapter target without secrets.  
- **Expected result:** Configured provider determines actual adapter used; unsupported provider names fail validation or explicitly fall back, never silently route to another provider.  
- **Evidence to attach:** Provider stub logs; config mapping.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-008 — Gemini/local runtime secrets are not hardcoded or exposed

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Config and container definitions available.  
- **Steps:** Inspect defaults, environment wiring, errors, debug logs, and API responses for provider API key use.  
- **Expected result:** Production requires externally supplied secrets; placeholder strings are not accepted as usable credentials; keys are redacted.  
- **Evidence to attach:** Config assertions; secret-scan results.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-009 — Citizen narrative masking covers all model ingress

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Synthetic canary plus fake PII are seeded; capture adapter input.  
- **Steps:** Trigger triage, NER, summarization, investigation chat retrieval, correlation, and report drafting as restricted role.  
- **Expected result:** Restricted models/services receive minimized/masked content; canary scan is clean across every configured path, including retries.  
- **Evidence to attach:** Captured adapter payload scans.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-010 — Prompt injection is treated as untrusted content

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Local/stub model adapter and investigation chat route exist.  
- **Steps:** Use benign security test strings requesting system prompt disclosure, tool misuse, or policy override inside complaint/evidence text.  
- **Expected result:** System instructions and tool permissions remain isolated; content is treated as data and unauthorized tools/actions do not execute.  
- **Evidence to attach:** Prompt fixture; model/tool logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-011 — AI has no authority to perform final case decisions

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** AI triage/investigation recommendations can be generated.  
- **Steps:** Generate a high-risk suggestion and attempt to use output as direct case close/assignment or guilt determination.  
- **Expected result:** Recommendations remain advisory; final action requires an authorized human and is audited.  
- **Evidence to attach:** Workflow result and audit trail.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-012 — URL phishing detector handles safe representative cases

- **Priority:** P1  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** URL classifier model or fallback is available.  
- **Steps:** Test benign URLs, obvious suspicious synthetic URLs, malformed URL, internationalized domain, IP-literal URL, and empty input using non-clicked strings.  
- **Expected result:** Output follows declared schema, handles edge cases, discloses fallback, and does not fetch untrusted URLs unexpectedly.  
- **Evidence to attach:** Fixture results and outbound network capture.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-013 — Email/SMS threat classifier uses neutral labels and uncertainty

- **Priority:** P1  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Relevant models/adapters enabled or fallback mode declared.  
- **Steps:** Test benign, suspicious, unknown, multilingual/Unicode, and long inputs.  
- **Expected result:** Classification output is structured with confidence/engine and avoids fabricated accuracy claims.  
- **Evidence to attach:** Request/response and engine flag.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-014 — Metrics have provenance and are not invented at runtime

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Metric JSON/reports exist.  
- **Steps:** Compare model metrics API to persisted evaluation artifacts and baseline provenance docs.  
- **Expected result:** Metrics match source artifacts, have dataset/split provenance and timestamps, and missing metrics are null/unknown rather than guessed.  
- **Evidence to attach:** Artifact comparison.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-015 — AI errors do not leak raw sensitive input

- **Priority:** P0  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Model adapter can be forced to raise a controlled exception.  
- **Steps:** Trigger failure with synthetic canary/PII in input and inspect API error/log/telemetry.  
- **Expected result:** Client sees safe generic error and correlation/request ID; raw sensitive input and secrets are not logged.  
- **Evidence to attach:** Error response and redacted logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AI-016 — External-provider calls use data minimization and safe timeouts

- **Priority:** P1  
- **Type/tool:** pytest/model stubs + API; static config review  
- **Tags:** ai,privacy,degradation  
- **Preconditions:** Stub provider can observe outbound requests.  
- **Steps:** Simulate slow provider, provider 429/500, and oversized input.  
- **Expected result:** Timeout/retry/circuit-breaker policy is bounded; only approved/redacted content is sent; caller receives graceful degraded response.  
- **Evidence to attach:** Stub logs; timeout metrics.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### I. Investigation chat, streaming, context retrieval, and injection resistance


#### CHAT-001 — Valid chat request returns schema-valid answer

- **Priority:** P1  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** Authorized user with permitted case context exists; local/stub model is available.  
- **Steps:** Send a valid message with permitted case context.  
- **Expected result:** Response includes required fields, safe answer, request/correlation ID if designed, and persists the interaction according to policy.  
- **Evidence to attach:** API response; persistence rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-002 — SSE stream emits valid event framing

- **Priority:** P1  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** Chat streaming endpoint and test client support SSE.  
- **Steps:** Consume a complete streamed response and parse each event.  
- **Expected result:** Events follow expected SSE format, order, terminator, and content schema; no malformed partial JSON reaches client.  
- **Evidence to attach:** Raw event stream saved.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-003 — SSE disconnect is cleaned up

- **Priority:** P1  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** Streaming request can be cancelled in test.  
- **Steps:** Disconnect client mid-stream; inspect task/session/resource cleanup.  
- **Expected result:** No leaked task, DB transaction, or unbounded provider request remains.  
- **Evidence to attach:** Server logs/resource observation.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-004 — Context retrieval respects case permissions

- **Priority:** P0  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** User can access case A but not B; each has unique synthetic context canary.  
- **Steps:** Ask chat to summarize A, then attempt to reference B by ID or guessed title.  
- **Expected result:** A may be retrieved; B context is excluded and never appears in answer or model prompt.  
- **Evidence to attach:** Retrieved context IDs and canary scan.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-005 — Chat cannot use unauthorized case IDs to retrieve evidence

- **Priority:** P0  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** Protected evidence exists for B.  
- **Steps:** Send chat requests that mention B case/evidence ID and ask for file content.  
- **Expected result:** No unauthorized evidence fetch/content is returned; denial is logged safely.  
- **Evidence to attach:** Tool trace and response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-006 — Prompt injection in complaint/evidence is isolated

- **Priority:** P0  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** Synthetic complaint/evidence includes injection-like untrusted text.  
- **Steps:** Query chat using that record as context.  
- **Expected result:** Model treats embedded instructions as quoted/untrusted data; system prompts/secrets/tools are not disclosed.  
- **Evidence to attach:** Test transcripts and tool-call audit.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-007 — Chat tool/function calls are allowlisted

- **Priority:** P0  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** Chat tools are enabled in test.  
- **Steps:** Attempt requests to perform administrative or destructive action through natural language.  
- **Expected result:** Only allowlisted actions are callable and each rechecks user permission; unsupported action is refused.  
- **Evidence to attach:** Tool registry and audit results.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-008 — Chat messages persist with correct actor/case

- **Priority:** P1  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** Test chat flow is enabled.  
- **Steps:** Send multiple messages under case A; reopen history as same and another user.  
- **Expected result:** History is associated to correct user/case and another user cannot retrieve it without permission.  
- **Evidence to attach:** DB rows and access responses.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-009 — Chat provider failure degrades gracefully

- **Priority:** P1  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** Stub can return timeout, invalid JSON, or HTTP 500.  
- **Steps:** Send message for each controlled provider failure.  
- **Expected result:** UI/API returns safe failure/degraded notice, no false success, no duplicate persistence, and resources close.  
- **Evidence to attach:** Failure output and DB check.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CHAT-010 — Chat output is escaped in UI

- **Priority:** P1  
- **Type/tool:** pytest + API/SSE client; Playwright for rendering  
- **Tags:** chat,ai,security  
- **Preconditions:** A stub model can return HTML-like output.  
- **Steps:** Return script/tag payload through model response and render it in chat.  
- **Expected result:** Output is safely escaped/Markdown-sanitized; script does not execute.  
- **Evidence to attach:** Playwright screenshot, console, trace.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### J. Entity extraction, cross-case correlation, graph review


#### CORR-001 — Entity normalization handles equivalent forms

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Entity service or ingestion path is available.  
- **Steps:** Create same synthetic URL/domain/email/phone in different casing/format; inspect normalized form.  
- **Expected result:** Normalization is deterministic and type-aware; original raw value is retained only where policy permits.  
- **Evidence to attach:** Entity rows and normalization result.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-002 — Entity matching distinguishes types

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Synthetic entities of different types can be stored.  
- **Steps:** Use same textual value across types, e.g. domain-like string in a username field.  
- **Expected result:** Cross-type collisions do not create false equivalence unless configured relation explicitly supports it.  
- **Evidence to attach:** Entity type/value queries.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-003 — Shared indicator produces candidate, not automatic guilt claim

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Two cases share one synthetic URL but otherwise differ.  
- **Steps:** Run correlation generation and inspect candidate/output labels.  
- **Expected result:** Relationship is described as a candidate/potential overlap; no offender identity or guilt is asserted.  
- **Evidence to attach:** Correlation row and UI wording.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-004 — Correlation records identify engine source

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Model weights can be removed or rule-based fallback selected in test.  
- **Steps:** Run correlation with missing weights and inspect metadata.  
- **Expected result:** Rule-based fallback is identified as such and not misrepresented as trained neural inference.  
- **Evidence to attach:** Response, log, engine field.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-005 — Correlation confidence is bounded and interpreted correctly

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Correlation engine yields confidence/score.  
- **Steps:** Test no-overlap, one-indicator overlap, and multiple corroborating indicators.  
- **Expected result:** Scores stay in documented bounds and are explained as heuristic/model confidence, not probability of guilt unless calibrated and validated.  
- **Evidence to attach:** Score fixtures and UI label.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-006 — Correlation review state persists across refresh

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Candidate is reviewed by authorized user.  
- **Steps:** Approve/reject/mark unrelated, force refresh/recompute, reload UI.  
- **Expected result:** Human review decision and reviewer/time persist; refresh does not silently reset decision.  
- **Evidence to attach:** Before/after DB row.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-007 — Unauthorized user cannot review correlation

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Correlation candidate exists.  
- **Steps:** Call review endpoints as citizen, unrelated staff, and unauthorized specialist.  
- **Expected result:** All unauthorized decisions are rejected; no state mutation occurs.  
- **Evidence to attach:** Responses and DB snapshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-008 — Correlation is bounded for large case counts

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Seed synthetic cases/entities with documented volume.  
- **Steps:** Trigger correlation within configured candidate/timeout limit.  
- **Expected result:** Comparison is bounded and paginated/batched; no unbounded full-table quadratic scan occurs for normal request path.  
- **Evidence to attach:** Query count/timing/logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-009 — Duplicate correlation edges are prevented

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Same two cases can be discovered from multiple shared entities.  
- **Steps:** Run correlation generation repeatedly and concurrently.  
- **Expected result:** A single canonical relationship is persisted or duplicate handling is deterministic; evidence of shared types can aggregate without duplicating edges.  
- **Evidence to attach:** DB uniqueness/edge list.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-010 — Graph UI handles empty and dense data

- **Priority:** P2  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Correlation graph UI is available.  
- **Steps:** Render zero nodes, one edge, disconnected clusters, and bounded high-density synthetic data.  
- **Expected result:** UI shows meaningful empty/loading/error states and remains responsive/readable for supported scale.  
- **Evidence to attach:** Playwright screenshots/video.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-011 — Case separation is respected in graph filters

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Graph includes authorized and unauthorized cases.  
- **Steps:** Apply filters/search, inspect detail drawer, click edge and attempt direct case navigation.  
- **Expected result:** Unauthorized nodes/details are not exposed; filtering does not leak counts or hidden labels.  
- **Evidence to attach:** API data set; UI screens.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CORR-012 — AI/entity extraction handles malformed document output

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright for graph  
- **Tags:** correlation,ai,workflow  
- **Preconditions:** Extraction adapter can return missing or malformed entities.  
- **Steps:** Feed malformed model response via stub.  
- **Expected result:** Invalid entities are rejected/normalized safely; no malformed case/correlation records are created.  
- **Evidence to attach:** Stub response and DB query.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### K. Investigation reports, exports, integrity seal, and truthfulness


#### RPT-001 — Report generation uses a real authorized case

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Authorized user and populated synthetic case exist.  
- **Steps:** Generate report and compare referenced facts with persisted case/investigation/evidence.  
- **Expected result:** Report fields derive from authorized persisted records; empty state does not synthesize demo data.  
- **Evidence to attach:** Report payload and linked DB rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-002 — Empty reports do not silently seed demo records

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Test DB has no report rows.  
- **Steps:** Call report list with no filters and refresh frontend.  
- **Expected result:** Empty state remains empty; no demo records are inserted or fabricated cards displayed outside explicit demo mode.  
- **Evidence to attach:** DB before/after count; UI screenshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-003 — Failed generation never displays sealed/success state

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Stub report API fails at create step.  
- **Steps:** Click Generate and trigger 4xx, 5xx, timeout, or network failure.  
- **Expected result:** UI displays failure/pending retry, not a sealed/verified report; no fake local report is added as if persisted.  
- **Evidence to attach:** Playwright trace; API failure; DB count.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-004 — Report read/download requires case-level authorization

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Report relates to unauthorized case.  
- **Steps:** Fetch by report ID and try all detail/export/download formats.  
- **Expected result:** All access paths deny consistently; guessing report ID does not bypass case access.  
- **Evidence to attach:** API responses.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-005 — Report author and timestamps are server-derived

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Report create API exists.  
- **Steps:** Submit forged author, creation time, case identity, and report status.  
- **Expected result:** Server ignores/rejects protected fields; authoritative actor/time are persisted correctly.  
- **Evidence to attach:** Request and DB row.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-006 — Integrity digest covers canonical full report payload

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Report format includes integrity digest.  
- **Steps:** Generate report; independently canonicalize declared signed/sealed payload and compute digest; mutate each included field in fixture.  
- **Expected result:** Digest is reproducible and any covered-field change is detected; digest scope is documented.  
- **Evidence to attach:** Canonical payload, digest, verifier output.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-007 — Digital signature claim is backed by real cryptographic verification

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** If product claims a digital signature/seal, test key material and verifier must exist.  
- **Steps:** Verify report with public-key operation, then alter payload and verify again.  
- **Expected result:** A claimed signature verifies with configured public key and fails after mutation. If only a hash exists, UI/docs call it a hash/integrity digest, not RSA-PSS or official certification.  
- **Evidence to attach:** Signature and verification output; safe key IDs only.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-008 — Report identifiers are collision-resistant

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Generate many reports in isolated test.  
- **Steps:** Create concurrent reports in same clock tick and verify uniqueness.  
- **Expected result:** Database-level unique IDs prevent collision; conflicts are handled safely.  
- **Evidence to attach:** DB uniqueness query; concurrent test.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-009 — CSV export escapes formulas and delimiters

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Report contains synthetic values beginning `=`, `+`, `-`, `@`, commas, quotes, CRLF.  
- **Steps:** Export CSV and open/parse in safe parser; inspect field escaping.  
- **Expected result:** CSV structure is valid and spreadsheet formula injection is neutralized per export policy.  
- **Evidence to attach:** Export bytes; parser test.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-010 — Export filters and scopes cannot leak other cases

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** User can view Case A but not B.  
- **Steps:** Use export filters for B IDs, wide date ranges, status values, and pagination.  
- **Expected result:** Only authorized records are exported and counts reflect visible results only.  
- **Evidence to attach:** Export row set versus authorized fixture.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-011 — PDF/DOCX export content is consistent

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Export formats are implemented and dependencies installed.  
- **Steps:** Generate same report in each supported format and compare source fields, timestamps, and digest/signature metadata.  
- **Expected result:** Supported formats contain consistent content; unsupported formats return explicit message rather than pretend success.  
- **Evidence to attach:** Export hashes and extracted text.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-012 — Report rendering escapes untrusted content

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Case title/narrative contains safe script-like payload.  
- **Steps:** Generate and display/export report with this content.  
- **Expected result:** Markup is escaped in preview/HTML; no executable content or template injection occurs.  
- **Evidence to attach:** UI screenshot; export inspect.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-013 — Report history and audit preserve revisions

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** A report can be regenerated/updated if supported.  
- **Steps:** Create then revise/replace report; inspect prior version and audit.  
- **Expected result:** Versioning/immutable audit behavior matches policy; a new report does not silently rewrite authoritative past content.  
- **Evidence to attach:** DB/history/audit rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### RPT-014 — Report unavailable state is explicit

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright; export parser  
- **Tags:** report,integrity,security  
- **Preconditions:** Create report with missing source data or a dependency failure.  
- **Steps:** Attempt report generation with empty/partially unavailable source.  
- **Expected result:** System returns a truthful incomplete/blocked response, clearly identifies missing data, and does not mark report officially verified.  
- **Evidence to attach:** Response and UI.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### L. Administration, users, roles, and governance


#### ADMIN-001 — Admin-only routes require admin permission

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** Admin and non-admin test identities exist.  
- **Steps:** Enumerate admin routes from API router/OpenAPI; call each as non-admin and anonymous.  
- **Expected result:** Every route enforces server-side authorization, independent of hidden frontend navigation.  
- **Evidence to attach:** Endpoint-role matrix.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-002 — User creation validates identity and role

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** Admin UI/API exists.  
- **Steps:** Create valid test user, duplicate email, malformed email, weak password, and protected role payload.  
- **Expected result:** Validation and uniqueness apply; only roles explicitly grantable by actor can be assigned.  
- **Evidence to attach:** Responses and DB rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-003 — Admin role changes are audited and protected

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** Admin can manage users.  
- **Steps:** Change a user role; attempt same as a non-admin; inspect audit event.  
- **Expected result:** Authorized change is atomic and audited; unauthorized attempt does not mutate role.  
- **Evidence to attach:** Before/after rows and audit.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-004 — Disabled users lose access promptly

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** A user has active session/token.  
- **Steps:** Disable that user and replay existing session against protected paths.  
- **Expected result:** Access is blocked within documented revocation/expiry window; user cannot continue sensitive work unnoticed.  
- **Evidence to attach:** Before/after requests.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-005 — MLOps/model actions are role-gated

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** MLOps/model management endpoints exist.  
- **Steps:** Try status, reload, retrain, feedback, evaluation, and configuration actions as each role.  
- **Expected result:** Only permitted roles can make operational changes; read status access is separately scoped.  
- **Evidence to attach:** Role-action matrix; DB/config before-after.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-006 — Admin dashboard uses live state outside demo mode

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** Dashboard and demo mode settings exist.  
- **Steps:** Launch with demo flag off and empty DB, then populated DB.  
- **Expected result:** Metrics match live API/DB and do not silently show mock/demo counts.  
- **Evidence to attach:** API values vs dashboard screenshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-007 — Audit log is restricted from ordinary users

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** Audit events exist.  
- **Steps:** Try list/detail/export audit logs as citizen, specialist, police, and admin.  
- **Expected result:** Only approved audit viewers access logs; sensitive values are masked.  
- **Evidence to attach:** Responses and role matrix.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-008 — Administrative actions are safe to retry

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** Test-only administrative action exists.  
- **Steps:** Replay same request due to simulated timeout/network retry.  
- **Expected result:** No duplicate users/roles/jobs or inconsistent state; idempotency behavior is documented.  
- **Evidence to attach:** Request IDs and DB state.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-009 — Account identifiers are not exposed in UI errors

- **Priority:** P1  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** Duplicate/unauthorized admin operations can be tried.  
- **Steps:** Submit duplicate user or unknown ID and inspect UI/API errors.  
- **Expected result:** Errors disclose only information permitted by policy and avoid stack traces.  
- **Evidence to attach:** Responses/screenshots.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### ADMIN-010 — Least privilege is maintained for specialist role

- **Priority:** P0  
- **Type/tool:** pytest/API + DB; Playwright  
- **Tags:** admin,rbac  
- **Preconditions:** Specialist account and admin APIs exist.  
- **Steps:** Inspect navigation, API routes, downloadable reports, model inputs, and backend permission dependencies.  
- **Expected result:** Specialist can complete designated tasks but cannot administer users, change system settings, or access unrestricted citizen data.  
- **Evidence to attach:** Role-route matrix and tests.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### M. Frontend routes, forms, responsive UI, and accessibility


#### UI-001 — Every navigation item opens the correct route

- **Priority:** P1  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** All role-specific portals are available and test users exist.  
- **Steps:** Click each visible navigation item for each role; record route, title, and primary content.  
- **Expected result:** No dead links, wrong portal, empty route, or accidental privilege reveal occurs.  
- **Evidence to attach:** Playwright route map/screenshots.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-002 — Direct route access applies same authorization as API

- **Priority:** P0  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Restricted routes are known.  
- **Steps:** Paste a restricted route into a fresh/unauthorized browser context.  
- **Expected result:** App redirects/denies appropriately and backend APIs independently deny access.  
- **Evidence to attach:** Browser trace + network log.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-003 — Loading, empty, error, and retry states are correct

- **Priority:** P1  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Network interception/test API can simulate delays, empty lists, 403, 500, and offline.  
- **Steps:** Exercise each major portal under those response conditions.  
- **Expected result:** Loading clears, empty state is distinct from error, error is actionable, retry works, and no fake success data appears.  
- **Evidence to attach:** Screenshots and trace.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-004 — Form validation messages are actionable

- **Priority:** P1  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Forms for login, complaint, uploads, case changes, report creation exist.  
- **Steps:** Submit invalid and missing fields, then correct input.  
- **Expected result:** Message identifies problem accessibly; valid correction succeeds without duplicate submission.  
- **Evidence to attach:** Screenshots; accessibility tree.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-005 — Keyboard-only interaction is possible

- **Priority:** P1  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** UI is running in browser.  
- **Steps:** Navigate major flows using Tab/Shift+Tab, Enter, Space, Escape, and arrow keys where applicable.  
- **Expected result:** Focus is visible and logical; interactive elements are keyboard operable; no keyboard trap.  
- **Evidence to attach:** Playwright key sequence/video.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-006 — Accessible labels and names exist

- **Priority:** P1  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Core UI screens render.  
- **Steps:** Inspect accessibility tree for inputs, buttons, dialog, tabs, status badges, graph controls.  
- **Expected result:** Controls expose meaningful accessible names/roles/states; errors associate with fields.  
- **Evidence to attach:** Automated accessibility scan + manual notes.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-007 — Viewport responsiveness at required sizes

- **Priority:** P2  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Frontend has responsive layout.  
- **Steps:** Run main portals at small mobile, tablet, laptop, and wide desktop viewport.  
- **Expected result:** No critical overlap, clipped primary action, unreadable text, or inaccessible horizontal controls.  
- **Evidence to attach:** Screenshots per viewport.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-008 — Session expiry returns user to safe state

- **Priority:** P0  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Logged-in browser context exists.  
- **Steps:** Expire/clear session during a form and during a sensitive detail view.  
- **Expected result:** Protected data is not left exposed after expiry; user sees clear re-authentication behavior; draft preservation follows policy.  
- **Evidence to attach:** Browser trace and screenshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-009 — Network retries do not duplicate mutations

- **Priority:** P1  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Mutation endpoints are available.  
- **Steps:** Throttle/drop response after request is sent and trigger retry for complaint/evidence/case/report operation.  
- **Expected result:** The UI does not claim false state; idempotency or duplicate warning prevents unintended duplicate writes.  
- **Evidence to attach:** Trace/network log and DB count.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-010 — User-facing status matches persisted backend status

- **Priority:** P0  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Perform case, evidence, correlation, and report state changes.  
- **Steps:** Compare displayed state to fresh API read after action, refresh, and navigation away/back.  
- **Expected result:** UI does not use stale or local mock state as authoritative status.  
- **Evidence to attach:** Screenshots and API/DB evidence.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-011 — No sensitive info persists after account switch

- **Priority:** P0  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Browser has cached data as user A.  
- **Steps:** Logout; login as user B in same browser context; inspect tabs, caches, detail drawers, and API calls.  
- **Expected result:** User A content is cleared or properly partitioned; B cannot see A data through stale UI state.  
- **Evidence to attach:** Playwright trace and canary scan.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### UI-012 — Browser console has no critical errors

- **Priority:** P1  
- **Type/tool:** Playwright + accessibility checks + API assertions  
- **Tags:** frontend,usability  
- **Preconditions:** Critical user flows can be executed.  
- **Steps:** Run smoke journeys and capture console exceptions, failed requests, React warnings, and broken assets.  
- **Expected result:** No unexplained critical console errors or failed required API requests; known noncritical warnings are documented.  
- **Evidence to attach:** Console log and network HAR.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### N. Auditability, logs, privacy, and security headers


#### AUDIT-001 — Successful privileged mutations create audit entries

- **Priority:** P0  
- **Type/tool:** API + log scan + DB  
- **Tags:** audit,privacy  
- **Preconditions:** Case assignment, report generate, correlation review, and role change are testable.  
- **Steps:** Perform each authorized mutation.  
- **Expected result:** Audit event identifies actor, action, resource, timestamp, outcome, and request/correlation ID without excess PII.  
- **Evidence to attach:** DB audit rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUDIT-002 — Denied privileged operations are recorded safely

- **Priority:** P1  
- **Type/tool:** API + log scan + DB  
- **Tags:** audit,privacy  
- **Preconditions:** Unauthorized test user and restricted operation exist.  
- **Steps:** Attempt forbidden access and mutation.  
- **Expected result:** Security event is logged at appropriate level with reason/resource metadata and no secrets or raw narrative.  
- **Evidence to attach:** Redacted logs; audit rows if expected.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUDIT-003 — Audit history is tamper resistant to ordinary roles

- **Priority:** P0  
- **Type/tool:** API + log scan + DB  
- **Tags:** audit,privacy  
- **Preconditions:** Audit rows exist.  
- **Steps:** Attempt update/delete through UI/API/ORM-facing route as non-admin and ordinary admin if policy forbids edits.  
- **Expected result:** History cannot be altered by unauthorized actors; retention and privileged maintenance policy is explicit.  
- **Evidence to attach:** Responses and DB snapshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUDIT-004 — Request IDs propagate consistently

- **Priority:** P1  
- **Type/tool:** API + log scan + DB  
- **Tags:** audit,privacy  
- **Preconditions:** Request middleware is enabled.  
- **Steps:** Send request with custom request ID and one without; cause a controlled error.  
- **Expected result:** Response/logs share the proper ID; malformed user-provided IDs are bounded/normalized safely.  
- **Evidence to attach:** Headers and log excerpt.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUDIT-005 — Security headers are present on success and error

- **Priority:** P1  
- **Type/tool:** API + log scan + DB  
- **Tags:** audit,privacy  
- **Preconditions:** API and frontend are running.  
- **Steps:** Request health, login error, 404, 403, validation failure, and file download.  
- **Expected result:** Required headers such as nosniff/frame policy/referrer policy appear where applicable; error path does not drop them.  
- **Evidence to attach:** Captured headers.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUDIT-006 — Logs redact PII and credentials

- **Priority:** P0  
- **Type/tool:** API + log scan + DB  
- **Tags:** audit,privacy  
- **Preconditions:** Synthetic canaries in request payload and auth/provider values are available.  
- **Steps:** Trigger complaint, auth failure, AI error, upload error and report failure; search logs.  
- **Expected result:** No passwords, bearer tokens, OTPs, API keys, raw restricted narratives or file contents appear in logs.  
- **Evidence to attach:** Automated canary scan of test logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUDIT-007 — Errors do not expose internal traceback in production mode

- **Priority:** P0  
- **Type/tool:** API + log scan + DB  
- **Tags:** audit,privacy  
- **Preconditions:** Set isolated test app to production-like mode.  
- **Steps:** Trigger validation, dependency failure, and generic exception.  
- **Expected result:** Client gets safe structured response with request ID; traceback stays in protected server logs.  
- **Evidence to attach:** Responses and log captures.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### AUDIT-008 — Sensitive values are not leaked through telemetry/referrers

- **Priority:** P1  
- **Type/tool:** API + log scan + DB  
- **Tags:** audit,privacy  
- **Preconditions:** UI links and tracking/report flows exist.  
- **Steps:** Inspect analytics/network requests, browser history/referrer, and third-party requests after sensitive views.  
- **Expected result:** Tokens, narrative, evidence paths, or PII are not placed in URLs/third-party telemetry without approved controls.  
- **Evidence to attach:** HAR and referrer observations.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### O. Resilience, degraded modes, and deployment configuration


#### OPS-001 — Application starts with correct required configuration

- **Priority:** P0  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Test environment variables are prepared.  
- **Steps:** Start app with valid config; then omit each required secret in a separate isolated process.  
- **Expected result:** Valid config starts; missing required production secrets causes clear startup failure, not insecure defaults.  
- **Evidence to attach:** Startup logs and exit status.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-002 — Placeholder secrets are rejected in production mode

- **Priority:** P0  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Production config validator exists or is expected.  
- **Steps:** Set obvious placeholder/default secret values in production mode and start service.  
- **Expected result:** Startup is blocked with explicit safe validation error; no hardcoded fallback secret is accepted.  
- **Evidence to attach:** Exit code and sanitized message.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-003 — Database unavailable produces controlled readiness failure

- **Priority:** P1  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Use test-only DB endpoint that refuses connection.  
- **Steps:** Start/probe service and call readiness health endpoint.  
- **Expected result:** Readiness accurately reports DB unready; no false healthy response for required dependencies.  
- **Evidence to attach:** Health body and logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-004 — Readiness distinguishes live process from dependency health

- **Priority:** P1  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Health endpoints exist.  
- **Steps:** Compare liveness and readiness with DB/cache/storage/model/scanner on and off.  
- **Expected result:** Liveness remains useful for process supervision; readiness reflects required dependencies and optional degraded components accurately.  
- **Evidence to attach:** Endpoint responses.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-005 — Redis unavailable behavior is bounded

- **Priority:** P1  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Redis is used by the app or background jobs.  
- **Steps:** Disable Redis in isolated environment and trigger relevant flows.  
- **Expected result:** System fails/degrades according to documented policy without hanging requests or losing acknowledged durable data.  
- **Evidence to attach:** Responses, queue state, logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-006 — MinIO/storage unavailable does not create false evidence

- **Priority:** P0  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Object storage can be disabled in test.  
- **Steps:** Upload/download with storage unavailable.  
- **Expected result:** Operation fails safely, transaction remains consistent, no broken evidence marked verified, and no local temp file leaks.  
- **Evidence to attach:** API, DB/object inventory.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-007 — ClamAV service configuration points to reachable service

- **Priority:** P0  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Compose/deployment definitions and scanner settings exist.  
- **Steps:** Start isolated Compose stack with ClamAV; inspect backend hostname/port and run EICAR test.  
- **Expected result:** Backend reaches the scanner container by service DNS; readiness and scan verdict reflect actual result.  
- **Evidence to attach:** Compose ps/logs and EICAR result.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-008 — Missing ClamAV cannot be treated as clean

- **Priority:** P0  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Scanner is configured as required for release.  
- **Steps:** Stop scanner container, upload harmless synthetic file, then inspect status and processing permissions.  
- **Expected result:** Upload becomes explicitly unscanned/quarantined or rejects; it is not marked malware-cleared.  
- **Evidence to attach:** Evidence state and response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-009 — Migration upgrade works from prior schema

- **Priority:** P0  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Disposable test DB at prior migration revision is prepared.  
- **Steps:** Run `alembic upgrade head` using exact workspace configuration.  
- **Expected result:** Migration completes and new tracking_token column/index exists; pre-existing synthetic rows are preserved.  
- **Evidence to attach:** Alembic output; schema diff.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-010 — Migration is idempotent and downgrade policy is understood

- **Priority:** P1  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Disposable DB is at head after upgrade.  
- **Steps:** Run `alembic upgrade head` again; test downgrade only if project explicitly supports it and using disposable DB.  
- **Expected result:** Repeat upgrade is clean; downgrade behavior is documented and does not destroy user data unexpectedly.  
- **Evidence to attach:** Migration output; schema checks.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-011 — No automatic destructive schema initialization in production

- **Priority:** P0  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Application lifespan/migrations have been reviewed.  
- **Steps:** Inspect startup code and run production-like startup against preexisting schema.  
- **Expected result:** Production schema changes use controlled migrations; startup does not silently create/alter schema while swallowing arbitrary errors.  
- **Evidence to attach:** Code reference; startup log.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### OPS-012 — Container ports and secrets are production-safe

- **Priority:** P0  
- **Type/tool:** pytest/terminal/Compose + static review  
- **Tags:** ops,deployment  
- **Preconditions:** Docker Compose files exist.  
- **Steps:** Inspect exposed ports, credentials, image tags, health checks, mounted volumes, and env wiring.  
- **Expected result:** No default credentials in production; only required ports are public; versions are pinned where policy requires; secrets are not committed.  
- **Evidence to attach:** Compose/config review.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### P. Performance, concurrency, and resource bounds


#### PERF-001 — Baseline API latency is measured

- **Priority:** P2  
- **Type/tool:** pytest + bounded load tool  
- **Tags:** performance  
- **Preconditions:** Stable seeded test DB and local environment.  
- **Steps:** Measure p50/p95/p99 for health, case list, case detail, upload metadata, and report listing over documented sample size.  
- **Expected result:** Results are recorded with environment/seed size and compared to explicit targets; no unsupported SLA is invented.  
- **Evidence to attach:** Load-test output.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### PERF-002 — Case list pagination prevents unbounded response

- **Priority:** P1  
- **Type/tool:** pytest + bounded load tool  
- **Tags:** performance  
- **Preconditions:** Many synthetic cases exist.  
- **Steps:** Request default list and max page sizes; try invalid or huge limit/offset.  
- **Expected result:** API enforces bounded pagination and stable ordering; large DB cannot cause unbounded payload by default.  
- **Evidence to attach:** Response counts and timing.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### PERF-003 — Concurrent complaint submission preserves integrity

- **Priority:** P0  
- **Type/tool:** pytest + bounded load tool  
- **Tags:** performance  
- **Preconditions:** Test database and API are ready.  
- **Steps:** Submit many distinct synthetic complaints concurrently.  
- **Expected result:** No duplicate references, lost rows, deadlocks, or corrupted lifecycle transitions.  
- **Evidence to attach:** Load output; DB uniqueness checks.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### PERF-004 — Concurrent upload obeys resource limits

- **Priority:** P1  
- **Type/tool:** pytest + bounded load tool  
- **Tags:** performance  
- **Preconditions:** Test files and object storage/scanner available.  
- **Steps:** Upload multiple bounded synthetic files concurrently under configured limit.  
- **Expected result:** Resource usage stays within expected bounds; each accepted upload has consistent bytes/hash/record; overload is explicit.  
- **Evidence to attach:** Timings, resource metrics, DB/object checks.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### PERF-005 — Correlation job scales within configured limits

- **Priority:** P1  
- **Type/tool:** pytest + bounded load tool  
- **Tags:** performance  
- **Preconditions:** Seed increasingly sized synthetic case/entity sets.  
- **Steps:** Run correlation at several safe sizes and capture query count, runtime, peak memory.  
- **Expected result:** Runtime/resource curve is documented and safeguards/timeouts prevent runaway full-scan behavior.  
- **Evidence to attach:** Timing/query/resource report.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### PERF-006 — Slow model provider does not exhaust request workers

- **Priority:** P1  
- **Type/tool:** pytest + bounded load tool  
- **Tags:** performance  
- **Preconditions:** Stub provider delays responses.  
- **Steps:** Issue parallel AI/chat requests exceeding normal concurrency but within test budget.  
- **Expected result:** Timeouts/circuit breakers bound resource use; unrelated endpoints remain responsive.  
- **Evidence to attach:** Load tool output and app metrics.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### PERF-007 — Large report export is streamed/bounded

- **Priority:** P2  
- **Type/tool:** pytest + bounded load tool  
- **Tags:** performance  
- **Preconditions:** Large synthetic report payload within policy.  
- **Steps:** Generate/download supported export and monitor memory/time.  
- **Expected result:** Export respects configured limits and does not load unbounded data into memory without guardrails.  
- **Evidence to attach:** Timing/memory and response.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### PERF-008 — Repeated failed login/upload abuse is bounded

- **Priority:** P1  
- **Type/tool:** pytest + bounded load tool  
- **Tags:** performance  
- **Preconditions:** Rate limiting/size controls configured.  
- **Steps:** Run safe bounded abuse simulation in test environment.  
- **Expected result:** Rate limits and limits work; no resource exhaustion or leaked temp files.  
- **Evidence to attach:** Limiter metrics; resource observations.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### Q. CI/CD, static quality, migrations, and reproducibility


#### CI-001 — CI workflow exists and triggers on intended events

- **Priority:** P0  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** `.github/workflows/ci.yml` exists in workspace.  
- **Steps:** Inspect workflow event filters and validate YAML syntax.  
- **Expected result:** Workflow triggers on intended push/PR branches, avoids unintended deployment, and YAML parses cleanly.  
- **Evidence to attach:** Workflow source and parser result.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-002 — CI provisions supported Python version and runs backend tests

- **Priority:** P0  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** Workflow can be run on branch/PR.  
- **Steps:** Run backend job from a clean checkout.  
- **Expected result:** Declared Python version/dependencies install reproducibly and pytest fails the job on a test failure.  
- **Evidence to attach:** CI run URL/log.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-003 — CI validates Alembic migration history

- **Priority:** P0  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** Migration configuration uses isolated CI DB.  
- **Steps:** Run upgrade from expected baseline and/or test new migration head.  
- **Expected result:** Migration check succeeds from clean environment and catches missing/broken migration files.  
- **Evidence to attach:** CI logs and alembic history.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-004 — CI builds frontend from clean checkout

- **Priority:** P0  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** Frontend package lock and scripts are committed.  
- **Steps:** Run npm ci and production build.  
- **Expected result:** Clean build succeeds deterministically; no reliance on ignored local artifacts.  
- **Evidence to attach:** CI logs and artifact list.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-005 — CI runs security regression tests

- **Priority:** P0  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** Security-focused tests are discovered by config.  
- **Steps:** Inspect collected tests; run named security/workflow/RBAC/degraded-mode suites.  
- **Expected result:** Critical authorization and degraded-mode tests are in required CI path and fail the build on regression.  
- **Evidence to attach:** Pytest collection and CI output.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-006 — CI does not need real external secrets for unit tests

- **Priority:** P1  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** CI workflow configured.  
- **Steps:** Run test workflow with no production secret values.  
- **Expected result:** Tests use mocks/test secrets; production secrets are not stored in repo or printed.  
- **Evidence to attach:** Workflow env review; logs scan.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-007 — Model artifact absence is handled in CI

- **Priority:** P1  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** Large model weights are excluded or optional.  
- **Steps:** Run clean CI checkout with large weights absent.  
- **Expected result:** Non-model tests pass where expected; model-specific tests clearly skip/block or test fallback; no false green claiming neural inference.  
- **Evidence to attach:** Test report and model status artifact.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-008 — Coverage report records meaningful files/branches

- **Priority:** P2  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** Coverage tooling exists or can be invoked.  
- **Steps:** Run coverage for auth, case authorization, evidence, report, tracking, and AI masking.  
- **Expected result:** Coverage is reported by critical module; thresholds are used only if configured and justified.  
- **Evidence to attach:** Coverage XML/HTML summary.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-009 — Secrets and ignored artifact policy is correct

- **Priority:** P0  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** Git ignore and tracked file list available.  
- **Steps:** Scan tracked files for real secret patterns; check `.env.example` is not accidentally excluded while real `.env` remains ignored.  
- **Expected result:** No real secrets are tracked; safe example templates are committed if required; weight artifact storage policy is documented.  
- **Evidence to attach:** Secret scan; git check-ignore outputs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### CI-010 — Clean-clone reproducibility check

- **Priority:** P1  
- **Type/tool:** CI + terminal + static review  
- **Tags:** ci,build  
- **Preconditions:** All intended code/files are committed in a test branch or clean clone.  
- **Steps:** Create clean checkout (do not disturb current workspace); install backend/frontend dependencies and run selected checks.  
- **Expected result:** Build/tests do not rely on local-only files, stale generated bundles, or uncommitted migrations.  
- **Evidence to attach:** Clean-clone SHA, logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


### R. Complete end-to-end journeys across the platform


#### E2E-001 — Citizen complaint-to-tracking journey

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Fresh test DB; citizen account and browser/API clients configured.  
- **Steps:** Login/register as citizen; submit complaint; record reference/token as designed; upload safe evidence; retrieve allowed tracking view; reload and verify persistence.  
- **Expected result:** All stages join to one complaint; ownership is correct; evidence is correctly scoped; tracking exposes only allowed fields.  
- **Evidence to attach:** Playwright trace/video; API responses; DB relationship snapshot.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-002 — Complaint-to-case assignment-to-investigation journey

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Complaint with no case; authorized supervisor/investigator accounts.  
- **Steps:** Create case; assign investigator; add activity/finding; update status through permitted states; reopen case detail as assigned investigator.  
- **Expected result:** Single case links to complaint; assignment and history are correct; finding/action preserve actor and evidence traceability.  
- **Evidence to attach:** Trace, API results, audit history.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-003 — Evidence safe-processing journey with ClamAV online

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Test storage and ClamAV test service online.  
- **Steps:** Upload clean file; scan; verify hash; process; download as authorized user; deny unauthorized download.  
- **Expected result:** Clean file progresses according to state graph; hash matches; unauthorized path is denied.  
- **Evidence to attach:** Scanner logs, API/hash evidence, trace.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-004 — Evidence scanner-outage journey

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Test scanner can be stopped or stubbed unavailable.  
- **Steps:** Attempt upload; inspect quarantine/unscanned state; attempt downstream processing/download; restore scanner and retry per policy.  
- **Expected result:** Outage never yields false clean/verified state; retry transitions to a valid state and is audited.  
- **Evidence to attach:** Before/after state and scanner logs.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-005 — Cross-case correlation human-review journey

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Two synthetic cases share normalized indicator; role-appropriate reviewer exists.  
- **Steps:** Run correlation; open graph/candidate; inspect shared indicators; review/decline; refresh; inspect persistence.  
- **Expected result:** Candidate is advisory, engine source is truthful, reviewer decision persists, and unauthorized user cannot review.  
- **Evidence to attach:** Correlation rows; screenshots; audit log.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-006 — AI/ML System Lead workflow with narrative masking

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** AI/ML System Lead account and complaint with fake PII canary.  
- **Steps:** Open model views; run approved analysis; inspect network/model adapter inputs, outputs, logs, and report views.  
- **Expected result:** Restricted raw narrative remains masked/minimized across the full path; model status/fallback is honest.  
- **Evidence to attach:** Canary scans; adapter capture; Playwright trace.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-007 — Report generation-to-integrity verification journey

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Populated authorized case and working report service.  
- **Steps:** Generate report; reload list; export; independently verify digest/signature; mutate a local copy and verify failure; repeat as unauthorized user.  
- **Expected result:** Persisted report and exported content agree; real signature claims verify, digest claims are labeled accurately; unauthorized access fails.  
- **Evidence to attach:** Report DB row; exported bytes; verifier results.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-008 — Admin role change revokes former user's scope

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Test users A and B and synthetic case exist.  
- **Steps:** Admin changes role/disables A; replay old session and direct API; inspect audit.  
- **Expected result:** Access is removed according to revocation design and role change is auditable.  
- **Evidence to attach:** API before/after; audit rows.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-009 — Model outage does not break core citizen submission

- **Priority:** P1  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Disable optional models in isolated environment.  
- **Steps:** Submit complaint, attach allowed evidence, view confirmation and status.  
- **Expected result:** Core intake works per product contract; optional AI failure is visible but does not fabricate results or corrupt complaint data.  
- **Evidence to attach:** Responses, DB data, model status.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


#### E2E-010 — Full role-isolation regression matrix

- **Priority:** P0  
- **Type/tool:** Playwright + API clients + pytest + DB assertions  
- **Tags:** e2e,release-gate  
- **Preconditions:** Seed citizen A/B, investigator A/B, specialist, AI/ML lead, admin with distinct records.  
- **Steps:** For each role run a curated positive/negative path across complaint, case, evidence, report, correlation, AI, admin, and audit APIs.  
- **Expected result:** Every allowed action succeeds and every forbidden action fails across UI and direct API; no IDOR or stale-state leak remains.  
- **Evidence to attach:** Generated role/action matrix and failed-request artifacts.  
- **Execution status:** `NOT RUN`  
- **Actual result / defect ID:** _Fill during execution._


## 12. Required source-of-truth and anti-false-pass audit

Before closing the run, explicitly answer each item:

- [ ] Did the exact workspace HEAD and dirty status get recorded before any changes?
- [ ] Were the claimed remediation/report/CI/migration files verified in the active checkout?
- [ ] Were all reported test commands independently re-run on the same SHA that is being assessed?
- [ ] Do collected tests include actual assertions of authorization failures and unchanged database state, not just successful authorized flows?
- [ ] Were direct API access and guessed object IDs tested independently of frontend route/sidebar visibility?
- [ ] Was AI/ML narrative masking asserted on the actual model/provider input boundary, not just in the UI?
- [ ] Were missing neural artifacts tested, and was the active fallback clearly identified?
- [ ] Was malware scanner outage tested; can an unscanned file be processed/downloaded or marked verified?
- [ ] Was report integrity independently recomputed, and was any digital-signature claim cryptographically verified with a public key?
- [ ] Were demo/mock fallbacks checked in empty-state, timeout, and failed-mutation paths?
- [ ] Was schema migration tested against a disposable database at the prior revision, with pre-existing synthetic rows preserved?
- [ ] Was CI tested from a clean checkout without local-only files or production secrets?
- [ ] Were browser tests accompanied by API/network assertions and database checks where appropriate?
- [ ] Were skipped, blocked, xfailed, flaky, and not-run tests reported separately?
- [ ] Did the final release determination account for remaining model-weight and ClamAV prerequisites?

## 13. Exit criteria

Do not declare the project fully production-ready until all of the following are evidenced:

1. Zero unresolved P0 defects and all P0 tests PASS.
2. Critical RBAC/object authorization coverage passes across API and UI, including negative tests and no-side-effect assertions.
3. Evidence workflow proves authorization, type/size limits, SHA-256 correctness, malware scan states, quarantine behavior, safe storage, processing and download authorization.
4. AI workflows prove actual runtime/provider state, narrative masking at model ingress, prompt-injection boundaries, truthful confidence/fallback reporting, and no false neural-inference claims when weights are absent.
5. Report generation cannot fabricate success, empty states do not seed demo data, report scope inherits case permissions, and hash/signature wording matches verified cryptography.
6. Correlation remains advisory, human decisions persist, reviewer access is authorized, and rule-based fallback is labeled correctly.
7. Migration path works on a prior-schema disposable DB; production startup behavior is migration-safe and does not hide schema failures.
8. CI succeeds from clean checkout and includes meaningful security/workflow regression tests.
9. Core citizen, investigation, evidence, correlation, report, admin, and offline/degraded E2E journeys pass.
10. Required production secrets, ClamAV service wiring and scan test, model registry artifact handling, deployment networking, backup/restore and monitoring controls are verified before live deployment.

## 14. Final instruction to Antigravity

Act as the testing orchestrator and QA lead. First inspect the current workspace safely and reconcile it against the reported implementation. Then execute every applicable case in this document using the appropriate tool. Do not silently modify expected outcomes to match defects, do not invent results, and do not claim success without evidence. When a test discovers a defect, document it, preserve a minimal reproducer, and recommend/fix only within the owner's authorized scope. For fixes, rerun the failed case plus impacted regression tests. Produce the execution report, machine-readable results, artifact manifest, defect register, and a strict release decision. **Do not deploy, push, rotate secrets, run production migrations, or destroy data.**
