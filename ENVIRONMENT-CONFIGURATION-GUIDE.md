# Environment Configuration Guide

## Overview

This guide explains how to configure PrivexBot for different deployment environments (local development, staging, production, SecretVM) without needing to change code.

## The Problem

You asked: "do i need to be changing the settings? how do i ensure this works for any environments that i want to run the app?"

**Answer**: No, you should NEVER change settings in code. Instead, use environment variables for all environment-specific configuration.

## Best Practices

### 1. Use Environment Variables for ALL Environment-Specific Settings

**Current Configuration** (`backend/src/app/core/config.py`):
```python
FRONTEND_URL: str = Field(
    default="http://localhost:5173",
    description="Frontend application URL for generating invitation links"
)
```

This is **CORRECT** - it has a default for development but can be overridden via environment variables.

### 2. Create Environment-Specific .env Files

**DO NOT commit .env files to git!**

#### `.env.example` (Template - commit this)
```bash
# Environment
ENVIRONMENT=development
DEBUG=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/privexbot

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=change-this-to-a-random-string-in-production

# CORS
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@privexbot.com
SMTP_FROM_NAME=PrivexBot

# Frontend URL (for invitation links, webhook callbacks, etc.)
FRONTEND_URL=http://localhost:5173

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

#### `.env.local` (Local Development)
```bash
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=postgresql://privexbot:privexbot_dev@localhost:5432/privexbot_dev
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=dev-secret-key-not-for-production
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
FRONTEND_URL=http://localhost:5173
```

#### `.env.staging` (Staging Environment)
```bash
ENVIRONMENT=staging
DEBUG=false
DATABASE_URL=postgresql://user:password@staging-db:5432/privexbot_staging
REDIS_URL=redis://staging-redis:6379/0
SECRET_KEY=staging-secret-key-generate-random-string
BACKEND_CORS_ORIGINS=https://staging.privexbot.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=staging@privexbot.com
SMTP_PASSWORD=app-password-here
FRONTEND_URL=https://staging.privexbot.com
```

#### `.env.production` (Production Environment)
```bash
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:strong-password@prod-db:5432/privexbot_prod
REDIS_URL=redis://prod-redis:6379/0
SECRET_KEY=production-secret-key-VERY-RANDOM-AND-LONG
BACKEND_CORS_ORIGINS=https://app.privexbot.com
SMTP_HOST=smtp.sendgrid.net  # Or your production email service
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=sendgrid-api-key
FRONTEND_URL=https://app.privexbot.com
```

#### `.env.secretvm` (SecretVM Deployment)
```bash
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:password@secretvm-db:5432/privexbot
REDIS_URL=redis://secretvm-redis:6379/0
SECRET_KEY=secretvm-secret-key-VERY-RANDOM-AND-LONG
BACKEND_CORS_ORIGINS=https://secretvm.privexbot.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=secretvm@privexbot.com
SMTP_PASSWORD=app-password-here
FRONTEND_URL=https://secretvm.privexbot.com
CELERY_BROKER_URL=redis://secretvm-redis:6379/1
CELERY_RESULT_BACKEND=redis://secretvm-redis:6379/2
```

### 3. How to Use Different Environments

#### Option A: Copy the appropriate .env file
```bash
# Local development
cp .env.local .env

# Staging
cp .env.staging .env

# Production
cp .env.production .env

# SecretVM
cp .env.secretvm .env
```

#### Option B: Load environment file explicitly
```bash
# Using python-dotenv
python -c "from dotenv import load_dotenv; load_dotenv('.env.staging')"

# Using docker-compose
docker-compose --env-file .env.staging up
```

#### Option C: Set environment variables directly (Docker/K8s)
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=${DATABASE_URL}
      - FRONTEND_URL=https://app.privexbot.com
    env_file:
      - .env.production
```

## Frontend Environment Configuration

### Current Issue
Frontend also needs environment-specific configuration.

### `.env.local` (Frontend)
```bash
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

### `.env.production` (Frontend)
```bash
VITE_API_URL=https://api.privexbot.com
VITE_ENVIRONMENT=production
```

### `.env.secretvm` (Frontend)
```bash
VITE_API_URL=https://secretvm-api.privexbot.com
VITE_ENVIRONMENT=production
```

## Deployment Workflow

### Local Development
```bash
# Backend
cd backend
cp .env.example .env  # Edit with local values
cd src && uvicorn app.main:app --reload

