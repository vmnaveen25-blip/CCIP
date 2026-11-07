# ADMINISTRATOR SECURITY SPECIFICATION
## Least Privilege, Privilege Escalation Defenses & Security Event Registry
**Document Version:** 2026.2  
**Platform:** CCIP Sovereign Enclave  

---

## 1. Zero-Trust Access Architecture

Administrative accounts hold elevated privileges within the CCIP enclave and are governed by strict security defenses:

### 1.1 Least Privilege Role-Based Access Control (RBAC)
- **ADMIN:** System infrastructure, user accounts, and audit log inspection. Cannot alter operational police case statuses without audit records.
- **CYBERCRIME_POLICE:** Case creation, suspect tracking, law enforcement dispatch.
- **CYBERSECURITY_SPECIALIST:** Digital evidence forensics, threat classification, IOC extraction.
- **CITIZEN:** Restricted strictly to self-owned complaints and status tracking.

### 1.2 Broken Function-Level Authorization (BFLA) Prevention
- Frontend route hiding is treated purely as a UI convenience, never as a security boundary.
- Every API endpoint enforces `@require_admin`, `@require_police`, or `@require_specialist` backend dependencies.
- Citizen accounts probing administrative endpoints (`/api/v1/admin/*`) receive immediate `403 Forbidden` responses.

### 1.3 Security Event Registry (`security_events_registry`)
- Automatically records security anomalies:
  * Repeated authentication failures / brute force attempts.
  * Rate limit breaches (HTTP 429).
  * Unauthorized cross-citizen complaint enumeration attempts (BOLA).
  * High-risk administrative actions and dual-authorization decisions.
