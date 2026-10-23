# CCIP / Astraea Enclave — 10–15 Minute Live Demonstration Runbook

**Document Version:** 1.0.0  
**Phase:** Phase K — End-to-End Intelligence Hardening, Real Prototype Validation & Demo Readiness  
**Target Environment:** Local Enclave Runtime (100% Offline, Zero Internet Required)  
**Demonstration Length:** 10–15 minutes  
**Date:** 2026-09-12  

---

## 1. Demo Prerequisites & Environment Launch

Ensure both services are running locally:

```powershell
# Terminal 1: Backend API
cd C:\Users\Admin\Desktop\CCIP\backend
py -3.12 -m uvicorn app.main:app --port 8000

# Terminal 2: Frontend Client
cd C:\Users\Admin\Desktop\CCIP\frontend
npm run dev -- --port 5173
```

- **Frontend URL:** `http://localhost:5173`
- **Backend Swagger/Docs:** `http://localhost:8000/docs`

---

## 2. Credentials Quick Reference

| Role | Email | Password | Primary Demo Screen |
|---|---|---|---|
| **Citizen** | `elena.rostova@cyberdefense.org` | `AstraeaEnclave#42` | `/citizen`, `/citizen/cyber-shield`, `/citizen/file-complaint` |
| **Cybersecurity Specialist** | `a.thorne@astraea.gov` | `AstraeaEnclave#42` | `/specialist`, `/specialist/triage/:id` |
| **Cybercrime Police** | `s.chen@police.gov` | `AstraeaEnclave#42` | `/police`, `/police/cases/:id` |
| **Admin** | `root@astraea.internal` | `AstraeaEnclave#42` | `/admin`, `/admin/governance` |
| **AI/ML System Lead** | `m.vance@ai-ops.gov` | `AstraeaEnclave#42` | `/ai-lead`, `/ai-lead/models`, `/ai-lead/candidates` |

---

## 3. Step-by-Step 10–15 Minute Demonstration Flow

### Scene 1: Citizen Cyber Shield Pre-Incident Threat Screening (2 mins)
- **Actor:** Citizen (`elena.rostova@cyberdefense.org`)
- **Page:** Navigate to **Citizen Cyber Shield** (`/citizen/cyber-shield`).
- **Action 1 (URL Phishing):** Enter suspicious URL: `https://secure-sbi-update-kyc.in/login.php`.
  - **Click:** "Inspect Threat with Local Enclave AI".
  - **Expected Result:** Flagged as **Phishing / Malicious Domain**. Shows genuine XGBoost probability (~65%), suspicious heuristic count, and plain-language guidance: *"Do not enter netbanking credentials. Report immediately to 1930."*
- **Action 2 (Smishing SMS):** Enter SMS text: `Dear customer, your SBI card is blocked. Click http://bit.ly/sbi to unblock.`
  - **Expected Result:** Flagged as **Smishing Threat** via DistilBERT (>95% spam probability).
- **Action 3 (Pre-fill Complaint):** Click the button: **"File Official Complaint from Threat Report"**.
  - **Expected Result:** Navigates to `/citizen/file-complaint` with threat text, detected URL, and category pre-filled.

### Scene 2: Complaint Filing & SHA-256 Evidence Seal (2 mins)
- **Actor:** Citizen
- **Page:** `/citizen/file-complaint`
- **Action:**
  - Enter loss amount: `150,000 INR`.
  - Narrative: `Transferred funds to UPI scammer@oksbi after receiving fake investment advice on Telegram @invest_guru. Domain used: https://fake-invest-portal.biz.`
  - Upload sample transaction PDF or screenshot.
  - **Click:** "Submit Official Cybercrime Complaint".
- **Expected Result:**
  - Receives unique reference code: `CYBER-2026-XXXX`.
  - Evidence locker shows: **"Evidence Integrity Verified"** and hex **"SHA-256 Integrity Seal"**.

