# CCIP Document Ingestion & Vector Processing Pipeline

**Document ID:** CCIP-DOC-CB-004  
**Version:** 1.0.0 (Production)  
**Target Audience:** Backend Developers, ML Engineers, Forensic Data Analysts  

---

## 1. Pipeline Architecture & Execution Flow

The Knowledge Materials ingestion engine transforms raw administrative files (PDF, DOCX, TXT) into semantically searchable, vector-indexed knowledge units. The pipeline operates asynchronously using FastAPI `BackgroundTasks` to guarantee non-blocking responsiveness for administrators.

```
[ Raw File Upload ]
        |
        v
[ Step 1: Ingestion & Validation ]
   - MIME Type Verification (application/pdf, application/vnd.openxmlformats..., text/plain)
   - SHA-256 Checksum Calculation & Deduplication
   - Atomic File Write to Private Sovereign Vault
        |
        v
[ Step 2: Text Extraction ]
   - PDF: pypdf (Page-by-page extraction with stream cleanup)
   - DOCX: python-docx (Paragraph & table cell traversal)
   - TXT: UTF-8 decoder with UTF-16 and Latin-1 fallbacks
        |
        v
[ Step 3: Normalization & Sanitization ]
   - Strip non-printable ASCII and unmapped control characters
   - Collapse excessive newlines and whitespace
   - Strip executable script fragments or markup tags
        |
        v
[ Step 4: Semantic Window Chunking ]
   - Target Chunk Size: ~500 tokens (~2,000 characters)
   - Overlap: ~75 tokens (~300 characters)
   - Boundary Preservation: Split on sentence terminators (. ! ? \n)
        |
        v
[ Step 5: Dense Embedding Vectorization ]
   - Model: all-MiniLM-L6-v2 (Sentence-Transformers)
   - Vector Dimensionality: 384 dimensions
   - Normalization: L2 unit vector scaling for dot-product equivalence
        |
        v
[ Step 6: Atomic Database Persistence ]
   - Insert rows into knowledge_chunks
   - Update knowledge_materials.processing_status = 'COMPLETED'
```

---

## 2. Detailed Pipeline Steps

### 2.1 File Validation & Storage
Uploaded files are received via `multipart/form-data` at `/api/v1/admin/knowledge-materials/upload`.
1. **Size Enforcement:** Files exceeding `26,214,400 bytes` (25 MB) are rejected with HTTP 413.
2. **SHA-256 Hash:** The incoming byte stream is hashed in memory. If a matching SHA-256 hash already exists in `knowledge_materials`, the upload is identified as a duplicate and rejected with HTTP 409, preventing vector store pollution.
3. **Vault Isolation:** Validated files are written to `backend/storage/knowledge_materials/{uuid}_{safe_filename}` with permissions restricted to the backend service user.

### 2.2 Text Extraction Engine
- **PDF Extraction:**
  Implemented in `extract_text_from_file()` using `pypdf.PdfReader`.
  Each page's text is extracted, stripped of trailing form feeds, and appended with newline separators. If an encrypted or password-protected PDF is encountered, the extractor catches the error and marks the document `FAILED` with descriptive error details.
- **DOCX Extraction:**
  Implemented using `docx.Document(path)`.
  Iterates across all paragraphs and nested table cells, preserving tabular information in linear text format.
- **TXT Extraction:**
  Read in binary mode and decoded using `utf-8`. If a decoding exception occurs, it attempts `utf-16` followed by `latin-1`.

### 2.3 Semantic Window Chunking Algorithm
Documents cannot be indexed as monolithic texts because RAG retrieval requires granular passage precision.
```python
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 75) -> list[str]:
    # Approximated at 4 characters per token
    char_chunk_size = chunk_size * 4
    char_overlap = overlap * 4
    
    if len(text) <= char_chunk_size:
        return [text] if text.strip() else []
        
    chunks = []
    start = 0
    while start < len(text):
        end = start + char_chunk_size
        if end >= len(text):
            chunks.append(text[start:].strip())
            break
            
        # Find sentence boundary nearest to end
        boundary = max(
            text.rfind('. ', start, end),
            text.rfind('? ', start, end),
            text.rfind('! ', start, end),
            text.rfind('\n', start, end)
        )
        if boundary != -1 and boundary > start + (char_chunk_size // 2):
            chunks.append(text[start:boundary + 1].strip())
            start = boundary + 1 - char_overlap
        else:
            chunks.append(text[start:end].strip())
            start = end - char_overlap
            
    return [c for c in chunks if len(c) > 20]
```

### 2.4 Dense Embedding Generation
- **Model:** `all-MiniLM-L6-v2`
- **Output:** Dense 384-dimensional floating point array (`float32`).
- **Offline Guarantee:** The model weights are loaded locally from cache or quantized CPU execution, executing entirely within the sovereign server perimeter without external egress network requests.
- **Storage:** Embeddings are serialized to JSON string format and persisted in `knowledge_chunks.embedding_json`.

---

## 3. State Machine & Status Transitions

```
[ Upload Started ]
       |
       v
 [ PENDING ] ---> (Validation failure) ---> [ FAILED ]
       |
       v
 [ EXTRACTING ] -> (Corrupt file) ---------> [ FAILED ]
       |
       v
 [ CHUNKING ]
       |
       v
 [ EMBEDDING ] --> (OOM / Runtime error) --> [ FAILED ]
       |
       v
 [ COMPLETED ] (Ready for citizen retrieval)
```

If processing fails at any stage, `knowledge_materials.error_message` records the precise stack trace or validation failure reason, visible directly in the admin preview dialog.

