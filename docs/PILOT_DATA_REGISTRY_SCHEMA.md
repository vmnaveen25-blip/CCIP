# Pilot Data Registry & Governance Schema

**Document ID:** CCIP-DOC-M-002  
**Classification:** Operational Data Governance & Pilot Specification  
**Date:** September 2026  
**Status:** Approved Specification  

---

## 1. Overview and Operational Purpose

The **Pilot Data Registry** provides an immutable metadata and audit trail for all datasets utilized during pilot validation phases of the Citizen Cybercrime Intelligence Platform (CCIP / Astraea Enclave).

> [!IMPORTANT]
> **Strict Privacy Guarantee**:
> - The registry stores **metadata, authorization parameters, retention constraints, and integrity hashes ONLY**.
> - **Zero raw citizen complaint text, unredacted PII, or raw evidence payloads are stored directly in the registry schema.**
> - All actual evaluation files reside in access-controlled enclave directories referenced via `storage_location_ref`.

---

## 2. Pilot Data Modes

All evaluation and validation assets ingested into CCIP must be categorized into one of four operational modes:

| Mode | Name | Description | Authorization Basis | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **MODE A** | Public / Benchmark | Publicly available academic and industry cybersecurity/phishing benchmark datasets. | Open-access / Research License | AI Team, Specialists, Police |
| **MODE B** | De-Identified Historical | Historical complaints/cases stripped of direct PII (names, Aadhaar numbers, private addresses) with synthetic or masked identifiers. | Agency Statutory Data Sharing Agreement | Specialists, Police, AI Lead |
| **MODE C** | Shadow Pilot | Live operational complaints processed asynchronously by CCIP where human officers remain 100% authoritative and model inferences do NOT affect real-world outcomes. | Institutional Pilot Directive & Shadow Protocol | Authorized Pilot Reviewers |
| **MODE D** | Supervised Pilot | Operational cases where authorized investigators actively review and critique CCIP recommendations in supervised forensic triage. | Agency Head / Unit Commander Written Authorization | Assigned Officers & Supervisors |

---

## 3. Database Schema

### 3.1 Table: `pilot_dataset_registry`

```sql
CREATE TABLE pilot_dataset_registry (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- MODE_A_PUBLIC_BENCHMARK, MODE_B_DEIDENTIFIED_HISTORICAL, MODE_C_SHADOW_PILOT, MODE_D_SUPERVISED_PILOT
    source_description TEXT,
    authorization_basis VARCHAR(255) NOT NULL,
    deidentified BOOLEAN DEFAULT TRUE NOT NULL,
    contains_pii BOOLEAN DEFAULT FALSE NOT NULL,
    allowed_purposes_json JSON NOT NULL,
    retention_policy VARCHAR(255) NOT NULL,
    storage_location_ref VARCHAR(500) NOT NULL,
    created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING_APPROVAL' NOT NULL
);
```

### 3.2 Table: `pilot_evaluation_runs`

```sql
CREATE TABLE pilot_evaluation_runs (
    id VARCHAR(36) PRIMARY KEY,
    dataset_id VARCHAR(36) REFERENCES pilot_dataset_registry(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITHOUT TIME ZONE,
    model_versions_json JSON NOT NULL,
    status VARCHAR(50) DEFAULT 'RUNNING' NOT NULL, -- RUNNING, COMPLETED, FAILED
    created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL
);
```

### 3.3 Table: `pilot_predictions`

```sql
CREATE TABLE pilot_predictions (
    id VARCHAR(36) PRIMARY KEY,
    run_id VARCHAR(36) REFERENCES pilot_evaluation_runs(id) ON DELETE CASCADE NOT NULL,
    record_ref VARCHAR(100) NOT NULL,
    task VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    prediction_json JSON NOT NULL,
    confidence_json JSON NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
```

### 3.4 Table: `pilot_human_reviews`

```sql
CREATE TABLE pilot_human_reviews (
    id VARCHAR(36) PRIMARY KEY,
    prediction_id VARCHAR(36) REFERENCES pilot_predictions(id) ON DELETE CASCADE NOT NULL,
    reviewer_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    decision VARCHAR(50) NOT NULL, -- AGREE, DISAGREE, UNSURE
    correct BOOLEAN,
    correction_label VARCHAR(100),
    notes_redacted TEXT,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
```

---

## 4. Status Lifecycle & State Machine

```
[PENDING_APPROVAL] 
       │ (Authorization review by AI Lead / Admin)
       ▼
   [APPROVED] 
       │ (Evaluation run launched)
       ▼
    [ACTIVE]
       │
   ┌───┴───────────┐
   ▼               ▼
[EXPIRED]      [REVOKED]
(Retention)    (Security/Consent breach)
```

---

## 5. Security & Access Control Policies

1. **Citizen Role Denial**: Under no circumstances are Citizens permitted to query the pilot registry or view evaluation predictions (`403 Forbidden` strictly enforced at API router).
2. **Dual-Authorization for Deletion**: Once an evaluation run completes, records can only be purged by an Admin with explicit audit reason logging.
3. **Data Retention Timers**: `expires_at` enforcement triggers automated archiving or secure disk-wipe routines for pilot cache directories.
