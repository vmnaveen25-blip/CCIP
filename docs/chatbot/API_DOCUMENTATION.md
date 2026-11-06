# CCIP Chatbot & Knowledge Materials: REST API Reference

**Document ID:** CCIP-DOC-CB-006  
**Version:** 1.0.0 (Production)  
**Base URL:** `http://127.0.0.1:8000/api/v1`  

---

## 1. Public Citizen Chatbot Endpoints

These endpoints are exposed to anonymous citizens on the public landing page. They require **no user login**.

### 1.1 Health & Readiness
`GET /public-chat/health`

Returns operational readiness of the AI Assistant and indexed vector store.

**Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "total_active_materials": 5,
  "total_vector_chunks": 7,
  "model": "all-MiniLM-L6-v2",
  "sovereign_enclave": "ACTIVE"
}
```

---

### 1.2 Create Anonymous Chat Session
`POST /public-chat/session`

Initializes a 24-hour anonymous session and returns a signed token bound to the complainant.

**Headers:** None (Anonymous)  
**Request Body:** None  

**Response (200 OK):**
```json
{
  "session_id": "9f1e4b88-6c3d-4e92-b432-8df21b34e5a9",
  "session_token": "9f1e4b88-6c3d-4e92-b432-8df21b34e5a9",
  "expires_in_seconds": 86400,
  "welcome_message": "Hello! 👋 I'd be happy to help you. Ask me anything about CCIP or cyber safety."
}
```

---

### 1.3 Send Citizen Message
`POST /public-chat/message`

Submits an inquiry, executes vector RAG retrieval, checks for 1930 emergency fraud triggers, and returns grounded advisory steps.

**Request Body:**
```json
{
  "session_id": "9f1e4b88-6c3d-4e92-b432-8df21b34e5a9",
  "session_token": "9f1e4b88-6c3d-4e92-b432-8df21b34e5a9",
  "message": "What should I do if money was deducted from my account via UPI scam?"
}
```

**Response (200 OK):**
```json
{
  "response": "CRITICAL ADVISORY: If money was just deducted from your account, IMMEDIATELY dial the Cyber Financial Fraud Helpline at 1930. This activates the Golden Hours protocol to freeze fraudulent accounts. Next, follow these steps:\n1. Call 1930 immediately or log on to cybercrime.gov.in.\n2. Contact your bank to block your debit/credit card and freeze UPI ID.\n3. Keep your transaction reference number (UTR/RRN) ready.\n4. File a detailed complaint on CCIP with transaction screenshots.",
  "citations": [
    {
      "material_id": "df2b04f1-6101-443b-82ef-5079a0225d3a",
      "material_title": "UPI Fraud Awareness Guide.pdf",
      "chunk_index": 0,
      "relevance_score": 0.884
    }
  ],
  "is_urgent": true,
  "urgent_action": "DIAL_1930"
}
```

---

### 1.4 Terminate Session
`DELETE /public-chat/session/{session_id}`

Gracefully closes an active session and invalidates the session token.

**Response (200 OK):**
```json
{
  "status": "SESSION_TERMINATED",
  "session_id": "9f1e4b88-6c3d-4e92-b432-8df21b34e5a9"
}
```

---

## 2. Admin Knowledge Materials Endpoints

These endpoints govern document storage and vector indexing. They require an `Authorization: Bearer <JWT>` token with `admin` or `system_admin` role.

### 2.1 List Knowledge Materials & Statistics
`GET /admin/knowledge-materials/`

Retrieves the catalog of registered materials along with high-level statistics matching the 3-card layout.

**Query Parameters:**
- `search` (string, optional): Filter by title.
- `file_type` (string, optional): `pdf`, `docx`, `txt`.
- `page` (int, default: 1): Page number.
- `limit` (int, default: 10): Items per page.

**Response (200 OK):**
```json
{
  "total_materials": 1248,
  "storage_used_bytes": 3006477107,
  "storage_used_formatted": "2.8 GB",
  "available_for_chatbot": 1248,
  "items": [
    {
      "id": "df2b04f1-6101-443b-82ef-5079a0225d3a",
      "title": "CCIP Citizen User Guide.pdf",
      "file_type": "PDF",
      "file_size_formatted": "3.4 MB",
      "file_size_bytes": 3565158,
      "uploaded_on": "12 Mar 2025, 14:10",
      "created_at": "2025-03-12T14:10:00Z",
      "is_available_for_chatbot": true,
      "processing_status": "COMPLETED",
      "chunk_count": 2
    }
  ],
  "page": 1,
  "pages": 250
}
```

---

### 2.2 Upload & Ingest Knowledge Material
`POST /admin/knowledge-materials/upload`

Uploads a document, initiates SHA-256 verification, plaintext extraction, chunking, and dense vector embedding.

**Content-Type:** `multipart/form-data`  
**Parameters:**
- `file` (binary, required): PDF, DOCX, or TXT file $\le 25\text{ MB}$.
- `title` (string, optional): Human-readable title override.
- `category` (string, optional): Category classification.

**Response (201 Created):**
```json
{
  "id": "f51b9e28-89ab-4872-a1b2-c0e816a7f201",
  "title": "New Cyber Law Circular 2026.pdf",
  "file_type": "PDF",
  "file_size_formatted": "1.8 MB",
  "is_available_for_chatbot": true,
  "processing_status": "COMPLETED",
  "chunk_count": 4,
  "message": "Document uploaded and indexed successfully."
}
```

---

### 2.3 Preview Extracted Text & Vector Chunks
`GET /admin/knowledge-materials/{material_id}/preview`

Renders document metadata, raw extracted text, and individual chunk segmentations with token counts.

**Response (200 OK):**
```json
{
  "id": "df2b04f1-6101-443b-82ef-5079a0225d3a",
  "title": "UPI Fraud Awareness Guide.pdf",
  "file_type": "PDF",
  "processing_status": "COMPLETED",
  "raw_text_length": 1845,
  "chunk_count": 2,
  "chunks": [
    {
      "chunk_index": 0,
      "text": "UPI FRAUD AND IMMEDIATE RESPONSE PROTOCOL:\nIf you have fallen victim to a UPI fraud...",
      "token_count": 142,
      "has_embedding": true
    }
  ]
}
```

---

### 2.4 Toggle Chatbot Availability
`PATCH /admin/knowledge-materials/{material_id}/chatbot-status`

Instantly enables or disables a document from public RAG search without deleting data.

**Request Body:**
```json
{
  "is_available_for_chatbot": false
}
```

**Response (200 OK):**
```json
{
  "id": "df2b04f1-6101-443b-82ef-5079a0225d3a",
  "is_available_for_chatbot": false,
  "status": "STATUS_UPDATED"
}
```

---

### 2.5 Download Material Binary
`GET /admin/knowledge-materials/{material_id}/download`

Downloads the original binary file from the secure storage vault.

**Response (200 OK):** Binary stream (`Content-Disposition: attachment; filename="..."`).

---

### 2.6 Delete Knowledge Material
`DELETE /admin/knowledge-materials/{material_id}`

Deletes the document binary from disk and cascades deletion across all associated chunk embeddings in SQLite.

**Response (200 OK):**
```json
{
  "id": "df2b04f1-6101-443b-82ef-5079a0225d3a",
  "deleted": true,
  "purged_chunks": 2
}
```

