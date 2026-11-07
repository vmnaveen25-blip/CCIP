# COMPLAINT REVIEW WORKFLOW SPECIFICATION
## Administrative Queue, Incident Allocation & Statutory Decisions
**Document Version:** 2026.2  
**Platform:** CCIP Sovereign Enclave  

---

## 1. Complaint Review Console

Authorized supervisors, cybercrime police officers, and administrators review ingested complaints through the **Complaint Management Console**:

### Review Operations:
1. **Intake Validation:** Reviewing citizen-submitted incident narrative, bank transaction statements, and IOCs.
2. **Clarification Requests:** Transitioning status to `ADDITIONAL_INFO_REQUIRED` when critical bank UTRs or digital evidence are missing.
3. **Investigator Allocation:** Assigning complaint to a specialized investigation unit and case officer via `POST /api/v1/complaints/{id}/assign`.
4. **Referral Protocol:** Routing non-cyber or cross-jurisdictional incidents to competent authorities (`REFERRED`).
5. **Rejection with Rationale:** Flagging frivolous or malicious complaints with mandatory audit justification (`REJECTED`).
