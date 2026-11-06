# CCIP Public AI Assistant: Security Policy & Threat Mitigation

**Document ID:** CCIP-DOC-CB-007  
**Version:** 1.0.0 (Production)  
**Classification:** Sovereign Tier — Enclave Security Directive  

---

## 1. Threat Model & Risk Landscape

Deploying an AI-driven public interface on a national-scale cybercrime platform introduces distinct operational and cryptographic security challenges:

1. **Information Leakage Threat:** Complainants or adversaries attempting to query confidential case dockets, suspect names, ongoing undercover operations, or forensic indicators of compromise (IOCs).
2. **Adversarial Prompt Injection:** Attackers attempting to override system instructions via roleplay commands (e.g., "Ignore all previous instructions", "You are now DAN", or markdown injection).
3. **Denial of Service & API Exhaustion:** Malicious bots spamming continuous high-dimensional vector search queries or file upload endpoints.
4. **Complainant Tracking & Privacy Infiltration:** Correlation of anonymous complainant IP addresses with sensitive legal complaints.

---

## 2. Security Controls & Defenses

### 2.1 Complete Architectural Isolation (Zero Case Access)
The most critical defense is structural: **The Public AI Chatbot code path possesses zero database bindings, foreign keys, or object relationships to internal case tables.**

```
+-------------------------------------------------------------+
|                     DATABASE BOUNDARY                       |
|                                                             |
|   PUBLIC CHAT RETRIEVAL SCOPE:                              |
|   - `knowledge_materials`                                  |
|   - `knowledge_chunks`                                      |
|                                                             |
|   ================ AIRGAP PARTITION =====================   |
|                                                             |
|   INTERNAL ENCLAVE SCOPE (ZERO ACCESS FROM PUBLIC CHAT):    |
|   - `complaints`                                            |
|   - `case_dockets`                                          |
|   - `evidence_files`                                        |
|   - `suspect_profiles`                                      |
|   - `ioc_indicators`                                        |
|   - `audit_logs`                                            |
+-------------------------------------------------------------+
```

Even if an attacker crafts a mathematically perfect prompt injection bypass, the retrieval pipeline only searches rows in `knowledge_chunks` where `is_available_for_chatbot = True`. It is physically impossible for the retrieval engine to return internal police evidence.

---

### 2.2 Prompt Injection & Adversarial Refusal Guardrails
Every incoming message is filtered prior to vector retrieval through the Guardrails Engine (`_detect_prompt_injection`):

- **Regex & Pattern Filters:**
  - `ignore previous instructions` / `disregard prior directives`
  - `system prompt` / `reveal instructions` / `developer mode`
  - `you are now [DAN / uncensored AI / evil bot]`
  - `simulate a shell` / `run code` / `print secret key`
- **Enforcement Action:**
  When a prompt injection attempt is detected, the model immediately halts query processing and returns the standard sovereign refusal:
  > *"I am the CCIP AI Assistant, dedicated exclusively to assisting citizens with cybercrime guidance and platform navigation under Indian cyber regulations. I cannot execute code, reveal internal configuration, or alter my operating instructions."*

---

### 2.3 Anonymous Session Cryptography & PII Redaction
1. **Zero Login Requirement:** Anonymous citizens never submit identity credentials, phone numbers, or passwords to initiate a chat.
2. **Hashed Telemetry:** Complainant IP addresses are hashed using `HMAC-SHA256` with an ephemeral salt rotated daily. Raw IP addresses are never written to chat session logs.
3. **Time-To-Live (TTL):** Chat sessions and temporary session tokens expire automatically after 24 hours. Expired sessions are scrubbed from memory and database by the periodic cleanup worker.

---

### 2.4 Rate Limiting & Resource Throttling
- **Sliding Window Throttler:** Enforces a hard ceiling of **30 requests per minute** per client hash. Excess requests receive HTTP 429 (`Too Many Requests`).
- **Payload Boundaries:**
  - Citizen input text is capped at **2,000 characters**.
  - File upload on admin endpoints is strictly capped at **25 MB**.
  - Ingestion deduplication prevents redundant vector computations via SHA-256 matching.

