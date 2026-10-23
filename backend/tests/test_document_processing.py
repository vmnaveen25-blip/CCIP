"""
Unit and Integration Tests for CCIP Document Processing Pipeline
Tests:
- Native Text PDF extraction via pypdf
- Word document (.docx) parsing via python-docx
- Image handling and OCR graceful fallback
- Structured cybercrime entity extraction (URLs, Emails, Phones, UPI VPAs, UTRs, INR Amounts, Hashes)
- Local citizen PII redaction (Aadhaar, PAN, Credit Cards, Credentials)
- Corrupted and oversized file rejection
- Gemini contextual intelligence offline fallback
- Provenance tracking (source_id, offsets, confidence)
"""

import io
import sys
import os
from pathlib import Path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from unittest.mock import patch, MagicMock

import pypdf
import docx
from PIL import Image

from app.services.document_processor_service import document_processor
from app.services.pii_redactor import pii_redactor
from app.services.gemini_document_service import gemini_document_service
from app.ai.extractors.cyber_entity_extractor import cyber_entity_extractor
from app.core.exceptions import ValidationError


def create_synthetic_pdf(text_content: str) -> bytes:
    """Generates a valid, non-corrupted PDF in memory containing synthetic test text."""
    writer = pypdf.PdfWriter()
    # Add a blank page with text annotation or stream
    page = writer.add_blank_page(width=612, height=792)
    
    # We can write text to PDF via standard reportlab if available, or write a minimal PDF stream
    # With pypdf, we can use annotation or create a clean minimal PDF stream:
    pdf_bytes_io = io.BytesIO()
    # Minimal synthetic PDF format:
    pdf_raw = (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj << /Length 55 >> stream\n"
        b"BT /F1 12 Tf 72 712 Td (Evidence: Fraud transaction UTR 416428901234) Tj ET\n"
        b"endstream\n"
        b"endobj\n"
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n425\n%%EOF\n"
    )
    return pdf_raw


