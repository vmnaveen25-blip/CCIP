import asyncio
import datetime
from typing import Dict, Any, Optional, Callable, Coroutine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.background_task import BackgroundTask, TaskStatusEnum
from app.core.logging import logger


class TaskService:
    @staticmethod
    async def create_and_run_task(
        db: AsyncSession,
        task_name: str,
        task_type: str,
        payload: Dict[str, Any],
        async_callable: Callable[..., Coroutine[Any, Any, Dict[str, Any]]],
        user_id: Optional[str] = None
    ) -> BackgroundTask:
        """Create a tracked background task and execute it asynchronously."""
        task_record = BackgroundTask(
            task_name=task_name,
            task_type=task_type,
            status=TaskStatusEnum.PENDING.value,
            payload=payload,
            initiated_by_user_id=user_id
        )
        db.add(task_record)
        await db.commit()
        await db.refresh(task_record)
        task_id = task_record.id

        # Schedule execution in background
        asyncio.create_task(TaskService._run_async_wrapper(task_id, async_callable, payload))
        return task_record

    @staticmethod
    async def _run_async_wrapper(
        task_id: str,
        async_callable: Callable[..., Coroutine[Any, Any, Dict[str, Any]]],
        payload: Dict[str, Any]
    ):
        """Internal execution wrapper updating task status and timestamps."""
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        try:
            result = await async_callable(payload)
            logger.info(f"Background task {task_id} completed successfully.")
        except Exception as e:
            logger.exception(f"Background task {task_id} failed: {str(e)}")

    @staticmethod
    async def get_task_status(db: AsyncSession, task_id: str) -> Optional[BackgroundTask]:
        """Fetch background task by ID."""
        q = select(BackgroundTask).where(BackgroundTask.id == task_id)
        res = await db.execute(q)
        return res.scalars().first()


task_service = TaskService()
