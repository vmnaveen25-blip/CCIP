# INVESTIGATOR THREAT ALERT WORKFLOW & SUPPRESSION SPECIFICATION

**System:** CCIP (Citizen Cybercrime Intelligence Platform)  
**Classification:** RESTRICTED  
**Document Ref:** CTI-ALERT-005  

---

## 1. Overview & Operational Problem

In high-volume cybercrime response environments, threat feeds frequently generate thousands of repetitive indicator updates (e.g. repeated beacons to the same C2 domain, multiple reports of the same phishing redirect).

Without intelligent suppression:
1. Investigators experience **alert fatigue**, leading to overlooked critical threats.
2. Database tables become bloated with duplicate alerts.
3. Downstream WebSocket and notification queues become congested.

The `ThreatAlertEngine` solves this through **automated category classification**, **deterministic suppression windows**, and **actionable recommendations**.

---

## 2. Alert Categories & Automated Action Assignment

| Alert Category | Trigger Conditions | Severity | Standard Recommended Action |
| :--- | :--- | :---: | :--- |
| **`CRITICAL_INFRASTRUCTURE`** | Composite score $\ge 85.0$ on core infrastructure IPs | `CRITICAL` | Trigger high-priority triage review and inspect firewall boundary logs. |
| **`NEW_PHISHING`** | Threat category is `PHISHING` with confidence $\ge 80\%$ | `HIGH` | Block domain on DNS sinkhole and check victim credential compromises. |
| **`MALWARE_HASH_MATCH`** | MD5, SHA-1, or SHA-256 matches active threat actor payloads | `CRITICAL` | Immediately quarantine corresponding evidentiary files and execute memory forensics. |
| **`CROSS_CASE_IOC_MATCH`** | Indicator appears across 2 or more distinct cases | `HIGH` | Cross-reference indicators with active investigation '{case_id}'. |
| **`EXPIRING_INTEL`** | Indicator age approaches expiration window | `LOW` | Validate with upstream providers or archive finding. |
| **`HIGH_CONFIDENCE_REPORT`**| External provider confidence $\ge 90\%$ | `HIGH` | Review indicator correlation in threat intelligence workspace. |
| **`NEW_RELATIONSHIP`** | High-confidence link established between cases | `MEDIUM` | Review updated 3D correlation graph. |

---

## 3. Suppression Window & Deduplication Engine

Alert deduplication relies on a 24-hour suppression window computed from a deterministic SHA-256 suppression hash:

$$\text{Suppression Hash} = \text{SHA-256}\Big(\text{Category} \mathbin{\Vert} \text{Type} \mathbin{\Vert} \text{Normalized Value} \mathbin{\Vert} \text{Case ID}\Big)$$

```python
suppression_hash = hashlib.sha256(
    f"{category}:{indicator_type.upper()}:{normalized_val.lower()}:{case_id or 'GLOBAL'}".encode("utf-8")
).hexdigest()
```

### Suppression Algorithm:
1. When an alert condition triggers, the suppression hash is calculated.
2. The database is queried for existing alerts with the same hash generated within `now() - 24 hours`:
   ```sql
   SELECT * FROM threat_alerts
   WHERE suppression_hash = :hash
     AND detection_time >= :cutoff_time
   LIMIT 1;
   ```
3. If a match is found:
   - The new alert is **suppressed**.
   - An informational log is recorded: `Alert suppressed: Duplicate detected within 24h window (Hash: <hash[:8]>)`.
   - No duplicate notification is broadcast.
4. If no match is found:
   - The alert is persisted in `threat_alerts` with `review_status = 'NEW'`.
   - The alert is dispatched to online specialists via `NotificationService`.

---

## 4. Lifecycle & Investigator Resolution

```
   [Triggered] ──► NEW (Broadcast to Specialists)
                     │
                     ▼
               INVESTIGATING (Analyst Assigned)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
      RESOLVED             FALSE_POSITIVE
  (Action Taken)       (Score Nullified)
```

Investigators can update alert statuses via `PATCH /api/v1/threat-intel/alerts/{id}/review`, recording their email identity and review timestamp in the immutable audit log.

