import pytest
import time
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ai.extractors.cyber_entity_extractor import cyber_entity_extractor
from app.models.complaint import Complaint
from app.models.case import Case
from app.models.cyber_entity import CyberEntity
from app.models.role import RoleEnum
from app.services.entity_service import entity_service


# ---------------------------------------------------------------------------
# 1. CORE ENGINE EXTRACTION & NORMALIZATION TESTS
# ---------------------------------------------------------------------------

def test_extractor_all_entity_types():
    sample_text = """
    On 12-Sep-2026, victim received a fraudulent WhatsApp call from +91 9876543210.
    The caller impersonated an officer and instructed payment to UPI ID cyber.fraud99@okhdfcbank.
    Victim was also coerced to wire funds to Bank Account: 91234567890123 with IFSC Code HDFC0001234.
    The caller shared a malicious phishing link: https://portal-verification.bank-update.xyz/login
    and claimed telemetry originated from IP Address 198.51.100.45.
    They demanded crypto transfer to Bitcoin wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
    and Ethereum address 0x71C7656EC7ab88b098defB751B7401B5f6d8976F.
    Victim suffered a loss of Rs. 85,000 via UTR: 2026091212345678.
    Malware file SHA256 was e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    and contacted scam-operator@secure-proton.cc.
    """

    extracted = cyber_entity_extractor.extract(sample_text)
    types_found = {e.entity_type for e in extracted}

    assert "PHONE_NUMBER" in types_found
    assert "UPI_ID" in types_found
    assert "BANK_ACCOUNT" in types_found
    assert "IFSC_CODE" in types_found
    assert "URL" in types_found
    assert "IP_ADDRESS" in types_found
    assert "CRYPTO_WALLET" in types_found
    assert "FILE_HASH" in types_found
    assert "EMAIL_ADDRESS" in types_found
    assert "AMOUNT" in types_found
    assert "UTR" in types_found or "TRANSACTION_ID" in types_found

    # Check normalization details
    phone_ent = next(e for e in extracted if e.entity_type == "PHONE_NUMBER")
    assert phone_ent.normalized_value == "+919876543210"

    upi_ent = next(e for e in extracted if e.entity_type == "UPI_ID")
    assert upi_ent.normalized_value == "cyber.fraud99@okhdfcbank"

    ifsc_ent = next(e for e in extracted if e.entity_type == "IFSC_CODE")
    assert ifsc_ent.normalized_value == "HDFC0001234"

    ip_ent = next(e for e in extracted if e.entity_type == "IP_ADDRESS")
    assert ip_ent.normalized_value == "198.51.100.45"

    eth_ent = next(e for e in extracted if e.entity_type == "CRYPTO_WALLET" and e.normalized_value.startswith("0x"))
    assert eth_ent.normalized_value.startswith("0x71c765")

    hash_ent = next(e for e in extracted if e.entity_type == "FILE_HASH")
    assert hash_ent.metadata.get("algorithm") == "SHA-256"


def test_extractor_false_positive_controls():
    # 1. Plain years should NOT be classified as bank accounts or phones
    res1 = cyber_entity_extractor.extract("The event took place in the year 2024 and completed in 2025.")
    assert not any(e.entity_type in ["BANK_ACCOUNT", "PHONE_NUMBER"] for e in res1)

    # 2. Random 10-digit number starting with 1, 2, 3, 4, 5 should NOT be Indian phone
    res2 = cyber_entity_extractor.extract("Reference serial number was 1234567890.")
    assert not any(e.entity_type == "PHONE_NUMBER" for e in res2)

    # 3. Invalid IP octets (> 255) must be rejected
    res3 = cyber_entity_extractor.extract("Server log showed error code 999.888.777.666 on port 80.")
    assert not any(e.entity_type == "IP_ADDRESS" for e in res3)

    # 4. Standard conversational text must have 0 entities
    res4 = cyber_entity_extractor.extract("Good morning officer, I would like to report a problem with my order delivery.")
    assert len(res4) == 0

    # 5. Empty or whitespace text returns empty list
    assert len(cyber_entity_extractor.extract("")) == 0
    assert len(cyber_entity_extractor.extract("   \n\t  ")) == 0


def test_deduplication_and_occurrence_counting():
    text = "Send to UPI fraud@paytm immediately. If not working, send to fraud@paytm again. Once more: fraud@paytm."
    extracted = cyber_entity_extractor.extract(text)
    upi_entities = [e for e in extracted if e.entity_type == "UPI_ID"]

    assert len(upi_entities) == 1
    assert upi_entities[0].occurrence_count == 3
    assert upi_entities[0].normalized_value == "fraud@paytm"


