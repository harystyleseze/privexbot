#!/bin/bash
# Docker entrypoint script for backend service
# WHY: Ensures database migrations are applied before server starts
# HOW: Runs alembic upgrade, then starts uvicorn

set -e

echo "🔄 Running database migrations..."
cd /app/src
alembic upgrade head

echo "🚀 Starting uvicorn server..."
cd /app
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --reload-dir /app/src