def create_synthetic_docx() -> bytes:
    """Generates a valid .docx document in memory with paragraphs and tables."""
    doc = docx.Document()
    doc.add_heading("Cybercrime Incident Bank Statement", level=1)
    doc.add_paragraph("Victim reported phishing link http://secure-bank-verify.in from mobile +91 98765 43210.")
    doc.add_paragraph("Fraudulent transfer of INR 45,000.00 to VPA fraud@okaxis via UTR 987654321098.")

    table = doc.add_table(rows=2, cols=3)
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Date"
    hdr_cells[1].text = "Beneficiary VPA"
    hdr_cells[2].text = "Amount"

    row_cells = table.rows[1].cells
    row_cells[0].text = "12-JUN-2026"
    row_cells[1].text = "mule@paytm"
    row_cells[2].text = "Rs. 25000"

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def create_synthetic_png() -> bytes:
    """Generates a valid PNG image in memory."""
    img = Image.new("RGB", (300, 100), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# -----------------------------------------------------------------------------
# 1. PDF Text Extraction
# -----------------------------------------------------------------------------
def test_pdf_text_extraction():
    pdf_bytes = create_synthetic_pdf("Evidence: Fraud transaction UTR 416428901234")
    text, page_count, is_scanned = document_processor.extract_text_from_pdf(pdf_bytes)
    assert page_count >= 1
    assert "416428901234" in text or "Evidence" in text


# -----------------------------------------------------------------------------
# 2. DOCX Extraction
# -----------------------------------------------------------------------------
def test_docx_text_extraction():
    docx_bytes = create_synthetic_docx()
    text, pages = document_processor.extract_text_from_docx(docx_bytes)
    assert "secure-bank-verify.in" in text
    assert "+91 98765 43210" in text
    assert "fraud@okaxis" in text
    assert "mule@paytm" in text
    assert "45,000" in text
    assert pages >= 1


# -----------------------------------------------------------------------------
# 3. Image OCR / Graceful Fallback
# -----------------------------------------------------------------------------
def test_image_ocr_handling():
    png_bytes = create_synthetic_png()
    text, success = document_processor.extract_text_from_image(png_bytes)
    # Regardless of whether tesseract binary is installed on the host, the function must not crash
    assert isinstance(text, str)
    assert isinstance(success, bool)


# -----------------------------------------------------------------------------
# 4. Structured Entity Extraction: URLs, Emails, Phones, UPI, UTR, INR Amounts
# -----------------------------------------------------------------------------
def test_cyber_entity_extraction():
    narrative = (
        "Citizen paid Rs. 25,000.00 to fraud@okaxis via UPI reference UTR 416428901234. "
        "Caller dialed from +91 98765 43210 and sent phishing site http://fake-bank-login.in/verify. "
        "Contact email was attacker@phish-domain.com and resolved IP was 185.220.101.44."
    )
    entities = cyber_entity_extractor.extract(narrative, source_type="DOCUMENT")
    
    types = {e.entity_type for e in entities}
    values = {e.normalized_value for e in entities}

    assert "UPI_ID" in types
    assert "fraud@okaxis" in values

    assert "UTR" in types
    assert "416428901234" in values

    assert "AMOUNT" in types
    assert any("25,000" in v for v in values)

    assert "PHONE_NUMBER" in types or "MOBILE" in types
    assert any("9876543210" in v for v in values)

    assert "URL" in types
    assert any("fake-bank-login.in" in v for v in values)

    assert "EMAIL_ADDRESS" in types or "EMAIL" in types
    assert "attacker@phish-domain.com" in values

    assert "IP_ADDRESS" in types
    assert "185.220.101.44" in values


# -----------------------------------------------------------------------------
# 5. Local PII Redaction
# -----------------------------------------------------------------------------
def test_pii_redactor_masks_sensitive_data():
    sensitive_text = (
        "Citizen details: Aadhaar 2345 6789 0123, PAN ABCDE1234F. "
        "Debit card 4111 2222 3333 4444. "
        "Password: mysecretpass123. "
        "Incident: Citizen transferred INR 15,000 to mule@okhdfcbank with UTR 123456789012."
    )
    redacted, counts = pii_redactor.redact(sensitive_text)

    # Citizen PII must be masked
    assert "2345 6789 0123" not in redacted
    assert "[AADHAAR_REDACTED_" in redacted
    assert counts["aadhaar"] >= 1

    assert "ABCDE1234F" not in redacted
    assert "[PAN_REDACTED_" in redacted
    assert counts["pan"] >= 1

    assert "4111 2222 3333 4444" not in redacted
    assert "[CARD_REDACTED_" in redacted
    assert counts["card"] >= 1

    assert "mysecretpass123" not in redacted
    assert "[CREDENTIAL_REDACTED]" in redacted
    assert counts["credential"] >= 1

    # Cybercrime indicators MUST be preserved for investigation
    assert "mule@okhdfcbank" in redacted
    assert "123456789012" in redacted
    assert "15,000" in redacted


# -----------------------------------------------------------------------------
# 6. Corrupted File Rejection
# -----------------------------------------------------------------------------
def test_corrupted_file_validation():
    # File claims to be PDF but contains random garbage
    fake_pdf = b"NOT_A_REAL_PDF_HEADER_JUST_RANDOM_TEXT"
    with pytest.raises(ValidationError) as exc_info:
        document_processor.validate_file_content(fake_pdf, "statement.pdf")
    assert "lacks valid PDF signature header" in str(exc_info.value)

    # Empty file
    with pytest.raises(ValidationError):
        document_processor.validate_file_content(b"", "empty.pdf")


# -----------------------------------------------------------------------------
# 7. Gemini Offline Safe Fallback
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_gemini_offline_fallback():
    # Force API key to None to simulate offline / student environment
    with patch.object(gemini_document_service, "_get_api_key", return_value=None):
        result = await gemini_document_service.analyze_document(
            redacted_text="Transferred INR 50,000 to fraud@okaxis via UTR 112233445566.",
            detected_format="DOCX",
            filename="complaint_doc.docx",
            deterministic_entities=[
                {"entity_type": "UPI_ID", "raw_value": "fraud@okaxis"},
                {"entity_type": "UTR", "raw_value": "112233445566"}
            ]
        )

        assert result["status"] == "FALLBACK_OFFLINE"
        assert "Gemini contextual AI engine is currently in local offline mode" in result["summary"]
        assert "apparent_fraud_type" in result["analysis"]
        assert len(result["analysis"]["key_findings"]) > 0
        assert len(result["analysis"]["investigator_next_steps"]) > 0


# -----------------------------------------------------------------------------
# 8. Oversized File and Unsupported Extension Validation
# -----------------------------------------------------------------------------
def test_unsupported_extension_and_size_limits():
    from app.services.evidence_service import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES

    # Check allowed extensions
    assert "pdf" in ALLOWED_EXTENSIONS
    assert "docx" in ALLOWED_EXTENSIONS
    assert "png" in ALLOWED_EXTENSIONS
    assert "jpg" in ALLOWED_EXTENSIONS
    assert "exe" not in ALLOWED_EXTENSIONS
    assert "bat" not in ALLOWED_EXTENSIONS

    # Check size limit is 50MB
    assert MAX_FILE_SIZE_BYTES == 50 * 1024 * 1024


# -----------------------------------------------------------------------------
# 9. Provenance Tracking & Source Attribution
# -----------------------------------------------------------------------------
def test_provenance_preservation():
    narrative = "Transfer to fraud@okaxis via UTR 998877665544."
    entities = cyber_entity_extractor.extract(narrative, source_type="DOCUMENT")
    assert len(entities) >= 2

    for ent in entities:
        # Every entity must have start and end offsets
        assert ent.start_offset >= 0
        assert ent.end_offset > ent.start_offset
        assert ent.confidence > 0.0
        # Substring in narrative matches raw_value
        assert narrative[ent.start_offset:ent.end_offset] == ent.raw_value



if __name__ == "__main__":
    import asyncio
    print("Running test_pdf_text_extraction...")
    test_pdf_text_extraction()
    print("PASSED: test_pdf_text_extraction")

    print("Running test_docx_text_extraction...")
    test_docx_text_extraction()
    print("PASSED: test_docx_text_extraction")

    print("Running test_image_ocr_handling...")
    test_image_ocr_handling()
    print("PASSED: test_image_ocr_handling")

    print("Running test_cyber_entity_extraction...")
    test_cyber_entity_extraction()
    print("PASSED: test_cyber_entity_extraction")

    print("Running test_pii_redactor_masks_sensitive_data...")
    test_pii_redactor_masks_sensitive_data()
    print("PASSED: test_pii_redactor_masks_sensitive_data")

    print("Running test_corrupted_file_validation...")
    test_corrupted_file_validation()
    print("PASSED: test_corrupted_file_validation")

    print("Running test_gemini_offline_fallback...")
    asyncio.run(test_gemini_offline_fallback())
    print("PASSED: test_gemini_offline_fallback")
    print("\nALL 7 DOCUMENT PROCESSING TESTS PASSED SUCCESSFULLY!")

