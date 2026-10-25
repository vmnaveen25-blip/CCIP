import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AnyHttpUrl, field_validator, model_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    APP_NAME: str = "AI Cybercrime Intelligence Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./ccip.db"
    SYNC_DATABASE_URL: str = "sqlite:///./ccip.db"

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Security & JWT
    JWT_SECRET_KEY: str = "dev_insecure_jwt_secret_key_change_in_production_98421048"
    JWT_REFRESH_SECRET_KEY: str = "dev_insecure_jwt_refresh_secret_key_change_in_production_71048492"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Demo Seeding Control
    ALLOW_DEMO_SEEDING: bool = False

    # Malware Scanning Engine
    MALWARE_SCANNER_TYPE: str = "development"  # "development", "clamav"
    CLAMAV_HOST: str = "localhost"
    CLAMAV_PORT: int = 3310

    # Frontend URL for OAuth redirects
    FRONTEND_URL: str = "http://localhost:5173"

    # Google OAuth2
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # OTP
    OTP_PROVIDER: str = "development"
    OTP_COOLDOWN_SECONDS: int = 60
    OTP_EXPIRE_SECONDS: int = 300
    OTP_MAX_ATTEMPTS: int = 5
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # Storage
    STORAGE_BACKEND: str = "local"  # "local", "minio", "gcs"
    STORAGE_LOCAL_DIR: str = "./storage_vault"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "ccip-evidence-vault"
    MINIO_SECURE: bool = False

    # GCS
    GCS_PROJECT_ID: Optional[str] = None
    GCS_BUCKET: Optional[str] = None

    # AI Assistant & LLM Engine
    AI_ASSISTANT_API_KEY: Optional[str] = "astraea-sovereign-enclave-v2"
    GEMINI_API_KEY: Optional[str] = None
    AI_ASSISTANT_MODEL: str = "gemini-flash-lite-latest"

    # Generative Investigation Copilot (Local Sovereign LLM Runtime)
    INVESTIGATION_LLM_PROVIDER: str = "local"
    INVESTIGATION_LLM_BASE_URL: str = "http://127.0.0.1:11434"
    INVESTIGATION_LLM_MODEL: str = "qwen2.5:7b"
    INVESTIGATION_LLM_TEMPERATURE: float = 0.2
    INVESTIGATION_LLM_MAX_TOKENS: int = 2048
    INVESTIGATION_LLM_TIMEOUT: float = 60.0

    # Cyber NER Transformer Settings
    CYBER_NER_CONFIDENCE_THRESHOLD: float = 0.70

    @property
    def ai_api_key(self) -> Optional[str]:
        return (
            self.AI_ASSISTANT_API_KEY
            or self.GEMINI_API_KEY
            or os.environ.get("AI_ASSISTANT_API_KEY")
            or os.environ.get("GEMINI_API_KEY")
        )

    @property
    def is_production(self) -> bool:
        return (self.APP_ENV or "").strip().lower() in ("production", "prod")

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.is_production:
            if self.DEBUG:
                raise ValueError("Security violation: DEBUG cannot be enabled in production environment.")

            insecure_jwt_defaults = {
                "dev_insecure_jwt_secret_key_change_in_production_98421048",
                "prod_sovereign_enclave_jwt_key_98421048_production",
                "secret",
                "changeme",
                "jwt_secret",
                "password"
            }
            insecure_refresh_defaults = {
                "dev_insecure_jwt_refresh_secret_key_change_in_production_71048492",
                "prod_sovereign_enclave_refresh_key_71048492_production",
                "secret",
                "changeme",
                "jwt_refresh_secret",
                "password"
            }
            has_insecure_word = any(w in (self.JWT_SECRET_KEY or "").lower() for w in ("insecure", "changeme", "default", "change-in-production", "change_in_production"))
            if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY in insecure_jwt_defaults or len(self.JWT_SECRET_KEY) < 32 or has_insecure_word:
                raise ValueError(
                    "Production configuration error: JWT_SECRET_KEY cannot use default/insecure value in production and must be at least 32 characters."
                )
            has_refresh_insecure_word = any(w in (self.JWT_REFRESH_SECRET_KEY or "").lower() for w in ("insecure", "changeme", "default", "change-in-production", "change_in_production"))
            if not self.JWT_REFRESH_SECRET_KEY or self.JWT_REFRESH_SECRET_KEY in insecure_refresh_defaults or len(self.JWT_REFRESH_SECRET_KEY) < 32 or has_refresh_insecure_word:
                raise ValueError(
                    "Production configuration error: JWT_REFRESH_SECRET_KEY cannot use default/insecure value in production and must be at least 32 characters."
                )
            if self.JWT_SECRET_KEY == self.JWT_REFRESH_SECRET_KEY:
                raise ValueError(
                    "Production configuration error: JWT_SECRET_KEY and JWT_REFRESH_SECRET_KEY must be distinct and independent secrets."
                )

            if self.STORAGE_BACKEND == "minio":
                if self.MINIO_SECRET_KEY in ("minioadmin", "minioadmin_secure_vault", "password", ""):
                    raise ValueError(
                        "Production configuration error: MINIO_SECRET_KEY cannot use default or insecure credentials in production."
                    )

            if "postgres:postgres_enclave_secure@" in self.DATABASE_URL or "postgres:postgres@" in self.DATABASE_URL:
                raise ValueError(
                    "Production configuration error: DATABASE_URL cannot contain default database credentials in production."
                )

        return self


settings = Settings()
