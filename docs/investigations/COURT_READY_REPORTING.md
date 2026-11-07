# COURT-READY FORENSIC DOSSIERS & STATUTORY CERTIFICATE SPECIFICATION

**System:** CCIP (Citizen Cybercrime Intelligence Platform)  
**Classification:** RESTRICTED / JUDICIAL ADMISSIBILITY STANDARD  
**Document Ref:** FOR-CERT-008  

---

## 1. Statutory Foundations: Section 65B IEA & Section 63 BSA

Digital evidence presented in Indian judicial proceedings must comply with explicit statutory standards governing electronic records:
- **Section 65B, Indian Evidence Act, 1872** (for historical proceedings).
- **Section 63, Bharatiya Sakshya Adhiniyam (BSA), 2023** (for contemporary proceedings).

### Statutory Requirements Satisfied by CCIP:
1. **Lawful Custody & System Integrity:** The certificate confirms that the computer system was operating properly and under lawful custody throughout the acquisition and storage periods.
2. **Cryptographic Authenticity:** Every evidentiary file is cataloged with its primary bitstream digest calculated using FIPS 180-4 compliant SHA-256.
3. **Custodial Chain:** Digital evidence retention records document legal hold states, quarantine classifications, and timestamps.
4. **Attributable Signer:** The issuing officer's identity, badge number, and digital signature/seal are preserved in immutable audit records.
5. **Admissibility Disclaimer:** CCIP explicitly distinguishes between technical data integrity and legal admissibility. The dossier includes mandatory disclaimers noting that judicial admissibility remains subject to court adjudication under applicable statutory procedural codes.

---

## 2. Six-Part Evidentiary Structure (Sections A through F)

To prevent confusion between raw evidence, automated suggestions, and investigator conclusions, CCIP enforces a strict 6-part schema:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CCIP COURT FORENSIC DOSSIER                          │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION A: FACTS DIRECTLY SUPPORTED BY ORIGINAL EVIDENCE               │
│ • FIR Statements, bank transaction IDs, packet captures, file digests  │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION B: INVESTIGATOR OBSERVATIONS                                   │
│ • Physical interviews, inspection logs, investigative timeline notes   │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION C: EXTERNAL THREAT INTELLIGENCE                                │
│ • Upstream feeds (CERT-In, OTX, MISP), threat actor attributions, TTPs │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION D: AUTOMATED OR AI-GENERATED ANALYTICAL FINDINGS               │
│ • NER entity extractions, cosine case similarities, triage urgency     │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION E: UNVERIFIED HYPOTHESES                                       │
│ • Preliminary investigative theories requiring further subpoena/warrant│
├────────────────────────────────────────────────────────────────────────┤
│ SECTION F: FORMAL INVESTIGATOR CONCLUSIONS                             │
│ • Definitive investigative findings, statutory notices issued, status  │
├────────────────────────────────────────────────────────────────────────┤
│ SCHEDULE OF DIGITAL EVIDENCE (SHA-256 BITSTREAM INVENTORY)             │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 65B IEA / SECTION 63 BSA CERTIFICATE & DIGITAL SEAL            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cryptographic Report Digest & Immutability

When a report is generated:
1. The canonical JSON payload is constructed and sorted alphabetically by key (`json.dumps(payload, sort_keys=True)`).
2. A cryptographic SHA-256 hash of the canonical bytes is computed:
   $$\text{Report Digest} = \text{SHA-256}(\text{Canonical Payload JSON Bytes})$$
3. The resulting 64-character hexadecimal digest is embedded in the document header and stored in `investigation_report_versions.sha256_digest`.
4. Any post-sealing alteration of a single character in the dossier invalidates the cryptographic seal.

---

## 4. Native ReportLab PDF Generation

PDF generation is performed natively via `court_dossier_service.render_pdf_dossier()` using Python's `reportlab` library:
- **Header:** Sovereign CCIP banner, case metadata table, report code, and SHA-256 integrity seal.
- **Section A Table:** Factual statements mapped to source evidence references.
- **Evidence Schedule Table:** Filenames, byte sizes, full 64-character SHA-256 digests, and legal hold status.
- **Section 65B/63 Schedule:** Boxed statutory certificate clause signed by the investigating officer.
- **MIME & Response:** Streamed directly over HTTP via `GET /api/v1/reports/court-dossier/{case_id}/pdf` with headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="Court_Dossier_...pdf"`
  - `X-Report-SHA256: <64-hex-digest>`
  - `X-Statutory-Act: Section 65B IEA / Section 63 BSA`

