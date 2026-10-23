import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_full_canonical_case_workflow_lifecycle(client: AsyncClient):
    """
    Tests the canonical workflow chain:
    Citizen creates complaint (SUBMITTED) ->
    Specialist reviews & runs AI advisory triage (TRIAGED) ->
    Idempotent Case creation (CASE_CREATED) ->
    Police assigns investigator (ASSIGNED) ->
    Police starts investigation (UNDER_INVESTIGATION) ->
    Specialist records forensic finding (EVIDENCE_VERIFIED) ->
    Police executes field action (LAW_ENFORCEMENT_DISPATCHED) ->
    Police resolves case (RESOLVED) ->
    Police closes case (CLOSED).
    """
    # 1. Citizen login & complaint creation
    cit_login = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42"
    })
    assert cit_login.status_code == 200
    cit_token = cit_login.json()["access_token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    comp_resp = await client.post("/api/v1/complaints", headers=cit_headers, json={
        "title": "Unauthorized Crypto Exfiltration",
        "category": "Crypto Scam",
        "severity": "CRITICAL",
        "incidentDate": "2026-09-12",
        "financialLoss": 45000.0,
        "description": "Victim received fraudulent smart contract authorization request leading to wallet drain.",
        "citizenName": "Elena Rostova",
        "citizenEmail": "elena.rostova@cyberdefense.org",
        "citizenPhone": "+91-9876543210"
    })
    assert comp_resp.status_code == 201
    comp_data = comp_resp.json()
    complaint_id = comp_data["id"]
    ref_number = comp_data["referenceNumber"]
    assert comp_data["status"] == "SUBMITTED"

    # 2. Specialist login
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert spec_login.status_code == 200
    spec_token = spec_login.json()["access_token"]
    spec_headers = {"Authorization": f"Bearer {spec_token}"}

    # Specialist performs human-in-the-loop AI triage action
    triage_action_resp = await client.post(
        f"/api/v1/specialist/cases/{complaint_id}/triage-action",
        headers=spec_headers,
        json={
            "action": "ACCEPT",
            "category": "Crypto Scam",
            "confidence": 0.94,
            "notes": "DeBERTa prediction verified by Dr. Aris Thorne. Wallet drain signature detected.",
            "model_version": "DeBERTa-v3-Cyber-v1"
        }
    )
    assert triage_action_resp.status_code == 200
    assert triage_action_resp.json()["new_status"] == "TRIAGED"

    # 3. Create/activate official case idempotently
    case_resp = await client.post(f"/api/v1/cases/from-complaint/{complaint_id}", headers=spec_headers)
    assert case_resp.status_code == 200
    case_data = case_resp.json()
    case_id = case_data["id"]
    assert case_data["status"] == "CASE_CREATED"

    # Test idempotency: Calling again should return the exact same case without creating duplicates
    case_repeat_resp = await client.post(f"/api/v1/cases/from-complaint/{complaint_id}", headers=spec_headers)
    assert case_repeat_resp.status_code == 200
    assert case_repeat_resp.json()["id"] == case_id

    # 4. Police login
    pol_login = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    assert pol_login.status_code == 200
    pol_token = pol_login.json()["access_token"]
    pol_headers = {"Authorization": f"Bearer {pol_token}"}

    # Police assigns officer
    assign_resp = await client.post(f"/api/v1/cases/{case_id}/assign", headers=pol_headers, json={
        "notes": "Lead investigator assigned to execute exchange freeze subpoena."
    })
    assert assign_resp.status_code == 200

    # Verify status changed to ASSIGNED
    case_check = await client.get(f"/api/v1/cases/{case_id}", headers=pol_headers)
    assert case_check.status_code == 200
    assert case_check.json()["status"] == "ASSIGNED"

    # 5. Police starts official investigation
    start_inv_resp = await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={
        "status": "UNDER_INVESTIGATION",
        "reason": "Official criminal inquiry docket registered."
    })
    assert start_inv_resp.status_code == 200

    # 6. Specialist verifies technical evidence
    evidence_resp = await client.patch(f"/api/v1/cases/{case_id}/status", headers=spec_headers, json={
        "status": "EVIDENCE_VERIFIED",
        "reason": "Blockchain peel-chain forensic report authenticated with SHA-256 seal."
    })
    assert evidence_resp.status_code == 200

    # 7. Police dispatches law enforcement action
    dispatch_resp = await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={
        "status": "LAW_ENFORCEMENT_DISPATCHED",
        "reason": "Emergency digital asset freeze served to exchange compliance unit."
    })
    assert dispatch_resp.status_code == 200

    # 8. Police resolves case
    resolve_resp = await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={
        "status": "RESOLVED",
        "reason": "Victim crypto assets frozen and returned under statutory restitution order."
    })
    assert resolve_resp.status_code == 200

    # 9. Police closes and archives case
    close_resp = await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={
        "status": "CLOSED",
        "reason": "Final evidentiary dossier sealed and archived."
    })
    assert close_resp.status_code == 200

    # 10. Citizen verifies final resolution & complete timeline
    cit_track = await client.get(f"/api/v1/complaints/track/{ref_number}")
    assert cit_track.status_code == 200
    cit_case_data = cit_track.json()
    assert cit_case_data["status"] == "CLOSED"
    assert len(cit_case_data["timeline"]) >= 4

