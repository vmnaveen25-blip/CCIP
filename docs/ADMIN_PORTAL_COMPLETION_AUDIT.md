# Admin Portal, Notification System, and User Profile Experience Audit
**Citizen Cybercrime Intelligence Platform (CCIP) / Astraea Sovereign Enclave**  
**Audit Date:** September 2026  
**Auditor:** Senior Full-Stack, Security, and Admin Console Architecture Lead

---

## 1. Executive Overview

This audit document evaluates the current state of the **Admin Portal**, **Notification System**, and **User Profile / Account Experience** within CCIP. While core database foundations, authentication, and specialized intelligence features are robust, several administrative pages remain prototype shells containing hardcoded metrics, synthetic infrastructure claims, disconnected action buttons, and a defective notification lifecycle.

---

## 2. Page-by-Page Status Matrix

| Admin Section | Current Status | Findings & Deficiencies |
| :--- | :--- | :--- |
| **Admin Dashboard** | **PARTIALLY WORKING** | Displays real total users and departments, but contains hardcoded `"99.98%"` node uptime, static `"4 Nodes Active & Synced"`, static `"Tamper-Proof Audit Seals"`, hardcoded `"1.2 ms"` latency, and lack of complaint/case/evidence workload metrics. |
| **Users Management** | **FULLY WORKING** | Paginated directory, multi-field search, role/status/department filters, user provisioning modal, edit modal with role confirmation, suspend/activate/disable dialogs, slide-over detail drawer, and per-user audit history modal are active and hooked to real APIs. |
| **Roles & Permissions** | **STATIC SHELL** | Renders 4 hardcoded static cards (`Citizen Complainant`, `Cybersecurity Specialist`, `Cybercrime Police Officer`, `AI/ML System Lead`) with fixed permission lists. Omits the 5th role (`ADMIN`). No real matrix or backend policy reflection. |
| **Departments / Units** | **PARTIALLY WORKING** | Creation and listing of real departments works, but if the table is empty, the UI falls back to hardcoded mock precincts (*Financial Cybercrime Unit 14 Detectives*, *Darknet Squad*, etc.). No department editing or member count rollup. |
| **System Health** | **MISLEADING / PARTIAL** | Calls `/api/v1/admin/system-health`, but UI displays hardcoded `"24/24 PASS"` pytest suite, hardcoded `"18ms"` latency, claims `"PostgreSQL / SQLite Async"`, claims `"SEALED"` storage root without checking actual capacity, and claims synthetic statuses. |
| **System Configuration** | **STATIC SHELL** | Renders two static cards: hardcoded `"900 SECONDS"` session timeout and fictitious `"CONFIGURED: 7 YEARS SEALED"` evidence retention. No real backend configuration reading or safe runtime parameters. |
| **Security & Auth Enclave** | **MISLEADING / STATIC** | Hardcodes fictitious claims: `"Master AES-256-GCM Vault Key ROTATED: 2026-09-01"`, `"FIDO2 / WebAuthn Hardware Keys Enforced: 100% OF STAFF"`, and `"TLS 1.3 EXCLUSIVE"` (even over standard HTTP development sessions). No real security events section. |
| **API Integrations** | **FICTITIOUS / MOCK** | Displays 4 completely fictitious external integrations: *FinCEN Rapid Asset Recall API*, *CERT-In Threat Feed Webhook*, *VASP Crypto Exchange Freeze Protocol*, and *National Telecom CDR Gateway* with fake latencies (`24ms`, `18ms`, etc.). |
| **Database Management** | **FICTITIOUS / MOCK** | Displays synthetic shards: *Shard 01 (1,420,800 records, 24.2 GB)*, *Shard 02 (1.4 TB evidence blobs)*, and *Shard 03 (384,000 logs)*. Zero real database telemetry, table row counts, SQLite file size, or backup creation. |
| **Audit Logs Trail** | **PARTIALLY WORKING** | Reads from `/api/v1/admin/audit-logs`, but labels the table `"Tamper-Proof Audit Trail Ledger"`. The `"EXPORT LEDGER"` button is completely decorative (no onClick handler). No date, actor, or action filters. |

---

## 3. Notification System Defects & Root Causes

### Defect Analysis:
1. **No WebSocket Push on Notification Creation**:
   - `notification_service.create_notification()` saves notifications to SQLite/PostgreSQL, but **never calls** `ws_manager.send_personal_message()`.
   - The logged-in user is never notified via WebSocket in real time when an incident status changes, case is assigned, or evidence is verified.
2. **WebSocket Disconnected at Login / Session Restore**:
   - In `App.tsx`, `enclaveWS.connect()` runs on initial page mount. At mount time, `apiClient.getToken()` is often `null` before `restoreSession()` finishes.
   - When the user logs in via `AuthModal` or Google OAuth, `enclaveWS.connect()` was **never re-invoked**. The WebSocket connection remained permanently closed.
