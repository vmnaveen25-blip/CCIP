# CCIP AI Assistant & Knowledge Materials: System Administrator Manual

**Document ID:** CCIP-DOC-CB-012  
**Version:** 1.0.0 (Production)  
**Target Audience:** SOC Administrators, Content Curators, System Enclave Operators  

---

## 1. Introduction

Welcome to the **CCIP Knowledge Materials Administration Manual**. This guide provides practical, step-by-step instructions for managing the official cyber safety materials, procedural guidelines, and citizen circulars that feed the public **CCIP AI Assistant**.

---

## 2. Accessing the Module

1. Open the CCIP platform in any modern browser (`Chrome`, `Firefox`, `Edge`).
2. Click the **Sign In** button located in the top-right of the navigation header.
3. Select **Authorized Staff**.
4. In the role selector, choose **System Admin** (or use your issued Enclave credentials).
5. Click **Authenticate & Enter Enclave**.
6. In the left navigation sidebar under the **SYSTEM & INFRASTRUCTURE** section, click **Knowledge Materials**.

---

## 3. Daily Operations & Workflows

### 3.1 Reviewing Operational Telemetry
At the top of the screen, three telemetry cards reflect live platform health:
- **Total Materials:** Total registered documents. Ensure this matches your agency's published circular registry.
- **Storage Used:** Total disk capacity consumed by documents in the sovereign vault.
- **Available for Chatbot:** Documents actively indexed and eligible for citizen RAG retrieval.

---

### 3.2 Uploading a New Advisory or Manual
Whenever a new cyber advisory (e.g., advisories on new WhatsApp malware, updated UPI fraud recovery procedures) is published:

1. Click the green **Upload Material** button in the top right.
2. The upload dialog appears:
   - Drag and drop your file into the dashed emerald zone, or click to browse.
   - Supported file extensions: `.pdf`, `.docx`, `.txt`.
   - Maximum permitted size: `25 MB`.
3. Provide an administrative title (e.g., `Advisory on WhatsApp Impersonation Scams 2026.pdf`).
4. Select a category tag (e.g., `Financial Fraud`).
5. Click **Confirm Upload**.
6. The system automatically performs:
   - Cryptographic SHA-256 deduplication.
   - Text extraction.
   - Chunk segmentation (500 tokens).
   - Dense vector embedding calculation.
7. Once finished, a confirmation notification appears, and the document is instantly live for public citizens.

---

### 3.3 Auditing Document Chunks Before Release
To verify how the AI Assistant will interpret a newly uploaded document:
1. Locate the document in the **All Materials** table.
2. Click the **Preview** button (`Eye` icon) in the Actions column.
3. The **Document Inspector** modal opens, displaying:
   - Administrative file details and chunk tally.
   - Raw extracted text stream.
   - Individual chunk cards showing exact segment breaks and token lengths.
4. If the extracted text contains formatting errors or broken tables, you can delete the file, adjust the formatting, and re-upload.

---

### 3.4 Toggling Document Availability (Emergency Pause)
If an existing advisory contains an outdated phone number or superseded legal procedure:
1. Locate the document row.
2. Click the **Status Badge / Toggle** switch.
3. The document immediately shifts to `Unavailable`.
4. The AI Assistant will instantly cease citing or retrieving information from that document during citizen conversations, with zero system downtime.

---

### 3.5 Downloading an Original File
1. Locate the document in the table.
2. Click the **Download** button (`Download` icon).
3. The original unaltered binary is streamed directly to your downloads directory from the secure vault.

---

### 3.6 Permanently Removing a Document
1. Locate the document in the table.
2. Click the **Delete** button (`Trash` icon).
3. Confirm deletion in the prompt dialog.
4. The document binary is wiped from disk, and all associated vector embeddings are purged from the SQLite index.

---

## 4. Troubleshooting & Frequently Asked Questions

### Q: Why did an upload fail with "Duplicate Document Detected"?
**A:** CCIP calculates a SHA-256 cryptographic hash of every uploaded file. If the exact same document already exists in the system, it will reject the duplicate to prevent vector store pollution. Check the table to see if the file is already uploaded under another title.

### Q: Why did a PDF upload fail with "Encrypted PDF"?
**A:** Password-protected or encrypted PDFs cannot be indexed by the extraction engine. Remove password protection from the document before uploading.

### Q: How do I test the chatbot after uploading a new document?
**A:** Return to the CCIP landing page (or open an incognito browser window), click the floating chatbot logo in the bottom-right corner, and ask a question directly related to the newly uploaded material. Check that the assistant cites your document under "Verified Sources".

