# STAGE 12 ARCHITECTURE: SOVEREIGN CYBER THREAT INTELLIGENCE & FORENSIC DOSSIER SYSTEM

**System:** CCIP (Citizen Cybercrime Intelligence Platform)  
**Security Classification:** RESTRICTED / LAW ENFORCEMENT & FORENSIC SPECIALIST USE ONLY  
**Stage:** 12 — Threat Intelligence Ingestion, Correlation, and Court-Ready Reporting  
**Status:** IMPLEMENTED AND VERIFIED  

---

## 1. Architectural Overview

Stage 12 transforms CCIP from a case intake and workflow manager into an intelligence-driven investigation platform. The threat intelligence subsystem operates under a **Zero-Trust, Sovereign Defense Architecture**, ensuring that:
1. External feeds provide advisory and observational telemetry without ever being granted authority to automatically attribute guilt, execute arbitrary code, or merge active investigations.
2. All inbound observables undergo rigorous normalization, canonicalization, and bracket-defanging before persistence.
3. Outbound synchronization is guarded by strict pre-flight SSRF IP validation, blocking access to RFC 1918 subnets, loopback addresses, and cloud provider metadata endpoints (`169.254.169.254`).
4. Cross-case correlation maintains tenant and investigator compartmentation, redacting unauthorized case details.
5. Forensic reporting generates Section 65B Indian Evidence Act 1872 / Section 63 Bharatiya Sakshya Adhiniyam (BSA) 2023 certified dossiers with SHA-256 cryptographic digests and native PDF rendering via ReportLab.

```
                              SOVEREIGN ENCLAVE BOUNDARY
                                          │
    EXTERNAL FEEDS (Untrusted)            │       INTERNAL INVESTIGATION ENCLAVE
  ┌─────────────────────────────┐         │     ┌────────────────────────────────┐
  │ • STIX 2.1 / TAXII 2.1      │         │     │ • Case Intake & Evidence Vault │
  │ • MISP Rest Telemetry       │         │     │ • Citizen FIR Statements       │
  │ • AlienVault OTX Pulses     │         │     │ • Forensics Bitstream Hashes   │
  │ • abuse.ch URLhaus          │         │     └───────────────┬────────────────┘
  │ • AbuseIPDB Blacklists      │         │                     │
  │ • VirusTotal Analysis       │         │                     ▼
  └──────────────┬──────────────┘         │       ┌──────────────────────────────┐
                 │                        │       │ Case Enrichment Engine       │
                 ▼                        │       │ (Compartmented & Redacted)   │
  ┌─────────────────────────────┐         │       └─────────────┬────────────────┘
  │ SSRF Safe HTTP Client       │         │                     │
  │ (Pre-flight IP Inspection)  │─────────┼─────────────────────┤
  └──────────────┬──────────────┘         │                     ▼
                 │                        │       ┌──────────────────────────────┐
                 ▼                        │       │ Explainable Scoring Engine   │
  ┌─────────────────────────────┐         │       │ (Finding States & Modifiers) │
  │ IOC Normalization Service   │         │       └─────────────┬────────────────┘
  │ (Canonical Defanging & Type)│         │                     │
  └──────────────┬──────────────┘         │                     ▼
                 │                        │       ┌──────────────────────────────┐
                 ▼                        │       │ 3D Intelligence Graph (WebGL)│
  ┌─────────────────────────────┐         │       │ & Deduplicated Alert Engine  │
  │ Normalized Indicator Store  │─────────┼──────►└─────────────┬────────────────┘
  │ (ThreatIndicator v2)        │         │                     │
  └─────────────────────────────┘         │                     ▼
                                          │       ┌──────────────────────────────┐
                                          │       │ Court-Ready Forensic Dossier │
                                          │       │ (Section 65B/63 Certified)   │
                                          │       └──────────────────────────────┘
```

---

## 2. Core Subsystems & Components

