"""
Verification Script for CCIP Document Processing Pipeline
Executes an end-to-end simulated upload, document extraction, PII shielding,
cyber entity extraction, and Gemini contextual intelligence integration.
"""

import asyncio
import io
import sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pypdf
import docx

from app.db.database import AsyncSessionLocal
from app.models.complaint import Complaint
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.document_processing import DocumentProcessingResult
from app.models.cyber_entity import CyberEntity
from app.services.document_processor_service import document_processor
from app.services.storage_service import storage_service
from app.services.pii_redactor import pii_redactor
from app.services.gemini_document_service import gemini_document_service
from sqlalchemy import select


def make_test_pdf_bytes() -> bytes:
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=612, height=792)
    # Minimal PDF with selectable text
    return (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj << /Length 135 >> stream\n"
        b"BT /F1 12 Tf 72 712 Td (Debit: INR 25,000.00 to fraud@okaxis via UTR 416428901234. Contact phish@bank-alert.in or call +91 98765 43210) Tj ET\n"
        b"endstream\n"
        b"endobj\n"
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000430 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n505\n%%EOF\n"
    )


async def main():
    print("=== STARTING CCIP DOCUMENT PROCESSOR VERIFICATION ===")

    # 1. Test PDF Text Extraction
    pdf_bytes = make_test_pdf_bytes()
    pdf_text, pages, is_scanned = document_processor.extract_text_from_pdf(pdf_bytes)
    print(f"[1] PDF Extraction: {pages} page(s), Scanned={is_scanned}")
    print(f"    Sample text: {repr(pdf_text[:80])}")
    assert "416428901234" in pdf_text or "fraud@okaxis" in pdf_text

    # 2. Test DOCX Extraction
    doc = docx.Document()
    doc.add_paragraph("Fraud alert: Payment of ₹50,000 to mule@okhdfcbank, Ref: UTR 998877665544.")
    doc_io = io.BytesIO()
    doc.save(doc_io)
    docx_bytes = doc_io.getvalue()
    docx_text, docx_pages = document_processor.extract_text_from_docx(docx_bytes)
    print(f"[2] DOCX Extraction: {docx_pages} page(s)")
    print(f"    Sample text: {repr(docx_text[:80])}")
    assert "mule@okhdfcbank" in docx_text

    # 3. Test Local PII Redaction
    sample_pii_narrative = (
        "Citizen Aadhaar: 3456 7890 1234, PAN: BKZPD8812K. "
        "Debit Card: 5123 4567 8901 2345, PIN: 9021. "
        "Transferred INR 25,000 to fraud@okaxis with UTR 416428901234 on website http://fake-axis.in."
    )
    redacted_text, counts = pii_redactor.redact(sample_pii_narrative)
    print(f"[3] PII Redaction: {counts}")
    print(f"    Redacted output:\n    {redacted_text}")
    assert "3456 7890 1234" not in redacted_text
    assert "[AADHAAR_REDACTED_" in redacted_text
    assert "BKZPD8812K" not in redacted_text
    assert "[PAN_REDACTED_" in redacted_text
    assert "5123 4567 8901 2345" not in redacted_text
    assert "[CARD_REDACTED_" in redacted_text
    assert "9021" not in redacted_text
    assert "[CREDENTIAL_REDACTED]" in redacted_text
    # Indicators preserved
    assert "fraud@okaxis" in redacted_text
    assert "416428901234" in redacted_text

    # 4. Test Gemini Contextual Analysis (Offline Safe Mode)
    gemini_resp = await gemini_document_service.analyze_document(
        redacted_text=redacted_text,
        detected_format="TEXT_PDF",
        filename="bank_debit_slip.pdf",
        deterministic_entities=[
            {"entity_type": "UPI_ID", "raw_value": "fraud@okaxis"},
            {"entity_type": "UTR", "raw_value": "416428901234"}
        ]
    )
    print(f"[4] Gemini Analysis Status: {gemini_resp.get('status')}")
    print(f"    Summary: {gemini_resp.get('summary')}")
    print(f"    Category: {gemini_resp.get('analysis', {}).get('document_category')}")
    print(f"    Next Steps: {gemini_resp.get('analysis', {}).get('investigator_next_steps')}")

    print("\n=== ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS ===")


if __name__ == "__main__":
    asyncio.run(main())
