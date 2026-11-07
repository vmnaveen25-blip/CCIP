# REPORT TRACKING WORKFLOW SPECIFICATION
## Enumeration-Resistant Multi-Tier Status Tracking
**Document Version:** 2026.2  
**Platform:** CCIP Sovereign Enclave  

---

## 1. Tracking Philosophy & Threat Model

Public tracking endpoints frequently suffer from Broken Object Level Authorization (BOLA/IDOR) and automated enumeration, allowing unauthorized adversaries to harvest victim identities or case statuses.

To prevent enumeration attacks, CCIP implements **Dual-Tier Tracking**:

```
+-------------------------------------------------------------+
|                GET /api/v1/complaints/track/{ref}           |
+-------------------------------------------------------------+
                               |
              Does request present tracking token or
              authenticated citizen/investigator session?
                               |
             +-----------------+-----------------+
             |                                   |
            NO                                  YES
             v                                   v
+-----------------------------+   +-----------------------------+
|     PUBLIC MINIMAL TIER     |   |   FULL VERIFIED MILESTONE   |
+-----------------------------+   +-----------------------------+
| - Reference Number          |   | - Reference Number          |
| - High-level Status Label   |   | - Detailed Milestone Events |
| - Category                  |   | - Forensic Evidence Count   |
| - Reported Date             |   | - Assigned Unit Name        |
| ZERO PII / ZERO NARRATIVE   |   | - Clarification Requests    |
+-----------------------------+   +-----------------------------+
```

---

## 2. Permitted Lifecycle Statuses & Transitions

The platform enforces a strict finite state machine (`backend/app/core/state_machine.py`):

1. `DRAFT`: Local draft saved by citizen; not yet visible to police.
2. `SUBMITTED`: Cryptographically sealed and queued in triage enclave.
3. `VALIDATION_PENDING` / `UNDER_REVIEW`: Technical and evidentiary triage active.
4. `TRIAGED`: AI-assisted threat scoring completed; priority computed.
5. `VALIDATED`: Senior specialist confirmed evidence authenticity.
6. `CASE_CREATED`: Formal investigation case docket initialized.
7. `ASSIGNED`: Allocated to specialized cyber cell investigator.
8. `UNDER_INVESTIGATION`: Forensic analysis, bank nodal coordination, and ISP tracing active.
9. `ADDITIONAL_INFO_REQUIRED`: Complainant requested to provide supplementary bank receipts or evidence.
10. `EVIDENCE_VERIFIED`: Section 65B Indian Evidence Act integrity certificate generated.
11. `LAW_ENFORCEMENT_DISPATCHED`: Field investigation or physical raid initiated.
12. `REFERRED`: Handed over to competent state police or inter-agency unit.
13. `RESOLVED`: Offender apprehended, funds frozen, or restorative notice served.
14. `CLOSED`: Case formally concluded. Re-opening strictly requires supervisor dual-authorization.
15. `REJECTED`: Frivolous, non-jurisdictional, or duplicate complaint rejected with recorded rationale.
