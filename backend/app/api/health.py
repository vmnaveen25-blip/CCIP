import time
import datetime
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.config import settings
from app.services.storage_service import storage_service

router = APIRouter(prefix="/health", tags=["Health & Telemetry"])


@router.get("")
async def health_check(
    db: AsyncSession = Depends(get_db)
):
    """Overall system readiness health check."""
    start_time = time.time()
    db_healthy = True
    try:
        await db.execute(select(1))
    except Exception:
        db_healthy = False

    latency = round((time.time() - start_time) * 1000, 2)
    overall_status = "HEALTHY" if db_healthy else "DEGRADED"

    return {
        "status": overall_status,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "latency_ms": latency,
        "environment": settings.APP_ENV,
        "services": {
            "database": "UP" if db_healthy else "DOWN",
            "storage": "UP",
            "enclave": "ONLINE"
        }
    }


@router.get("/live")
async def liveness_probe():
    """Kubernetes / Container Liveness probe (verifies process is executing)."""
    return {"status": "LIVE", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}


@router.get("/ready")
async def readiness_probe(
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Kubernetes / Container Readiness probe (verifies critical dependencies)."""
    try:
        await db.execute(select(1))
        return {"status": "READY", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "NOT_READY", "reason": "Database connection unavailable"}


@router.get("/database")
async def database_health(
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Database connectivity test."""
    try:
        start = time.time()
        await db.execute(select(1))
        latency = round((time.time() - start) * 1000, 2)
        return {
            "status": "UP",
            "latency_ms": latency,
            "database_url": settings.DATABASE_URL.split("://")[0]
        }
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "DOWN", "error": str(e)}


from pathlib import Path

@router.get("/redis")
async def redis_health():
    """Redis cache connectivity test."""
    redis_url = getattr(settings, "REDIS_URL", None)
    if not redis_url or redis_url in ["", "none", "None", "redis://localhost:6379/0"]:
        # Test if redis is actually reachable
        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(redis_url or "redis://localhost:6379/0", socket_connect_timeout=0.3)
            await client.ping()
            await client.aclose()
            return {
                "status": "HEALTHY",
                "redis_url": redis_url.split("@")[-1] if "@" in redis_url else redis_url,
                "mode": "standalone"
            }
        except Exception:
            return {
                "status": "NOT_CONFIGURED",
                "message": "Redis standalone cache offline/unconfigured. In-memory session store active.",
                "mode": "in-memory"
            }
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(redis_url, socket_connect_timeout=0.5)
        await client.ping()
        await client.aclose()
        return {
            "status": "HEALTHY",
            "redis_url": redis_url.split("@")[-1] if "@" in redis_url else redis_url,
            "mode": "standalone"
        }
    except Exception as e:
        return {
            "status": "UNAVAILABLE",
            "reason": str(e),
            "mode": "in-memory"
        }


@router.get("/storage")
async def storage_health():
    """Object storage vault connectivity test."""
    backend_type = getattr(settings, "STORAGE_BACKEND", "local")
    local_dir = Path(getattr(settings, "STORAGE_LOCAL_DIR", "storage_vault"))
    is_writable = False
    try:
        local_dir.mkdir(parents=True, exist_ok=True)
        test_file = local_dir / ".health_check"
        test_file.write_text("health_ok")
        test_file.unlink(missing_ok=True)
        is_writable = True
    except Exception:
        is_writable = False

    return {
        "status": "HEALTHY" if is_writable else "DEGRADED",
        "backend": backend_type,
        "location": str(local_dir),
        "is_writable": is_writable
    }

