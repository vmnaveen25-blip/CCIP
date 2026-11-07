# CCIP – Data Flow & Telemetry Architecture
## Complete Data Lifecycle, Investigation Pipelines & Cryptographic Flow

---

### 1. Citizen Incident Reporting & Intake Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Complainant (Citizen)
    participant Front as Frontend (CitizenPortal.tsx)
    participant API as Gateway (/api/v1/complaints)
    participant CS as ComplaintService
    participant ES as EvidenceService
    participant Vault as Storage Vault (SHA-256)
    participant DB as Relational Database (SQLAlchemy)

    Citizen->>Front: Enters incident details & evidence files
    Front->>Front: Computes client-side SHA-256 seal
    Front->>API: POST /api/v1/complaints (Payload + Suspect Info)
    API->>CS: create_complaint()
    CS->>DB: INSERT into complaints (Ref: CCIP-2026-XXXX)
    CS->>DB: INSERT into complaint_events (Status: SUBMITTED)
    CS-->>API: ComplaintCreatedResponse (ID, Reference, TrackingToken)
    API-->>Front: Returns complaint metadata

    loop For each attached evidence file
        Front->>API: POST /api/v1/evidence/upload (file, complaint_id, tracking_token)
        API->>ES: upload_evidence()
        ES->>ES: Verify MIME magic bytes & sanitize filename
        ES->>ES: Calculate server SHA-256 & scan malware
        ES->>Vault: Write byte-stream to quarantine vault
        ES->>DB: INSERT into evidence & evidence_hashes
        ES-->>API: EvidenceUploadResponse (ID, SHA256, Status)
        API-->>Front: Upload confirmation
    end
```

---

### 2. Digital Evidence Processing & Forensic Analysis Pipeline

```mermaid
flowchart TD
    RawUpload["1. Raw File Ingested (UploadFile)"] --> SHA256["2. Compute SHA-256 Hash Seal"]
    SHA256 --> Quarantine["3. Quarantine Storage (Isolated Vault)"]
    Quarantine --> MalwareScan["4. Malware & Shellcode Inspection"]
    
    MalwareScan -->|Clean| SafeStorage["5. Safe Evidence Storage (StorageService)"]
    MalwareScan -->|Infected / Suspicious| QuarantineLock["5a. Flag Quarantined (Access Blocked)"]
    
    SafeStorage --> FormatRouter{"6. Detect Format"}
    
    FormatRouter -->|PDF| PyPDF["7a. PyPDF & Page Boundary Parser"]
    FormatRouter -->|DOCX| PythonDocx["7b. python-docx Semantic Reader"]
    FormatRouter -->|Image| OCR["7c. Tesseract OCR (if text present)"]
    FormatRouter -->|PCAP / Network| PcapReader["7d. Packet & Hex Stream Analyzer"]
    
    PyPDF & PythonDocx & OCR --> TextExtracted["8. Extracted Text Stream"]
    TextExtracted --> PIIRedact["9. PII Redaction (Aadhaar, PAN, Bank Details)"]
    PIIRedact --> CyberNER["10. Hybrid Cyber NER & IOC Extraction"]
    
    CyberNER --> ExtractedEntities["11. Extracted Entities (IP, Domain, UPI, Wallet)"]
    ExtractedEntities --> DocResults["12. Store in document_processing_results"]
    DocResults --> CrossCase["13. Trigger Cross-Case Correlation Engine"]
```

---

### 3. Sovereign RAG Knowledge Retrieval Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as Citizen / Public User
    participant Widget as FloatingChatbotWidget
    participant API as /api/v1/public-chat/message
    participant Guard as Guardrails & Inject Filter
    participant RAG as KnowledgeMaterialsService
    participant Index as Vector Table (knowledge_chunks)
    participant LLM as Grounded LLM Generator

    User->>Widget: "How do I report a UPI fraud within golden hours?"
    Widget->>API: POST /public-chat/message (Session Token + Query)
    API->>Guard: Validate session & scan prompt injection
    
    alt Contains Financial Scam / UPI Urgency Keyword
        Guard-->>API: Trigger Statutory 1930 Helpline Alert
        API-->>Widget: Emergency 1930 Instructions & Golden Hour Steps
    else Standard Knowledge Query
        Guard->>RAG: search_materials(query)
        RAG->>RAG: Generate 384-dim Query Vector (PyTorch)
        RAG->>Index: Cosine similarity search (Filter: chatbot_status == 'AVAILABLE')
        Index-->>RAG: Top-K chunks with similarity >= 0.55
        RAG->>LLM: Grounded Prompt (Instructions + Retrieved Context)
        LLM-->>RAG: Synthesized Answer + Exact Citations
        RAG-->>API: Formatted Response with Citations & Metadata
        API-->>Widget: Stream JSON Response to User
    end
```

---

### 4. Cross-Case Correlation & Graph Resolution Pipeline

1. **Indicator Ingestion:** Extracted IOCs (suspect bank account, phone number, UPI handle, IP address, cryptocurrency address) are committed to the `cyber_entities` registry.
2. **Cluster Matching:** `cross_case_correlation_service.py` evaluates indicator co-occurrence across open complaints and formal police cases.
3. **Weight Computation:** Jaccard similarity and graph adjacency metrics score the likelihood that separate complaints represent the same syndicated cybercrime syndicate.
4. **Graph Persistence:** Generated correlations are persisted in `case_correlations` and rendered dynamically in the 3D WebGL correlation graph (`react-force-graph-3d`).
