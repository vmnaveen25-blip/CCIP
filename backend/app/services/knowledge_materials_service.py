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

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BACKEND_DIR / "storage" / "knowledge_materials"


class KnowledgeMaterialsService:
    def __init__(self):
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        self.embedding_adapter = CaseSimilarityAdapter()

    # -------------------------------------------------------------
    # 1. Secure File Storage & Registration
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
        """Stores the original raw document safely and registers the database record."""
        # Calculate SHA-256 integrity hash
        file_hash = hashlib.sha256(file_bytes).hexdigest()

        # Check for duplicate
        stmt = select(KnowledgeMaterial).where(KnowledgeMaterial.file_hash == file_hash)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            logger.info(f"[KM] Duplicate file uploaded: {original_filename} (matches {existing.id})")
            return existing

        # Determine extension and validate type
        ext = Path(original_filename).suffix.lower()
        if ext not in [".pdf", ".docx", ".txt", ".md"]:
            raise ValueError(f"Unsupported file format '{ext}'. Only PDF, DOCX, TXT, and MD are allowed.")

        file_type = ext.replace(".", "").upper()
        clean_title = (title.strip() if title else original_filename)
        doc_id = str(uuid.uuid4())
        safe_filename = f"km_{doc_id[:8]}_{re.sub(r'[^a-zA-Z0-9_.-]', '_', original_filename)}"
        target_path = STORAGE_DIR / safe_filename

        # Write to secure local storage
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
            chatbot_status="AVAILABLE",
            chunks_count=0
        )
        db.add(material)
        await db.commit()
        await db.refresh(material)
        logger.info(f"[KM] Stored document {clean_title} ({len(file_bytes)} bytes) as {doc_id}")
        return material

    # -------------------------------------------------------------
    # 2. Text Extraction (PDF, DOCX, TXT)
    # -------------------------------------------------------------
    def extract_text_from_file(self, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """
        Extracts text passages with page/section provenance.
        Returns list of {"page": int, "text": str}.
        """
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Material file not found at {file_path}")

        extracted_pages = []

        if file_type == "PDF":
            try:
                import pypdf
                reader = pypdf.PdfReader(str(path))
                for page_num, page in enumerate(reader.pages, start=1):
                    txt = page.extract_text() or ""
                    clean_txt = self._clean_text(txt)
                    if clean_txt:
                        extracted_pages.append({"page": page_num, "text": clean_txt})
            except Exception as e:
                logger.error(f"[KM] PDF extraction failed for {file_path}: {e}")
                raise

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
                if clean_txt:
                    extracted_pages.append({"page": 1, "text": clean_txt})
            except Exception as e:
                logger.error(f"[KM] DOCX extraction failed for {file_path}: {e}")
                raise

        elif file_type in ["TXT", "MD"]:
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    txt = f.read()
                clean_txt = self._clean_text(txt)
                if clean_txt:
                    extracted_pages.append({"page": 1, "text": clean_txt})
            except Exception as e:
                logger.error(f"[KM] Text extraction failed for {file_path}: {e}")
                raise

        return extracted_pages

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

            # Split by paragraph first
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
                        # Keep overlap from the end of current_chunk
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
        """Extracts text, chunks, computes embeddings, and marks AVAILABLE."""
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
            pages = self.extract_text_from_file(material.storage_path, material.file_type)
            if not pages:
                raise ValueError("No extractable text found in file.")

            chunks_data = self.chunk_text(pages)
            if not chunks_data:
                raise ValueError("Could not produce semantic chunks from extracted text.")

            # Clear existing chunks if any (for re-indexing)
            del_stmt = delete(KnowledgeChunk).where(KnowledgeChunk.material_id == material_id)
            await session.execute(del_stmt)

            # Generate embeddings and persist chunks
            for c in chunks_data:
                text_content = c["text"]
                # 384-dimensional vector embedding
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

            material.chunks_count = len(chunks_data)
            material.processing_status = "AVAILABLE"
            material.error_message = None
            await session.commit()
            logger.info(f"[KM] Successfully indexed {len(chunks_data)} chunks for {material.title}")

        except Exception as e:
            logger.error(f"[KM] Ingestion pipeline failed for {material_id}: {e}")
            material.processing_status = "FAILED"
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
                    KnowledgeMaterial.chatbot_status == "AVAILABLE"
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
