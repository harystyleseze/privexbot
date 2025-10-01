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
