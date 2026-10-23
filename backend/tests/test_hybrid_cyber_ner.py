import pytest
import os
from pathlib import Path
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.model_config import (
    CYBER_NER_PATH,
    CYBER_NER_WEIGHTS,
    CYBER_NER_CONFIG,
    CYBER_NER_METADATA,
    CYBER_NER_METRICS,
    load_model_metadata,
    load_model_metrics
)
from app.ai.adapters.cyber_ner_transformer import cyber_ner_transformer, CyberNERTransformer
from app.ai.extractors.hybrid_entity_extractor import hybrid_entity_extractor, HybridEntityExtractor
from app.services.entity_service import entity_service
from app.models.complaint import Complaint
from app.models.case import Case
from app.models.cyber_entity import CyberEntity
from app.models.role import RoleEnum
from app.ai.model_manager import model_manager


# -----------------------------------------------------------------------------
# 1. ARTIFACT & OFFLINE RELOAD VERIFICATION (PHASE 1 & 2)
# -----------------------------------------------------------------------------

def test_cyber_ner_artifacts_exist():
    """Verify all expected model files exist in local enclave directory."""
    assert CYBER_NER_PATH.is_dir(), f"Missing directory: {CYBER_NER_PATH}"
    assert CYBER_NER_CONFIG.is_file(), f"Missing config: {CYBER_NER_CONFIG}"
    assert CYBER_NER_WEIGHTS.is_file(), f"Missing weights: {CYBER_NER_WEIGHTS}"
    assert CYBER_NER_METADATA.is_file(), f"Missing metadata: {CYBER_NER_METADATA}"
    assert CYBER_NER_METRICS.is_file(), f"Missing metrics: {CYBER_NER_METRICS}"

    # Verify no NaN or nulls in metrics
    metrics = load_model_metrics("cyber_ner")
    assert metrics["accuracy"] is not None
    assert metrics["f1_score"] is not None
    assert metrics["precision"] is not None
    assert metrics["recall"] is not None
    assert metrics["validation_f1"] > 0.80
    assert metrics["heldout_test_f1"] > 0.50
    assert "challenge_f1" in metrics


def test_cyber_ner_offline_local_reload():
    """Verify model and tokenizer reload locally without internet on CPU."""
    assert cyber_ner_transformer.is_available() is True
    loaded = cyber_ner_transformer.load()
    assert loaded is True
    assert cyber_ner_transformer._is_loaded is True
    assert cyber_ner_transformer._model is not None
    assert cyber_ner_transformer._tokenizer is not None
    assert cyber_ner_transformer.extractor_name == "DEBERTA_CYBER_NER_V4"

    meta = cyber_ner_transformer.get_metadata()
    assert meta.get("base_model") == "microsoft/deberta-v3-base"
    assert meta.get("task") == "token-classification"


# -----------------------------------------------------------------------------
# 2. CRITICAL ENTITY TEST CASES (PHASE 20)
# -----------------------------------------------------------------------------

def test_critical_case_1_rahul_transaction():
    """
    Test 1: 'Rahul transferred ₹50,000 to fraud@oksbi after receiving a WhatsApp call from +91 98765 43210.'
    Expected: PERSON_NAME, AMOUNT, UPI_ID, PLATFORM_NAME, PHONE_NUMBER
    """
    text = "Rahul transferred ₹50,000 to fraud@oksbi after receiving a WhatsApp call from +91 98765 43210."
    entities = hybrid_entity_extractor.extract(text)
    types_found = {e.entity_type for e in entities}

    assert "PERSON_NAME" in types_found
    assert "AMOUNT" in types_found
    assert "UPI_ID" in types_found
    assert "PLATFORM_NAME" in types_found
    assert "PHONE_NUMBER" in types_found

    # Verify normalization
    phone = next(e for e in entities if e.entity_type == "PHONE_NUMBER")
    assert phone.normalized_value == "+919876543210"
    assert phone.source == "HYBRID_MERGED"

    upi = next(e for e in entities if e.entity_type == "UPI_ID")
    assert upi.normalized_value == "fraud@oksbi"
    assert upi.source == "HYBRID_MERGED"

    amount = next(e for e in entities if e.entity_type == "AMOUNT")
    assert "50,000" in amount.raw_value

    person = next(e for e in entities if e.entity_type == "PERSON_NAME")
    assert person.raw_value == "Rahul"
    assert person.source == "TRANSFORMER"


