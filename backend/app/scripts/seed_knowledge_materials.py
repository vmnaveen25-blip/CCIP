"""
Seed script to populate initial authoritative CCIP Knowledge Materials,
generate legitimate PDF/DOCX files, extract text, chunk, and index
embeddings for RAG retrieval.
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

import asyncio
import docx
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io

from app.db.database import AsyncSessionLocal
from app.services.knowledge_materials_service import knowledge_materials_service
from app.models.knowledge_material import KnowledgeMaterial
from sqlalchemy import select


DOCUMENTS_TO_SEED = [
    {
        "filename": "CCIP Citizen User Guide.pdf",
        "title": "CCIP Citizen User Guide",
        "category": "Citizen Guide",
        "file_type": "PDF",
        "paragraphs": [
            "AI Cyber Crime Intelligence Platform (CCIP) - Citizen Operational Manual",
            "Section 1: Platform Overview and Mission. CCIP is India's sovereign cybercrime intelligence and incident reporting platform. It bridges citizens, law enforcement agencies, cybercrime investigation specialists, and financial institutions to provide rapid, evidence-driven resolution of digital crimes.",
            "Section 2: How to Report a Cybercrime on CCIP. Citizens can file a cybercrime report in five simple steps:",
            "Step 1: Navigate to the CCIP homepage and click 'Report Cybercrime' in the top header or main banner.",
            "Step 2: Sign in with your citizen credentials or register a new verified citizen account.",
            "Step 3: Select the appropriate crime category (Financial Fraud, Identity Theft, Phishing, Social Media Account Takeover, Cyber Harassment, or Malware Infection) and provide the incident date, time, and complete description.",
            "Step 4: Upload all supporting digital evidence including transaction receipts, SMS alerts, payment screenshot proofs, suspicious URLs, email headers, or chat logs.",
            "Step 5: Submit the complaint to obtain your cryptographically signed Case Tracking ID (e.g., CCIP-2026-001).",
            "Section 3: Status Tracking. You can track investigation progress in real time via the Status Tracker using your Case Tracking ID. Cases move through Intake Review, Evidence Forensic Triage, Technical Assignment, and Judicial Closure.",
            "Section 4: National Cybercrime Helpline 1930 Integration. For immediate financial fraud involving unauthorized bank or UPI transfers, citizens must call 1930 immediately within the golden hours to trigger automated inter-bank account freeze protocols."
        ]
    },
    {
        "filename": "UPI Fraud Awareness Guide.pdf",
        "title": "UPI Fraud Awareness Guide",
        "category": "Financial Scams",
        "file_type": "PDF",
        "paragraphs": [
            "National Advisory on Unified Payments Interface (UPI) Fraud, QR Code Deceptions, and Golden Hours Recovery",
            "Section 1: The Golden Principle of UPI Security. Remember: You NEVER need to enter your UPI PIN or scan a QR code to RECEIVE money. Entering your UPI PIN or biometric authentication will ALWAYS deduct (debit) money from your bank account. Scammers routinely exploit misunderstandings of QR codes to steal funds.",
            "Section 2: Common UPI Fraud Modus Operandi.",
            "Modus A - Marketplace and OLX QR Scams: The scammer poses as an interested buyer of second-hand goods. They claim they are paying an advance deposit and send a QR code saying 'Scan this QR to receive funds into your account'. The moment the citizen scans the code and enters their UPI PIN, funds are instantly transferred to the scammer's bank account.",
            "Modus B - Deceptive Collect Requests: The fraudster sends a 'Collect Request' via Google Pay, PhonePe, or Paytm disguised with messages like 'Approved Refund: Rs 15,000' or 'Cashback Prize'. If approved, the victim's account is debited immediately.",
            "Modus C - Screen Sharing and AnyDesk Traps: Callers impersonate bank executives or telecom agents and convince the victim to install remote screen-sharing tools like AnyDesk, TeamViewer QuickSupport, or RustDesk under the pretext of solving a pending transaction or updating KYC. They then view incoming OTPs and authorize fraudulent UPI debits.",
            "Section 3: Emergency Response Protocol - The Golden Hours.",
            "If money has been fraudulently deducted from your account, act immediately within the Golden Hours (the first 2 to 4 hours):",
            "Step 1: Immediately dial the National Cyber Financial Fraud Helpline 1930 (Toll-Free 24x7). Provide your account number, transaction UTR/reference number, and scammer details to initiate nodal bank freezing.",
            "Step 2: Log on to the Citizen Cybercrime Intelligence Platform (CCIP) or cybercrime.gov.in and file a formal financial fraud complaint.",
            "Step 3: Contact your bank's 24x7 emergency helpline to freeze your debit cards, UPI handles, and netbanking credentials."
        ]
    },
    {
        "filename": "Phishing & Fake Websites.pdf",
        "title": "Phishing & Fake Websites",
        "category": "Web Security",
        "file_type": "PDF",
        "paragraphs": [
            "Technical Advisory on Phishing Detection, Fake Banking Portals, and Malicious URL Defense",
            "Section 1: Understanding Modern Phishing Attacks. Phishing involves fraudulent communications designed to trick individuals into disclosing sensitive credentials such as usernames, passwords, credit card numbers, ATM PINs, and OTPs.",
            "Section 2: Recognizing Deceptive Lookalike Portals (Typosquatting).",
            "Attackers register domains that closely resemble trusted institutions. Examples include replacing the letter 'l' with the number '1' or adding deceptive prefixes (e.g., 'sbi-kyc-update.com' instead of 'onlinesbi.sbi'). Always inspect the full URL domain in your browser address bar.",
            "Section 3: Fake Electricity Bill and Courier Delivery Scams. A widespread tactic involves SMS or WhatsApp messages claiming 'Your electricity supply will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer at 98XXXXXX' or 'Your courier package is on hold; pay Rs 5 re-delivery fee at link'. These links lead directly to phishing capture pages.",
            "Section 4: Immediate Mitigation Steps.",
            "1. Never click on unverified links received via SMS, WhatsApp, or unsolicited emails.",
            "2. If you accidentally submitted credentials, immediately change your passwords from a separate, secure device.",
            "3. Enable Multi-Factor Authentication (MFA) across all email and banking accounts.",
            "4. Report the phishing URL directly on the CCIP platform to trigger threat intelligence automated domain takedown."
        ]
    },
    {
        "filename": "Social Media Account Safety.docx",
        "title": "Social Media Account Safety",
        "category": "Account Security",
        "file_type": "DOCX",
        "paragraphs": [
            "Comprehensive Security Guidelines for Social Media Account Protection and Impersonation Defense",
            "Section 1: Multi-Factor Authentication (MFA/2FA). Always activate two-factor authentication on Instagram, Facebook, X, and WhatsApp. Prioritize authenticator apps (Google Authenticator, Microsoft Authenticator) over SMS verification to safeguard against SIM swap attacks. Store recovery backup keys in a secure offline location.",
            "Section 2: Recognizing Account Compromise. Signs that your account has been breached include: unprompted password reset notifications, friends reporting unusual financial requests sent from your direct messages, unknown sessions appearing in account security logs, or email address modifications.",
            "Section 3: Incident Response and Account Recovery.",
            "Step 1: Use the platform's verified account recovery mechanism immediately ('Need more help?' or 'Hacked account recovery' flow).",
            "Step 2: Terminate all active sessions and revoke third-party app authorizations in your privacy settings.",
            "Step 3: Post an alert on other channels warning family and friends that your account is compromised and to ignore requests for money or gift cards.",
            "Step 4: If cyberstalking, non-consensual media distribution, or extortion is occurring, report the incident immediately on CCIP under Cyber Harassment."
        ]
    },
    {
        "filename": "Cybercrime Prevention Tips.pdf",
        "title": "Cybercrime Prevention Tips",
        "category": "General Awareness",
        "file_type": "PDF",
        "paragraphs": [
            "Statutory Cyber Hygiene, Digital Arrest Scam Advisory, and Citizen Protection Checklist",
            "Section 1: Cyber Hygiene Best Practices.",
            "1. Strong Password Management: Use passwords of at least 14 characters containing uppercase letters, lowercase letters, numbers, and symbols. Never reuse credentials across critical banking and social media accounts.",
            "2. Software and Firmware Updates: Keep operating systems, browsers, and security software updated with automatic patches to prevent exploitation of known zero-day vulnerabilities.",
            "3. Public Wi-Fi Dangers: Never conduct banking transactions or enter confidential passwords while connected to public or unencrypted Wi-Fi hotspots without an authorized VPN.",
            "Section 2: Urgent Advisory - Digital Arrest Scams.",
            "There is NO provision for 'Digital Arrest' under Indian Law or statutory criminal procedure. Scammers impersonate officers from the CBI, ED, Police, or Customs via WhatsApp and Skype video calls. They claim that an illegal parcel containing narcotics or passports was intercepted in your name, display fake official badges, and demand money transfer to 'reserve bank verification accounts' to avoid arrest.",
            "Official Notice: Police, CBI, ED, and courts NEVER conduct interrogations, trials, or arrests via video calls. They NEVER ask citizens to transfer money to verify innocence. If you receive such a call, terminate it immediately and report to Helpline 1930 and CCIP."
        ]
    }
]


def create_pdf_bytes(paragraphs: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor='#000000',
        spaceAfter=14
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        textColor='#222222',
        spaceAfter=10
    )

    story = []
    story.append(Paragraph(paragraphs[0], title_style))
    story.append(Spacer(1, 10))

    for p in paragraphs[1:]:
        story.append(Paragraph(p, body_style))
        story.append(Spacer(1, 6))

    doc.build(story)
    return buffer.getvalue()


def create_docx_bytes(paragraphs: list) -> bytes:
    doc = docx.Document()
    doc.add_heading(paragraphs[0], level=1)
    for p in paragraphs[1:]:
        doc.add_paragraph(p)
    
    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


async def seed():
    print("[Seed] Starting CCIP Knowledge Materials seeding...")
    async with AsyncSessionLocal() as session:
        for doc_info in DOCUMENTS_TO_SEED:
            # Check if already seeded
            stmt = select(KnowledgeMaterial).where(KnowledgeMaterial.title == doc_info["title"])
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if existing:
                print(f"[Seed] Material already exists: '{doc_info['title']}' (ID: {existing.id}, Chunks: {existing.chunks_count})")
                continue

            print(f"[Seed] Generating binary for '{doc_info['filename']}'...")
            if doc_info["file_type"] == "PDF":
                file_bytes = create_pdf_bytes(doc_info["paragraphs"])
            else:
                file_bytes = create_docx_bytes(doc_info["paragraphs"])

            print(f"[Seed] Registering document '{doc_info['title']}' ({len(file_bytes)} bytes)...")
            material = await knowledge_materials_service.register_and_store_document(
                db=session,
                file_bytes=file_bytes,
                original_filename=doc_info["filename"],
                title=doc_info["title"],
                category=doc_info["category"],
                uploaded_by="System Administrator (Automated Seed)"
            )

            print(f"[Seed] Processing text extraction & vector embeddings for '{material.title}'...")
            await knowledge_materials_service._run_process_document(material.id, session)
            print(f"[Seed] Successfully indexed '{material.title}' with {material.chunks_count} chunks!")

    print("[Seed] All canonical CCIP Knowledge Materials successfully seeded and vectorized.")


if __name__ == "__main__":
    asyncio.run(seed())

