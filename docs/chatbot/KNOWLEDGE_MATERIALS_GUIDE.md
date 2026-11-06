# CCIP Knowledge Materials Management: Administrator Guide

**Document ID:** CCIP-DOC-CB-003  
**Version:** 1.0.0 (Production)  
**Target Audience:** CCIP System Administrators, SOC Operation Leads, Legal & Compliance Officers  

---

## 1. Overview & Purpose

The **Knowledge Materials** module (`/admin/knowledge-materials`) provides centralized governance over the authoritative documents and advisory handbooks consumed by the public CCIP AI Assistant. 

Through this interface, authorized personnel can:
1. Ingest new advisory circulars, procedural handbooks, and citizen guidelines in PDF, DOCX, or TXT format.
2. Inspect live extraction results, chunk segmentations, and semantic vectors before documents are queried in production.
3. Instantly enable or disable specific materials from the public AI Assistant's search scope.
4. Download original stored documents for regulatory audit or update cycles.
5. Securely remove outdated guidelines with cascade removal of associated vector chunk embeddings.

---

## 2. Interface Anatomy & Visual Layout

The interface strictly adheres to the Sovereign Enclave dark theme (`#04120a`, `#00e676` accents) with high-density tabular typography and glassmorphic telemetry cards.

```
+--------------------------------------------------------------------------------------------------+
| Knowledge Materials                                                        [ + Upload Material ] |
| Storage for approved materials used by the CCIP AI Assistant (chatbot).                          |
|                                                                                                  |
| [ 1,248 Total Materials ]        [ 2.8 GB Storage Used ]        [ 1,248 Available for Chatbot ]  |
+--------------------------------------------------------------------------------------------------+
| All Materials                                                     [ Q Search materials by title ]|
|                                                                                                  |
| #   Title                              Type   Size      Uploaded On          Actions             |
| 1   [PDF] CCIP Citizen User Guide.pdf   PDF    3.4 MB    12 Mar 2025, 14:10   [Preview] [Download]|
| 2   [PDF] UPI Fraud Awareness Guide.pdf PDF    5.1 MB    09 Mar 2025, 16:20   [Preview] [Download]|
| 3   [PDF] Phishing & Fake Websites.pdf  PDF    4.8 MB    08 Mar 2025, 11:02   [Preview] [Download]|
| 4   [DOC] Social Media Safety.docx      DOCX   2.1 MB    07 Mar 2025, 17:30   [Preview] [Download]|
| 5   [PDF] Cybercrime Prevention.pdf     PDF    3.9 MB    06 Mar 2025, 10:15   [Preview] [Download]|
|                                                                                                  |
| Showing 1 - 5 of 1,248 materials                        [<] [1] [2] [3] ... [250] [>]           |
+--------------------------------------------------------------------------------------------------+
```

### 2.1 The Three Telemetry Cards
1. **Total Materials Card (`Total Materials`):**
   - Displays total document records registered in the sovereign registry.
   - Shows active database volume with fallback indicator.
2. **Storage Used Card (`Storage Used`):**
   - Calculates aggregate byte size of all stored document binaries on disk (`storage/knowledge_materials/`).
   - Automatically formats across KB, MB, and GB thresholds.
3. **Available for Chatbot Card (`Available for Chatbot`):**
   - Counts documents with active status (`is_available_for_chatbot = True` and `processing_status = 'COMPLETED'`).
   - Serves as the primary operational readiness metric for public assistance availability.

### 2.2 Document Operations Table
Each row provides:
- **Type Icon:** Color-coded badge (Red for PDF, Blue for DOCX, Gray for TXT).
- **Metadata:** File title, MIME type, disk footprint, and timestamp.
- **Action Buttons:**
  - **Preview (`Eye` icon):** Opens the Document Inspector Modal showing extracted text, chunk segments, and similarity statistics.
  - **Download (`Download` icon):** Generates an authenticated, direct download stream from the private storage vault.
  - **Availability Toggle:** Switches chatbot availability on/off without deleting the document or its vector representations.
  - **Delete (`Trash` icon):** Executes hard deletion of the binary file and purges associated vector rows from SQLite.

---

## 3. Operational Workflows

### 3.1 Uploading New Knowledge Materials
1. Navigate to **Admin Portal -> System & Infrastructure -> Knowledge Materials**.
2. Click the **Upload Material** button in the top right.
3. Drag and drop the target file or click **Browse Files**.
   - **Allowed formats:** `.pdf`, `.docx`, `.txt`.
   - **Maximum file size:** 25 MB per document.
4. Input an **Administrative Title** (optional; defaults to filename) and an optional **Category Tag** (`Financial Fraud`, `Identity Theft`, `Citizen Procedure`, `General Prevention`).
5. Click **Confirm Upload**.
6. The file is uploaded with real-time progress indicators:
   - *Phase 1:* File Transfer & SHA-256 Validation.
   - *Phase 2:* Plaintext Extraction (pypdf/python-docx).
   - *Phase 3:* Semantic Chunking (500 tokens).
   - *Phase 4:* Dense Embedding Vectorization (384 dimensions).
7. Upon completion, the record appears immediately at the top of the table.

### 3.2 Inspecting and Auditing Extracted Chunks
Before releasing a critical cyber advisory to the public chatbot:
1. Locate the document in the table.
2. Click the **Preview** button (`Eye` icon).
3. The **Document Preview Modal** renders:
   - Document metadata (Title, Format, Total Chunks, Ingestion Date).
   - Complete extracted text stream.
   - Segmented chunk cards displaying token counts and embedding readiness.
4. Verify that formatting artifacts, optical scanning noise, or corrupted headers are absent.

### 3.3 Toggling Chatbot Availability
If a guideline is temporarily under review or superseded by a newly published directive:
1. Locate the row in the table.
2. Click the **Status Badge / Toggle** button.
3. The system executes `PATCH /api/v1/admin/knowledge-materials/{id}/chatbot-status`.
4. The document remains in the archive for auditing, but its vector chunks are immediately excluded from citizen RAG retrieval.

---

## 4. Ground Truth Seed Data & Emergency Re-indexing

CCIP includes a built-in sovereign seeding utility located at:
`backend/app/scripts/seed_knowledge_materials.py`

To re-seed or rebuild the baseline knowledge bank from scratch:
```powershell
cd c:\CCIP-main\CCIP-main\backend
.\venv\Scripts\python.exe app\scripts\seed_knowledge_materials.py
```

This utility automatically ingests:
1. `CCIP Citizen User Guide.pdf` — How to register, file complaints, upload evidence, and track status.
2. `UPI Fraud Awareness Guide.pdf` — Golden Hours 1930 protocol, reversing fraudulent transactions, contacting bank nodal officers.
3. `Phishing & Fake Websites.pdf` — Recognizing counterfeit banking portals, SMS phishing, and URL safety checks.
4. `Social Media Account Safety.docx` — Account takeover recovery, 2FA protocols, and impersonation takedown procedures.
5. `Cybercrime Prevention Tips.pdf` — Password hygiene, public Wi-Fi risks, and digital arrest scam advisories.

