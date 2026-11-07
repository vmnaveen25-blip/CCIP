# CCIP EVIDENCE RETENTION & LIFECYCLE MANAGEMENT POLICY
**Data Governance, Statutory Compliance & Secure Decommissioning**

---

## 1. Regulatory Framework & Retention Objectives

The Cyber Crime Intelligence Platform (CCIP) enforces strict evidence retention schedules aligned with:
- Criminal Procedure Code (CrPC) / Bharatiya Nagarik Suraksha Sanhita (BNSS) statutory limitation periods.
- ISO/IEC 27040 (Storage Security) & ISO/IEC 27037 (Digital Evidence Handling).
- National Cyber Crime Reporting Portal (NCRP) governance directives.

The policy balances long-term evidentiary availability for criminal prosecution against privacy mandates and storage optimization.

---

## 2. Retention Classifications & Schedules

| Evidence Class | Description | Retention Period | Default Action Post-Period |
|---|---|---|---|
| **Class A: Active Adjudication** | Evidence linked to active FIR / chargesheeted court cases | Duration of judicial trial + 10 Years appeal period | Indefinite Legal Hold |
| **Class B: Preliminary Inquiry** | Verified complaints under active investigation without FIR | 3 Years from closure date | Cold Archive to Tier 2 Storage |
| **Class C: Citizen Intake Artifacts** | Unverified or unsubstantiated complaint attachments | 1 Year from status `REJECTED` or `WITHDRAWN` | Automated Cryptographic Sanitization |
| **Class D: Temporary Forensic Dumps** | Memory captures, pcap files, disk triage images | 180 Days post extraction report generation | Archive to offline air-gapped media |
| **Class E: Chain of Custody Metadata** | Cryptographic hash logs, custody event entries, audit trails | **Permanent (Never Deleted)** | Retained indefinitely in read-only ledger |

---

## 3. Legal Hold Mechanism

A Legal Hold freezes automated retention expirations for specific evidence items or entire case dossiers.
- **Trigger**: Issued by Investigating Officer (IO), Court Order, or Public Prosecutor.
- **System Impact**:
  - Sets `is_legal_hold = true` on the evidence record.
  - Deletion, truncation, or movement endpoints return `403 Forbidden: Active Legal Hold`.
  - Periodic retention cleanup workers skip flagged records.

---

## 4. Secure Disposal & Sanitization Standards

When an evidence item completes its retention lifespan without active legal holds:
1. **Approval Gate**: Dual authorization required (Case Officer + Administrative Chief).
2. **Sanitization Method**: NIST SP 800-88 Rev. 1 (Cryptographic Erase / 3-Pass Overwrite).
3. **Disposal Log**: A tombstone record is generated preserving:
   - Initial SHA-256 hash.
   - Deletion timestamp.
   - Authorizing officer ID.
   - Disposal certificate digest.
4. Physical disk blocks are overwritten with pseudo-random bytes prior to unlinking file pointers.
