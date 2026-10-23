import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import CCIPException, ccip_exception_handler, generic_exception_handler
from app.db.database import async_engine
from app.db.base import Base

# Routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.complaints import router as complaints_router
from app.api.cases import router as cases_router
from app.api.evidence import router as evidence_router
from app.api.investigations import router as investigations_router
from app.api.intelligence import router as intelligence_router
from app.api.notifications import router as notifications_router
from app.api.reports import router as reports_router
from app.api.police import router as police_router
from app.api.specialist import router as specialist_router
from app.api.admin import router as admin_router
from app.api.mlops import router as mlops_router
from app.api.health import router as health_router
from app.api.tasks import router as tasks_router
from app.api.websocket import router as websocket_router
from app.api.ai_verification import router as ai_verification_router
from app.api.dashboard_summaries import router as dashboard_summaries_router
from app.api.entities import router as entities_router
from app.api.citizen_ai import router as citizen_ai_router
from app.api.citizen_timeline import router as citizen_timeline_router
from app.api.intelligence_v2 import router as intelligence_v2_router
from app.api.pilot import router as pilot_router
from app.api.investigation_chat import router as investigation_chat_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    logger.info("Initializing CCIP Enclave database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("CCIP Database tables initialized.")
    yield
    # Shutdown
    logger.info("Shutting down CCIP Enclave backend...")
    await async_engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Production-Ready Sovereign Backend for the Citizen Cybercrime Intelligence Platform (CCIP)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Content-SHA256", "X-Integrity-Status"]
)


# Request ID, Security Headers, and Structured Logging Middleware
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    # Security Headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    duration_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms) [ID: {request_id[:8]}]")
    return response


# Exception Handlers
@app.exception_handler(CCIPException)
async def handle_ccip_exception(request: Request, exc: CCIPException):
    return await ccip_exception_handler(request, exc)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    formatted_errors = []
    for err in exc.errors():
        err_copy = dict(err)
        if "ctx" in err_copy and isinstance(err_copy["ctx"], dict):
            err_copy["ctx"] = {k: str(v) if isinstance(v, Exception) else v for k, v in err_copy["ctx"].items()}
        formatted_errors.append(err_copy)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request payload validation failed",
                "details": formatted_errors,
                "request_id": request_id
            }
        }
    )


@app.exception_handler(Exception)
async def handle_generic_exception(request: Request, exc: Exception):
    logger.exception(f"Unhandled enclave exception: {str(exc)}")
    return await generic_exception_handler(request, exc)


# Include All Routers under /api/v1
api_v1_prefix = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(users_router, prefix=api_v1_prefix)
app.include_router(complaints_router, prefix=api_v1_prefix)
app.include_router(cases_router, prefix=api_v1_prefix)
app.include_router(evidence_router, prefix=api_v1_prefix)
app.include_router(investigations_router, prefix=api_v1_prefix)
app.include_router(intelligence_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)
app.include_router(reports_router, prefix=api_v1_prefix)
app.include_router(police_router, prefix=api_v1_prefix)
app.include_router(specialist_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)
app.include_router(mlops_router, prefix=api_v1_prefix)
app.include_router(tasks_router, prefix=api_v1_prefix)
app.include_router(health_router, prefix=api_v1_prefix)
app.include_router(websocket_router, prefix=api_v1_prefix)
app.include_router(ai_verification_router, prefix=api_v1_prefix)
app.include_router(dashboard_summaries_router, prefix=api_v1_prefix)
app.include_router(entities_router, prefix=api_v1_prefix)
app.include_router(citizen_ai_router, prefix=api_v1_prefix)
app.include_router(citizen_timeline_router, prefix=api_v1_prefix)
app.include_router(intelligence_v2_router, prefix=api_v1_prefix)
app.include_router(pilot_router, prefix=api_v1_prefix)
app.include_router(investigation_chat_router, prefix=api_v1_prefix)



@app.get("/")
async def root():
    return {
        "service": "AI Cybercrime Intelligence Platform API",
        "version": "1.0.0",
        "status": "ONLINE",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health & Telemetry"])
async def top_level_health():
    return {
        "status": "healthy",
        "service": "ccip-backend"
    }