### 2.1 Threat Ingestion Engine (`threat_feed_adapters.py`, `threat_intel_service.py`)
- Provides abstract `BaseThreatFeedAdapter` supporting pluggable connectors:
  - `StixTaxiiAdapter`: Parses STIX 2.1 JSON Bundles, Indicator SDOs, and TAXII 2.1 collections.
  - `MispAdapter`: Ingests MISP event JSON, parsing Attribute objects and threat-actor taxonomy tags.
  - `AlienVaultOtxAdapter`: Ingests OTX pulses, parsing IP, domain, URL, and file hashes.
  - `UrlhausAdapter`: Ingests online and recent malicious URLs from abuse.ch telemetry feeds.
  - `AbuseIpdbAdapter`: Ingests IP blacklist feeds and reputation scores with API key authentication.
  - `VirusTotalAdapter`: Ingests v3 analysis reports under explicit rate-limiting constraints.
- Features exponential backoff (`delay *= 2.0`), HTTP 429 `Retry-After` header adherence, and feed health telemetry tracking consecutive failures.

### 2.2 IOC Normalization & Safety Defanging (`threat_ioc_service.py`)
- Standardizes 9 observable types: `IPV4`, `IPV6`, `DOMAIN`, `URL`, `MD5`, `SHA1`, `SHA256`, `EMAIL`, and `CRYPTO_WALLET` (BTC, ETH, TRX).
- Enforces canonical lowercasing, exploded IPv6 addresses, URL port stripping, and bracket defanging (`hxxp[://]`, `[.]`, `[@]`) to prevent drive-by execution in investigator workstations.

### 2.3 Explainable Threat Scoring Engine (`threat_scoring_engine.py`)
- Replaces opaque AI threat metrics with a multi-factor transparent formula:
  $$\text{Composite Score} = (\text{Rel} \times 0.25) + (\text{Conf} \times 0.25) + (\text{Rep} \times 0.20) + (\text{Rec} \times 0.15) + (\text{Corrob} \times 0.15) + \text{Bonuses}$$
- Disallows high automated scores from forcing findings to `CONFIRMED`.
- Explicit finding states: `UNVERIFIED`, `OBSERVED`, `EXTERNALLY_REPORTED`, `AI_SUGGESTED`, `HUMAN_REVIEWED`, `CONFIRMED`, `FALSE_POSITIVE`, `EXPIRED`.
- Human override audit trail; marking `FALSE_POSITIVE` nullifies threat score to `0.0`.

### 2.4 Compartmented Investigation Enrichment (`investigation_enrichment_service.py`)
- Triggers on-demand or automated correlation for active cases.
- Checks object-level investigator assignment.
- Discovers shared observables across other cases without exposing unauthorized case numbers or complaint details (anonymized as `RESTRICTED-CASE-XXXX`).
- Writes typed `IntelligenceRelationship` edges preserving provenance (`INTERNAL_EVIDENCE`, `EXTERNAL_INTEL`, `AI_SUGGESTION`, `HUMAN_CONFIRMED`).

### 2.5 3D Graph Provenance (`CorrelationGraph3D.tsx`, `threat_intel.py`)
- Surfaces cross-entity topologies directly in WebGL via Three.js.
- Visualizes 11 entity types with distinctive forensic color coding.
- Displays edge provenance, confidence scores, and verification status.

### 2.6 Investigator Alert Engine (`threat_alert_engine.py`)
- Deduplicates incoming alerts using SHA-256 suppression hashes across a 24-hour window.
- Directs critical malicious infrastructure and malware hash alerts to the sovereign `notification_service` for real-time WebSocket delivery to investigators.

### 2.7 Statutory Forensic Dossier Generator (`court_dossier_service.py`, `reports.py`)
- Assembles Sections A through F:
  - **Section A:** Direct facts supported by original bitstream evidence.
  - **Section B:** Investigator observations.
  - **Section C:** External threat intelligence.
  - **Section D:** Automated or AI-generated analytical findings.
  - **Section E:** Unverified hypotheses.
  - **Section F:** Formal investigator conclusions.
- Includes Section 65B Indian Evidence Act 1872 / Section 63 BSA 2023 Statutory Certificate Schedule.
- Emits cryptographic SHA-256 seal digests and outputs formatted PDF dossiers via ReportLab.

