# Phase M — Real-Data Annotation Guidelines & Quality Framework

**Document ID:** CCIP-DOC-M-003  
**Classification:** Operational Annotation Standard  
**Date:** September 2026  
**Status:** Canonical Standard for Human-in-the-Loop Evaluation  

---

## 1. General Principles and Reviewer Qualifications

To ensure rigorous, statistically sound, and legally defensible evaluation data, all human annotations across pilot datasets must adhere to these foundational rules:

1. **Dual Reviewer Mandate**: All high-impact labels (Complaint Classification, Cyber NER contextual entities, Incident Urgency, Cross-Case Correlation, and Feedback Gate) must be independently annotated by at least **two qualified reviewers**.
2. **Reviewer Qualifications**:
   - *Technical Categories / Threats*: Cybersecurity Analyst (min. 2 years experience in SOC or cyber incident triage).
   - *Legal / Statutory Offenses*: Cybercrime Police Officer / Inspector (trained in IT Act 2000 and BNS/IPC sections).
   - *ML System Governance*: AI/ML Systems Engineer or Data Governance Officer.
3. **Abstain / Uncertain Policy**: Reviewers are strictly forbidden from guessing. If evidence is ambiguous, incomplete, or truncated, reviewers must record `UNSURE` or `ABSTAIN`.
4. **Adjudication Process**: Inter-annotator disagreements are resolved by a third Senior Reviewer (Adjudicator) to produce the finalized Gold Label.

---

## 2. Task-by-Task Annotation Specifications

### Task A: Complaint Classification
- **Annotation Unit**: Full citizen complaint text narrative.
- **Allowed Labels (18 Categories)**:
  `FINANCIAL_FRAUD`, `IDENTITY_THEFT`, `PHISHING_SCAM`, `CYBER_BULLYING_HARASSMENT`, `JOB_INVESTMENT_FRAUD`, `LOTTERY_PRIZE_SCAM`, `SEXTORTION_BLACKMAIL`, `RANSOMWARE_MALWARE`, `SOCIAL_MEDIA_ACCOUNT_HACKING`, `E_COMMERCE_FRAUD`, `CRYPTO_FRAUD`, `IMPERSONATION_DEFAMATION`, `UNAUTHORIZED_ACCESS`, `DATA_LEAK_PRIVACY`, `ONLINE_GAMING_FRAUD`, `MATRIMONIAL_DATING_FRAUD`, `DENIAL_OF_SERVICE`, `OTHER_CYBERCRIME`.
- **Classification Paradigm**: Multi-label classification (a complaint can involve both `IMPERSONATION_DEFAMATION` and `FINANCIAL_FRAUD`).
- **Ambiguity Handling**: If fraud mechanism is novel, assign `OTHER_CYBERCRIME` and annotate specific tags in notes.
- **Edge Cases**: Threat extortion with simulated kidnap is marked `SEXTORTION_BLACKMAIL` or `OTHER_CYBERCRIME` with police alert flag.

### Task B: Cyber Named Entity Recognition (NER)
- **Annotation Unit**: Word/character token spans within narrative and extracted evidence logs.
- **Structured Entities (Deterministic Primary Authority)**:
  `URL`, `DOMAIN`, `EMAIL_ADDRESS`, `IP_ADDRESS`, `IFSC_CODE`, `FILE_HASH`, `CRYPTO_WALLET`.
- **Contextual Entities (Transformer Primary Authority)**:
  `PERSON_NAME`, `BANK_NAME`, `ORGANIZATION`, `PLATFORM_NAME`, `SOCIAL_HANDLE`, `AMOUNT`, `UPI_ID`, `PHONE_NUMBER`, `BANK_ACCOUNT`, `UTR`, `TRANSACTION_ID`.
- **Tagging Format**: Strict `B-` (Begin), `I-` (Inside), and `O-` (Outside) BIO sequence tokens.
- **Span Boundaries**:
  - Punctuation immediately trailing an entity (e.g., `"contacted via Telegram,"`) must NOT be included in the entity span.
  - Indian currency symbols and words (e.g., `"Rs."`, `"INR"`, `"₹"`) must be included in `AMOUNT` span only if consistent across document standard; preferred standard is numeric + currency symbol together.
- **Ambiguity**: Do not label generic words ("sir", "officer", "manager") as `PERSON_NAME` unless an identifiable name is present.

