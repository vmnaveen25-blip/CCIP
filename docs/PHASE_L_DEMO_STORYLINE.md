# Phase L Evaluator Demo Storyline: The Telegram Syndicate Infiltration

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Estimated Demonstration Duration:** 10–15 Minutes  
**Demonstration Scope:** Live End-to-End Walkthrough Across 5 Authoritative Roles  
**Prerequisites:** Backend running on port 8000, Frontend running on port 5173, all 11 local models cached.  

---

## 1. Demo Narrative Arc & Dramatis Personae

| Act | Role Persona | Demo Persona Name & Email | Key Story Action |
|---|---|---|---|
| **Act I** | `CITIZEN` | Elena Rostova (`elena.rostova@cyberdefense.org`) | Evaluates malicious Telegram URL on Cyber Shield $\rightarrow$ Files complaint $\rightarrow$ Seals transaction receipt with SHA-256. |
| **Act II** | `CYBERSECURITY_SPECIALIST` | Alex Thorne (`a.thorne@astraea.gov`) | Reviews technical indicators via Hybrid NER $\rightarrow$ Extracts relations $\rightarrow$ Activates official Case Docket $\rightarrow$ Runs Intelligence Refresh. |
| **Act III** | `CYBERCRIME_POLICE` | Det. Inspector Sarah Chen (`s.chen@police.gov`) | Discovers cross-case syndicate link $\rightarrow$ Explores Evidence Graph Canvas $\rightarrow$ Confirms correlation $\rightarrow$ Advances case lifecycle to `CLOSED`. |
| **Act IV** | `ADMIN` | Root Administrator (`root@astraea.internal`) | Inspects offline enclave diagnostics $\rightarrow$ Reopens closed case with mandatory audit justification. |
| **Act V** | `AI_ML_SYSTEM_LEAD` | Marcus Vance (`m.vance@ai-ops.gov`) | Inspects model registry cards $\rightarrow$ Verifies 5-gate Feedback Gate evaluation $\rightarrow$ Approves record into Controlled Learning Queue. |

---

## 2. Step-by-Step Speaker Script & Action Runbook

### Act I: The Citizen Threat Screening & Complaint Filing (3 Minutes)
1. **Navigate to Citizen Portal:** Open `http://localhost:5173` and click on **Cyber Shield**.
2. **Screen Malicious Lure:**
   - Paste URL: `https://secure-sbi-update-kyc.in/login.php`
   - Click **Run Threat Check**.
   - *Speaker Note:* "Notice that our local XGBoost model scores this in real-time on CPU. It returns a 56.8% phishing probability with 3 suspicious features detected, explaining *why* it is dangerous without sending data to external cloud APIs."
3. **Submit Complaint:**
   - Log in as Elena (`elena.rostova@cyberdefense.org` / `AstraeaEnclave#42`).
   - Fill complaint: "Telegram High-Yield Investment Scam by @invest_guru promising 30% daily returns. Transferred Rs 150,000 to UPI `scammer@oksbi` on GooglePay. Domain: `https://fake-invest-portal.biz`."
   - Click **Submit Complaint**. Reference number generated: `CYBER-2026-XXXX`.
4. **Upload Evidence:**
   - Attach PDF bank statement receipt.
   - *Speaker Note:* "Observe the server instantly computing and storing the SHA-256 digest `2277b9e3...`. This establishes an immutable, tamper-evident evidence integrity trail for court admissibility."

---

### Act II: Specialist Technical Triage & Hybrid Extraction (3 Minutes)
1. **Log in as Specialist:** (`a.thorne@astraea.gov` / `AstraeaEnclave#42`).
2. **Specialist Workbench:** Open the newly filed complaint.
3. **Execute Hybrid Cyber NER:**
   - Click **Extract Cyber Entities**.
   - *Speaker Note:* "Watch the hybrid engine in action: `scammer@oksbi` is recognized deterministically as a UPI ID; `@invest_guru` and `fake-invest-portal.biz` are extracted as platform and URL indicators; the suspect name is extracted via DeBERTa-v3 token classification. Deterministic regex authority strictly supersedes any token conflict."
