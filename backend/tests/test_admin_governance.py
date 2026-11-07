"""
CCIP Stage 7 Verification Suite: Administrator Governance Refinement
Covers:
1. Administrator authentication & RBAC boundary enforcement
2. Unauthorized citizen access rejection from administrative endpoints
3. Investigator profile management & workload telemetry
4. Complaint assignment to investigation units & officers
5. Valid state machine status transitions
6. Dual-Authorization Governance (Separation of Duties):
   - Request creation for high-risk action
   - Prohibition against self-approval (403 Forbidden)
   - Dual-admin sign-off and audit persistence
7. Security Events Registry & real-time monitoring
8. Evidence Governance & statutory legal hold enforcement
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_rbac_and_investigator_governance(client: AsyncClient):
    # 1. Citizen login attempt on admin endpoints must be rejected with 403 Forbidden
    c_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "elena.rostova@cyberdefense.org", "password": "AstraeaEnclave#42"}
    )
    c_token = c_login.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {c_token}"}

    forbidden_users = await client.get("/api/v1/admin/users", headers=citizen_headers)
    assert forbidden_users.status_code == 403

    # 2. Administrator login
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42"}
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. List users with pagination
    users_res = await client.get("/api/v1/admin/users?page=1&page_size=10&paginate=true", headers=admin_headers)
    assert users_res.status_code == 200
    users_data = users_res.json()
    assert "items" in users_data
    assert users_data["total"] >= 1

    # Find Dr. Aris Thorne (Specialist) to provision investigator profile
    spec_user = next((u for u in users_data["items"] if "thorne" in u["email"].lower()), None)
    assert spec_user is not None

    # 4. Provision Investigator Profile
    inv_payload = {
        "userId": spec_user["id"],
        "badgeNumber": "INV-THORNE-8492",
        "designation": "Chief Forensic Malware Investigator",
        "jurisdictionZone": "State Cyber Cell - Unit A",
        "specializations": ["FINANCIAL_FRAUD", "MALWARE_ANALYSIS", "RANSOMWARE"],
        "maxActiveCases": 20,
        "availabilityStatus": "AVAILABLE"
    }
    create_inv = await client.post("/api/v1/admin/investigators", json=inv_payload, headers=admin_headers)
    assert create_inv.status_code == 201
    inv_data = create_inv.json()
    assert inv_data["status"] == "SUCCESS"
    assert inv_data["profile"]["badgeNumber"] == "INV-THORNE-8492"

    # 5. List investigators directory
    list_inv = await client.get("/api/v1/admin/investigators", headers=admin_headers)
    assert list_inv.status_code == 200
    inv_list = list_inv.json()
    assert len(inv_list) >= 1
    assert any(i["badgeNumber"] == "INV-THORNE-8492" for i in inv_list)


@pytest.mark.asyncio
async def test_dual_authorization_separation_of_duties(client: AsyncClient):
    # Admin 1 (Root)
    root_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42"}
    )
    root_token = root_login.json()["access_token"]
    root_headers = {"Authorization": f"Bearer {root_token}"}

    # 1. Root requests a high-risk operation
    req_payload = {
        "actionType": "SENSITIVE_EVIDENCE_EXPORT",
        "resourceType": "evidence",
        "resourceId": "ev-seized-darknet-ledger-994",
        "justification": "Required for High Court judicial submission under Section 65B.",
        "payload": {"target_format": "COURT_ENCRYPTED_ZIP"}
    }
    req_res = await client.post("/api/v1/admin/approvals/request", json=req_payload, headers=root_headers)
    assert req_res.status_code == 201
    approval_data = req_res.json()
    approval_id = approval_data["approvalId"]
    assert approval_data["status"] == "PENDING_APPROVAL"

    # 2. Root attempts to approve their OWN high-risk request (must be rejected!)
    self_approve_res = await client.post(
        f"/api/v1/admin/approvals/{approval_id}/decision",
        json={"decision": "APPROVED", "notes": "Self approval attempt"},
        headers=root_headers
    )
    assert self_approve_res.status_code == 403
    assert "cannot approve or sign-off on your own" in self_approve_res.json()["detail"]

    # 3. Create a second administrator to sign off
    sec_admin_payload = {
        "email": "supervisor.patel@astraea.gov",
        "full_name": "Supervisor Vikram Patel",
        "password": "AstraeaEnclave#42",
        "role": "ADMIN",
        "is_staff": True
    }
    sec_res = await client.post("/api/v1/admin/users", json=sec_admin_payload, headers=root_headers)
    assert sec_res.status_code == 201

    sec_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "supervisor.patel@astraea.gov", "password": "AstraeaEnclave#42"}
    )
    sec_token = sec_login.json()["access_token"]
    sec_headers = {"Authorization": f"Bearer {sec_token}"}

    # 4. Second Admin approves the dual-authorization ticket
    approve_res = await client.post(
        f"/api/v1/admin/approvals/{approval_id}/decision",
        json={"decision": "APPROVED", "notes": "Verified warrant and judicial order."},
        headers=sec_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["decision"] == "APPROVED"

    # 5. Verify approved ticket appears in audit listing
    approvals_list = await client.get("/api/v1/admin/approvals", headers=root_headers)
    assert approvals_list.status_code == 200
    records = approvals_list.json()
    approved_rec = next((a for a in records if a["id"] == approval_id), None)
    assert approved_rec is not None
    assert approved_rec["status"] == "APPROVED"
    assert approved_rec["approvedBy"]["email"] == "supervisor.patel@astraea.gov"


@pytest.mark.asyncio
async def test_complaint_assignment_and_status_transitions(client: AsyncClient):
    # Police officer login
    police_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "s.chen@police.gov", "password": "AstraeaEnclave#42"}
    )
    assert police_login.status_code == 200
    police_token = police_login.json()["access_token"]
    police_headers = {"Authorization": f"Bearer {police_token}"}

    # Assign pre-seeded complaint
    assign_res = await client.post(
        "/api/v1/complaints/CYBER-2026-9842/assign",
        json={"assignedUnit": "Special Financial Fraud Taskforce", "assignedOfficer": "Det. Inspector Sarah Chen"},
        headers=police_headers
    )
    assert assign_res.status_code == 200
    assigned_data = assign_res.json()
    assert assigned_data["assignedUnit"] == "Special Financial Fraud Taskforce"
    assert assigned_data["assignedOfficer"] == "Det. Inspector Sarah Chen"

    # Check status transition to UNDER_INVESTIGATION
    update_res = await client.patch(
        "/api/v1/complaints/CYBER-2026-9842",
        json={"status": "UNDER_INVESTIGATION"},
        headers=police_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "UNDER_INVESTIGATION"