# Frontend
cd frontend
cp .env.example .env  # Edit with local values
npm run dev
```

### Staging Deployment
```bash
# Build with staging environment
cd frontend
npm run build -- --mode staging

cd backend
# Deploy with .env.staging
```

### Production Deployment
```bash
# Build with production environment
cd frontend
npm run build -- --mode production

cd backend
# Deploy with .env.production
```

### SecretVM Deployment
```bash
# Build with secretvm environment
cd frontend
npm run build -- --mode secretvm

cd backend
# Deploy with .env.secretvm inside TEE
```

## Security Best Practices

### 1. Never Commit Secrets
```bash
# .gitignore (already configured)
.env
.env.local
.env.staging
.env.production
.env.secretvm
*.pem
*.key
```

### 2. Use Secret Management Services

**For Production/SecretVM:**
- AWS Secrets Manager
- HashiCorp Vault
- Google Secret Manager
- Azure Key Vault

**Example with AWS Secrets Manager:**
```python
# In config.py
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# Override settings from secrets manager in production
if settings.ENVIRONMENT == "production":
    secrets = get_secret("privexbot/production")
    settings.DATABASE_URL = secrets["DATABASE_URL"]
    settings.SECRET_KEY = secrets["SECRET_KEY"]
```

### 3. Rotate Secrets Regularly
- Change SECRET_KEY every 90 days
- Rotate database passwords quarterly
- Update SMTP passwords when compromised

### 4. Use Strong Random Secrets
```bash
# Generate strong SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Generate strong database password
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Configuration Validation

Add validation to ensure all required settings are present:

```python
# backend/src/app/core/config.py
from pydantic import field_validator

class Settings(BaseSettings):
    # ... existing fields ...

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        if info.data.get('ENVIRONMENT') == 'production':
            if v == "dev-secret-key-change-in-production":
                raise ValueError("Must set SECRET_KEY in production!")
            if len(v) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters in production!")
        return v

    @field_validator('FRONTEND_URL')
    @classmethod
    def validate_frontend_url(cls, v: str, info) -> str:
        if not v:
            raise ValueError("FRONTEND_URL is required!")
        if info.data.get('ENVIRONMENT') == 'production' and v.startswith('http://localhost'):
            raise ValueError("FRONTEND_URL cannot be localhost in production!")
        return v

    @field_validator('DATABASE_URL')
    @classmethod
    def validate_database_url(cls, v: str, info) -> str:
        if info.data.get('ENVIRONMENT') == 'production':
            if 'localhost' in v or '127.0.0.1' in v:
                raise ValueError("DATABASE_URL cannot be localhost in production!")
        return v
```

## Health Check Endpoint

Add environment info to health check (already exists):

```python
# backend/src/app/main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "privexbot-backend",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT  # Shows which environment is running
    }
```

## Monitoring Environment-Specific Issues

### Log Environment on Startup
```python
# backend/src/app/main.py (already implemented)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 {settings.PROJECT_NAME} Backend starting...")
    print(f"📝 Environment: {settings.ENVIRONMENT}")  # ✅ Already logging
    print(f"🔐 CORS enabled for: {settings.cors_origins}")
    print(f"🌐 Frontend URL: {settings.FRONTEND_URL}")  # Add this
    yield
    print(f"👋 {settings.PROJECT_NAME} Backend shutting down...")
```

## Summary

### ✅ What You Should Do:
1. Create `.env.example` with all required variables (template)
2. Create environment-specific `.env.*` files (local, staging, production, secretvm)
3. Add `.env*` to `.gitignore` (except `.env.example`)
4. Use environment variables for ALL environment-specific config
5. Add validation to ensure production configs are secure
6. Use secret management services in production
7. Document required environment variables

### ❌ What You Should NEVER Do:
1. Hardcode environment-specific values in code
2. Commit `.env` files with real secrets to git
3. Use development secrets in production
4. Share `.env` files via email/Slack
5. Use weak SECRET_KEY values
6. Use localhost URLs in production configs

### 🎯 Result:
**One codebase, multiple environments - zero code changes needed!**

```bash
# Same code deploys to all environments
# Just change which .env file is loaded

# Local
uvicorn app.main:app --env-file .env.local

# Staging
uvicorn app.main:app --env-file .env.staging

# Production
uvicorn app.main:app --env-file .env.production

# SecretVM
uvicorn app.main:app --env-file .env.secretvm
```