def test_extractor_latency_benchmark():
    benchmark_text = """
    Target suspect operating syndicate using phone +91 9123456789 and secondary +91 9988776655.
    Luring victims to http://verify-kyc-service.org/update and https://axis-secure-portal.cc/login.
    Transfer instructions: Account: 50100234567890 IFSC: UTIB0000123.
    UPI handles: target1@ybl, target2@paytm.
    Stolen sum of Rs. 4,50,000 sent to Binance wallet 0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE.
    Evidence file SHA256: d41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000.
    Server C2: 185.220.101.5:8080.
    """
    start = time.perf_counter()
    for _ in range(50):
        cyber_entity_extractor.extract(benchmark_text)
    elapsed = time.perf_counter() - start
    avg_latency_ms = (elapsed / 50.0) * 1000.0

    assert avg_latency_ms < 20.0, f"Average latency {avg_latency_ms:.2f}ms exceeds 20ms threshold"


# ---------------------------------------------------------------------------
# 2. INTEGRATION & DB PERSISTENCE TESTS
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_complaint_intake_automatically_extracts_and_persists(client: AsyncClient, db_session: AsyncSession):
    # Register citizen
    reg_resp = await client.post("/api/v1/auth/register", json={
        "name": "Entity Test Citizen",
        "email": "entity.citizen@cyber-test.org",
        "password": "EntityPassword#2026",
        "consent": True
    })
    assert reg_resp.status_code == 201
    citizen_token = reg_resp.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # File complaint with valid complaint payload schema
    comp_resp = await client.post("/api/v1/complaints", headers=citizen_headers, json={
        "title": "Crypto and UPI extortion scam",
        "category": "Online Financial Fraud",
        "severity": "HIGH",
        "incidentDate": "2026-09-12",
        "financialLoss": 50000.0,
        "description": "Scammer called from +91 9999888877 demanding Rs. 50,000 sent to victim-extort@okaxis and visited http://lure-login.top",
        "suspectInfo": {
            "phone": "+91 9999888877",
            "walletAddress": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"
        }
    })
    assert comp_resp.status_code == 201
    complaint_data = comp_resp.json()
    complaint_id = complaint_data["id"]

    # Verify entities were persisted in database
    q = select(CyberEntity).where(CyberEntity.complaint_id == complaint_id)
    res = await db_session.execute(q)
    saved_entities = res.scalars().all()

    assert len(saved_entities) > 0
    saved_types = {e.entity_type for e in saved_entities}
    assert "PHONE_NUMBER" in saved_types
    assert "UPI_ID" in saved_types
    assert "AMOUNT" in saved_types
    assert "CRYPTO_WALLET" in saved_types

    # Phone was present in both description and suspect_info -> verify occurrence count is 2
    phone_ent = next(e for e in saved_entities if e.entity_type == "PHONE_NUMBER")
    assert phone_ent.occurrence_count == 2
    # Check extraction mode and extractor
    assert phone_ent.extraction_mode in ["HYBRID_RULES_PLUS_TRANSFORMER", "HYBRID_RULE_BASED", "RULES_ONLY_DEGRADED"]
    assert phone_ent.extractor in ["HYBRID_CYBER_NER_V1", "CYBER_ENTITY_EXTRACTOR_V1"]


@pytest.mark.asyncio
async def test_direct_ai_entity_extract_endpoint(client: AsyncClient):
    # Login as specialist using seeded credentials
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42",
        "mfa_code": "000000",
        "target_role": "specialist"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    resp = await client.post(
        "/api/v1/ai/entities/extract",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "text": "Suspect domain active at https://target-phish.in and hosting C2 at 198.51.100.99"
        }
    )
    assert resp.status_code == 200
    body = resp.json()

    assert body["status"] == "SUCCESS"
    assert body["mode"] in ["HYBRID_RULES_PLUS_TRANSFORMER", "HYBRID_RULE_BASED", "RULES_ONLY_DEGRADED"]
    assert body["extractor"] in ["HYBRID_CYBER_NER_V1", "CYBER_ENTITY_EXTRACTOR_V1"]
    assert body["count"] >= 2

    types = [e["entity_type"] for e in body["entities"]]
    assert "URL" in types or "DOMAIN" in types
    assert "IP_ADDRESS" in types


