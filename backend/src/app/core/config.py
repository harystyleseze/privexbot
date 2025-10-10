"""
Configuration settings loaded from environment variables.

PSEUDOCODE:
-----------
class Settings:
    # Database
    - DATABASE_URL: str (PostgreSQL connection string)

    # Redis
    - REDIS_URL: str (Redis connection for nonce caching)

    # JWT/Security
    - SECRET_KEY: str (for JWT token signing, must be strong random string)
    - ALGORITHM: str (default: "HS256")
    - ACCESS_TOKEN_EXPIRE_MINUTES: int (default: 30)

    # CORS
    - BACKEND_CORS_ORIGINS: list[str] (allowed origins for CORS)

    # App Settings
    - PROJECT_NAME: str (default: "PrivexBot")
    - API_V1_PREFIX: str (default: "/api/v1")

    # Wallet Auth Settings
    - NONCE_EXPIRE_SECONDS: int (default: 300, 5 minutes)

    # Load from .env file using pydantic-settings BaseSettings
    # Use environment variables with validation

# Create single settings instance to be imported
settings = Settings()
"""

# ACTUAL IMPLEMENTATION
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App Settings
    PROJECT_NAME: str = "PrivexBot"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = Field(
        default="postgresql://privexbot:privexbot_dev@localhost:5432/privexbot_dev",
        description="PostgreSQL connection string"
    )

    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection for caching and sessions"
    )

    # JWT/Security
    SECRET_KEY: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key for JWT token signing"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        description="Comma-separated list of allowed origins"
    )

    # Wallet Auth Settings
    NONCE_EXPIRE_SECONDS: int = 300  # 5 minutes

    # Celery
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/1",
        description="Celery broker URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/2",
        description="Celery result backend URL"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]


# Create single settings instance to be imported
settings = Settings()