3. **No Dedicated Notification Center**:
   - Clicking the notification bell in `Header.tsx` opens a minimal 5-item popover in `App.tsx` with no filtering by type (Complaint, Case, Evidence, Security, System), no pagination, and no navigation to the referenced incident or evidence.
4. **Unread Count Stale**:
   - The unread count badge in `Header.tsx` only updated on initial load or manual refresh, not reactively via WebSocket events.

---

## 4. User Profile & Account Experience Deficiencies

### Defect Analysis:
1. **Missing Global Profile Screen**:
   - Top-right profile menu in `Header.tsx` only provided a "Sign Out" button (and a link to Citizen Portal only if already on the citizen portal). Operators in Admin, Specialist, Police, and AI/ML portals had no way to view or edit their profile.
2. **Citizen Profile Tab Was Minimal Placeholder**:
   - In `CitizenPortal.tsx`, the `profile` tab rendered a 15-line card showing static text. It lacked:
     - Real complaint counts (Total, Active, Resolved).
     - Digital evidence file counts.
     - Verification status badges (Email, Phone, Google OAuth).
     - Notification delivery preferences.
     - Profile editing (Name, Phone number with verification safeguard).
3. **Missing Session & Security Telemetry**:
   - Neither citizens nor administrative staff had a view showing active session start time, authentication method, or recent login activity.

---

## 5. False & Misleading Infrastructure Claims Identified

The following hardcoded synthetic values violate the Non-Negotiable Real-Data Rule and must be eradicated:

1. **"99.98% / 99.9% System Health"**: Static string in `AdminPortal.tsx` and `Sidebar.tsx` badge.
2. **"24/24 Tests Pass"**: Static claim in `AdminPortal.tsx` System Health tab.
3. **"PostgreSQL / SQLite Async"**: Must truthfully state SQLite when SQLite engine is active.
4. **"Master AES-256-GCM Vault Key ROTATED: 2026-09-01"**: Fictitious key rotation date.
5. **"100% of Staff FIDO2 Enforced"**: Fabricated security claim.
6. **"TLS 1.3 EXCLUSIVE"**: Misleading when accessed over HTTP localhost.
7. **External APIs**: FinCEN, CERT-In Webhook, VASP Freeze, Telecom CDR Gateway cards are completely synthetic.
8. **Database Shards & Blobs**: "1.4 TB evidence blobs", "384,000 logs", "Shard 01/02/03" are fictitious.
9. **"Tamper-Proof Audit Trail Ledger"**: Unsupported cryptographic claim for standard relational tables.

---

## 6. Action Plan & Architectural Remediation

1. **Admin Dashboard**: Connect to real aggregated counts from `Case`, `Complaint`, `Evidence`, `User`, `Department`, `AuditLog`, and genuine model health.
2. **Roles & Permissions**: Build a read-only authoritative permission matrix mapping all 5 operational roles to enforceable backend permissions.
3. **Departments**: Remove fake department fallbacks; provide real member and case counts per unit, plus editing support (`PATCH /admin/departments/{id}`).
4. **System Health**: Provide genuine telemetry: DB latency, SQLite file size and path, storage directory status, AI model status, WebSocket connection state.
5. **System Configuration**: Display actual runtime configuration from `settings` (session timeout, JWT expiry, OTP cooldown, max evidence upload size, allowed MIME types, AI provider, WebSocket state) marked as `CONFIGURED` / `READ-ONLY`.
6. **Security & Auth Enclave**: Show real security controls (Argon2id password hashing, JWT HS256, Google OAuth configured status, OTP cooldown, rate limiting status, account lockout limits) and real security audit events.
7. **API Integrations**: Remove fake cards. Show genuine configured integrations: Google OAuth, Twilio SMS/OTP, Local Generative LLM Runtime, Internal WebSockets, Local Storage Vault.
8. **Database Management**: Show actual database engine, safe sanitized URL, SQLite file size, table row counts, and real database backup creation (`storage/backups/ccip_backup_<timestamp>.db`).
9. **Audit Logs Trail**: Add search, action/actor filters, row inspection drawer, and working CSV/JSON export (`GET /api/v1/admin/audit/export`).
10. **Notification System**:
    - Trigger `ws_manager.send_personal_message` inside `create_notification()`.
    - Auto-reconnect `enclaveWS` upon authentication and session restoration.
    - Build rich Notification Bell dropdown and a complete Notification Center view.
11. **User Profile Modal & Citizen Profile**:
    - Build universal `/profile` view with Profile, Security, and Notification Preferences tabs.
    - Enable name and phone updating with server-side validation.
    - Implement Citizen-safe view with live incident counts and zero internal leakages.
