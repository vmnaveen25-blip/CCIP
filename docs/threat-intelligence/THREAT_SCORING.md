# EXPLAINABLE MULTI-FACTOR THREAT SCORING SPECIFICATION

**System:** CCIP (Citizen Cybercrime Intelligence Platform)  
**Classification:** RESTRICTED  
**Document Ref:** CTI-SCORE-003  

---

## 1. Principles of Explainable Threat Scoring

In law enforcement and digital forensic investigations, **opaque black-box AI scores are legally inadmissible and operationally dangerous**. An automated score must never:
1. Automatically attribute criminal guilt to an individual or IP subscriber.
2. Automatically merge separate criminal investigations without investigator concurrence.
3. Automatically promote an indicator to `CONFIRMED` status without human review.

The CCIP `ThreatScoringEngine` computes a deterministic, multi-factor composite threat score between `0.0` and `100.0` where every contributing point is explicitly auditable.

---

## 2. Mathematical Scoring Model

The composite threat score is computed from 5 weighted base components and 2 contextual modifiers:

$$\text{Base Score} = (w_1 \cdot R_{\text{source}}) + (w_2 \cdot C_{\text{reported}}) + (w_3 \cdot V_{\text{reputation}}) + (w_4 \cdot T_{\text{recency}}) + (w_5 \cdot S_{\text{corroboration}})$$

### 2.1 Component Definitions & Weights

| Component | Symbol | Weight | Range | Definition & Calculation |
| :--- | :---: | :---: | :---: | :--- |
| **Source Reliability** | $R_{\text{source}}$ | **0.25** | $0.0 - 1.0$ | Admiralty System B2 standard rating of the intelligence source (e.g. Government CERT: 0.95, Trusted Commercial Feed: 0.85, Open Community: 0.70). |
| **Reported Confidence** | $C_{\text{reported}}$ | **0.25** | $0.0 - 1.0$ | Confidence reported directly by the provider (scaled from $0-100$). |
| **Reputation Verdict** | $V_{\text{reputation}}$ | **0.20** | $0.0 - 1.0$ | Discrete verdict mapping:<br/>• `MALICIOUS`: $1.0$<br/>• `SUSPICIOUS`: $0.65$<br/>• `NEUTRAL`: $0.30$<br/>• `BENIGN`: $0.0$ |
| **Temporal Recency** | $T_{\text{recency}}$ | **0.15** | $0.15 - 1.0$ | Decay based on elapsed time since indicator was last observed:<br/>• $\le 7$ days: $1.0$<br/>• $\le 30$ days: $0.85$<br/>• $\le 60$ days: $0.60$<br/>• $\le 90$ days: $0.40$<br/>• $> 90$ days: $\max(0.15, 1.0 - \text{age}/180)$ |
| **Corroborating Sources** | $S_{\text{corroboration}}$ | **0.15** | $0.4 - 1.0$ | Calculated as $\min(1.0, 0.4 + (N_{\text{sources}} \times 0.2))$. Single source yields $0.6$, 3 or more independent sources yield $1.0$. |

### 2.2 Contextual Modifiers

- **Internal Case Evidence Match ($+0.10$):** If the indicator matches a physical or digital artifact directly extracted from case evidence, a $+10\%$ bonus is applied.
- **Human Reviewer Verification ($+0.15$):** If an authorized investigator has reviewed and validated the finding, a $+15\%$ bonus is applied.
- **False Positive Override:** If an indicator is flagged as `FALSE_POSITIVE` by an authorized investigator, the composite score is **immediately clamped to `0.0`**, regardless of external feeds.

$$\text{Final Composite} = \begin{cases} 0.0 & \text{if } \text{is\_false\_positive} \\ \min(100.0, (\text{Base Score} + \text{Bonuses}) \times 100) & \text{otherwise} \end{cases}$$

---

## 3. Severity Bands

| Composite Score Range | Severity Band | Recommended Operational Response |
| :---: | :---: | :--- |
| **$85.0 - 100.0$** | **`CRITICAL`** | Immediate firewall egress drop; trigger high-priority alert; initiate bank account freeze notice if financial observables match. |
| **$65.0 - 84.99$** | **`HIGH`** | Highlight in investigator case workspace; review related cross-case connections; verify hosting provider WHOIS records. |
| **$40.0 - 64.99$** | **`MEDIUM`** | Log for correlation; include in background analytics; monitor for subsequent telemetry hits. |
| **$0.0 - 39.99$** | **`LOW`** | Advisory observation; no active containment required. |

---

## 4. Discrete Finding States

To maintain strict evidentiary provenance, indicators move through explicit lifecycle states:

```
  [Ingested] ──► UNVERIFIED ──► EXTERNALLY_REPORTED ──► OBSERVED (Case Evidence)
                     │                 │                       │
                     ▼                 ▼                       ▼
               FALSE_POSITIVE   HUMAN_REVIEWED ────────► CONFIRMED
                     ▲                 ▲
                     │                 │
                     └───────── EXPIRED
```

1. **`UNVERIFIED`:** Raw indicator ingested without corroboration.
2. **`EXTERNALLY_REPORTED`:** Ingested from one or more external threat feeds.
3. **`OBSERVED`:** Indicator identified in active digital evidence attached to an investigation.
4. **`AI_SUGGESTED`:** Correlation or relation suggested by heuristic or neural matching models.
5. **`HUMAN_REVIEWED`:** Investigating officer has examined the indicator and attached analytical notes.
6. **`CONFIRMED`:** Validated by investigator as actively malicious within the operational scope.
7. **`FALSE_POSITIVE`:** Investigating officer marked the indicator as benign or misattributed. Score is permanently nullified.
8. **`EXPIRED`:** Indicator has passed its operational validity window without renewed observation.