def test_critical_case_2_state_bank_of_india():
    """
    Test 2: 'The caller claimed to represent State Bank of India.'
    Expected: BANK_NAME
    """
    text = "The caller claimed to represent State Bank of India."
    entities = hybrid_entity_extractor.extract(text)
    types_found = {e.entity_type for e in entities}

    assert "BANK_NAME" in types_found
    bank = next(e for e in entities if e.entity_type == "BANK_NAME")
    assert "State Bank of India" in bank.raw_value
    assert bank.source == "TRANSFORMER"


def test_critical_case_3_securepay_priya_telegram():
    """
    Test 3: 'SecurePay Solutions contacted Priya on Telegram.'
    Expected: ORGANIZATION, PERSON_NAME, PLATFORM_NAME
    """
    text = "SecurePay Solutions contacted Priya on Telegram."
    entities = hybrid_entity_extractor.extract(text)
    types_found = {e.entity_type for e in entities}

    assert "ORGANIZATION" in types_found
    assert "PERSON_NAME" in types_found
    assert "PLATFORM_NAME" in types_found

    org = next(e for e in entities if e.entity_type == "ORGANIZATION")
    assert "SecurePay" in org.raw_value

    person = next(e for e in entities if e.entity_type == "PERSON_NAME")
    assert person.raw_value == "Priya"

    platform = next(e for e in entities if e.entity_type == "PLATFORM_NAME")
    assert platform.raw_value == "Telegram"


def test_critical_case_4_url_and_domain():
    """
    Test 4: 'Visit https://fake-bank.com and email help@fake-bank.org.'
    Expected deterministic: URL, DOMAIN, EMAIL_ADDRESS
    """
    text = "Visit https://fake-bank.com and email help@fake-bank.org."
    entities = hybrid_entity_extractor.extract(text)
    types_found = {e.entity_type for e in entities}

    assert "URL" in types_found
    assert "DOMAIN" in types_found
    assert "EMAIL_ADDRESS" in types_found

    url_ent = next(e for e in entities if e.entity_type == "URL")
    assert url_ent.source == "DETERMINISTIC"
    assert url_ent.deterministic_validated is True


def test_critical_case_5_hash_ip_ifsc():
    """
    Test 5: Structured technical entities:
    Expected deterministic: FILE_HASH, IP_ADDRESS, IFSC_CODE
    """
    text = "Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 IP: 192.168.1.10 IFSC: SBIN0004819"
    entities = hybrid_entity_extractor.extract(text)
    types_found = {e.entity_type for e in entities}

    assert "FILE_HASH" in types_found
    assert "IP_ADDRESS" in types_found
    assert "IFSC_CODE" in types_found

    for ent in entities:
        assert ent.deterministic_validated is True
        assert ent.source == "DETERMINISTIC"


def test_critical_case_6_conversational_negative():
    """
    Test 6: 'Good afternoon team, the architecture review is tomorrow.'
    Expected: 0 cyber entities
    """
    text = "Good afternoon team, the architecture review is tomorrow."
    entities = hybrid_entity_extractor.extract(text)
    assert len(entities) == 0


# -----------------------------------------------------------------------------
# 3. CONFLICT RESOLUTION & OVERLAP TESTS (PHASE 21)
# -----------------------------------------------------------------------------

def test_conflict_same_upi_and_phone():
    """Verify both deterministic and transformer detecting same entity merges to single record."""
    text = "Transfer to fraud@paytm or call +91 98765 43210 immediately."
    entities = hybrid_entity_extractor.extract(text)

    upis = [e for e in entities if e.entity_type == "UPI_ID"]
    phones = [e for e in entities if e.entity_type == "PHONE_NUMBER"]

    assert len(upis) == 1
    assert len(phones) == 1
    assert upis[0].source == "HYBRID_MERGED"
    assert phones[0].source == "HYBRID_MERGED"
    assert upis[0].deterministic_validated is True
    assert phones[0].deterministic_validated is True


def test_conflict_structured_authority_wins():
    """Verify deterministic structured entities (e.g. EMAIL) win over conflicting contextual spans."""
    text = "Contact victim at security-alerts@icici-update.org for refunds."
    entities = hybrid_entity_extractor.extract(text)

    # EMAIL_ADDRESS should be present and authoritative
    email_ents = [e for e in entities if e.entity_type == "EMAIL_ADDRESS"]
    assert len(email_ents) == 1
    assert email_ents[0].deterministic_validated is True


