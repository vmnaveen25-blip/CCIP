"""
Knowledge Materials Service for CCIP Enclave.
Provides secure document upload, text extraction (PDF, DOCX, TXT),
semantic chunking, 384/768-dim dense vector embedding generation,
RAG similarity retrieval, and chatbot availability management.
"""

import os
import io
import re
import uuid
import struct
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, delete

from app.core.logging import logger
from app.models.knowledge_material import KnowledgeMaterial, KnowledgeChunk
from app.ai.adapters.case_similarity import CaseSimilarityAdapter
from app.services.malware_service import malware_scanner

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BACKEND_DIR / "storage" / "knowledge_materials"


class KnowledgeMaterialsService:
    def __init__(self):
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        self.embedding_adapter = CaseSimilarityAdapter()

    # -------------------------------------------------------------
    # 1. Secure File Storage & Registration (MIME Magic + AV Scan)
    # -------------------------------------------------------------
    async def register_and_store_document(
        self,
        db: AsyncSession,
        file_bytes: bytes,
        original_filename: str,
        title: Optional[str] = None,
        category: str = "General Awareness",
        uploaded_by: str = "System Administrator"
    ) -> KnowledgeMaterial:
        """Stores the original raw document safely with magic byte verification and malware scanning."""
        if not file_bytes or len(file_bytes) == 0:
            raise ValueError("Uploaded file is empty (0 bytes).")
        if len(file_bytes) > 25 * 1024 * 1024:
            raise ValueError("File exceeds maximum allowable size of 25 MB.")

        # Calculate primary SHA-256 integrity hash
        file_hash = hashlib.sha256(file_bytes).hexdigest()

        # Check for duplicate: preserve original, record re-upload, update timestamp
        stmt = select(KnowledgeMaterial).where(KnowledgeMaterial.file_hash == file_hash)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            logger.info(f"[KM] Duplicate file re-uploaded: {original_filename} matches existing {existing.id}")
            if title and title.strip():
                existing.title = title.strip()
            if category:
                existing.category = category
            existing.uploaded_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(existing)
            return existing

        # Determine extension and validate type
        ext = Path(original_filename).suffix.lower()
        if ext not in [".pdf", ".docx", ".txt", ".md"]:
            raise ValueError(f"Unsupported file format '{ext}'. Only PDF, DOCX, TXT, and MD are allowed.")

        # MIME magic byte verification
        if ext == ".pdf":
            header_sample = file_bytes[:1024]
            if b"%PDF-" not in header_sample:
                if file_bytes[:2] == b"MZ" or file_bytes[:4] == b"\x7fELF":
                    raise ValueError("Binary executable masquerading as PDF rejected.")
                raise ValueError("MIME verification failed: Missing %PDF- magic signature.")
        elif ext == ".docx":
            if file_bytes[:4] != b"PK\x03\x04":
                raise ValueError("MIME verification failed: File is not a valid OpenXML ZIP package.")
        elif ext in [".txt", ".md"]:
            if b"\x00" in file_bytes[:512]:
                raise ValueError("MIME verification failed: Text file contains non-printable binary null characters.")

        # Malware scanning stage
        scan_status, scan_details = await malware_scanner.scan_bytes(file_bytes, original_filename)
        is_quarantined = scan_status in ("INFECTED", "SUSPICIOUS")

        doc_id = str(uuid.uuid4())
        safe_filename = f"km_{doc_id[:8]}_{re.sub(r'[^a-zA-Z0-9_.-]', '_', original_filename)}"

        if is_quarantined:
            quarantine_dir = BACKEND_DIR / "storage" / "quarantine"
            quarantine_dir.mkdir(parents=True, exist_ok=True)
            target_path = quarantine_dir / f"quarantine_{safe_filename}"
            with open(target_path, "wb") as f:
                f.write(file_bytes)

            clean_title = (title.strip() if title else original_filename)
            material = KnowledgeMaterial(
                id=doc_id,
                title=clean_title,
                original_filename=original_filename,
                stored_filename=safe_filename,
                file_type=ext.replace(".", "").upper(),
                file_size_bytes=len(file_bytes),
                file_hash=file_hash,
                category=category,
                storage_path=str(target_path),
                uploaded_by=uploaded_by,
                processing_status="QUARANTINED",
                chatbot_status="DISABLED",
                chunks_count=0,
                error_message=f"Threat detected: {scan_details or scan_status}"
            )
            db.add(material)
            await db.commit()
            await db.refresh(material)
            logger.warning(f"[KM] File {original_filename} quarantined: {scan_details}")
            return material

        file_type = ext.replace(".", "").upper()
        clean_title = (title.strip() if title else original_filename)
        target_path = STORAGE_DIR / safe_filename

        # Write pristine original file to secure storage (never overwritten)
        with open(target_path, "wb") as f:
            f.write(file_bytes)

        material = KnowledgeMaterial(
            id=doc_id,
            title=clean_title,
            original_filename=original_filename,
            stored_filename=safe_filename,
            file_type=file_type,
            file_size_bytes=len(file_bytes),
            file_hash=file_hash,
            category=category,
            storage_path=str(target_path),
            uploaded_by=uploaded_by,
            processing_status="PROCESSING",
            chatbot_status="DISABLED",  # strictly DISABLED until extraction & indexing succeed
            chunks_count=0
        )
        db.add(material)
        await db.commit()
        await db.refresh(material)
        logger.info(f"[KM] Stored document {clean_title} ({len(file_bytes)} bytes) as {doc_id}")
        return material

    # -------------------------------------------------------------
    # 2. Document Extraction (PDF, DOCX, TXT)
    # -------------------------------------------------------------
    def extract_text_from_file(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Extracts text passages with page/section provenance.
        Returns detailed extraction report with status:
        SUCCESS, OCR_REQUIRED, PARTIALLY_EXTRACTED, FAILED, ENCRYPTED
        """
        path = Path(file_path)
        if not path.is_file():
            return {
                "pages": [],
                "page_count": 0,
                "total_text_length": 0,
                "extraction_method": "none",
                "warnings": [f"Material file not found at {file_path}"],
                "status": "FAILED",
                "error_message": f"Material file not found at {file_path}"
            }

        extracted_pages: List[Dict[str, Any]] = []
        warnings: List[str] = []
        total_pages = 0

        if file_type == "PDF":
            try:
                import pypdf
                reader = pypdf.PdfReader(str(path))
                if getattr(reader, "is_encrypted", False):
                    try:
                        decrypted = reader.decrypt("")
                        if decrypted == 0:
                            return {
                                "pages": [],
                                "page_count": len(reader.pages) if hasattr(reader, "pages") else 0,
                                "total_text_length": 0,
                                "extraction_method": "pypdf_encrypted",
                                "warnings": ["PDF is password protected"],
                                "status": "ENCRYPTED",
                                "error_message": "Document is password-protected or encrypted; unable to extract text without credentials."
                            }
                    except Exception:
                        return {
                            "pages": [],
                            "page_count": 0,
                            "total_text_length": 0,
                            "extraction_method": "pypdf_encrypted",
                            "warnings": ["PDF is password protected"],
                            "status": "ENCRYPTED",
                            "error_message": "Document is password-protected or encrypted; unable to extract text without credentials."
                        }

                total_pages = len(reader.pages)
                if total_pages == 0:
                    return {
                        "pages": [],
                        "page_count": 0,
                        "total_text_length": 0,
                        "extraction_method": "pypdf",
                        "warnings": ["PDF contains 0 pages"],
                        "status": "FAILED",
                        "error_message": "PDF document contains 0 pages."
                    }

                max_pages = min(total_pages, 200)
                if total_pages > 200:
                    warnings.append(f"Document contains {total_pages} pages; processed first 200 pages.")

                for page_num in range(max_pages):
                    page = reader.pages[page_num]
                    txt = page.extract_text() or ""
                    clean_txt = self._clean_text(txt)
                    if clean_txt:
                        extracted_pages.append({"page": page_num + 1, "text": clean_txt})

                total_chars = sum(len(p["text"]) for p in extracted_pages)

                # Detect scanned / image-only documents
                if total_chars < 30:
                    return {
                        "pages": [],
                        "page_count": total_pages,
                        "total_text_length": total_chars,
                        "extraction_method": "pypdf_native",
                        "warnings": warnings + ["Scanned or image-only pages detected with no extractable text."],
                        "status": "OCR_REQUIRED",
                        "error_message": "Scanned document detected with no extractable text. OCR processing required."
                    }

                return {
                    "pages": extracted_pages,
                    "page_count": total_pages,
                    "total_text_length": total_chars,
                    "extraction_method": "pypdf_native",
                    "warnings": warnings,
                    "status": "SUCCESS",
                    "error_message": None
                }

            except Exception as e:
                logger.warning(f"[KM] Native PDF extraction exception for {file_path}: {e}. Running raw stream recovery...")
                try:
                    with open(path, "rb") as bf:
                        raw_data = bf.read()
                    matches = re.findall(rb'[A-Za-z0-9 ,.;:!?-]{6,}', raw_data)
                    recovered = " ".join(m.decode("ascii", errors="ignore") for m in matches if len(m) > 6)
                    clean_txt = self._clean_text(recovered)
                    if clean_txt and len(clean_txt) >= 60:
                        return {
                            "pages": [{"page": 1, "text": clean_txt}],
                            "page_count": 1,
                            "total_text_length": len(clean_txt),
                            "extraction_method": "text_stream_recovery",
                            "warnings": warnings + [f"PDF parser encountered error ({str(e)}); partial text recovered from stream."],
                            "status": "PARTIALLY_EXTRACTED",
                            "error_message": None
                        }
                    else:
                        return {
                            "pages": [],
                            "page_count": 0,
                            "total_text_length": 0,
                            "extraction_method": "none",
                            "warnings": warnings + [f"PDF extraction error: {str(e)}"],
                            "status": "FAILED",
                            "error_message": f"Malformed or damaged PDF file: {str(e)}"
                        }
                except Exception as fb_err:
                    return {
                        "pages": [],
                        "page_count": 0,
                        "total_text_length": 0,
                        "extraction_method": "none",
                        "warnings": warnings + [f"Recovery error: {str(fb_err)}"],
                        "status": "FAILED",
                        "error_message": f"Corrupted PDF file could not be parsed: {str(e)}"
                    }

        elif file_type == "DOCX":
            try:
                import docx
                doc = docx.Document(str(path))
                full_text = []
                for p in doc.paragraphs:
                    if p.text.strip():
                        full_text.append(p.text.strip())
                joined = "\n\n".join(full_text)
                clean_txt = self._clean_text(joined)
                if not clean_txt or len(clean_txt) < 20:
                    return {
                        "pages": [],
                        "page_count": 1,
                        "total_text_length": len(clean_txt or ""),
                        "extraction_method": "python-docx",
                        "warnings": warnings,
                        "status": "FAILED",
                        "error_message": "DOCX document contains no usable text."
                    }
                return {
                    "pages": [{"page": 1, "text": clean_txt}],
                    "page_count": 1,
                    "total_text_length": len(clean_txt),
                    "extraction_method": "python-docx",
                    "warnings": warnings,
                    "status": "SUCCESS",
                    "error_message": None
                }
            except Exception as e:
                return {
                    "pages": [],
                    "page_count": 0,
                    "total_text_length": 0,
                    "extraction_method": "none",
                    "warnings": warnings,
                    "status": "FAILED",
                    "error_message": f"DOCX parsing failed: {str(e)}"
                }

        elif file_type in ["TXT", "MD"]:
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    txt = f.read()
                clean_txt = self._clean_text(txt)
                if not clean_txt or len(clean_txt) < 15:
                    return {
                        "pages": [],
                        "page_count": 1,
                        "total_text_length": len(clean_txt or ""),
                        "extraction_method": "text_plain",
                        "warnings": warnings,
                        "status": "FAILED",
                        "error_message": "Text document contains no usable content."
                    }
                return {
                    "pages": [{"page": 1, "text": clean_txt}],
                    "page_count": 1,
                    "total_text_length": len(clean_txt),
                    "extraction_method": "text_plain",
                    "warnings": warnings,
                    "status": "SUCCESS",
                    "error_message": None
                }
            except Exception as e:
                return {
                    "pages": [],
                    "page_count": 0,
                    "total_text_length": 0,
                    "extraction_method": "none",
                    "warnings": warnings,
                    "status": "FAILED",
                    "error_message": f"Text reading failed: {str(e)}"
                }

        return {
            "pages": [],
            "page_count": 0,
            "total_text_length": 0,
            "extraction_method": "none",
            "warnings": [f"Unsupported format {file_type}"],
            "status": "FAILED",
            "error_message": f"Unsupported file type '{file_type}'"
        }

    def _clean_text(self, text: str) -> str:
        """Normalizes whitespace and removes control characters."""
        if not text:
            return ""
        # Remove null bytes and non-printable control chars
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', text)
        # Collapse multiple spaces and excessive newlines
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    # -------------------------------------------------------------
    # 3. Semantic Chunking
    # -------------------------------------------------------------
    def chunk_text(self, pages: List[Dict[str, Any]], chunk_size: int = 600, chunk_overlap: int = 100) -> List[Dict[str, Any]]:
        """
        Splits extracted pages into overlapping semantic chunks.
        Preserves page number provenance.
        """
        chunks = []
        chunk_idx = 0

        for page_data in pages:
            page_num = page_data["page"]
            text = page_data["text"]

            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            current_chunk = ""

            for p in paragraphs:
                if len(current_chunk) + len(p) + 2 <= chunk_size:
                    current_chunk = f"{current_chunk}\n\n{p}".strip() if current_chunk else p
                else:
                    if current_chunk:
                        chunk_idx += 1
                        chunks.append({
                            "chunk_index": chunk_idx,
                            "page_number": page_num,
                            "text": current_chunk,
                            "token_count": len(current_chunk.split())
                        })
                        overlap_start = max(0, len(current_chunk) - chunk_overlap)
                        overlap_text = current_chunk[overlap_start:]
                        current_chunk = f"{overlap_text}\n\n{p}".strip()
                    else:
                        current_chunk = p

            if current_chunk:
                chunk_idx += 1
                chunks.append({
                    "chunk_index": chunk_idx,
                    "page_number": page_num,
                    "text": current_chunk,
                    "token_count": len(current_chunk.split())
                })

        return chunks

    # -------------------------------------------------------------
    # 4. Asynchronous Document Processing Pipeline
    # -------------------------------------------------------------
    async def process_document(self, material_id: str, db: Optional[AsyncSession] = None):
        """Extracts text, chunks, computes embeddings, and marks AVAILABLE strictly on success."""
        from app.db.database import AsyncSessionLocal

        if db is not None:
            await self._run_process_document(material_id, db)
        else:
            async with AsyncSessionLocal() as session:
                await self._run_process_document(material_id, session)

    async def _run_process_document(self, material_id: str, session: AsyncSession):
        stmt = select(KnowledgeMaterial).where(KnowledgeMaterial.id == material_id)
        result = await session.execute(stmt)
        material = result.scalar_one_or_none()
        if not material:
            logger.error(f"[KM] Cannot process material {material_id}: not found.")
            return

        try:
            logger.info(f"[KM] Starting extraction for material: {material.title}")
            extraction = self.extract_text_from_file(material.storage_path, material.file_type)
            status = extraction["status"]

            # If extraction failed, encrypted, or requires OCR: NEVER create synthetic text!
            if status in ("FAILED", "ENCRYPTED", "OCR_REQUIRED"):
                del_stmt = delete(KnowledgeChunk).where(KnowledgeChunk.material_id == material_id)
                await session.execute(del_stmt)
                material.chunks_count = 0
                material.processing_status = status
                material.chatbot_status = "DISABLED"
                material.error_message = extraction.get("error_message")
                await session.commit()
                logger.warning(f"[KM] Material {material_id} cannot enter RAG: {status} ({extraction.get('error_message')})")
                return

            pages = extraction["pages"]
            chunks_data = self.chunk_text(pages)
            # Filter out empty or meaningless chunks
            valid_chunks = [c for c in chunks_data if len(c["text"].strip()) >= 25]

            if not valid_chunks:
                del_stmt = delete(KnowledgeChunk).where(KnowledgeChunk.material_id == material_id)
                await session.execute(del_stmt)
                material.chunks_count = 0
                material.processing_status = "FAILED"
                material.chatbot_status = "DISABLED"
                material.error_message = "No valid semantic chunks could be created from document content."
                await session.commit()
                return

            # Clear existing chunks if any (for re-indexing)
            del_stmt = delete(KnowledgeChunk).where(KnowledgeChunk.material_id == material_id)
            await session.execute(del_stmt)

            # Generate embeddings and persist chunks
            for c in valid_chunks:
                text_content = c["text"]
                raw_vector = self.embedding_adapter.get_embedding(text_content)
                vector_bytes = struct.pack(f"{len(raw_vector)}f", *raw_vector)

                chunk_obj = KnowledgeChunk(
                    id=str(uuid.uuid4()),
                    material_id=material_id,
                    chunk_index=c["chunk_index"],
                    chunk_text=text_content,
                    token_count=c["token_count"],
                    page_number=c["page_number"],
                    section_title=material.title,
                    embedding_vector=vector_bytes
                )
                session.add(chunk_obj)

            material.chunks_count = len(valid_chunks)
            material.processing_status = "AVAILABLE"
            material.chatbot_status = "AVAILABLE"
            material.error_message = None
            await session.commit()
            logger.info(f"[KM] Successfully indexed {len(valid_chunks)} chunks for {material.title}")

        except Exception as e:
            logger.error(f"[KM] Ingestion pipeline failed for {material_id}: {e}")
            del_stmt = delete(KnowledgeChunk).where(KnowledgeChunk.material_id == material_id)
            await session.execute(del_stmt)
            material.chunks_count = 0
            material.processing_status = "FAILED"
            material.chatbot_status = "DISABLED"
            material.error_message = str(e)
            await session.commit()

    # -------------------------------------------------------------
    # 5. Semantic Vector Retrieval (RAG)
    # -------------------------------------------------------------
    async def search_relevant_chunks(
        self,
        db: AsyncSession,
        query: str,
        top_k: int = 4,
        similarity_threshold: float = 0.35
    ) -> List[Dict[str, Any]]:
        """
        Encodes query, computes cosine similarity against all AVAILABLE chatbot chunks,
        and returns top-K ranked context chunks.
        """
        if not query or not query.strip():
            return []

        # Generate query vector
        query_vec = np.array(self.embedding_adapter.get_embedding(query), dtype=np.float32)
        query_norm = np.linalg.norm(query_vec)
        if query_norm > 0:
            query_vec = query_vec / query_norm

        # Query all chunks where parent material is AVAILABLE
        stmt = (
            select(
                KnowledgeChunk.id,
                KnowledgeChunk.chunk_text,
                KnowledgeChunk.page_number,
                KnowledgeChunk.chunk_index,
                KnowledgeChunk.embedding_vector,
                KnowledgeMaterial.title,
                KnowledgeMaterial.category
            )
            .join(KnowledgeMaterial, KnowledgeChunk.material_id == KnowledgeMaterial.id)
            .where(
                and_(
                    KnowledgeMaterial.processing_status == "AVAILABLE",
                    KnowledgeMaterial.chatbot_status == "AVAILABLE",
                    KnowledgeMaterial.chunks_count > 0
                )
            )
        )
        result = await db.execute(stmt)
        rows = result.all()

        if not rows:
            return []

        scored_chunks = []
        for row in rows:
            chunk_id, chunk_text, page_number, chunk_idx, vec_bytes, doc_title, category = row
            try:
                # Unpack float32 bytes
                dim = len(vec_bytes) // 4
                chunk_vec = np.array(struct.unpack(f"{dim}f", vec_bytes), dtype=np.float32)
                chunk_norm = np.linalg.norm(chunk_vec)
                if chunk_norm > 0:
                    chunk_vec = chunk_vec / chunk_norm
                
                # Cosine similarity
                sim = float(np.dot(query_vec, chunk_vec))
                if sim >= similarity_threshold:
                    scored_chunks.append({
                        "id": chunk_id,
                        "chunk_id": chunk_id,
                        "title": doc_title,
                        "category": category,
                        "page": page_number,
                        "chunk_index": chunk_idx,
                        "text": chunk_text,
                        "similarity_score": round(sim, 4)
                    })
            except Exception as err:
                continue

        # Sort descending by similarity
        scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_chunks[:top_k]

    # -------------------------------------------------------------
    # 6. Admin Management Operations
    # -------------------------------------------------------------
    async def list_materials(
        self,
        db: AsyncSession,
        search: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 5
    ) -> Dict[str, Any]:
        """Returns paginated materials and overall knowledge metrics."""
        query = select(KnowledgeMaterial)

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.where(
                or_(
                    KnowledgeMaterial.title.ilike(s),
                    KnowledgeMaterial.category.ilike(s),
                    KnowledgeMaterial.original_filename.ilike(s)
                )
            )

        if category and category != "All":
            query = query.where(KnowledgeMaterial.category == category)

        # Count total matching
        count_stmt = select(func.count()).select_from(query.subquery())
        total_matching = (await db.execute(count_stmt)).scalar() or 0

        # Overall summary stats
        stat_stmt = select(
            func.count(KnowledgeMaterial.id),
            func.coalesce(func.sum(KnowledgeMaterial.file_size_bytes), 0),
            func.count(func.nullif(KnowledgeMaterial.chatbot_status != "AVAILABLE", True))
        )
        stat_res = (await db.execute(stat_stmt)).one()
        total_all_materials = stat_res[0] or 0
        total_storage_bytes = stat_res[1] or 0
        total_available = stat_res[2] or 0

        # Pagination
        offset = (page - 1) * page_size
        paged_stmt = query.order_by(KnowledgeMaterial.created_at.desc()).offset(offset).limit(page_size)
        items = (await db.execute(paged_stmt)).scalars().all()

        return {
            "items": [
                {
                    "id": m.id,
                    "title": m.title,
                    "original_filename": m.original_filename,
                    "file_type": m.file_type,
                    "size_bytes": m.file_size_bytes,
                    "size_formatted": f"{(m.file_size_bytes / (1024 * 1024)):.1f} MB" if m.file_size_bytes >= 1024*1024 else f"{(m.file_size_bytes / 1024):.0f} KB",
                    "category": m.category,
                    "uploaded_on": m.uploaded_at.strftime("%d %b %Y, %H:%M") if m.uploaded_at else "Recent",
                    "uploaded_by": m.uploaded_by,
                    "processing_status": m.processing_status,
                    "chatbot_status": m.chatbot_status,
                    "chunks_count": m.chunks_count,
                    "file_hash": m.file_hash[:8] + "..." + m.file_hash[-4:] if m.file_hash else ""
                }
                for m in items
            ],
            "total_items": total_matching,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total_matching + page_size - 1) // page_size),
            "statistics": {
                "total_materials": total_all_materials,
                "storage_used_bytes": total_storage_bytes,
                "storage_used_formatted": f"{(total_storage_bytes / (1024 * 1024 * 1024)):.1f} GB" if total_storage_bytes >= 1024**3 else f"{(total_storage_bytes / (1024 * 1024)):.1f} MB",
                "available_for_chatbot": total_available
            }
        }

    async def get_material(self, db: AsyncSession, material_id: str) -> Optional[KnowledgeMaterial]:
        stmt = select(KnowledgeMaterial).where(KnowledgeMaterial.id == material_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_material_preview(self, db: AsyncSession, material_id: str) -> Optional[Dict[str, Any]]:
        """Returns safe preview metadata and first extracted text chunks for administrator verification."""
        material = await self.get_material(db, material_id)
        if not material:
            return None

        # Fetch up to first 5 chunks
        chunk_stmt = (
            select(KnowledgeChunk)
            .where(KnowledgeChunk.material_id == material_id)
            .order_by(KnowledgeChunk.chunk_index.asc())
            .limit(5)
        )
        chunks_res = await db.execute(chunk_stmt)
        chunks = chunks_res.scalars().all()

        formatted_size = (
            f"{(material.file_size_bytes / (1024 * 1024)):.1f} MB"
            if material.file_size_bytes >= 1024 * 1024
            else f"{(material.file_size_bytes / 1024):.0f} KB"
        )

        return {
            "id": material.id,
            "title": material.title,
            "original_filename": material.original_filename,
            "file_type": material.file_type,
            "file_size_bytes": material.file_size_bytes,
            "size_formatted": formatted_size,
            "category": material.category,
            "uploaded_by": material.uploaded_by,
            "uploaded_on": material.uploaded_at.strftime("%d %b %Y, %H:%M") if material.uploaded_at else "Recent",
            "processing_status": material.processing_status,
            "chatbot_status": material.chatbot_status,
            "chunks_count": material.chunks_count,
            "file_hash": material.file_hash,
            "error_message": material.error_message,
            "preview_chunks": [
                {
                    "chunk_index": c.chunk_index,
                    "page_number": c.page_number,
                    "text": c.chunk_text
                }
                for c in chunks
            ]
        }

    async def toggle_chatbot_status(self, db: AsyncSession, material_id: str, new_status: str) -> Optional[KnowledgeMaterial]:
        material = await self.get_material(db, material_id)
        if material:
            material.chatbot_status = "AVAILABLE" if new_status.upper() == "AVAILABLE" else "DISABLED"
            await db.commit()
            await db.refresh(material)
        return material

    async def delete_material(self, db: AsyncSession, material_id: str) -> bool:
        material = await self.get_material(db, material_id)
        if not material:
            return False

        # Remove file from disk
        try:
            p = Path(material.storage_path)
            if p.is_file():
                p.unlink()
        except Exception as e:
            logger.warning(f"[KM] Could not delete disk file {material.storage_path}: {e}")

        # Delete database record (chunks cascade delete automatically)
        await db.delete(material)
        await db.commit()
        logger.info(f"[KM] Purged knowledge material {material_id}")
        return True


# Global service singleton
knowledge_materials_service = KnowledgeMaterialsService()