### Task C: Relation Extraction
- **Annotation Unit**: Entity-pair `(head_entity, tail_entity)` within the same complaint context.
- **Allowed Relations (9 Relations)**:
  1. `TRANSFERRED_TO` (e.g., victim → scammer account/UPI)
  2. `CONTACTED_VIA` (e.g., scammer → Telegram/WhatsApp/phone)
  3. `IMPERSONATES` (e.g., scammer → Bank/Police official)
  4. `ASSOCIATED_WITH_BANK` (e.g., account/IFSC → SBI/HDFC)
  5. `PAID_AMOUNT` (e.g., transaction → amount)
  6. `USES_ACCOUNT` (e.g., suspect → bank account)
  7. `SENT_MESSAGE_TO` (e.g., sender → victim)
  8. `OWNS_OR_CONTROLS` (e.g., entity → domain/wallet)
  9. `NO_RELATION` (null hypothesis)
- **Edge Cases**: If entity pair has directionality ambiguity, default to chronological causality (Victim `TRANSFERRED_TO` Mule).

### Task D: Incident Urgency
- **Annotation Unit**: Triage summary and incident context.
- **Allowed Labels**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Statutory Severity Criteria**:
  - `CRITICAL`: Ongoing financial bleeding (<2 hours from transfer, golden hour active), suicide/life threat, critical infrastructure compromise, or child sexual abuse material (CSAM).
  - `HIGH`: Losses > ₹5,00,000, active ransomware infection, or identity takeover of law enforcement personnel.
  - `MEDIUM`: Losses ₹50,000–₹5,00,000, offline phishing attempt without known data compromise.
  - `LOW`: Losses < ₹50,000 or spam/lure messages with zero interaction or financial loss.
- **Strict Rule**: Reviewers evaluate **incident impact and active threat**, NEVER suspect culpability.

### Task E: Case Similarity
- **Annotation Unit**: Pair of complaint descriptions `(Complaint_A, Complaint_B)`.
- **Allowed Labels**: `SIMILAR` (1), `DISSIMILAR` (0).
- **Criterion**: Shared Modus Operandi (MO), identical lure phrasing, shared target demographic, or common attack infrastructure.

### Task F: Cross-Case Correlation
- **Annotation Unit**: Structured graph & narrative comparison between two distinct cases.
- **Allowed Labels**:
  - `UNRELATED`: No shared infrastructure, distinct MOs, unrelated parties.
  - `POSSIBLY_RELATED`: Shared heuristic indicators (similar phone prefix, identical phishing template, same bank branch).
  - `STRONGLY_RELATED`: Verified identical hard indicators (exact same UPI ID, bank account number, phone number, wallet address, or malware hash).
- **Semantics**: Relates cases, NOT persons. Label must read `STRONGLY_RELATED_CASE`, never "same criminal".

### Task G: Evidence Graph Links
- **Annotation Unit**: Candidate edge between two nodes in evidence topological graph `(Node_A, Node_B)`.
- **Allowed Labels**: `CANDIDATE_LINK`, `NO_LINK`.
- **Criterion**: Verifiable transactional or infrastructural adjacency (e.g., IP address hosting domain; account receiving funds from UPI).

### Task H: Feedback Gate
- **Annotation Unit**: Candidate operational learning record submitted by specialist or investigator.
- **Evaluation**:
  - **Stage 1: Five Deterministic Hard Gates** (Must score 100% pass):
    1. Authorized submitter role (`CYBERSECURITY_SPECIALIST`, `CYBERCRIME_POLICE`)
    2. Evidence integrity verification (SHA-256 matches vault record)
    3. Audit trail complete and signed
    4. Case finalized / closed with no pending appeal
    5. No open reopening petition
  - **Stage 2: Machine Learning Reliability Gating**:
    - `APPROVE_CANDIDATE` (High evidentiary reliability, validated ground truth)
    - `REQUIRES_REVIEW` (Marginal confidence, ambiguous telemetry)
    - `REJECT` (Low confidence, contradictory notes, unverified claims)

---

## 3. Conflict Resolution & Gold Label Adjudication

```
[Annotator 1] ───┐
                 ├── Agreement Check ──► [K >= 0.80] ──► [Accepted as Gold Label]
[Annotator 2] ───┘         │
                           ▼ [Disagreement]
                  [Senior Adjudicator] ──► [Final Resolved Gold Label]
```

- If Cohen's kappa $\kappa < 0.70$ on a batch, annotation is paused and guidelines are re-reviewed with annotators.
- All adjudication rationale must be recorded in the audit trail.