# -----------------------------------------------------------------------------
# 4. FAILURE MODE & RESILIENCE TESTS (PHASE 22)
# -----------------------------------------------------------------------------

def test_failure_empty_and_whitespace():
    assert hybrid_entity_extractor.extract("") == []
    assert hybrid_entity_extractor.extract("   \n\t  ") == []


def test_failure_very_long_narrative():
    """Narratives exceeding max_length (256 tokens) should execute without crashing."""
    long_narrative = "The suspect called from +91 98765 43210. " * 60
    entities = hybrid_entity_extractor.extract(long_narrative)
    assert len(entities) > 0
    phone = next(e for e in entities if e.entity_type == "PHONE_NUMBER")
    assert phone.occurrence_count >= 1


def test_failure_unicode_and_currency():
    """Verify Indian currency symbols (₹) and unicode characters handle cleanly."""
    text = "Demanded ₹1,25,000 via UPI suspect@oksbi with emoji 🚨."
    entities = hybrid_entity_extractor.extract(text)
    assert any(e.entity_type == "UPI_ID" for e in entities)
    assert any(e.entity_type == "AMOUNT" for e in entities)


def test_failure_degraded_mode_on_missing_model():
    """When transformer directory is invalid, extractor gracefully degrades to RULES_ONLY_DEGRADED."""
    custom_extractor = HybridEntityExtractor(
        transformer_engine=CyberNERTransformer(model_dir=Path("/non/existent/path"))
    )
    assert custom_extractor.mode == "RULES_ONLY_DEGRADED"
    assert custom_extractor.is_transformer_available is False

    # Deterministic extraction still succeeds!
    res = custom_extractor.extract("Send to fraud@oksbi and call +91 98765 43210")
    assert len(res) >= 2
    for r in res:
        assert r.extraction_mode == "RULES_ONLY_DEGRADED"


# -----------------------------------------------------------------------------
# 5. DATABASE PERSISTENCE & ON-DEMAND RE-EXTRACTION
# -----------------------------------------------------------------------------

@pytest.fixture
def specialist_token() -> str:
    from app.core.security import create_access_token
    # a.thorne@astraea.gov has role CYBERSECURITY_SPECIALIST, seeded in conftest
    from app.models.role import RoleEnum
    return create_access_token({
        "sub": "user-specialist-seed-id",
        "email": "a.thorne@astraea.gov",
        "role": RoleEnum.CYBERSECURITY_SPECIALIST.value
    })


@pytest.fixture
def citizen_token() -> str:
    from app.core.security import create_access_token
    from app.models.role import RoleEnum
    return create_access_token({
        "sub": "user-citizen-seed-id",
        "email": "elena.rostova@cyberdefense.org",
        "role": RoleEnum.CITIZEN.value
    })


@pytest.fixture
def ai_lead_token() -> str:
    from app.core.security import create_access_token
    from app.models.role import RoleEnum
    return create_access_token({
        "sub": "user-ai-seed-id",
        "email": "m.vance@ai-ops.gov",
        "role": RoleEnum.AI_ML_SYSTEM_LEAD.value
    })


@pytest.mark.asyncio
async def test_entity_service_extract_and_persist(db_session: AsyncSession):
    """Test extracting and persisting entities with complaint and case linkages."""
    import uuid
    complaint = Complaint(
        reference_number=f"CC-TEST-{uuid.uuid4().hex[:8]}",
        title="Phishing Call Incident",
        category="Financial Fraud",
        citizen_name="Rahul Test",
        citizen_email="rahul.test@example.com",
        incident_date="2026-09-12 10:00 UTC",
        reported_date="2026-09-12 11:00 UTC",
        financial_loss=25000.0,
        suspect_info={},
        description="Rahul transferred ₹25,000 to scammer@oksbi after call from +91 98765 43210",
        severity="HIGH",
        status="TRIAGED"
    )
    db_session.add(complaint)
    await db_session.flush()

    persisted = await entity_service.extract_and_persist_for_complaint(
        db=db_session,
        complaint=complaint
    )
    assert len(persisted) >= 3

    # Check persistence attributes
    persisted_types = {e.entity_type for e in persisted}
    assert "UPI_ID" in persisted_types
    assert "PHONE_NUMBER" in persisted_types

    upi_rec = next(e for e in persisted if e.entity_type == "UPI_ID")
    assert upi_rec.normalized_value == "scammer@oksbi"
    assert upi_rec.extraction_mode in ["HYBRID_RULES_PLUS_TRANSFORMER", "RULES_ONLY_DEGRADED"]

    # Re-extract and verify occurrence count increment
    re_persisted = await entity_service.extract_and_persist_for_complaint(
        db=db_session,
        complaint=complaint
    )
    re_upi = next(e for e in re_persisted if e.entity_type == "UPI_ID")
    assert re_upi.occurrence_count == 2


