# Investigation Assistant Generative AI Audit Report
**Project:** AI Cybercrime Intelligence Platform (CCIP) / Astraea Enclave  
**Date:** 2026-09-13  
**Auditor:** Senior AI Systems Engineer, Full-Stack Engineer, RAG Engineer, & Cyber Investigation UX Engineer  
**Status:** Audit Complete — Upgrades Required

---

## 1. Executive Summary & Root Cause Analysis

The current **AI Investigation Assistant** in the Specialist Portal (`SpecialistPortal.tsx`) gives the illusion of an intelligent co-pilot, but under the hood it operates primarily as a **keyword-matching template engine** with hardcoded fallback responses. 

### Why Repeated Answers Occur
When investigators ask different questions regarding the same case or different cases, the assistant matches broad substrings (e.g. `"upi"`, `"wallet"`, `"crypto"`, `"voice"`, `"sim"`, `"bec"`, `"phish"`) and outputs fixed, pre-fabricated markdown templates. If no keywords match, it falls into a default `else` branch which prints:
```markdown
### 1. Executive Intelligence Summary
Astraea Enclave forensic analysis has processed your inquiry regarding `{prompt}` in relation to **{case_title}** (`{case_id}`).
- **Target Operation:** Multi-Vector Cybercrime Forensic Intelligence & Syndicate Correlation
- **Threat Level:** `CRITICAL` // Active Ongoing Incident
- **Confidence Rating:** `98.4%` (Sovereign Neural Forensic Cross-Validation)
...
```
As a result:
1. **Free-form questions are ignored:** The semantic intent and nuance of an investigator's specific query (e.g., "Which UPI accounts are linked to Case 12?", "Provide a chronological timeline of transfers", "Compare Telegram evidence") are overridden by the canned template.
2. **Context blindness:** No multi-turn conversational memory exists. Follow-up questions like "Why?", "Which one of those is strongest?", or "Explain the first link" fail because each turn is evaluated in isolation without conversational context.
3. **No Dynamic Case Retrieval:** The backend does not query the real database of `CyberEntity`, `CyberEntityRelation`, `Evidence`, `CaseCorrelation`, or `EvidenceGraphNode` for the given case. It only receives `case_id` and `case_title` as string metadata.
4. **Static Regulatory Directives:** Predefined blocks for CERT-In 6-hour disclosures, CEIR IMEI blocking, Section 91 CrPC/Section 94 BNSS, and Section 65B certificates are dumped into every single response, regardless of relevance.
5. **No Token Streaming:** Responses are returned as a single JSON object with high latency or instant artificial delay, rather than streaming token-by-token.

---

## 2. Hardcoded & Template Response Locations Identified

### A. Backend (`backend/app/ai/adapters/investigation_assistant.py`)
- **Lines 304–373 (Keyword-to-Template Mapping):**
  Matches strings like `"wallet"`, `"crypto"`, `"voice"`, `"sim"`, `"bec"`, `"upi"`, `"phish"` and assigns hardcoded suspect aliases:
  - `"Astraea-DeepSynapse Voice Syndicate (@synthetic_call_ops)"`
  - `"SIM-Port Syndicate 'GhostSIM' (@telecom_bypass_in)"`
  - `"FinWire Spoofing Syndicate (@corp_invoice_alter)"`
  - `"HydraPeel Operations (@shadow_crypto_wash)"`
  - `"DarkMatrix Mule Syndicate (@fast_cash_out_in)"`
  - `"PhishMatrix Collective (@apk_drop_distrib)"`
- **Lines 384–438 (Static Markdown Skeleton):**
  Assembles fixed 5-part sections (`### 1. Executive Intelligence Summary`, `### 2. Case Identifiers & Forensic Entities`, `### 3. Statutory Offenses`, `### 4. Tactical Digital Forensics`, `### 5. Regulatory Compliance`).
- **Lines 284, 390 (Fake Confidence Scores):**
  Returns hardcoded `0.98` confidence and textual `"Confidence Rating: 98.4%"`.
- **Lines 118–153 (External Gemini API Dependency with Silent Fallback):**
  Makes synchronous `urllib.request` calls to Google Generative Language API. When no external Gemini API key is configured (or when offline in sovereign enclave mode), it silently falls back to `_generate_sovereign_response`—which is the canned template engine described above.
- **Lines 189–220 (Rigid System Prompt):**
  Forces Gemini (if active) to follow a rigid 5-section template on every response, destroying natural conversational dialogue.

