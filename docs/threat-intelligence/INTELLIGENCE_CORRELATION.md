# INTELLIGENCE CORRELATION & CROSS-CASE ISOLATION SPECIFICATION

**System:** CCIP (Citizen Cybercrime Intelligence Platform)  
**Classification:** RESTRICTED  
**Document Ref:** CTI-CORR-004  

---

## 1. Overview & Regulatory Imperatives

Cross-case intelligence correlation allows law enforcement agencies to identify serial cybercrime syndicates, mule account networks, and coordinated phishing campaigns across multiple complaints.

However, strict legal and procedural constraints govern inter-case data access:
1. **Compartmentation:** An investigator authorized to work on Case A must **never** be granted unfettered visibility into the victim identities, financial records, or notes of Case B unless explicit departmental authorization exists.
2. **Attribution Neutrality:** A shared IP address or domain does not prove that the suspect in Case A committed the offenses in Case B (e.g. shared VPN exit nodes, compromised residential proxies, shared web hosting).
3. **Provable Auditability:** Every correlation candidate must document its underlying observables and mathematical correlation score.

---

## 2. Authorization-Aware Correlation Algorithm

When an investigator executes `POST /api/v1/threat-intel/cases/{case_id}/enrich`:

```
                       Active Investigation Case Record
                                      │
                                      ▼
                        Extract Normalized Case IOCs
                        (IPs, Domains, Hashes, UPIs)
                                      │
                                      ▼
                   Match Against Global Threat Indicators
                                      │
                                      ▼
                 Scan Local Database for Other Cases with Shared IOCs
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
          Investigator is Assigned            Investigator is NOT
         or has Global Police Role            Assigned to Target Case
                    │                                   │
                    ▼                                   ▼
          Full Case Details Returned           Redacted Candidate Returned
          (Case Title, Number, Status)       ("RESTRICTED-CASE-XXXX", Redacted Title)
```

### 2.1 Correlation Scoring Formulation

The correlation score between Case $A$ and Case $B$ is computed as:

$$\text{Correlation Score} = \min(98.0, 40.0 + (N_{\text{shared\_iocs}} \times 20.0))$$

- 1 shared indicator: $60.0\%$ candidate strength.
- 2 shared indicators: $80.0\%$ candidate strength.
- 3 or more shared indicators: $98.0\%$ candidate strength.

### 2.2 Redaction Rules for Unauthorized Cases

If the authenticated user does not have `ADMIN` or `CYBERCRIME_POLICE` roles and is not assigned as the lead specialist on the target case:
- `case_id`: Set to `"REDACTED"`.
- `case_number`: Anonymized to `"RESTRICTED-CASE-" + case_number[-4:]`.
- `case_title`: Replaced with `"[Restricted Case - Department Authorization Required]"`.
- `recommended_action`: Replaced with `"Request administrative joint-investigation access"`.

---

## 3. Intelligence Relationships & Provenance

Correlated findings are formally stored in `intelligence_relationships`:

| Column | Type | Description |
| :--- | :--- | :--- |
| `source_entity_id` | String | Source identifier (e.g. `CASE-2026-0842`) |
| `source_entity_type` | String | Entity type (`INVESTIGATION`, `IP_ADDRESS`, `MALWARE_FAMILY`) |
| `target_entity_id` | String | Target identifier |
| `target_entity_type` | String | Target entity type |
| `relationship_type` | String | Relationship label (`OBSERVED_IN`, `SUGGESTED_CORRELATION`, etc.) |
| `confidence` | Float | Relationship confidence percentage ($0.0 - 100.0$) |
| `provenance_type` | String | Origin (`INTERNAL_EVIDENCE`, `EXTERNAL_INTEL`, `AI_SUGGESTION`, `HUMAN_CONFIRMED`) |
| `provenance_source` | String | Specific originating document, engine, or feed |
| `evidence_reference` | String | Optional link to evidentiary file hash |

### Supported Relationship Types:
- `OBSERVED_IN`: An indicator directly present in evidence.
- `REPORTED_BY`: Ingested from an external feed.
- `ASSOCIATED_WITH`: Correlated through threat actor or campaign.
- `RESOLVES_TO`: DNS resolution link.
- `HOSTED_ON`: Infrastructure co-location link.
- `EXTRACTED_FROM`: Observable extracted from forensic disk/memory image.
- `SHARED_INDICATOR`: Common observable between two cases.
- `ATTRIBUTED_TO_SOURCE`: Attributed by a threat intelligence provider.
- `SUGGESTED_CORRELATION`: Automated algorithmic candidate.
- `CONFIRMED_RELATIONSHIP`: Validated by senior investigator.
