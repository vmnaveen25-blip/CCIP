import pytest
import io
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.role import RoleEnum
from app.core.security import create_access_token


from sqlalchemy import select
from app.models.user import User


@pytest.mark.asyncio
async def test_knowledge_materials_lifecycle(client, db_session):
    """Test full lifecycle: list, upload, get detail, toggle status, and delete."""
    admin_q = await db_session.execute(select(User).where(User.email == "root@astraea.internal"))
    admin_user = admin_q.scalars().first()
    admin_token = create_access_token({"sub": admin_user.id, "role": RoleEnum.ADMIN.value, "email": admin_user.email})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. List materials
    resp = await client.get("/api/v1/admin/knowledge-materials", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total_items" in data

    # 2. Upload test document
    test_file_content = b"%PDF-1.4 sample cybersecurity standard operating procedure"
    files = {
        "file": ("test_sop.pdf", io.BytesIO(test_file_content), "application/pdf")
    }
    form_data = {
        "title": "Automated Test SOP",
        "category": "Standard Operating Procedures",
        "description": "Test procedure for automated verification"
    }
    upload_resp = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        files=files,
        data=form_data
    )
    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    assert upload_data["status"] == "SUCCESS"
    doc = upload_data["document"]
    doc_id = doc["id"]

    # 3. Retrieve metadata
    detail_resp = await client.get(f"/api/v1/admin/knowledge-materials/{doc_id}", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["title"] == "Automated Test SOP"

    # 4. Toggle chatbot availability status to DISABLED
    toggle_resp = await client.patch(
        f"/api/v1/admin/knowledge-materials/{doc_id}/chatbot-status",
        headers=headers,
        json={"chatbot_status": "DISABLED"}
    )
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["chatbot_status"] == "DISABLED"

    # 5. Delete material and verify cascade
    del_resp = await client.delete(f"/api/v1/admin/knowledge-materials/{doc_id}", headers=headers)
    assert del_resp.status_code == 200

    # Verify 404 after deletion
    check_resp = await client.get(f"/api/v1/admin/knowledge-materials/{doc_id}", headers=headers)
    assert check_resp.status_code == 404
