from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime

from app.services.task_service import task_service
from app.core.permissions import get_current_user
from app.models.user import User

router = APIRouter(prefix="/tasks", tags=["Background Tasks"])


class TaskStatusResponse(BaseModel):
    id: str
    task_name: str
    task_type: str
    status: str
    progress_percentage: float
    result: Optional[dict] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


from app.db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession


@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Query execution status and output of a background processing task."""
    task = await task_service.get_task_status(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskStatusResponse(
        id=task.id,
        task_name=task.task_name,
        task_type=task.task_type,
        status=task.status,
        progress_percentage=task.progress_percentage,
        result=task.result,
        error_message=task.error_message,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at
    )
