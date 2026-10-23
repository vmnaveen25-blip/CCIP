from typing import Any, Dict, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
import uuid


class CCIPException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.code = code
        self.message = message
        self.details = details or {}


class AuthenticationError(CCIPException):
    def __init__(self, message: str = "Invalid authentication credentials", code: str = "AUTH_ERROR"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            message=message,
            headers={"WWW-Authenticate": "Bearer"}
        )


class PermissionDeniedError(CCIPException):
    def __init__(self, message: str = "Permission denied for this operational resource", code: str = "PERMISSION_DENIED"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code=code,
            message=message
        )


class NotFoundError(CCIPException):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code=code,
            message=message
        )


class ValidationError(CCIPException):
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=422,
            code="VALIDATION_ERROR",
            message=message,
            details=details
        )


class RateLimitExceededError(CCIPException):
    def __init__(self, message: str = "Rate limit exceeded. Please retry later.", code: str = "RATE_LIMIT_EXCEEDED"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code=code,
            message=message
        )


async def ccip_exception_handler(request: Request, exc: CCIPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "request_id": request_id
            }
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred in the operational enclave.",
                "details": str(exc) if getattr(request.app.state, "debug", False) else {},
                "request_id": request_id
            }
        }
    )