# -----------------------------------------------------------------------------
# 6. API ENDPOINT & RBAC TESTS (PHASE 13 & 24)
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_api_entities_extract_endpoint(client: AsyncClient):
    """POST /api/v1/ai/entities/extract truthfully reports runtime mode and model metadata."""
    # Login as seeded specialist
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    payload = {
        "text": "Rahul received a call from +91 98765 43210 asking to transfer to fraud@oksbi."
    }
    resp = await client.post(
        "/api/v1/ai/entities/extract",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "SUCCESS"
    assert data["mode"] in ["HYBRID_RULES_PLUS_TRANSFORMER", "RULES_ONLY_DEGRADED"]
    assert "entities" in data
    assert len(data["entities"]) >= 2

    if data["mode"] == "HYBRID_RULES_PLUS_TRANSFORMER":
        assert data["transformer_available"] is True
        assert data["model"] == "ccip-cyber-ner-deberta-v3-base"


@pytest.mark.asyncio
async def test_api_entities_rbac_isolation(
    client: AsyncClient,
    db_session: AsyncSession
):
    """Verify strict RBAC isolation on operational entity retrieval."""
    import uuid
    # Obtain actual tokens by logging into seeded accounts
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    spec_token = spec_login.json()["access_token"]

    cit_login = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42"
    })
    cit_token = cit_login.json()["access_token"]

    ai_login = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    ai_token = ai_login.json()["access_token"]

    # Create complaint belonging to another citizen
    other_comp = Complaint(
        reference_number=f"CC-TEST-{uuid.uuid4().hex[:8]}",
        title="Other citizen incident",
        category="Financial Fraud",
        citizen_name="External Victim",
        citizen_email="external.victim@example.com",
        incident_date="2026-09-12 10:00 UTC",
        reported_date="2026-09-12 11:00 UTC",
        financial_loss=5000.0,
        suspect_info={},
        description="Scam phone +91 98765 43210",
        citizen_id="another-citizen-uuid"
    )
    db_session.add(other_comp)
    await db_session.flush()

    # Extract entities for other_comp so there is something to inspect
    await entity_service.extract_and_persist_for_complaint(db_session, other_comp)
    await db_session.commit()

    # 1. AI Lead is strictly blocked (HTTP 403) from operational complaint entities
    ai_resp = await client.get(
        f"/api/v1/complaints/{other_comp.id}/entities",
        headers={"Authorization": f"Bearer {ai_token}"}
    )
    assert ai_resp.status_code == 403

    # 2. Citizen is blocked (HTTP 403) from other citizens' complaints
    cit_resp = await client.get(
        f"/api/v1/complaints/{other_comp.id}/entities",
        headers={"Authorization": f"Bearer {cit_token}"}
    )
    assert cit_resp.status_code == 403

    # 3. Specialist is authorized (HTTP 200)
    spec_resp = await client.get(
        f"/api/v1/complaints/{other_comp.id}/entities",
        headers={"Authorization": f"Bearer {spec_token}"}
    )
    assert spec_resp.status_code == 200


# -----------------------------------------------------------------------------
# 7. MODEL MANAGER STATUS REPORTING (PHASE 14)
# -----------------------------------------------------------------------------

def test_model_manager_status_contains_cyber_ner():
    status = model_manager.get_status()
    assert "cyber_ner" in status.get("models", {})
    ner_status = status["models"]["cyber_ner"]

    assert ner_status["architecture"] == "DebertaV2ForTokenClassification"
    assert ner_status["version"] == "cyber-ner-bootstrap-v4.0.0"
    assert ner_status["available"] is True
    assert "metrics" not in ner_status or ner_status["accuracy"] > 90.0
    assert "validation_scope" in ner_status
    assert "BOOTSTRAP" in ner_status["validation_scope"]
