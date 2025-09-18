FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy only the dependency files first
COPY apps/backend/pyproject.toml ./

# Install build dependencies and uv
RUN pip install --no-cache-dir uv

# Copy application code
COPY apps/backend/backend ./backend

# Install project dependencies (into system env)
RUN uv pip install . --system


# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