4. **Extract Relations:** Click **Extract Relations**. RoBERTa links `scammer@oksbi` to State Bank of India with `ASSOCIATED_WITH_BANK` (91% confidence).
5. **Activate Official Case Docket:** Click **Create Official Case Docket** (`CASE-CYBER-2026-XXXX`).
6. **Trigger Multi-Stage Intelligence Refresh:** Click **Refresh Intelligence**. The orchestrator sequentially executes urgency scoring, dense semantic similarity, and cross-case correlation without pipeline failure.

---

### Act III: Police Syndicate Discovery & Graph Investigation (4 Minutes)
1. **Log in as Police Investigator:** (`s.chen@police.gov` / `AstraeaEnclave#42`).
2. **Police Command Console:** Open active case docket `CASE-CYBER-2026-XXXX`.
3. **Review Cross-Case Correlations:**
   - *Speaker Note:* "Look at the Candidate Correlation card. The system detected an existing case in Station B sharing the exact same UPI handle `scammer@oksbi` and a matching Telegram pitch. Notice the explicit disclaimer: *'Candidate Correlation — Investigator Review Required'*."
   - Inspector Chen reviews the evidence and clicks **Confirm Correlation** with note: *"Shared payment handle confirmed as active mule syndicate."*
4. **Interactive Evidence Graph Canvas:**
   - Click **Open Evidence Graph**.
   - Explore the force-directed graph: Case node $\rightarrow$ UPI node $\rightarrow$ Bank node $\rightarrow$ Linked historical case node.
   - *Speaker Note:* "Every node has explicit entity badges. Relation edges indicate model provenance. If I run another AI refresh right now, Inspector Chen's confirmed verdict is locked and will NEVER be overwritten."
5. **Advance State Machine:** Update status through canonical transitions: `UNDER_INVESTIGATION` $\rightarrow$ `EVIDENCE_VERIFIED` $\rightarrow$ `LAW_ENFORCEMENT_DISPATCHED` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED`.

---

### Act IV: Administrative Governance & Audit Trail (2 Minutes)
1. **Log in as Administrator:** (`root@astraea.internal` / `AstraeaEnclave#42`).
2. **Inspect Enclave Diagnostics:** Admin dashboard confirms `OFFLINE ENCLAVE / PASS`, zero mock data, and 100% operational persistence.
3. **Administrative Case Reopen:**
   - Attempting to edit a closed case via standard endpoints is blocked by the state machine.
   - Click **Reopen Closed Case**. Enter mandatory justification: *"New supplemental financial transaction records received from beneficiary bank."*
   - Case successfully transitions back to `UNDER_INVESTIGATION`; audit log captures the administrator's identity and timestamp.

---

### Act V: AI Lead Governance & The 5-Gate Continual Learning Queue (3 Minutes)
1. **Log in as AI/ML System Lead:** (`m.vance@ai-ops.gov` / `AstraeaEnclave#42`).
2. **Model Registry Oversight:** Inspect cards for all 11 models, viewing exact held-out F1 metrics and training lineage.
3. **Feedback Gate Diagnostics:**
   - Review how Inspector Chen's confirmed correlation was evaluated against the **5 Deterministic Hard Gates** (Confidence $\ge 0.85$, PII Anonymization, Human Review, Agreement, Anti-Drift).
   - All 5 gates passed $\rightarrow$ Case placed into `learning_candidates` queue with status `PENDING`.
4. **Curation Without Auto-Retraining:**
   - Vance reviews the candidate record and clicks **Approve for Controlled Learning**.
   - *Speaker Note:* "Notice that approving this candidate does NOT trigger an automatic model retraining run or redeployment. It stages the sanitized data into an isolated training queue for scheduled, human-overseen re-evaluation. Responsible AI is baked into the architecture."
