"""
PrivexBot Backend - FastAPI Application
Main entry point for the API server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Privacy-First AI Chatbot Builder API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Configuration
# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Docker healthcheck and monitoring"""
    return {
        "status": "healthy",
        "service": "privexbot-backend",
        "version": "0.1.0"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "0.1.0",
        "docs": "/api/docs",
        "health": "/health",
        "environment": settings.ENVIRONMENT
    }


# API v1 endpoints (for testing basic functionality)
@app.get("/api/v1/ping")
async def ping():
    """Simple ping endpoint to test API connectivity"""
    return {
        "message": "pong",
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/v1/status")
async def status():
    """Get API status and environment info"""
    return {
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "cors_origins": settings.cors_origins,
        "database": "PostgreSQL (configured)",
        "redis": "Redis (configured)",
        "api_prefix": settings.API_V1_PREFIX
    }


# Test endpoint with CORS
@app.post("/api/v1/test")
async def test_post(data: dict):
    """Test POST endpoint to verify CORS is working"""
    return {
        "message": "POST request received successfully",
        "data": data,
        "cors": "enabled"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print(f"🚀 {settings.PROJECT_NAME} Backend starting...")
    print(f"📝 Environment: {settings.ENVIRONMENT}")
    print(f"🔐 CORS enabled for: {settings.cors_origins}")

    # Initialize database tables
    try:
        init_db()
    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
        print("   (This is normal if database is not yet accessible)")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print(f"👋 {settings.PROJECT_NAME} Backend shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
