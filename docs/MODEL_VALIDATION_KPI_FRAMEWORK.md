# Production-Quality Model Validation KPI Framework

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Mathematical & Statistical Benchmark Definitions for Real-World Validation  
**Status:** Advanced Prototype / Pilot Preparation  

---

## 1. Overview & Objective

To transition from the current synthetic and bootstrap evaluation baseline to production-grade readiness, each model adapter must be benchmarked against rigorous, domain-specific statistical key performance indicators (KPIs). This framework defines the quantitative metrics, acceptance thresholds, and operational impact indicators required before full deployment.

---

## 2. Multi-Model Validation KPI Specifications

### A. Complaint Classifier (`ccip-complaint-classifier-v1`)
- **Macro F1 Score:** Target $\ge 0.90$ across all 18 cybercrime categories.
  $$\text{Macro F1} = \frac{1}{C}\sum_{c=1}^C \frac{2 \cdot P_c \cdot R_c}{P_c + R_c}$$
- **Per-Class Recall on High-Harm Categories:** Target $\ge 0.95$ on critical life/safety crimes (`SEXTORTION`, `CYBERSTALKING`, `DIGITAL_ARREST`). A false negative on critical categories carries catastrophic operational risk.
- **Expected Calibration Error (ECE):** Target $\text{ECE} \le 0.05$ across 10 probability bins, ensuring predicted confidence reflects real empirical likelihood.
  $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$

---

### B. Hybrid Cyber NER (`ccip-cyber-ner-v1`)
- **Overall Token & Entity Micro F1:** Target $\ge 0.90$.
- **Structured Indicator Precision:** Target $\ge 0.98$ on strict regex classes (`UPI_ID`, `PHONE_NUMBER`, `BANK_ACCOUNT`, `TRANSACTION_ID`). Zero false positives permitted in structured payment routing.
- **Contextual Entity Recall:** Target $\ge 0.85$ on `PERSON_NAME` (suspects) and `BANK_NAME`.
- **Out-of-Distribution (OOD) Challenge F1:** Target $\ge 0.65$ on noisy/adversarial phrasings (currently 3.23% in synthetic challenge splits).
- **Span Boundary Exact Match Ratio:** Target $\ge 0.88$ (exact character start and end index alignment).

---

### C. Relation Extraction (`ccip-cyber-relation-extraction-v1`)
- **Macro F1 Score:** Target $\ge 0.85$ across all 9 relation labels.
- **Financial Attribution Precision (`USES_ACCOUNT`, `TRANSFERRED_TO`):** Target $\ge 0.92$. False relation inferences risk issuing freeze notices against innocent accounts.
- **Null Relation Rejection Rate (`NO_RELATION`):** Target $\ge 0.90$ specificity, ensuring the model does not invent relationships between coincidentally co-occurring entities.

---

### D. Incident Urgency Scorer (`ccip-incident-urgency-v1`)
- **Macro F1:** Target $\ge 0.88$ across `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **False De-escalation Rate:** Target $< 1.0\%$. A `CRITICAL` or `HIGH` case must virtually never be classified as `LOW`.
  $$\text{False De-escalation Rate} = \frac{\text{Actual}_{\text{CRITICAL/HIGH}} \rightarrow \text{Pred}_{\text{LOW}}}{\text{Total Actual}_{\text{CRITICAL/HIGH}}}$$
- **False Escalation Rate:** Target $< 5.0\%$, preventing alert fatigue in police command rooms.
- **Investigator Urgency Override Rate:** Target $< 15.0\%$ during operational pilots.

---

### E. Case Similarity Discovery (`all-MiniLM-L6-v2`)
- **Precision@5 (P@5):** Target $\ge 0.80$ (at least 4 out of top 5 suggested cases are genuinely relevant to the incident's crime typology).
  $$\text{P@K} = \frac{1}{K}\sum_{k=1}^K \text{rel}(k)$$
- **Mean Reciprocal Rank (MRR):** Target $\ge 0.75$ (the most relevant historical case appears in the top 2 suggestions).
- **Investigator Acceptance Rate:** Target $\ge 70\%$ (investigators bookmark or link suggested cases to active investigation files).

---

### F. Cross-Case Correlation (`ccip-cross-case-correlation-v1`)
- **Precision on `STRONGLY_RELATED`:** Target $\ge 0.92$. Suggested syndicates must reflect genuine criminal links.
- **Investigator Confirmation Rate:** Target $\ge 75\%$ of proposed correlations confirmed as `CONFIRMED_RELEVANT`.
- **False Correlation Rate:** Target $< 5.0\%$, avoiding wrongful linking of unrelated citizen complaints.

---

### G. Evidence Graph Link Prediction (`ccip-evidence-graph-link-v1`)
- **Candidate Edge Precision:** Target $\ge 0.75$ (proposed multi-hop links verified by officers).
- **Graph Usefulness Score:** Target $\ge 4.2 / 5.0$ in standardized investigator surveys (measuring clarity and investigative utility).
- **Confirmed-to-Rejected Edge Ratio:** Target $\ge 3:1$.

---

### H. Feedback Gate Governance (`ccip-feedback-gate-v1`)
- **Approve-Candidate Precision:** 100% adherence to the 5 deterministic hard gates.
- **False Approval Rate:** 0.0% (zero tolerance for admitting poisoned, un-anonymized, or unverified cases into the learning queue).
- **Gate Rejection Logging Completeness:** 100% of rejected candidates must log the exact failing gate number and diagnostic reason.

---

## 3. Summary Scorecard Thresholds

| Model / Adapter | Primary Production KPI | Target Threshold | Minimum Pilot Gate |
|---|---|---|---|
| **Complaint Classifier** | Macro F1 | $\ge 0.90$ | $\ge 0.85$ |
| **Hybrid Cyber NER** | Structured Precision / OOD F1 | $\ge 0.98$ / $\ge 0.65$ | $\ge 0.95$ / $\ge 0.50$ |
| **Relation Extraction** | Financial Attribution Precision | $\ge 0.92$ | $\ge 0.85$ |
| **Incident Urgency** | False De-escalation Rate | $< 1.0\%$ | $< 2.5\%$ |
| **Case Similarity** | Precision@5 | $\ge 0.80$ | $\ge 0.70$ |
| **Cross-Case Correlation** | `STRONGLY_RELATED` Precision | $\ge 0.92$ | $\ge 0.85$ |
| **Evidence Graph Link** | Candidate Edge Precision | $\ge 0.75$ | $\ge 0.65$ |
| **Feedback Gate** | False Approval Rate | **0.0%** | **0.0%** |