### B. Frontend (`frontend/src/views/SpecialistPortal.tsx`)
- **Lines 72–79 (Hardcoded Initial Chat History):**
  ```typescript
  {
    sender: 'ai',
    text: '### Specialist AI Co-Pilot Online\n\nAstraea Enclave Sovereign Neural Engine active: `astraea-sovereign-neural-v2`...',
    tags: ['STATUS: SOVEREIGN_OFFLINE', 'ADAPTER: READY', 'WEIGHTS: DEPLOYED (Astraea Sovereign Engine)']
  }
  ```
- **Lines 1878–1880 (Misleading Confidence and Badge):**
  Displays static `PRODUCTION` badge and static weights.
- **Lines 1968–1973 (Static Suggested Inquiries):**
  Hardcoded suggestions completely detached from current case evidence:
  - `"Correlate wallet 0x71C with known Lazarus exchange deposit nodes"`
  - `"Run spectral acoustic analysis on attached audio evidence"`
  - `"Summarize incident timeline and suggest 3 law enforcement actions"`
  - `"Extract all IP addresses and check against abuseIPDB"`
  (These mention Lazarus, wallet `0x71C`, acoustic analysis even on simple UPI or BEC cases).
- **Lines 1944–1960 (Input & Interaction):**
  Single line text input instead of multiline textarea; lacks "Stop Generation" capability; lacks conversation management (no session history, cannot start a new chat or switch between previous sessions).
- **Line 560 (`handleSendAiMessage`):**
  Sends only `{ case_id, case_title }` without conversational history or real-time streaming SSE integration.

### C. API Layer (`backend/app/api/specialist.py` & `backend/app/api/ai_verification.py`)
- `POST /api/v1/specialist/ai-assistant` simply calls `investigation_assistant.generate_response(user_prompt, case_context)`.
- No streaming endpoints (`/chat/stream`).
- No conversation or message persistence models (`InvestigationConversation`, `InvestigationMessage`).

---

## 3. Components to Retain vs. Replace

| Component | Current State | Verdict | Action Required |
|:---|:---|:---|:---|
| **Portal Shell & Layout** | Specialist Portal dark UI, sidebar, headers, tabs | **RETAIN** | Keep existing visual styles, colors, and layout structure intact. |
| **Markdown Renderer** | `MarkdownMessage` in frontend | **RETAIN & ENHANCE** | Keep markdown parsing and sanitization; add support for citation chips (`[Entity: ...]`, `[Evidence: ...]`). |
| **Deterministic Data Models** | `CyberEntity`, `CyberEntityRelation`, `CaseCorrelation`, `EvidenceGraphNode`, `Evidence` | **RETAIN & LEVERAGE** | Ground all generative retrieval in these real database entities. |
| **Static Keyword Engine** | `_generate_sovereign_response` keyword-based template dictionary | **REMOVE / REPLACE** | Replace with local OpenAI-compatible generative LLM runtime + case context builder. |
| **External API Only Architecture** | Directly calling Google Generative Language API via raw HTTP | **REPLACE** | Create `backend/app/ai/adapters/generative_llm.py` supporting local OpenAI-compatible endpoints (Ollama, vLLM, llama.cpp). |
| **Fake Fallback on Offline** | Returning canned templates when LLM unavailable | **REMOVE** | When LLM is offline, return explicit `AI_ASSISTANT_UNAVAILABLE` status without deception. |
| **Suggested Inquiries** | 4 hardcoded string buttons mentioning Lazarus, 0x71C | **REPLACE** | Dynamically generate from active case entities (UPI, phone, domain, suspect, etc.). |
| **Stateless Chat Handler** | Transient React state `chatMessages` lost on refresh | **REPLACE** | Add persistent `InvestigationConversation` and `InvestigationMessage` database tables and APIs. |
| **All-At-Once HTTP Response** | Awaiting complete response before returning JSON | **REPLACE** | Implement Server-Sent Events (SSE) streaming token-by-token with client abort controller. |
| **Single Universal Confidence (98%)** | Hardcoded 0.98 | **REMOVE** | Replace with provenance support tags (Verified Evidence, Strong Support, Unverified Inference). |

---

## 4. Next Implementation Steps
1. Create persistent models: `InvestigationConversation` & `InvestigationMessage`.
2. Build `GenerativeLLMAdapter` supporting OpenAI-compatible local APIs (`http://127.0.0.1:11434/v1` or configured runtime) with streaming.
3. Build `InvestigationContextService` for question-aware entity, relation, evidence, graph, and correlation retrieval.
4. Build SSE streaming chat endpoint `POST /api/v1/investigation-assistant/chat/stream`.
5. Build dynamic suggestions endpoint `GET /api/v1/cases/{case_id}/assistant/suggestions`.
6. Upgrade SpecialistPortal UI to support multi-turn conversational chat, token streaming, stop generation, session switcher, context HUD, citation chips, and dynamic inquiries.
