"""
Document Processing Service for CCIP / Astraea Enclave
Orchestrates text extraction, OCR, local PII redaction, deterministic cyber entity extraction,
and Gemini contextual intelligence using 100% free/open-source tools (pypdf, python-docx, pytesseract).
"""

import io
import os
import re
import time
import logging
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.evidence import Evidence
from app.models.cyber_entity import CyberEntity
from app.models.document_processing import DocumentProcessingResult
from app.services.storage_service import storage_service
from app.services.pii_redactor import pii_redactor
from app.services.gemini_document_service import gemini_document_service
from app.ai.extractors.cyber_entity_extractor import cyber_entity_extractor, ExtractedEntity
from app.core.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

# Supported magic byte signatures for security validation
FILE_SIGNATURES = {
    "pdf": b"%PDF",
    "png": b"\x89PNG\r\n\x1a\n",
    "jpg": b"\xff\xd8\xff",
    "jpeg": b"\xff\xd8\xff",
    "webp": b"RIFF", # followed by WEBP
    "docx": b"PK\x03\x04", # zip container
}


class DocumentProcessorService:
    """
    Production-grade document processor for cybercrime evidence.
    Supports native PDF (pypdf), Word (.docx), Screenshots/Images (Pillow/OCR),
    and plain text formats.
    """

    def validate_file_content(self, file_bytes: bytes, filename: str) -> str:
        """
        Validates file magic bytes and format signatures to prevent disguised executables.
        Returns the confirmed format string ('pdf', 'docx', 'png', 'jpg', 'webp', 'txt', etc.)
        """
        if not file_bytes:
            raise ValidationError("Evidence document file content is empty")

        ext = filename.split(".")[-1].lower() if "." in filename else ""

        if ext == "pdf":
            if not file_bytes.startswith(b"%PDF"):
                raise ValidationError("File has .pdf extension but lacks valid PDF signature header")
            return "pdf"

        elif ext in {"png"}:
            if not file_bytes.startswith(FILE_SIGNATURES["png"]):
                raise ValidationError("File has .png extension but lacks valid PNG signature header")
            return "png"

        elif ext in {"jpg", "jpeg"}:
            if not file_bytes.startswith(FILE_SIGNATURES["jpg"][:2]):
                raise ValidationError("File has JPEG extension but lacks valid JPEG signature header")
            return "jpg"

        elif ext == "webp":
            if not (file_bytes.startswith(b"RIFF") and b"WEBP" in file_bytes[:16]):
                raise ValidationError("File has .webp extension but lacks valid WEBP signature header")
            return "webp"

        elif ext == "docx":
            if not file_bytes.startswith(FILE_SIGNATURES["docx"]):
                raise ValidationError("File has .docx extension but lacks valid ZIP/DOCX signature header")
            return "docx"

        elif ext in {"txt", "csv", "log", "json"}:
            # Text based: check for binary null bytes
            if b"\x00" in file_bytes[:1024]:
                raise ValidationError("Plaintext file contains unexpected binary null bytes")
            return "txt"

        return ext or "bin"

    def extract_text_from_pdf(self, file_bytes: bytes) -> Tuple[str, int, bool]:
        """
        Extracts selectable text from PDF using pypdf (BSD licensed).
        Returns: (extracted_text, page_count, is_scanned)
        """
        import pypdf

        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        page_count = len(reader.pages)
        pages_text: List[str] = []
        total_chars = 0

        for idx, page in enumerate(reader.pages):
            p_text = page.extract_text() or ""
            clean_page_text = re.sub(r'[ \t]+', ' ', p_text).strip()
            if clean_page_text:
                pages_text.append(f"--- [Page {idx + 1}] ---\n{clean_page_text}")
                total_chars += len(clean_page_text)

        # Scanned PDF detection heuristic: if average chars per page < 15, consider it scanned
        is_scanned = (total_chars < (15 * max(1, page_count)))
        combined_text = "\n\n".join(pages_text).strip()

        # If scanned and embedded images exist, attempt OCR on page images
        if is_scanned:
            ocr_text_parts: List[str] = []
            for idx, page in enumerate(reader.pages):
                if hasattr(page, "images") and page.images:
                    for img in page.images:
                        img_text, _ = self.extract_text_from_image(img.data)
                        if img_text.strip():
                            ocr_text_parts.append(f"--- [Page {idx + 1} OCR] ---\n{img_text.strip()}")
            if ocr_text_parts:
                combined_text = "\n\n".join(ocr_text_parts).strip()
                is_scanned = False  # OCR successfully retrieved text

        return combined_text, page_count, is_scanned

    def extract_text_from_docx(self, file_bytes: bytes) -> Tuple[str, int]:
        """
        Extracts structured text and table contents from DOCX files using python-docx.
        """
        import docx

        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs: List[str] = []

        for p in doc.paragraphs:
            txt = p.text.strip()
            if txt:
                paragraphs.append(txt)

        # Extract structured tables (e.g. bank statements or charge summaries)
        for t_idx, table in enumerate(doc.tables):
            table_rows: List[str] = []
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if cells:
                    table_rows.append(" | ".join(cells))
            if table_rows:
                paragraphs.append(f"\n[Table {t_idx + 1}]\n" + "\n".join(table_rows))

        combined_text = "\n\n".join(paragraphs).strip()
        # Page count estimation for DOCX based on ~3000 chars per standard page
        est_pages = max(1, (len(combined_text) // 2500) + 1)
        return combined_text, est_pages

    def extract_text_from_image(self, file_bytes: bytes) -> Tuple[str, bool]:
        """
        Extracts visible text from images (PNG, JPG, WEBP) using pytesseract & Pillow.
        Returns: (text, ocr_success)
        """
        from PIL import Image

        try:
            image = Image.open(io.BytesIO(file_bytes))
            # Convert RGBA/Palette to RGB
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
        except Exception as e:
            logger.warning(f"Failed to open image for OCR: {e}")
            return "", False

        try:
            import pytesseract
            ocr_text = pytesseract.image_to_string(image)
            clean_text = re.sub(r'[ \t]+', ' ', ocr_text).strip()
            return clean_text, True
        except Exception as e:
            logger.info(f"Pytesseract OCR unavailable or failed: {e}. OCR required on host.")
            return "", False

    def extract_text_from_plaintext(self, file_bytes: bytes) -> str:
        """Decodes UTF-8 / Latin-1 plain text files."""
        for enc in ("utf-8", "latin-1", "cp1252"):
            try:
                return file_bytes.decode(enc)
            except UnicodeDecodeError:
                continue
        return file_bytes.decode("utf-8", errors="replace")

    async def process_evidence(
        self,
        db: AsyncSession,
        evidence_id: str
    ) -> DocumentProcessingResult:
        """
        Executes full end-to-end document processing pipeline:
        1. Validation
        2. Format Identification
        3. Text Extraction (pypdf / docx / OCR / text)
        4. Local PII Redaction
        5. Deterministic Cyber Entity Extraction + Database Persistence
        6. Gemini Contextual Intelligence (with offline fallback)
        7. Audit Record & Status Persistence
        """
        start_time = time.time()

        # 1. Fetch Evidence record
        q = select(Evidence).where(Evidence.id == evidence_id)
        res = await db.execute(q)
        evidence = res.scalars().first()
        if not evidence:
            raise NotFoundError(f"Evidence {evidence_id} not found")

        # 2. Retrieve file bytes from private storage vault
        file_bytes = await storage_service.get_file(evidence.storage_key)
        if not file_bytes:
            raise NotFoundError(f"Evidence payload not found in storage vault for key {evidence.storage_key}")

        # Check existing result or create new
        existing_q = select(DocumentProcessingResult).where(DocumentProcessingResult.evidence_id == evidence.id)
        existing_res = await db.execute(existing_q)
        result = existing_res.scalars().first()

        if not result:
            result = DocumentProcessingResult(
                evidence_id=evidence.id,
                complaint_id=evidence.complaint_id,
                case_id=evidence.case_id,
                processing_status="PROCESSING"
            )
            db.add(result)
            await db.flush()
        else:
            result.processing_status = "PROCESSING"
            result.error_message = None

        extracted_text = ""
        detected_format = "UNKNOWN"
        page_count = 1
        ocr_applied = False
        ocr_engine = None
        is_scanned_pdf = False

        try:
            # 3. Validate content signature
            detected_format = self.validate_file_content(file_bytes, evidence.original_filename)

            # 4. Extract content by detected type
            if detected_format == "pdf":
                extracted_text, page_count, is_scanned_pdf = self.extract_text_from_pdf(file_bytes)
                if is_scanned_pdf and not extracted_text:
                    detected_format = "SCANNED_PDF"
                    result.processing_status = "OCR_REQUIRED"
                    ocr_applied = False
                else:
                    detected_format = "TEXT_PDF"
                    ocr_applied = False

            elif detected_format == "docx":
                extracted_text, page_count = self.extract_text_from_docx(file_bytes)
                detected_format = "DOCX"

            elif detected_format in {"png", "jpg", "webp"}:
                ocr_text, ocr_ok = self.extract_text_from_image(file_bytes)
                if ocr_ok and ocr_text:
                    extracted_text = ocr_text
                    ocr_applied = True
                    ocr_engine = "PYTESSERACT_OCR"
                    detected_format = "IMAGE_SCREENSHOT"
                else:
                    detected_format = "IMAGE_SCREENSHOT"
                    result.processing_status = "OCR_REQUIRED" if not ocr_ok else "PARTIALLY_COMPLETED"
                    ocr_applied = ocr_ok
                    ocr_engine = "PYTESSERACT_OCR" if ocr_ok else None

            elif detected_format == "txt":
                extracted_text = self.extract_text_from_plaintext(file_bytes)
                detected_format = "PLAINTEXT"
                page_count = 1

            else:
                detected_format = "UNSUPPORTED"
                result.processing_status = "FAILED"
                result.error_message = f"Unsupported evidence document format '.{detected_format}'"

        except Exception as e:
            logger.error(f"Error extracting text from evidence {evidence.id}: {e}", exc_info=True)
            result.processing_status = "FAILED"
            result.error_message = f"Extraction failed: {str(e)}"
            result.processing_duration_ms = round((time.time() - start_time) * 1000, 2)
            await db.commit()
            return result

        # 5. Clean text & Local PII Redaction
        redacted_text, pii_counts = pii_redactor.redact(extracted_text)

        # 6. Extract deterministic cyber entities & link provenance
        raw_entities = cyber_entity_extractor.extract(extracted_text, source_type="DOCUMENT")
        
        # Clear previous cyber entities from this document if re-processing
        await db.execute(
            delete(CyberEntity).where(
                CyberEntity.source_id == evidence.id,
                CyberEntity.source_type == "DOCUMENT"
            )
        )

        persisted_entities_data = []
        for ent in raw_entities:
            cyber_ent = CyberEntity(
                complaint_id=evidence.complaint_id,
                case_id=evidence.case_id,
                entity_type=ent.entity_type,
                raw_value=ent.raw_value,
                normalized_value=ent.normalized_value,
                confidence=ent.confidence,
                source_type="DOCUMENT",
                source_id=evidence.id,
                extractor="DOCUMENT_PROCESSOR_V1",
                extraction_mode="RULE_BASED",
                start_offset=ent.start_offset,
                end_offset=ent.end_offset,
                occurrence_count=ent.occurrence_count,
                metadata_json={
                    **ent.metadata,
                    "filename": evidence.original_filename,
                    "sha256": evidence.sha256_hash,
                    "validation_status": "Candidate Indicator",
                    "provenance_doc_id": evidence.id
                }
            )
            db.add(cyber_ent)
            persisted_entities_data.append(ent.to_dict())

        # 7. Gemini Contextual Intelligence (invoked only with redacted text)
        gemini_result = await gemini_document_service.analyze_document(
            redacted_text=redacted_text,
            detected_format=detected_format,
            filename=evidence.original_filename,
            deterministic_entities=persisted_entities_data
        )

        # 8. Determine final processing status
        if result.processing_status != "FAILED" and result.processing_status != "OCR_REQUIRED":
            if extracted_text and extracted_text.strip():
                result.processing_status = "COMPLETED"
            elif is_scanned_pdf:
                result.processing_status = "OCR_REQUIRED"
            else:
                result.processing_status = "PARTIALLY_COMPLETED"

        result.detected_format = detected_format
        result.page_count = page_count
        result.character_count = len(extracted_text)
        result.ocr_applied = ocr_applied
        result.ocr_engine = ocr_engine
        result.extracted_text = extracted_text
        result.redacted_text = redacted_text
        result.gemini_summary = gemini_result.get("summary")
        result.gemini_analysis_json = gemini_result.get("analysis", {})
        result.gemini_status = gemini_result.get("status", "NOT_ATTEMPTED")
        result.processing_duration_ms = round((time.time() - start_time) * 1000, 2)

        await db.commit()
        await db.refresh(result)
        logger.info(
            f"Document processing completed for evidence {evidence.id} ({detected_format}): "
            f"{len(persisted_entities_data)} entities, status={result.processing_status}"
        )
        return result


document_processor = DocumentProcessorService()