@pytest.mark.asyncio
async def test_invalid_status_transitions_protection(client: AsyncClient):
    """Verifies that unauthorized or invalid state transitions return clear 4xx errors."""
    # 1. Citizen cannot arbitrarily close or resolve a complaint
    cit_login = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42"
    })
    cit_token = cit_login.json()["access_token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    comp = await client.post("/api/v1/complaints", headers=cit_headers, json={
        "title": "Phishing Email",
        "category": "Phishing / Social Eng",
        "severity": "LOW",
        "incidentDate": "2026-09-12",
        "description": "Suspicious credential harvesting email received."
    })
    comp_id = comp.json()["id"]

    # Citizen tries to set RESOLVED directly
    bad_cit_patch = await client.patch(f"/api/v1/complaints/{comp_id}", headers=cit_headers, json={
        "status": "RESOLVED"
    })
    assert bad_cit_patch.status_code in (400, 403, 422)

    # 2. Specialist cannot directly close or resolve a police case
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    spec_token = spec_login.json()["access_token"]
    spec_headers = {"Authorization": f"Bearer {spec_token}"}

    case_res = await client.post(f"/api/v1/cases/from-complaint/{comp_id}", headers=spec_headers)
    case_id = case_res.json()["id"]

    bad_spec_patch = await client.patch(f"/api/v1/cases/{case_id}/status", headers=spec_headers, json={
        "status": "RESOLVED",
        "reason": "Specialist attempting unauthorized case closure."
    })
    assert bad_spec_patch.status_code in (400, 403, 422)

    # 3. AI Lead is strictly read-only on operational cases
    ai_login = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    ai_token = ai_login.json()["access_token"]
    ai_headers = {"Authorization": f"Bearer {ai_token}"}

    bad_ai_patch = await client.patch(f"/api/v1/cases/{case_id}/status", headers=ai_headers, json={
        "status": "UNDER_INVESTIGATION"
    })
    assert bad_ai_patch.status_code in (400, 403, 422)

    # 4. Forbidden reverse transition: CLOSED -> UNDER_REVIEW must fail for police
    pol_login = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    pol_token = pol_login.json()["access_token"]
    pol_headers = {"Authorization": f"Bearer {pol_token}"}

    # Advance to closed
    await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={"status": "UNDER_INVESTIGATION"})
    await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={"status": "RESOLVED"})
    await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={"status": "CLOSED"})

    # Try invalid reverse transition
    bad_reverse = await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={
        "status": "UNDER_REVIEW",
        "reason": "Illegal transition back to review."
    })
    assert bad_reverse.status_code in (400, 403, 422)


