# CCIP – Complete Administrator Governance Workflow Specification
## System Operations, User Lifecycle Management & Knowledge Materials RAG Governance

---

### 1. Administrator Capabilities Overview

The System Administrator Portal (`/admin`) is the governance nexus of the CCIP Sovereign Enclave. Access is strictly guarded by the `RoleEnum.ADMIN` dependency and hardware token / MFA verification.

```mermaid
graph LR
    subgraph "Administrative Domains"
        UM[User & RBAC Governance]
        KM[Knowledge Materials RAG Pipeline]
        SH[System Health & Telemetry]
        AL[Immutable Audit Log Explorer]
        DB[Database & Backup Operations]
    end

    UM -->|Manage Users| UserAccounts[Promote, Suspend, Revoke Sessions]
    KM -->|Manage RAG| Ingest[Upload PDF/DOCX, Chunk, Vector Index, Toggle]
    SH -->|Observe| Telemetry[Memory, Latency, AI Model Status]
    AL -->|Audit| Ledger[Trace IP, User-Agent, Actions, Timestamps]
    DB -->|Protect| Backup[Encrypted Snapshots, Pruning, Integrity Checks]
```

---

### 2. Knowledge Materials Ingestion & RAG Lifecycle

Administrators govern the source materials that ground the CCIP Public AI Assistant:

```mermaid
stateDiagram-v2
    [*] --> UPLOADED : Admin uploads PDF/DOCX/TXT
    UPLOADED --> QUARANTINED : Isolated in Storage Vault
    QUARANTINED --> VALIDATED : SHA-256 Hash & Malware Scan Clean
    VALIDATED --> EXTRACTED : PyPDF / python-docx Text Extraction
    EXTRACTED --> CHUNKED : Semantic Boundary Splitting (500 tokens)
    CHUNKED --> EMBEDDED : 384-dim Tensor Generation (PyTorch)
    EMBEDDED --> AVAILABLE : Material Active for Citizen Chatbot
    
    AVAILABLE --> DISABLED : Admin toggles Chatbot Status
    DISABLED --> AVAILABLE : Admin re-enables Chatbot Status
    
    AVAILABLE --> DELETED : Admin Deletes Material
    DISABLED --> DELETED : Admin Deletes Material
    DELETED --> [*] : Cascade deletes chunks from vector index
```

#### Document Lifecycle Specification:
1. **Upload:** Admin submits material via `POST /api/v1/admin/knowledge-materials`.
   - Title, Category, Scope/Grounding Notes, File binary.
   - Size limit: 25 MB.
2. **Extraction:**
   - Multi-format extraction with fallback synthesis for scanned/short documents.
   - Whitespace normalization and removal of non-printable artifacts.
3. **Semantic Chunking:**
   - Token limit: 500 tokens per chunk.
   - Overlap: 75 tokens to preserve sentence context across chunk boundaries.
4. **Vector Embedding:**
   - Model: Sovereign MiniLM dense multilingual embedding engine.
   - Dimensionality: 384 float32 dimensions per chunk.
   - Storage: Direct serialization into `knowledge_chunks.embedding_vector` BLOB column.
5. **Availability Toggle:**
   - Admin can patch `chatbot_status` between `AVAILABLE` and `DISABLED` without deleting the document.
   - Disabled materials are immediately filtered out from RAG vector similarity search.
6. **Deletion:**
   - Cascading deletion purges the raw file from storage and deletes all associated vector chunks from the database index.

---

### 3. User Governance & Role Management

1. **User Discovery:** Search, filter by clearance tier (`CITIZEN TIER`, `TIER-3 FORENSICS`, `LEO TIER 2`, `ROOT ENCLAVE`), and sort by registration date.
2. **Role Elevation:** Promote verified investigators to `CYBERSECURITY_SPECIALIST` or `CYBERCRIME_POLICE` with mandatory badge number entry.
3. **Account Suspension & Deactivation:** Instant toggle setting `is_active = False` which terminates all active JWT sessions and revokes refresh tokens.
4. **Session Revocation:** Force sign-out on compromised accounts across all devices.

---

### 4. Immutable Audit Ledger Inspection

Every privileged administrative operation commits an append-only audit event:
- **Captured Attributes:** Timestamp, User ID, Full Name, Clearance Tier, Action Code, Resource Target ID, Client IP Address, User-Agent String, Execution Latency.
- **Tamper Protection:** In-database audit records cannot be edited or deleted via standard API routes.
