# 📁 Complete KB File Structure & Implementation Guide

**Purpose**: Comprehensive file structure documentation with implementation details for each component

**Target Audience**: Senior engineers implementing KB features from scratch

**Status**: Production-ready structure with all required files

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Backend Structure](#backend-structure)
3. [File-by-File Implementation Guide](#file-by-file-implementation-guide)
4. [Configuration Files](#configuration-files)
5. [Testing Structure](#testing-structure)
6. [Deployment Files](#deployment-files)

---

## Overview

### Complete KB System File Structure

```
privexbot/backend/
├── src/app/
│   ├── models/                          # SQLAlchemy database models
│   │   ├── knowledge_base.py            # ✅ Core KB model with multi-tenancy
│   │   ├── document.py                  # ✅ Document model with annotations
│   │   ├── chunk.py                     # ✅ Text chunk model
│   │   └── __init__.py                  # Model imports and registry
│   │
│   ├── schemas/                         # Pydantic request/response schemas
│   │   ├── knowledge_base.py            # ✅ KB API schemas
│   │   ├── document.py                  # ✅ Document API schemas
│   │   ├── chunk.py                     # ✅ Chunk API schemas
│   │   ├── kb_draft.py                  # ✅ Draft API schemas
│   │   └── __init__.py
│   │
│   ├── api/v1/routes/                   # FastAPI route handlers
│   │   ├── kb_draft.py                  # ✅ Draft mode API endpoints
│   │   ├── knowledge_bases.py           # ✅ Production KB endpoints
│   │   ├── documents.py                 # ✅ Document management endpoints
│   │   ├── search.py                    # 🆕 Search and retrieval endpoints
│   │   └── __init__.py
│   │
│   ├── services/                        # Business logic layer
│   │   ├── kb_draft_service.py          # ✅ Draft lifecycle management
│   │   ├── document_processing_service.py # ✅ Document parsing & extraction
│   │   ├── chunking_service.py          # ✅ Intelligent text chunking
│   │   ├── embedding_service.py         # ✅ Self-hosted embeddings
│   │   ├── vector_store_service.py      # ✅ Qdrant vector operations
│   │   ├── retrieval_service.py         # ✅ Hybrid search & ranking
│   │   ├── indexing_service.py          # 🆕 Document indexing coordination
│   │   ├── audit_service.py             # 🆕 HIPAA/SOC2 audit logging
│   │   └── __init__.py
│   │
│   ├── integrations/                    # External service adapters
│   │   ├── unstructured_adapter.py      # 🆕 Unstructured.io integration
│   │   ├── crawl4ai_adapter.py          # 🆕 Website crawling
│   │   ├── google_docs_adapter.py       # 🆕 Google Workspace integration
│   │   ├── notion_adapter.py            # 🆕 Notion API integration
│   │   ├── qdrant_adapter.py            # 🆕 Qdrant client wrapper
│   │   └── __init__.py
│   │
│   ├── tasks/                           # Celery background tasks
│   │   ├── document_tasks.py            # ✅ Document processing tasks
│   │   ├── embedding_tasks.py           # 🆕 Batch embedding generation
│   │   ├── indexing_tasks.py            # 🆕 Vector indexing tasks
│   │   ├── cleanup_tasks.py             # 🆕 Data cleanup and maintenance
│   │   └── __init__.py
│   │
│   ├── utils/                           # Utility functions
│   │   ├── file_processing.py           # 🆕 File handling utilities
│   │   ├── text_processing.py           # 🆕 Text processing helpers
│   │   ├── vector_utils.py              # 🆕 Vector operation utilities
│   │   ├── security_utils.py            # 🆕 Security and validation helpers
│   │   └── __init__.py
│   │
│   ├── core/                            # Core application components
│   │   ├── config.py                    # ✅ Environment configuration
│   │   ├── security.py                  # ✅ Authentication and security
│   │   ├── logging.py                   # 🆕 Structured logging setup
│   │   ├── exceptions.py                # 🆕 Custom exception definitions
│   │   └── __init__.py
│   │
│   ├── db/                              # Database configuration
│   │   ├── base_class.py                # ✅ SQLAlchemy base class
│   │   ├── session.py                   # ✅ Database session management
│   │   └── __init__.py
│   │
│   ├── tests/                           # Test suite
│   │   ├── unit/                        # Unit tests
│   │   │   ├── test_kb_draft_service.py
│   │   │   ├── test_document_processing.py
│   │   │   ├── test_chunking_service.py
│   │   │   ├── test_embedding_service.py
│   │   │   └── test_vector_store.py
│   │   ├── integration/                 # Integration tests
│   │   │   ├── test_kb_creation_flow.py
│   │   │   ├── test_search_functionality.py
│   │   │   └── test_multi_tenancy.py
│   │   ├── performance/                 # Performance tests
│   │   │   ├── test_embedding_throughput.py
│   │   │   ├── test_search_latency.py
│   │   │   └── test_concurrent_operations.py
│   │   ├── conftest.py                  # ✅ Pytest configuration
│   │   └── __init__.py
│   │
│   └── main.py                          # ✅ FastAPI application entry point
│
├── alembic/                             # Database migrations
│   ├── versions/
│   │   ├── 001_initial_kb_system.py     # 🆕 KB system tables
│   │   ├── 002_add_document_annotations.py # 🆕 Document annotations
│   │   ├── 003_add_vector_indexes.py    # 🆕 Performance indexes
│   │   └── 004_add_audit_tables.py      # 🆕 Audit logging tables
│   ├── alembic.ini                      # ✅ Alembic configuration
│   ├── env.py                           # ✅ Migration environment
│   └── script.py.mako                   # ✅ Migration template
│
├── scripts/                             # Deployment and maintenance scripts
│   ├── setup_embedding_models.py        # 🆕 Download sentence-transformers models
│   ├── deploy_production.sh             # 🆕 Production deployment script
│   ├── backup_kb_data.sh               # 🆕 Backup and recovery
│   ├── migrate_vector_store.py         # 🆕 Vector store migration
│   ├── cleanup_orphaned_data.py        # 🆕 Data cleanup utilities
│   └── performance_benchmark.py        # 🆕 Performance testing
│
├── docs/kb/                             # Knowledge Base documentation
│   ├── KB_PRODUCTION_IMPLEMENTATION_GUIDE.md      # ✅ Main implementation guide
│   ├── KB_PRODUCTION_IMPLEMENTATION_GUIDE_PART2.md # ✅ Advanced implementation
│   ├── SERVICE_ARCHITECTURE_GUIDE.md              # ✅ Service patterns
│   ├── COMPLETE_FILE_STRUCTURE_GUIDE.md           # ✅ This document
│   ├── SELF_HOSTED_INFRASTRUCTURE_GUIDE.md        # 🆕 Infrastructure setup
│   ├── HIPAA_SOC2_COMPLIANCE_GUIDE.md             # 🆕 Compliance requirements
│   ├── architecture.md                            # ✅ Existing architecture overview
│   ├── kb-flow.md                                 # ✅ Existing KB flow documentation
│   ├── kb-draft.md                                # ✅ Existing draft documentation
│   └── kb_components.md                           # ✅ Existing component documentation
│
├── docker/                              # Docker configurations
│   ├── Dockerfile.production            # 🆕 Production Docker image
│   ├── Dockerfile.development           # 🆕 Development Docker image
│   ├── docker-compose.kb-stack.yml     # 🆕 Complete KB stack
│   ├── docker-compose.qdrant.yml       # 🆕 Qdrant vector database
│   └── docker-compose.monitoring.yml   # 🆕 Monitoring stack
│
├── config/                              # Configuration files
│   ├── logging.conf                     # 🆕 Logging configuration
│   ├── celery.conf                      # 🆕 Celery configuration
│   ├── nginx.conf                       # 🆕 Nginx reverse proxy
│   └── ssl/                             # 🆕 SSL certificates directory
│
├── requirements/                        # Python dependencies
│   ├── base.txt                         # 🆕 Core dependencies
│   ├── production.txt                   # 🆕 Production dependencies
│   ├── development.txt                  # 🆕 Development dependencies
│   └── testing.txt                      # 🆕 Testing dependencies
│
├── .env.production                      # 🆕 Production environment variables
├── .env.development                     # 🆕 Development environment variables
├── .env.example                         # ✅ Environment template
├── pyproject.toml                       # ✅ Python project configuration
├── Dockerfile                           # ✅ Main Dockerfile
├── docker-compose.yml                   # ✅ Development compose
└── README.md                            # ✅ Project documentation
```

**Legend:**
- ✅ = Exists with pseudocode/implementation
- 🆕 = New file needed for production KB system

---

## File-by-File Implementation Guide

### Core Models

#### `src/app/models/knowledge_base.py`
```python
"""
Production KnowledgeBase model - UPDATED for production requirements.
Status: ✅ Exists but needs production enhancements
"""

# ENHANCEMENTS NEEDED:
# 1. Add vector_store_config field for flexible provider support
# 2. Add context_settings for chatbot access control
# 3. Add audit fields (created_by, updated_by, etc.)
# 4. Add performance indexes
# 5. Add data retention policies

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    # PRODUCTION ADDITIONS:
    vector_store_config = Column(JSONB, nullable=False, default={
        "provider": "qdrant",
        "collection_name": "",
        "distance_metric": "cosine"
    })

    context_settings = Column(JSONB, nullable=False, default={
        "access_mode": "all",
        "retrieval_config": {"top_k": 5, "threshold": 0.7}
    })

    # Performance tracking
    search_count = Column(Integer, default=0)
    last_accessed_at = Column(DateTime(timezone=True))

    # Data retention
    retention_days = Column(Integer, default=365)
    auto_delete_after = Column(DateTime(timezone=True))
```

#### `src/app/models/document.py`
```python
"""
Enhanced Document model with annotations and processing tracking.
Status: ✅ Exists but needs annotation fields
"""

# ENHANCEMENTS NEEDED:
# 1. Add annotations field for AI context
# 2. Add processing_metadata for pipeline tracking
# 3. Add custom_metadata for user-defined fields
# 4. Add lifecycle management fields

class Document(Base):
    # PRODUCTION ADDITIONS:
    annotations = Column(JSONB, nullable=True, default={
        "enabled": False,
        "category": "document",
        "importance": "medium",
        "purpose": "",
        "tags": [],
        "usage_instructions": "",
        "constraints": ""
    })

    processing_metadata = Column(JSONB, nullable=False, default={})
    custom_metadata = Column(JSONB, nullable=False, default={})

    # Lifecycle management
    is_archived = Column(Boolean, default=False)
    archived_at = Column(DateTime(timezone=True))
    auto_disabled_reason = Column(String(255))
```

### New Service Files

#### `src/app/services/indexing_service.py`
```python
"""
🆕 NEW FILE: Coordinates document indexing across all components.
Purpose: Orchestrates the complete document-to-vector pipeline.
"""

class IndexingService:
    """
    Coordinates document processing, chunking, embedding, and vector storage.
    Provides a unified interface for the entire indexing pipeline.
    """

    async def index_document(self, document_id: UUID) -> IndexingResult:
        """
        Complete document indexing pipeline:
        1. Extract content (DocumentProcessingService)
        2. Generate chunks (ChunkingService)
        3. Generate embeddings (EmbeddingService)
        4. Store vectors (VectorStoreService)
        5. Update document status
        """

    async def reindex_document(self, document_id: UUID) -> IndexingResult:
        """Re-index existing document with new settings."""

    async def batch_index_documents(self, document_ids: List[UUID]) -> List[IndexingResult]:
        """Efficiently index multiple documents in parallel."""

    async def get_indexing_status(self, document_id: UUID) -> IndexingStatus:
        """Get current indexing status and progress."""
```

#### `src/app/services/audit_service.py`
```python
"""
🆕 NEW FILE: HIPAA/SOC2 compliant audit logging.
Purpose: Comprehensive audit trail for all KB operations.
"""

class AuditService:
    """
    HIPAA/SOC2 compliant audit logging for all KB operations.
    Tracks access, modifications, and administrative actions.
    """

    async def log_kb_access(self, kb_id: UUID, user_id: UUID, action: str, details: Dict):
        """Log knowledge base access events."""

    async def log_document_operation(self, doc_id: UUID, operation: str, user_id: UUID):
        """Log document CRUD operations."""

    async def log_search_activity(self, kb_id: UUID, query_hash: str, user_id: UUID):
        """Log search queries (hashed for privacy)."""

    async def log_data_export(self, resource_id: UUID, export_type: str, user_id: UUID):
        """Log data export events for compliance."""

    async def generate_audit_report(self, start_date: datetime, end_date: datetime) -> AuditReport:
        """Generate compliance audit reports."""
```

### New Integration Files

#### `src/app/integrations/unstructured_adapter.py`
```python
"""
🆕 NEW FILE: Unstructured.io integration for smart document parsing.
Purpose: Preserve document structure while extracting content.
"""

class UnstructuredAdapter:
    """
    Adapter for Unstructured.io document processing.
    Preserves tables, headings, and document structure.
    """

    async def process_document(self, file_path: str, strategy: str = "hi_res") -> ProcessingResult:
        """
        Process document using Unstructured.io:
        - Extract text with structure preservation
        - Detect and preserve tables
        - Maintain heading hierarchy
        - Extract images and charts
        """

    async def extract_tables(self, file_path: str) -> List[TableData]:
        """Extract structured table data separately."""

    async def get_document_metadata(self, file_path: str) -> DocumentMetadata:
        """Extract document metadata (author, title, etc.)."""
```

#### `src/app/integrations/qdrant_adapter.py`
```python
"""
🆕 NEW FILE: Qdrant vector database adapter.
Purpose: Optimized Qdrant operations with retry logic and performance tuning.
"""

class QdrantAdapter:
    """
    Production-ready Qdrant adapter with:
    - Connection pooling
    - Retry logic with exponential backoff
    - Batch operations optimization
    - Tenant isolation
    - Performance monitoring
    """

    async def create_collection(self, collection_name: str, vector_size: int, **config):
        """Create optimized vector collection."""

    async def upsert_vectors_batch(self, collection_name: str, vectors: List[VectorData]):
        """Batch upsert with optimal performance."""

    async def search_similar(self, collection_name: str, query_vector: List[float], **params):
        """Optimized similarity search with filtering."""

    async def get_collection_stats(self, collection_name: str) -> CollectionStats:
        """Get collection performance statistics."""
```

### New Task Files

#### `src/app/tasks/embedding_tasks.py`
```python
"""
🆕 NEW FILE: Background tasks for embedding generation.
Purpose: Process embeddings asynchronously with retry logic.
"""

@celery.task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def generate_embeddings_task(self, chunk_ids: List[str], model_name: str):
    """
    Generate embeddings for chunks in background.
    Includes retry logic and progress tracking.
    """

@celery.task(bind=True)
def batch_embed_documents_task(self, document_ids: List[str]):
    """Process multiple documents in parallel."""

@celery.task(bind=True)
def reembed_knowledge_base_task(self, kb_id: str, new_model: str):
    """Re-embed entire KB with new model."""
```

#### `src/app/tasks/cleanup_tasks.py`
```python
"""
🆕 NEW FILE: Data cleanup and maintenance tasks.
Purpose: Automated cleanup of orphaned data and old files.
"""

@celery.task
def cleanup_orphaned_vectors_task():
    """Remove vectors for deleted documents."""

@celery.task
def cleanup_expired_drafts_task():
    """Remove expired draft data from Redis."""

@celery.task
def archive_old_documents_task():
    """Archive documents based on retention policy."""

@celery.task
def compress_old_embeddings_task():
    """Compress old embedding data for storage efficiency."""
```

### New Utility Files

#### `src/app/utils/file_processing.py`
```python
"""
🆕 NEW FILE: File processing utilities.
Purpose: Secure file handling, validation, and storage.
"""

class FileProcessor:
    """Secure file processing utilities."""

    @staticmethod
    def validate_file_upload(file: UploadFile) -> ValidationResult:
        """Comprehensive file validation."""

    @staticmethod
    def secure_file_storage(file_content: bytes, filename: str, workspace_id: UUID) -> str:
        """Securely store uploaded files with encryption."""

    @staticmethod
    def extract_file_metadata(file_path: str) -> FileMetadata:
        """Extract file metadata safely."""

    @staticmethod
    def cleanup_temp_files(older_than_hours: int = 24):
        """Clean up temporary files."""
```

#### `src/app/utils/security_utils.py`
```python
"""
🆕 NEW FILE: Security utilities for KB operations.
Purpose: Input validation, sanitization, and security checks.
"""

class SecurityUtils:
    """Security utilities for KB operations."""

    @staticmethod
    def sanitize_text_input(text: str) -> str:
        """Sanitize user text input."""

    @staticmethod
    def validate_search_query(query: str) -> bool:
        """Validate search query for security."""

    @staticmethod
    def check_rate_limit(user_id: UUID, operation: str) -> bool:
        """Check operation rate limits."""

    @staticmethod
    def encrypt_sensitive_data(data: str, key: str) -> str:
        """Encrypt sensitive data for storage."""
```

### New Core Files

#### `src/app/core/logging.py`
```python
"""
🆕 NEW FILE: Structured logging configuration.
Purpose: Comprehensive logging for debugging and compliance.
"""

import logging
import json
from datetime import datetime

class StructuredLogger:
    """
    Structured logging for KB operations.
    Outputs JSON logs for easy parsing and analysis.
    """

    @staticmethod
    def setup_logging(log_level: str = "INFO"):
        """Configure structured logging."""

    @staticmethod
    def log_performance(operation: str, duration_ms: float, metadata: Dict):
        """Log performance metrics."""

    @staticmethod
    def log_error(error: Exception, context: Dict):
        """Log errors with context."""

    @staticmethod
    def log_audit_event(event_type: str, user_id: UUID, details: Dict):
        """Log audit events for compliance."""
```

#### `src/app/core/exceptions.py`
```python
"""
🆕 NEW FILE: Custom exception definitions.
Purpose: Standardized error handling across KB system.
"""

class KBException(Exception):
    """Base exception for KB operations."""
    pass

class DocumentProcessingError(KBException):
    """Document processing failed."""
    pass

class EmbeddingGenerationError(KBException):
    """Embedding generation failed."""
    pass

class VectorStoreError(KBException):
    """Vector store operation failed."""
    pass

class TenantIsolationError(KBException):
    """Tenant isolation violation."""
    pass

class ComplianceViolationError(KBException):
    """HIPAA/SOC2 compliance violation."""
    pass
```

---

## Configuration Files

### Database Migration Files

#### `alembic/versions/001_initial_kb_system.py`
```python
"""
🆕 NEW FILE: Initial KB system database schema.
Creates all tables for knowledge base functionality.
"""

def upgrade():
    # Create knowledge_bases table
    op.create_table('knowledge_bases', ...)

    # Create documents table
    op.create_table('documents', ...)

    # Create chunks table
    op.create_table('chunks', ...)

    # Create performance indexes
    op.create_index('ix_kb_workspace_status', 'knowledge_bases', ['workspace_id', 'status'])
    op.create_index('ix_documents_kb_status', 'documents', ['knowledge_base_id', 'status'])
    op.create_index('ix_chunks_document', 'chunks', ['document_id'])
```

#### `alembic/versions/004_add_audit_tables.py`
```python
"""
🆕 NEW FILE: Add audit logging tables for compliance.
"""

def upgrade():
    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True)),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True)),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('details', postgresql.JSONB()),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.Text()),
        sa.Column('success', sa.Boolean, nullable=False),
        sa.Column('error_message', sa.Text()),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Index('ix_audit_logs_timestamp', 'timestamp'),
        sa.Index('ix_audit_logs_user_org', 'user_id', 'organization_id'),
        sa.Index('ix_audit_logs_resource', 'resource_type', 'resource_id')
    )
```

### Docker Configuration Files

#### `docker/Dockerfile.production`
```dockerfile
# 🆕 NEW FILE: Production Docker image with optimizations
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash privexbot
USER privexbot
WORKDIR /app

# Install Python dependencies
COPY requirements/production.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ src/
COPY alembic/ alembic/
COPY alembic.ini .

# Create directories for data
RUN mkdir -p /app/{models,storage,logs}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Python Dependency Files

#### `requirements/base.txt`
```txt
# 🆕 NEW FILE: Core dependencies for KB system
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
pydantic==2.5.0
redis==5.0.1
celery==5.3.4

# Document processing
unstructured[all]==0.11.2
sentence-transformers==2.2.2
PyMuPDF==1.23.8
python-docx==1.1.0
pandas==2.1.3
openpyxl==3.1.2

# Vector database
qdrant-client==1.7.0

# Security
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
cryptography==41.0.7

# Utilities
python-multipart==0.0.6
aiofiles==23.2.1
pillow==10.1.0
tiktoken==0.5.1
bleach==6.1.0
```

#### `requirements/production.txt`
```txt
# 🆕 NEW FILE: Production-specific dependencies
-r base.txt

# Production server
gunicorn==21.2.0

# Monitoring
prometheus-client==0.19.0
structlog==23.2.0

# Performance
orjson==3.9.10
ujson==5.8.0

# Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

### Environment Configuration

#### `.env.production`
```bash
# 🆕 NEW FILE: Production environment configuration
# Application
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-super-secure-secret-key

# Database
DATABASE_URL=postgresql://privexbot:password@localhost:5432/privexbot_prod
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password
REDIS_DB_CACHE=0
REDIS_DB_DRAFTS=1
REDIS_DB_EMBEDDINGS=2

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_GRPC_PORT=6334
QDRANT_API_KEY=your-qdrant-api-key

# KB Configuration
DEFAULT_EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_MODELS_PATH=/app/models
MAX_FILE_SIZE=50MB
TEMP_UPLOAD_PATH=/tmp/uploads
PERMANENT_STORAGE_PATH=/app/storage

# Celery
CELERY_BROKER_URL=redis://localhost:6379/3
CELERY_RESULT_BACKEND=redis://localhost:6379/4
CELERY_WORKER_CONCURRENCY=4

# Security & Compliance
ENABLE_AUDIT_LOGGING=true
ENCRYPT_FILES_AT_REST=true
ENCRYPTION_KEY=your-32-byte-encryption-key

# Performance
CHUNK_PROCESSING_BATCH_SIZE=100
EMBEDDING_BATCH_SIZE=32
VECTOR_UPSERT_BATCH_SIZE=100

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=INFO
```

---

## Testing Structure

### Unit Test Files

#### `src/app/tests/unit/test_chunking_service.py`
```python
"""
🆕 NEW FILE: Unit tests for chunking service.
"""

class TestChunkingService:
    """Comprehensive tests for text chunking functionality."""

    def test_recursive_chunking_strategy(self):
        """Test recursive chunking with different separators."""

    def test_by_heading_chunking(self):
        """Test heading-based chunking."""

    def test_chunk_size_limits(self):
        """Test chunk size and overlap validation."""

    def test_token_counting_accuracy(self):
        """Test token counting accuracy."""

    def test_overlap_handling(self):
        """Test chunk overlap preservation."""
```

#### `src/app/tests/integration/test_kb_creation_flow.py`
```python
"""
🆕 NEW FILE: Integration tests for complete KB creation.
"""

class TestKBCreationFlow:
    """End-to-end tests for KB creation workflow."""

    async def test_complete_kb_creation_flow(self):
        """Test entire flow from draft to production KB."""

    async def test_multi_source_kb_creation(self):
        """Test KB with multiple document sources."""

    async def test_kb_creation_with_annotations(self):
        """Test KB creation with document annotations."""

    async def test_kb_creation_failure_scenarios(self):
        """Test error handling in KB creation."""
```

### Performance Test Files

#### `src/app/tests/performance/test_search_latency.py`
```python
"""
🆕 NEW FILE: Performance tests for search operations.
"""

class TestSearchPerformance:
    """Performance tests for KB search functionality."""

    async def test_vector_search_latency(self):
        """Test vector search response times."""

    async def test_hybrid_search_performance(self):
        """Test hybrid search performance under load."""

    async def test_concurrent_search_requests(self):
        """Test system under concurrent search load."""

    async def test_large_kb_search_performance(self):
        """Test search performance with large knowledge bases."""
```

---

## Deployment Files

### Production Deployment Scripts

#### `scripts/deploy_production.sh`
```bash
#!/bin/bash
# 🆕 NEW FILE: Production deployment automation

echo "🚀 Starting KB Production Deployment"

# Prerequisites check
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    # Check Docker, Docker Compose, environment files
}

# Download and cache embedding models
setup_embedding_models() {
    echo "🤖 Setting up embedding models..."
    python3 scripts/setup_embedding_models.py
}

# Start infrastructure services
start_infrastructure() {
    echo "🔧 Starting infrastructure services..."
    docker-compose -f docker/docker-compose.qdrant.yml up -d
    # Wait for readiness checks
}

# Run database migrations
run_migrations() {
    echo "🗄️ Running database migrations..."
    cd src && alembic upgrade head && cd ..
}

# Deploy application
deploy_application() {
    echo "🚀 Deploying application..."
    docker-compose -f docker/docker-compose.production.yml up -d
}

# Verify deployment
verify_deployment() {
    echo "🏥 Running health checks..."
    # Test all endpoints and services
}

# Main deployment flow
main() {
    check_prerequisites
    setup_embedding_models
    start_infrastructure
    run_migrations
    deploy_application
    verify_deployment
    echo "✅ Deployment complete!"
}

main "$@"
```

This comprehensive file structure guide provides the complete blueprint for implementing a production-ready knowledge base system. Each file has a clear purpose and implementation guidance, ensuring consistent architecture across the entire system.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create complete file/folder structure documentation", "status": "completed", "activeForm": "Creating complete file/folder structure documentation"}, {"content": "Create self-hosted infrastructure setup guide", "status": "in_progress", "activeForm": "Creating self-hosted infrastructure setup guide"}, {"content": "Review and validate existing KB pseudocodes for accuracy", "status": "pending", "activeForm": "Reviewing and validating existing KB pseudocodes"}, {"content": "Create HIPAA/SOC2 compliance documentation", "status": "pending", "activeForm": "Creating HIPAA/SOC2 compliance documentation"}, {"content": "Create deployment verification checklist", "status": "pending", "activeForm": "Creating deployment verification checklist"}]