# ---------------------------------------------------------------------------
# 3. RBAC & TENANT ISOLATION TESTS
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_complaint_entities_rbac_isolation(client: AsyncClient):
    # 1. Citizen 1 registers and files complaint
    c1_resp = await client.post("/api/v1/auth/register", json={
        "name": "Citizen One",
        "email": "c1.isolate@cyber-test.org",
        "password": "CitizenPassword#2026",
        "consent": True
    })
    c1_token = c1_resp.json()["access_token"]
    c1_headers = {"Authorization": f"Bearer {c1_token}"}

    comp1 = await client.post("/api/v1/complaints", headers=c1_headers, json={
        "title": "Scam complaint 1",
        "category": "Online Financial Fraud",
        "incidentDate": "2026-09-12",
        "description": "Payment sent to scam1@paytm with phone +91 9888776655"
    })
    assert comp1.status_code == 201
    comp1_id = comp1.json()["id"]

    # 2. Citizen 2 registers
    c2_resp = await client.post("/api/v1/auth/register", json={
        "name": "Citizen Two",
        "email": "c2.isolate@cyber-test.org",
        "password": "CitizenPassword#2026",
        "consent": True
    })
    c2_token = c2_resp.json()["access_token"]
    c2_headers = {"Authorization": f"Bearer {c2_token}"}

    # Citizen 1 can access own complaint entities
    resp_c1 = await client.get(f"/api/v1/complaints/{comp1_id}/entities", headers=c1_headers)
    assert resp_c1.status_code == 200
    assert len(resp_c1.json()) >= 1

    # Citizen 2 is strictly FORBIDDEN from inspecting Citizen 1's entities
    resp_c2 = await client.get(f"/api/v1/complaints/{comp1_id}/entities", headers=c2_headers)
    assert resp_c2.status_code == 403

    # 3. AI ML System Lead is forbidden from operational incident entities
    ai_login = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42",
        "mfa_code": "000000",
        "target_role": "aiml"
    })
    assert ai_login.status_code == 200
    ai_token = ai_login.json()["access_token"]
    ai_headers = {"Authorization": f"Bearer {ai_token}"}

    resp_ai = await client.get(f"/api/v1/complaints/{comp1_id}/entities", headers=ai_headers)
    assert resp_ai.status_code == 403

    # 4. Specialist and Police have authorized operational access
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42",
        "mfa_code": "000000",
        "target_role": "specialist"
    })
    assert spec_login.status_code == 200
    spec_token = spec_login.json()["access_token"]
    spec_headers = {"Authorization": f"Bearer {spec_token}"}

    resp_spec = await client.get(f"/api/v1/complaints/{comp1_id}/entities", headers=spec_headers)
    assert resp_spec.status_code == 200
    assert len(resp_spec.json()) >= 1


@pytest.mark.asyncio
async def test_case_entities_and_on_demand_reextraction(client: AsyncClient):
    # Register and file complaint
    c_resp = await client.post("/api/v1/auth/register", json={
        "name": "Case Re-extract Citizen",
        "email": "case.reextract@cyber-test.org",
        "password": "CitizenPassword#2026",
        "consent": True
    })
    c_token = c_resp.json()["access_token"]

    comp = await client.post("/api/v1/complaints", headers={"Authorization": f"Bearer {c_token}"}, json={
        "title": "On demand extraction case",
        "category": "Identity Theft",
        "incidentDate": "2026-09-12",
        "description": "Suspect phone: +91 9777665544 and receiver UPI: demand@oksbi"
    })
    assert comp.status_code == 201
    comp_id = comp.json()["id"]

    # Login as Specialist
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42",
        "mfa_code": "000000",
        "target_role": "specialist"
    })
    assert spec_login.status_code == 200
    spec_token = spec_login.json()["access_token"]
    spec_headers = {"Authorization": f"Bearer {spec_token}"}

    # On-demand re-extraction by specialist
    reextract_resp = await client.post(f"/api/v1/complaints/{comp_id}/extract-entities", headers=spec_headers)
    assert reextract_resp.status_code == 200
    reextracted = reextract_resp.json()
    assert len(reextracted) >= 1

    # Create official case from complaint
    # First transition to TRIAGED
    await client.post(
        f"/api/v1/specialist/cases/{comp_id}/triage-action",
        headers=spec_headers,
        json={
            "action": "ACCEPT",
            "category": "Identity Theft",
            "confidence": 0.95,
            "notes": "Verified suspect phone and UPI identifiers."
        }
    )
    case_create_resp = await client.post(f"/api/v1/cases/from-complaint/{comp_id}", headers=spec_headers)
    assert case_create_resp.status_code == 200
    case_id = case_create_resp.json()["id"]

    # Specialist retrieves case entities
    case_ents_resp = await client.get(f"/api/v1/cases/{case_id}/entities", headers=spec_headers)
    assert case_ents_resp.status_code == 200
    case_ents = case_ents_resp.json()
    assert len(case_ents) >= 1

    # Citizen cannot access case entities route (strictly staff controlled)
    cit_case_ents = await client.get(f"/api/v1/cases/{case_id}/entities", headers={"Authorization": f"Bearer {c_token}"})
    assert cit_case_ents.status_code == 403

    # Citizen cannot trigger re-extraction -> 403 Forbidden
    c_reextract_resp = await client.post(f"/api/v1/complaints/{comp_id}/extract-entities", headers={"Authorization": f"Bearer {c_token}"})
    assert c_reextract_resp.status_code == 403
