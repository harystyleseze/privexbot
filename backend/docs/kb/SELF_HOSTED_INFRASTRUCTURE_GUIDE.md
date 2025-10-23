# 🏗️ Self-Hosted Infrastructure Setup Guide

**Purpose**: Complete guide for setting up self-hosted KB infrastructure on SecretVM or private cloud

**Target Audience**: DevOps engineers and system administrators

**Status**: Production-ready infrastructure with enterprise-grade security

---

## 📋 Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Qdrant Vector Database Setup](#qdrant-vector-database-setup)
3. [Sentence-Transformers Embedding Setup](#sentence-transformers-embedding-setup)
4. [Unstructured.io Document Processing](#unstructured-document-processing)
5. [Redis Configuration](#redis-configuration)
6. [PostgreSQL Optimization](#postgresql-optimization)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Backup & Recovery](#backup--recovery)
10. [Performance Tuning](#performance-tuning)

---

## Infrastructure Overview

### Complete Self-Hosted Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                   │
│                   SSL Termination                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                FastAPI Application                         │
│           (Multiple instances behind LB)                   │
└─────────┬─────────────────────────────────┬─────────────────┘
          │                                 │
┌─────────┴─────────┐              ┌─────────┴─────────┐
│   PostgreSQL      │              │  Celery Workers   │
│   (Primary DB)    │              │ (Background Jobs) │
└─────────┬─────────┘              └─────────┬─────────┘
          │                                  │
┌─────────┴─────────┐              ┌─────────┴─────────┐
│      Redis        │              │      Qdrant       │
│ (Cache & Queue)   │              │  (Vector Store)   │
└───────────────────┘              └───────────────────┘

Additional Components:
- Unstructured.io (Document Processing)
- Sentence-Transformers (Local Embeddings)
- Monitoring Stack (Prometheus + Grafana)
- Backup Services (automated)
```

### Hardware Requirements

**Minimum Production Setup:**
- **CPU**: 8 cores (16 recommended)
- **RAM**: 32GB (64GB recommended)
- **Storage**: 500GB SSD (1TB recommended)
- **Network**: 1Gbps connection

**Large Scale Setup:**
- **CPU**: 16+ cores per service
- **RAM**: 128GB+ total
- **Storage**: 2TB+ NVMe SSD
- **Network**: 10Gbps connection

### Service Resource Allocation

| Service | CPU Cores | RAM | Storage | Purpose |
|---------|-----------|-----|---------|---------|
| **Qdrant** | 4 cores | 16GB | 200GB | Vector database |
| **PostgreSQL** | 2 cores | 8GB | 100GB | Primary database |
| **Redis** | 2 cores | 4GB | 20GB | Cache & message queue |
| **Embedding Service** | 4 cores | 16GB | 50GB | Model storage |
| **Unstructured.io** | 2 cores | 8GB | 20GB | Document processing |
| **Application** | 4 cores | 8GB | 50GB | API servers |
| **Monitoring** | 2 cores | 4GB | 50GB | Metrics & logs |

---

## Qdrant Vector Database Setup

### 1. Installation via Docker

```bash
# Create directories
sudo mkdir -p /opt/qdrant/{storage,snapshots,raft_logs}
sudo chown -R $USER:$USER /opt/qdrant

# Create optimized configuration
cat > /opt/qdrant/config.yaml << EOF
log_level: INFO
service:
  http_port: 6333
  grpc_port: 6334
  enable_cors: false
  api_key: ${QDRANT_API_KEY}

storage:
  storage_path: /qdrant/storage
  snapshots_path: /qdrant/snapshots
  raft_logs_path: /qdrant/raft_logs

  # Performance optimizations
  performance:
    max_search_threads: 4
    max_optimization_threads: 2
    max_indexing_threads: 2

  # Memory settings
  wal_capacity_mb: 32
  wal_segments_ahead: 0

cluster:
  enabled: false
EOF

# Run Qdrant with production settings
docker run -d \
  --name qdrant \
  --restart unless-stopped \
  -p 6333:6333 \
  -p 6334:6334 \
  -v /opt/qdrant/storage:/qdrant/storage \
  -v /opt/qdrant/snapshots:/qdrant/snapshots \
  -v /opt/qdrant/raft_logs:/qdrant/raft_logs \
  -v /opt/qdrant/config.yaml:/qdrant/config/config.yaml \
  --memory=16g \
  --cpus=4 \
  qdrant/qdrant:v1.7.3
```

### 2. Qdrant Performance Optimization

```bash
# Create optimized Docker Compose for Qdrant
cat > docker-compose.qdrant.yml << EOF
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:v1.7.3
    container_name: qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
      - QDRANT__STORAGE__STORAGE_PATH=/qdrant/storage
      - QDRANT__STORAGE__PERFORMANCE__MAX_SEARCH_THREADS=4
      - QDRANT__STORAGE__PERFORMANCE__MAX_OPTIMIZATION_THREADS=2
      - QDRANT__SERVICE__API_KEY=${QDRANT_API_KEY}
      # Memory optimizations
      - QDRANT__STORAGE__WAL_CAPACITY_MB=32
      - QDRANT__STORAGE__WAL_SEGMENTS_AHEAD=0
      # Index optimizations
      - QDRANT__STORAGE__OPTIMIZERS__DEFAULT_SEGMENT_NUMBER=2
      - QDRANT__STORAGE__OPTIMIZERS__MAX_SEGMENT_SIZE=200000
      - QDRANT__STORAGE__OPTIMIZERS__MEMMAP_THRESHOLD=200000
      - QDRANT__STORAGE__OPTIMIZERS__INDEXING_THRESHOLD=20000
    volumes:
      - qdrant_storage:/qdrant/storage
      - qdrant_snapshots:/qdrant/snapshots
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 16G
        reservations:
          cpus: '2.0'
          memory: 8G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  qdrant_storage:
    driver: local
  qdrant_snapshots:
    driver: local
EOF

# Start Qdrant
docker-compose -f docker-compose.qdrant.yml up -d
```

### 3. Qdrant Security Configuration

```bash
# Generate secure API key
export QDRANT_API_KEY=$(openssl rand -hex 32)

# Create systemd service for Qdrant
sudo tee /etc/systemd/system/qdrant.service << EOF
[Unit]
Description=Qdrant Vector Database
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/docker-compose -f /opt/qdrant/docker-compose.yml up -d
ExecStop=/usr/bin/docker-compose -f /opt/qdrant/docker-compose.yml down
WorkingDirectory=/opt/qdrant

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable qdrant
sudo systemctl start qdrant
```

---

## Sentence-Transformers Embedding Setup

### 1. Local Model Installation

```python
#!/usr/bin/env python3
"""
Production embedding model setup script.
Downloads and optimizes models for local inference.
"""

import os
import sys
from pathlib import Path
from sentence_transformers import SentenceTransformer
import torch

def setup_embedding_models():
    """Download and optimize embedding models."""

    # Create models directory
    models_dir = Path("/opt/privexbot/models")
    models_dir.mkdir(parents=True, exist_ok=True)

    # Production models with specifications
    models = {
        "all-MiniLM-L6-v2": {
            "dimensions": 384,
            "max_seq_length": 256,
            "speed": "fast",
            "quality": "good",
            "use_case": "General purpose, high throughput"
        },
        "all-mpnet-base-v2": {
            "dimensions": 768,
            "max_seq_length": 384,
            "speed": "medium",
            "quality": "high",
            "use_case": "High quality embeddings"
        },
        "multi-qa-mpnet-base-dot-v1": {
            "dimensions": 768,
            "max_seq_length": 512,
            "speed": "medium",
            "quality": "high",
            "use_case": "Question-answering optimization"
        }
    }

    for model_name, specs in models.items():
        print(f"📥 Downloading {model_name}...")
        print(f"   Dimensions: {specs['dimensions']}")
        print(f"   Use case: {specs['use_case']}")

        try:
            # Download model
            model = SentenceTransformer(
                model_name,
                cache_folder=str(models_dir),
                device="cpu"  # Use CPU for reproducible performance
            )

            # Test model
            test_embedding = model.encode("This is a test sentence.")
            assert len(test_embedding) == specs['dimensions']

            print(f"   ✅ Successfully downloaded and verified")

            # Optimize model for inference (optional)
            if torch.cuda.is_available():
                print(f"   🚀 Optimizing for GPU...")
                model = model.to('cuda')
                # Compile model for faster inference (PyTorch 2.0+)
                if hasattr(torch, 'compile'):
                    model = torch.compile(model)

        except Exception as e:
            print(f"   ❌ Failed to download {model_name}: {e}")
            sys.exit(1)

        print()

    print("✅ All embedding models ready for production!")

    # Create model configuration file
    config = {
        "models_path": str(models_dir),
        "available_models": models,
        "default_model": "all-MiniLM-L6-v2",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "batch_size": 32,
        "max_seq_length": 512
    }

    import json
    with open(models_dir / "config.json", "w") as f:
        json.dump(config, f, indent=2)

if __name__ == "__main__":
    setup_embedding_models()
```

### 2. Embedding Service Optimization

```python
# Optimized embedding service configuration
class ProductionEmbeddingService:
    """Production-optimized embedding service."""

    def __init__(self):
        self.models_path = "/opt/privexbot/models"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.models = {}

        # Load configuration
        with open(f"{self.models_path}/config.json") as f:
            self.config = json.load(f)

        # Pre-warm default model
        self._preload_model(self.config["default_model"])

    def _preload_model(self, model_name: str):
        """Pre-load model for faster first request."""
        print(f"Pre-loading model: {model_name}")
        model = SentenceTransformer(
            model_name,
            cache_folder=self.models_path,
            device=self.device
        )

        # Optimize for inference
        model.eval()
        if self.device == "cuda":
            model.half()  # Use FP16 for memory efficiency

        self.models[model_name] = model

        # Warm up with dummy inference
        dummy_text = "Warming up the model for faster inference."
        _ = model.encode(dummy_text)

        print(f"✅ Model {model_name} ready for inference")
```

### 3. Embedding Service Deployment

```dockerfile
# Dockerfile for embedding service
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch (CPU version for consistent performance)
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install sentence-transformers and dependencies
RUN pip install \
    sentence-transformers==2.2.2 \
    transformers==4.35.2 \
    numpy==1.24.3 \
    scikit-learn==1.3.2

# Create non-root user
RUN useradd --create-home --shell /bin/bash embeddings
USER embeddings

# Set working directory
WORKDIR /app

# Copy embedding service code
COPY embedding_service.py .
COPY setup_models.py .

# Create models directory
RUN mkdir -p /app/models

# Download models during build (optional - can be done at runtime)
RUN python setup_models.py

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8001/health')"

# Run embedding service
EXPOSE 8001
CMD ["python", "embedding_service.py"]
```

---

## Unstructured Document Processing

### 1. Self-Hosted Unstructured.io Setup

```bash
# Option 1: Docker deployment (recommended)
docker run -d \
  --name unstructured-api \
  --restart unless-stopped \
  -p 8001:8000 \
  -e UNSTRUCTURED_API_KEY=${UNSTRUCTURED_API_KEY} \
  -v /opt/privexbot/temp:/tmp/unstructured \
  --memory=8g \
  --cpus=2 \
  quay.io/unstructured-io/unstructured-api:latest

# Option 2: Local Python installation
pip install "unstructured[all]"
```

### 2. Document Processing Configuration

```python
# Optimized document processing configuration
class DocumentProcessorConfig:
    """Production configuration for document processing."""

    # Unstructured.io settings
    UNSTRUCTURED_API_URL = "http://localhost:8001"
    UNSTRUCTURED_API_KEY = os.getenv("UNSTRUCTURED_API_KEY")

    # Processing strategies
    STRATEGIES = {
        "pdf": {
            "strategy": "hi_res",
            "infer_table_structure": True,
            "chunking_strategy": "by_title",
            "max_characters": 10000,
            "include_page_breaks": True
        },
        "docx": {
            "strategy": "hi_res",
            "infer_table_structure": True,
            "include_page_breaks": False
        },
        "default": {
            "strategy": "auto",
            "infer_table_structure": False
        }
    }

    # File size limits
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    # Temporary storage
    TEMP_DIR = "/opt/privexbot/temp"

    # Performance settings
    PROCESSING_TIMEOUT = 300  # 5 minutes
    CONCURRENT_PROCESSES = 4
```

### 3. Document Processing Service

```python
class ProductionDocumentProcessor:
    """Production-ready document processor with fallbacks."""

    def __init__(self):
        self.config = DocumentProcessorConfig()
        self.fallback_processors = {
            "pdf": self._process_pdf_fallback,
            "docx": self._process_docx_fallback,
            "txt": self._process_text_fallback
        }

    async def process_document(self, file_path: str, file_type: str) -> ProcessingResult:
        """Process document with fallback strategies."""

        try:
            # Try Unstructured.io first
            return await self._process_with_unstructured(file_path, file_type)

        except Exception as e:
            logger.warning(f"Unstructured.io processing failed: {e}")

            # Fallback to traditional processors
            if file_type in self.fallback_processors:
                logger.info(f"Using fallback processor for {file_type}")
                return await self.fallback_processors[file_type](file_path)
            else:
                raise ProcessingError(f"No processor available for {file_type}")

    async def _process_with_unstructured(self, file_path: str, file_type: str):
        """Process using Unstructured.io API."""

        strategy_config = self.config.STRATEGIES.get(
            file_type,
            self.config.STRATEGIES["default"]
        )

        # Prepare request
        with open(file_path, "rb") as f:
            files = {"files": f}
            data = {
                "strategy": strategy_config["strategy"],
                "hi_res_model_name": "yolox",
                **strategy_config
            }

            response = await self._make_unstructured_request(files, data)

        return self._parse_unstructured_response(response)

    async def _make_unstructured_request(self, files, data):
        """Make request to Unstructured.io API with retry logic."""

        import aiohttp
        import asyncio

        async with aiohttp.ClientSession() as session:
            for attempt in range(3):  # Retry up to 3 times
                try:
                    async with session.post(
                        f"{self.config.UNSTRUCTURED_API_URL}/general/v0/general",
                        data=data,
                        files=files,
                        headers={"unstructured-api-key": self.config.UNSTRUCTURED_API_KEY},
                        timeout=aiohttp.ClientTimeout(total=self.config.PROCESSING_TIMEOUT)
                    ) as response:
                        response.raise_for_status()
                        return await response.json()

                except Exception as e:
                    if attempt == 2:  # Last attempt
                        raise

                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s: {e}")
                    await asyncio.sleep(wait_time)
```

---

## Redis Configuration

### 1. Production Redis Setup

```bash
# Create Redis configuration directory
sudo mkdir -p /opt/redis/{conf,data,logs}

# Create optimized Redis configuration
sudo tee /opt/redis/conf/redis.conf << EOF
# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Authentication
requirepass ${REDIS_PASSWORD}

# Memory Management
maxmemory 8gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

dir /data
dbfilename dump.rdb
rdbcompression yes
rdbchecksum yes

# AOF
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511

# Logging
loglevel notice
logfile /logs/redis.log

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
EOF

# Start Redis with production settings
docker run -d \
  --name redis \
  --restart unless-stopped \
  -p 6379:6379 \
  -v /opt/redis/conf/redis.conf:/usr/local/etc/redis/redis.conf \
  -v /opt/redis/data:/data \
  -v /opt/redis/logs:/logs \
  --memory=8g \
  redis:7-alpine redis-server /usr/local/etc/redis/redis.conf
```

### 2. Redis Database Allocation

```python
# Redis database allocation for KB system
REDIS_DATABASES = {
    0: "cache",           # General application cache
    1: "drafts",          # KB draft storage
    2: "embeddings",      # Embedding cache
    3: "celery_broker",   # Celery message broker
    4: "celery_results",  # Celery task results
    5: "sessions",        # User sessions
    6: "rate_limits",     # Rate limiting data
    7: "analytics"        # Analytics cache
}

# Redis connection pools for each database
class RedisManager:
    def __init__(self):
        self.pools = {}
        for db_num, purpose in REDIS_DATABASES.items():
            self.pools[purpose] = redis.ConnectionPool(
                host=REDIS_HOST,
                port=REDIS_PORT,
                password=REDIS_PASSWORD,
                db=db_num,
                max_connections=20,
                retry_on_timeout=True,
                health_check_interval=30
            )

    def get_client(self, purpose: str) -> redis.Redis:
        return redis.Redis(connection_pool=self.pools[purpose])
```

---

## PostgreSQL Optimization

### 1. Production PostgreSQL Configuration

```sql
-- postgresql.conf optimizations for KB workload

-- Memory settings
shared_buffers = 2GB                    -- 25% of system RAM
effective_cache_size = 6GB              -- 75% of system RAM
work_mem = 64MB                         -- For sorting and joins
maintenance_work_mem = 512MB            -- For maintenance operations

-- Checkpoints and WAL
checkpoint_completion_target = 0.9
wal_buffers = 64MB
max_wal_size = 4GB
min_wal_size = 1GB

-- Query planner
random_page_cost = 1.1                  -- For SSD storage
effective_io_concurrency = 200          -- For SSD
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8

-- Connections
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

-- Full-text search optimization
default_text_search_config = 'english'

-- Logging
log_min_duration_statement = 1000       -- Log slow queries
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

### 2. PostgreSQL Performance Indexes

```sql
-- Performance indexes for KB operations

-- Knowledge bases
CREATE INDEX CONCURRENTLY ix_kb_workspace_status_performance
ON knowledge_bases (workspace_id, status)
WHERE status IN ('processing', 'completed');

CREATE INDEX CONCURRENTLY ix_kb_search_performance
ON knowledge_bases (organization_id, updated_at DESC)
WHERE status = 'completed';

-- Documents
CREATE INDEX CONCURRENTLY ix_documents_kb_status_performance
ON documents (knowledge_base_id, status, updated_at DESC);

CREATE INDEX CONCURRENTLY ix_documents_fulltext
ON documents USING gin(to_tsvector('english', name || ' ' || COALESCE(content_preview, '')));

-- Chunks
CREATE INDEX CONCURRENTLY ix_chunks_document_enabled
ON chunks (document_id)
WHERE is_enabled = true;

CREATE INDEX CONCURRENTLY ix_chunks_fulltext
ON chunks USING gin(to_tsvector('english', content));

-- Audit logs (for compliance)
CREATE INDEX CONCURRENTLY ix_audit_logs_compliance
ON audit_logs (organization_id, timestamp DESC, event_type);

CREATE INDEX CONCURRENTLY ix_audit_logs_user_activity
ON audit_logs (user_id, timestamp DESC)
WHERE success = true;
```

### 3. PostgreSQL Monitoring

```sql
-- Create monitoring views for KB performance

-- KB query performance
CREATE VIEW kb_query_performance AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time,
    stddev_time
FROM pg_stat_statements
WHERE query LIKE '%knowledge_bases%'
   OR query LIKE '%documents%'
   OR query LIKE '%chunks%'
ORDER BY total_time DESC;

-- KB storage usage
CREATE VIEW kb_storage_usage AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE tablename IN ('knowledge_bases', 'documents', 'chunks', 'audit_logs')
ORDER BY size_bytes DESC;

-- Index usage analysis
CREATE VIEW kb_index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('knowledge_bases', 'documents', 'chunks')
ORDER BY idx_scan DESC;
```

---

## Security Hardening

### 1. Network Security

```bash
# Firewall configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow only necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow from 127.0.0.1 to any port 6333  # Qdrant (local only)
sudo ufw allow from 127.0.0.1 to any port 6379  # Redis (local only)
sudo ufw allow from 127.0.0.1 to any port 5432  # PostgreSQL (local only)

sudo ufw enable
```

### 2. SSL/TLS Configuration

```nginx
# /etc/nginx/sites-available/privexbot-kb
server {
    listen 443 ssl http2;
    server_name kb.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/privexbot.crt;
    ssl_certificate_key /etc/ssl/private/privexbot.key;

    # SSL security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload limits
    client_max_body_size 50M;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name kb.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. API Key Management

```python
# Secure API key generation and management
class APIKeyManager:
    """Secure API key management for KB services."""

    @staticmethod
    def generate_api_key() -> str:
        """Generate cryptographically secure API key."""
        import secrets
        return f"kb_{secrets.token_urlsafe(32)}"

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash API key for secure storage."""
        import bcrypt
        return bcrypt.hashpw(api_key.encode(), bcrypt.gensalt()).decode()

    @staticmethod
    def verify_api_key(api_key: str, hashed: str) -> bool:
        """Verify API key against hash."""
        import bcrypt
        return bcrypt.checkpw(api_key.encode(), hashed.encode())

    @staticmethod
    def rotate_api_keys():
        """Rotate API keys on schedule."""
        # Implementation for automated key rotation
        pass
```

---

## Monitoring & Alerting

### 1. Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "kb_alerts.yml"

scrape_configs:
  # Application metrics
  - job_name: 'privexbot-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: /metrics
    scrape_interval: 15s

  # Qdrant metrics
  - job_name: 'qdrant'
    static_configs:
      - targets: ['localhost:6333']
    metrics_path: /metrics
    scrape_interval: 30s

  # Redis metrics
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
    scrape_interval: 30s

  # PostgreSQL metrics
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    scrape_interval: 30s

  # Node metrics
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 30s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 2. KB-Specific Alerts

```yaml
# kb_alerts.yml
groups:
  - name: kb_performance
    rules:
      - alert: HighSearchLatency
        expr: histogram_quantile(0.95, rate(kb_search_duration_seconds_bucket[5m])) > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "KB search latency is high"
          description: "95th percentile search latency is {{ $value }}s"

      - alert: HighEmbeddingLatency
        expr: histogram_quantile(0.95, rate(embedding_generation_duration_seconds_bucket[5m])) > 2.0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Embedding generation is slow"

      - alert: QdrantDown
        expr: up{job="qdrant"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Qdrant vector database is down"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"

      - alert: DocumentProcessingBacklog
        expr: celery_tasks_total{state="PENDING",queue="document_processing"} > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Document processing backlog detected"
```

### 3. Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "PrivexBot KB System",
    "panels": [
      {
        "title": "Search Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(kb_search_total[5m])",
            "legendFormat": "Searches/sec"
          },
          {
            "expr": "histogram_quantile(0.95, rate(kb_search_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile latency"
          }
        ]
      },
      {
        "title": "Vector Database Status",
        "type": "stat",
        "targets": [
          {
            "expr": "qdrant_collections_total",
            "legendFormat": "Collections"
          },
          {
            "expr": "qdrant_points_total",
            "legendFormat": "Total Vectors"
          }
        ]
      },
      {
        "title": "Document Processing",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(documents_processed_total[5m])",
            "legendFormat": "Documents/sec"
          },
          {
            "expr": "celery_tasks_total{state=\"PENDING\"}",
            "legendFormat": "Queue Length"
          }
        ]
      }
    ]
  }
}
```

---

## Backup & Recovery

### 1. Automated Backup Script

```bash
#!/bin/bash
# Production backup script for KB system

BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting comprehensive KB backup..."

# PostgreSQL backup
echo "📊 Backing up PostgreSQL..."
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/postgres.sql.gz"

# Qdrant collections backup
echo "🔍 Backing up Qdrant..."
curl -X POST "http://localhost:6333/collections/snapshot" \
  -H "Content-Type: application/json" \
  -H "api-key: $QDRANT_API_KEY" \
  -d '{"name": "'$(date +%Y%m%d_%H%M%S)'"}'

# Copy Qdrant snapshots
docker cp qdrant:/qdrant/snapshots "$BACKUP_DIR/qdrant_snapshots"

# Redis data backup
echo "💾 Backing up Redis..."
docker exec redis redis-cli --rdb "$BACKUP_DIR/redis_dump.rdb"

# File storage backup
echo "📁 Backing up file storage..."
tar -czf "$BACKUP_DIR/file_storage.tar.gz" /opt/privexbot/storage

# Configuration backup
echo "⚙️ Backing up configurations..."
cp -r /opt/privexbot/config "$BACKUP_DIR/"
cp docker-compose*.yml "$BACKUP_DIR/"

# Embedding models backup (optional - large files)
if [ "$BACKUP_MODELS" = "true" ]; then
    echo "🤖 Backing up embedding models..."
    tar -czf "$BACKUP_DIR/models.tar.gz" /opt/privexbot/models
fi

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "components": [
    "postgresql",
    "qdrant",
    "redis",
    "file_storage",
    "configurations"
  ],
  "size_mb": $(du -sm "$BACKUP_DIR" | cut -f1),
  "retention_days": 30
}
EOF

echo "✅ Backup completed: $BACKUP_DIR"

# Upload to secure storage (optional)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    echo "☁️ Uploading to S3..."
    aws s3 sync "$BACKUP_DIR" "s3://$BACKUP_S3_BUCKET/backups/$(basename $BACKUP_DIR)/"
fi

# Cleanup old backups (keep 30 days)
find /opt/backups -type d -mtime +30 -exec rm -rf {} +
```

### 2. Recovery Procedures

```bash
#!/bin/bash
# Recovery script for KB system

BACKUP_DIR="$1"
if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

echo "🔄 Starting KB system recovery from $BACKUP_DIR"

# Stop services
echo "⏹️ Stopping services..."
docker-compose down

# Recover PostgreSQL
echo "📊 Recovering PostgreSQL..."
dropdb privexbot_kb
createdb privexbot_kb
gunzip -c "$BACKUP_DIR/postgres.sql.gz" | psql privexbot_kb

# Recover Qdrant
echo "🔍 Recovering Qdrant..."
docker volume rm qdrant_storage
docker volume create qdrant_storage
tar -xzf "$BACKUP_DIR/qdrant_snapshots.tar.gz" -C /var/lib/docker/volumes/qdrant_storage/_data/

# Recover Redis
echo "💾 Recovering Redis..."
docker run --rm -v redis_data:/data -v "$BACKUP_DIR":/backup redis:7-alpine \
  sh -c 'cp /backup/redis_dump.rdb /data/dump.rdb'

# Recover file storage
echo "📁 Recovering file storage..."
tar -xzf "$BACKUP_DIR/file_storage.tar.gz" -C /

# Recover configurations
echo "⚙️ Recovering configurations..."
cp -r "$BACKUP_DIR/config"/* /opt/privexbot/config/

# Start services
echo "🚀 Starting services..."
docker-compose up -d

echo "✅ Recovery completed successfully"
```

This comprehensive self-hosted infrastructure guide provides everything needed to deploy and maintain a production-ready KB system with enterprise-grade security, performance, and reliability.