@pytest.mark.asyncio
async def test_exact_transition_graph_and_reopen_policy(client: AsyncClient):
    """
    Exhaustively tests role-based state machine boundaries, removed bypass paths,
    and the audited administrative reopen procedure.
    """
    # 1. Citizen tests:
    cit_login = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42"
    })
    cit_headers = {"Authorization": f"Bearer {cit_login.json()['access_token']}"}

    # Draft creation
    draft_res = await client.post("/api/v1/complaints", headers=cit_headers, json={
        "title": "Draft complaint for cancel test",
        "category": "Financial Fraud",
        "severity": "LOW",
        "incidentDate": "2026-09-12",
        "description": "Draft incident notes.",
        "isDraft": True
    })
    assert draft_res.status_code == 201
    draft_id = draft_res.json()["id"]
    assert draft_res.json()["status"] == "DRAFT"

    # Citizen cannot use police CLOSED semantics on draft
    closed_draft = await client.patch(f"/api/v1/complaints/{draft_id}", headers=cit_headers, json={
        "status": "CLOSED"
    })
    assert closed_draft.status_code in (400, 403, 422)

    # Citizen can CANCEL draft
    cancel_draft = await client.patch(f"/api/v1/complaints/{draft_id}", headers=cit_headers, json={
        "status": "CANCELLED"
    })
    assert cancel_draft.status_code == 200
    assert cancel_draft.json()["status"] == "CANCELLED"

    # Create submitted complaint
    sub_res = await client.post("/api/v1/complaints", headers=cit_headers, json={
        "title": "Submitted complaint for bypass testing",
        "category": "Financial Fraud",
        "severity": "MEDIUM",
        "incidentDate": "2026-09-12",
        "description": "Submitted incident notes."
    })
    assert sub_res.status_code == 201
    sub_id = sub_res.json()["id"]
    assert sub_res.json()["status"] == "SUBMITTED"

    # Citizen cannot close submitted complaint
    cit_close_sub = await client.patch(f"/api/v1/complaints/{sub_id}", headers=cit_headers, json={
        "status": "CLOSED"
    })
    assert cit_close_sub.status_code in (400, 403, 422)

    # 2. Staff logins:
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    spec_headers = {"Authorization": f"Bearer {spec_login.json()['access_token']}"}

    pol_login = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    pol_headers = {"Authorization": f"Bearer {pol_login.json()['access_token']}"}

    admin_login = await client.post("/api/v1/auth/login", json={
        "email": "root@astraea.internal",
        "password": "AstraeaEnclave#42"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # 3. Bypass test: SUBMITTED cannot jump directly to ASSIGNED or UNDER_INVESTIGATION
    spec_bypass_assign = await client.patch(f"/api/v1/complaints/{sub_id}", headers=spec_headers, json={
        "status": "ASSIGNED"
    })
    assert spec_bypass_assign.status_code in (400, 403, 422)

    spec_bypass_inv = await client.patch(f"/api/v1/complaints/{sub_id}", headers=spec_headers, json={
        "status": "UNDER_INVESTIGATION"
    })
    assert spec_bypass_inv.status_code in (400, 403, 422)

    # 4. Canonical Specialist flow: SUBMITTED -> UNDER_REVIEW -> VALIDATED
    spec_review = await client.patch(f"/api/v1/complaints/{sub_id}", headers=spec_headers, json={
        "status": "UNDER_REVIEW"
    })
    assert spec_review.status_code == 200
    assert spec_review.json()["status"] == "UNDER_REVIEW"

    spec_val = await client.patch(f"/api/v1/complaints/{sub_id}", headers=spec_headers, json={
        "status": "VALIDATED"
    })
    assert spec_val.status_code == 200
    assert spec_val.json()["status"] == "VALIDATED"

    # Specialist cannot set RESOLVED or CLOSED
    spec_resolve = await client.patch(f"/api/v1/complaints/{sub_id}", headers=spec_headers, json={
        "status": "RESOLVED"
    })
    assert spec_resolve.status_code in (400, 403, 422)

    spec_close = await client.patch(f"/api/v1/complaints/{sub_id}", headers=spec_headers, json={
        "status": "CLOSED"
    })
    assert spec_close.status_code in (400, 403, 422)

    # 5. Create Case docket from validated complaint
    case_res = await client.post(f"/api/v1/cases/from-complaint/{sub_id}", headers=spec_headers)
    assert case_res.status_code == 200
    case_id = case_res.json()["id"]
    assert case_res.json()["status"] == "CASE_CREATED"

    # 6. Police flow: CASE_CREATED -> ASSIGNED -> UNDER_INVESTIGATION -> RESOLVED -> CLOSED
    pol_assign = await client.post(f"/api/v1/cases/{case_id}/assign", headers=pol_headers, json={
        "notes": "Assigned for forensic execution"
    })
    assert pol_assign.status_code == 200

    pol_inv = await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={
        "status": "UNDER_INVESTIGATION"
    })
    assert pol_inv.status_code == 200

    pol_resolve = await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={
        "status": "RESOLVED"
    })
    assert pol_resolve.status_code == 200

    pol_close = await client.patch(f"/api/v1/cases/{case_id}/status", headers=pol_headers, json={
        "status": "CLOSED"
    })
    assert pol_close.status_code == 200

    # 7. Closed Case Reopening Policy:
    # Standard PATCH to reopen CLOSED case must fail for everyone (even admin)
    bad_patch_reopen = await client.patch(f"/api/v1/cases/{case_id}/status", headers=admin_headers, json={
        "status": "UNDER_INVESTIGATION",
        "reason": "Direct patch reopen attempt"
    })
    assert bad_patch_reopen.status_code in (400, 422)

    # Non-admin cannot call POST /cases/{id}/reopen
    pol_reopen = await client.post(f"/api/v1/cases/{case_id}/reopen", headers=pol_headers, json={
        "reason": "Police attempting reopen without admin credentials"
    })
    assert pol_reopen.status_code == 403

    # Admin call without adequate reason fails
    admin_no_reason = await client.post(f"/api/v1/cases/{case_id}/reopen", headers=admin_headers, json={
        "reason": ""
    })
    assert admin_no_reason.status_code == 400

    # Admin call with valid reason succeeds
    admin_reopen_success = await client.post(f"/api/v1/cases/{case_id}/reopen", headers=admin_headers, json={
        "reason": "New cryptographic evidence submitted by sovereign exchange partner requiring docket reactivation."
    })
    assert admin_reopen_success.status_code == 200
    assert "successfully reopened" in admin_reopen_success.json()["message"].lower()

    # Verify status is UNDER_INVESTIGATION on both Case and Complaint
    case_check = await client.get(f"/api/v1/cases/{case_id}", headers=admin_headers)
    assert case_check.status_code == 200
    assert case_check.json()["status"] == "UNDER_INVESTIGATION"
    assert case_check.json()["complaint"]["status"] == "UNDER_INVESTIGATION"
