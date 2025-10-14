#!/bin/bash
# Production entrypoint script for backend service
# WHY: Ensures database migrations are applied before server starts
# HOW: Runs alembic upgrade, then starts gunicorn with multiple workers

set -e

echo "🔄 Running database migrations..."
cd /app/src
alembic upgrade head

echo "🚀 Starting production server with gunicorn..."
cd /app
exec gunicorn src.app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile -
