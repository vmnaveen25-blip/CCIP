"""
Admin Knowledge Materials API for CCIP Enclave.
Authoritative endpoints for uploading, managing, vectorizing,
and provisioning documents used by the CCIP AI Assistant.
"""

from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    Form,
    BackgroundTasks,
    status
)
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.core.permissions import require_admin
from app.core.logging import logger
from app.services.knowledge_materials_service import knowledge_materials_service

router = APIRouter(prefix="/admin/knowledge-materials", tags=["Admin Knowledge Materials"])


class ChatbotStatusUpdatePayload(BaseModel):
    chatbot_status: str  # 'AVAILABLE' or 'DISABLED'


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_knowledge_material(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    category: str = Form("General Awareness"),
    description: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Uploads a knowledge document (.pdf, .docx, .txt, .md),
    verifies SHA-256 integrity, and initiates background RAG vector indexing.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum 25 MB limit.")

    try:
        material = await knowledge_materials_service.register_and_store_document(
            db=db,
            file_bytes=file_bytes,
            original_filename=file.filename,
            title=title or file.filename,
            category=category,
            uploaded_by=admin.full_name or admin.email
        )

        # Trigger background processing (text extraction, chunking, embeddings)
        background_tasks.add_task(
            knowledge_materials_service.process_document,
            material.id
        )

        return {
            "status": "SUCCESS",
            "message": f"Document '{material.title}' registered. Processing in background.",
            "document": {
                "id": material.id,
                "title": material.title,
                "file_type": material.file_type,
                "size_bytes": material.file_size_bytes,
                "category": material.category,
                "processing_status": material.processing_status,
                "chatbot_status": material.chatbot_status
            }
        }
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"[KM API] Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {str(e)}")


@router.get("")
async def list_knowledge_materials(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Returns paginated knowledge materials and authoritative platform statistics."""
    return await knowledge_materials_service.list_materials(
        db=db,
        search=search,
        category=category,
        page=page,
        page_size=page_size
    )


@router.get("/{material_id}")
async def get_knowledge_material_details(
    material_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Returns detailed metadata and chunk status for one knowledge material."""
    material = await knowledge_materials_service.get_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Knowledge material not found.")

    return {
        "id": material.id,
        "title": material.title,
        "original_filename": material.original_filename,
        "file_type": material.file_type,
        "file_size_bytes": material.file_size_bytes,
        "file_hash": material.file_hash,
        "category": material.category,
        "uploaded_by": material.uploaded_by,
        "uploaded_at": material.uploaded_at.isoformat() if material.uploaded_at else None,
        "processing_status": material.processing_status,
        "chatbot_status": material.chatbot_status,
        "chunks_count": material.chunks_count,
        "error_message": material.error_message
    }


@router.get("/{material_id}/preview")
async def preview_knowledge_material(
    material_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Returns safe preview text passages and chunk metadata for an authorized administrator."""
    preview = await knowledge_materials_service.get_material_preview(db, material_id)
    if not preview:
        raise HTTPException(status_code=404, detail="Knowledge material not found.")
    return preview


@router.get("/{material_id}/download")
async def download_knowledge_material(
    material_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Streams the authorized original knowledge document file."""
    material = await knowledge_materials_service.get_material(db, material_id)
    if not material or not Path(material.storage_path).is_file():
        raise HTTPException(status_code=404, detail="Material file not found.")

    return FileResponse(
        path=material.storage_path,
        filename=material.original_filename,
        media_type="application/octet-stream"
    )


@router.patch("/{material_id}/chatbot-status")
async def update_chatbot_status(
    material_id: str,
    payload: ChatbotStatusUpdatePayload,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Enables or disables material availability for the public citizen chatbot."""
    updated = await knowledge_materials_service.toggle_chatbot_status(
        db=db,
        material_id=material_id,
        new_status=payload.chatbot_status
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Knowledge material not found.")

    return {
        "status": "SUCCESS",
        "material_id": updated.id,
        "chatbot_status": updated.chatbot_status
    }


@router.post("/{material_id}/reindex")
async def reindex_knowledge_material(
    material_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Forces re-extraction and re-vectorization of a knowledge document."""
    material = await knowledge_materials_service.get_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Knowledge material not found.")

    material.processing_status = "PROCESSING"
    await db.commit()

    background_tasks.add_task(
        knowledge_materials_service.process_document,
        material.id
    )
    return {"status": "SUCCESS", "message": f"Re-indexing initiated for '{material.title}'."}


@router.delete("/{material_id}")
async def delete_knowledge_material(
    material_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Permanently purges document and cascades removal of all associated vector chunks."""
    deleted = await knowledge_materials_service.delete_material(db, material_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Knowledge material not found.")
    return {"status": "SUCCESS", "message": "Knowledge material permanently deleted."}