### Scene 3: Specialist Triage, Hybrid Cyber NER & Relations (3 mins)
- **Actor:** Cybersecurity Specialist (`a.thorne@astraea.gov`)
- **Page:** `/specialist` -> Open newly submitted complaint.
- **Action:**
  - **Complaint Classification:** Display multi-label DeBERTa prediction (`Financial Fraud: 98%`).
  - **Hybrid Cyber NER:** Point out extracted indicators:
    - `UPI_ID`: `scammer@oksbi` (Provenance: `DETERMINISTIC`)
    - `PERSON_NAME`: `@invest_guru` / Suspect (Provenance: `TRANSFORMER`)
    - `DOMAIN`: `fake-invest-portal.biz` (Provenance: `DETERMINISTIC`)
  - **Cyber Relation Extraction:** Show predicted entity relationship:
    - `@invest_guru` -> `scammer@oksbi` (`TRANSFERRED_TO` / `USES_ACCOUNT`)
  - **Triage Action:** Click **"Triage & Promote to Active Case"**.
- **Expected Result:** Case created with ID `CASE-CYBER-2026-XXXX`. Specialist reviews Incident Urgency advisory signal (`HIGH Priority — human review required`).

### Scene 4: Police Investigation, Correlations & Evidence Graph (4 mins)
- **Actor:** Cybercrime Police Officer (`s.chen@police.gov`)
- **Page:** `/police/cases/:id`
- **Action 1 (Cross-Case Correlation):**
  - View **Candidate Correlations** tab.
  - Point out candidate match with an earlier case sharing `scammer@oksbi`.
  - Highlight required non-accusatory disclaimer: *"AI candidate correlation — semantic similarity does not establish a common offender. Investigator review required."*
- **Action 2 (Evidence Graph):**
  - Open **Interactive Evidence Graph** view.
  - Show multi-hop graph connecting Case, Complaint, UPI Node, Phone Node, and Domain Node.
  - Demonstrate candidate edge vs investigator confirmed edge distinction.
- **Action 3 (Lifecycle Progression):**
  - Progress status: `ASSIGNED` -> `UNDER_INVESTIGATION` -> `EVIDENCE_VERIFIED` -> `LAW_ENFORCEMENT_DISPATCHED` -> `RESOLVED` -> `CLOSED`.

### Scene 5: Admin Governance & Case Reopen (2 mins)
- **Actor:** Admin (`root@astraea.internal`)
- **Page:** `/admin/cases/:id`
- **Action:**
  - Locate the closed case.
  - Click **"Reopen Case for Supplemental Evidence"**.
  - Enter justification: *"New beneficiary bank transaction logs received."*
- **Expected Result:** Case status transitions back to `UNDER_INVESTIGATION`. Audit log and notification immediately generated.

### Scene 6: AI/ML System Lead & Feedback Gate Governance (2 mins)
- **Actor:** AI/ML System Lead (`m.vance@ai-ops.gov`)
- **Page:** `/ai-lead/models` and `/ai-lead/candidates`
- **Action 1 (Truthful Registry):**
  - Show all 11 model statuses.
  - Highlight Cyber NER truthful metrics (Validation F1: 87.23%, Held-out F1: 58.41%, Challenge F1: 3.23%).
- **Action 2 (Feedback Gate Hard Rules):**
  - Open learning candidate review queue.
  - Demonstrate hard gate enforcement: if a candidate has `evidence_integrity_verified == false` or `case_finalized == false`, show that it is blocked from dataset entry.
  - Show that approving an eligible candidate marks it `APPROVED_FOR_DATASET` for offline evaluation without triggering any automated model retraining.

---

## 4. Fallback Strategies (If Model Loads Slowly on CPU)

1. **Transformer Cold Start:**
   - The first time a transformer runs, CPU cold-load can take 3–8 seconds.
   - *Presenter Note:* Mention: *"The sovereign enclave lazily loads model weights into secure memory on first invocation with local_files_only=True."* Subsequent inferences run in warm mode in 50–150ms.
2. **Offline Local Constraint:**
   - If questioned about internet access, open Network tab in DevTools to prove **zero external requests** leave the machine.
