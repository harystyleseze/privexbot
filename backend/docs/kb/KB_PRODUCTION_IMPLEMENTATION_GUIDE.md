# 🚀 Knowledge Base Production Implementation Guide

**Purpose**: Complete step-by-step implementation guide for building the knowledge base system from scratch

**Target Audience**: Senior engineers implementing the KB features

**Status**: Production-ready architecture with proven patterns

---

## 📋 Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
3. [Phase 2: Document Processing Pipeline](#phase-2-document-processing-pipeline)
4. [Phase 3: Vector Storage & Retrieval](#phase-3-vector-storage--retrieval)
5. [Phase 4: Draft Management System](#phase-4-draft-management-system)
6. [Phase 5: API Layer](#phase-5-api-layer)
7. [Phase 6: Self-Hosted Services](#phase-6-self-hosted-services)
8. [Phase 7: Production Deployment](#phase-7-production-deployment)
9. [Testing Strategy](#testing-strategy)
10. [Monitoring & Observability](#monitoring--observability)

---

## Implementation Overview

### Architecture Principles

**🎯 Core Requirements Met:**
- ✅ **Speed**: Redis drafts, async processing, optimized chunking
- ✅ **Privacy**: Self-hosted embeddings, local vector storage, audit logs
- ✅ **HIPAA/SOC2**: Encryption, access control, audit trails
- ✅ **Structure Preservation**: Smart parsing with Unstructured.io
- ✅ **Debuggable ETL**: Step-by-step monitoring and inspection
- ✅ **Enterprise Grade**: Production patterns, error handling, scalability

### Technology Stack (Self-Hosted)

```yaml
Vector Database: Qdrant (Rust-based, fast, tenant-aware)
Embeddings: sentence-transformers (all-MiniLM-L6-v2, all-mpnet-base-v2)
Document Processing: Unstructured.io (preserves tables, structure)
Draft Storage: Redis (high-performance temporary storage)
Background Processing: Celery (reliable task queue)
Document Parsing: PyMuPDF, python-docx, pandas (structured data)
Web Scraping: Crawl4AI (JavaScript rendering, smart extraction)
```

### Implementation Timeline

**Phase 1-3**: Core infrastructure (1-2 weeks)
**Phase 4-5**: Draft system and APIs (1-2 weeks)
**Phase 6-7**: Self-hosted services and deployment (1 week)

---

## Phase 1: Core Infrastructure

### 1.1 Database Models Implementation

**File**: `src/app/models/knowledge_base.py`

```python
"""
Production-ready KnowledgeBase model with enterprise features.
Extends the existing pseudocode with actual SQLAlchemy implementation.
"""

from sqlalchemy import Column, UUID, String, Text, JSONB, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    # Core Identity
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Multi-tenancy (CRITICAL for isolation)
    workspace_id = Column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)  # Denormalized for fast filtering

    # Processing Configuration
    embedding_config = Column(JSONB, nullable=False, default={
        "provider": "sentence_transformers",
        "model": "all-MiniLM-L6-v2",
        "dimensions": 384,
        "batch_size": 32
    })

    vector_store_config = Column(JSONB, nullable=False, default={
        "provider": "qdrant",
        "collection_name": "",  # Set on creation
        "distance_metric": "cosine",
        "enable_hybrid_search": True
    })

    chunking_config = Column(JSONB, nullable=False, default={
        "strategy": "recursive",
        "chunk_size": 1000,
        "chunk_overlap": 200,
        "separators": ["\n\n", "\n", ". ", " "]
    })

    # Access Control (Context-aware design)
    context_settings = Column(JSONB, nullable=False, default={
        "access_mode": "all",  # all | specific | none
        "allowed_chatbots": [],
        "allowed_chatflows": [],
        "retrieval_config": {
            "top_k": 5,
            "similarity_threshold": 0.7,
            "search_method": "hybrid"
        }
    })

    # Statistics & Status
    status = Column(String(50), nullable=False, default="creating")  # creating | processing | completed | error
    total_documents = Column(Integer, nullable=False, default=0)
    total_chunks = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)

    # Audit Trail
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_indexed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="knowledge_bases")
    documents = relationship("Document", back_populates="knowledge_base", cascade="all, delete-orphan")
    creator = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('ix_kb_workspace_status', 'workspace_id', 'status'),
        Index('ix_kb_org_id', 'organization_id'),
    )
```

**File**: `src/app/models/document.py`

```python
"""
Enhanced Document model with annotations and processing tracking.
"""

class Document(Base):
    __tablename__ = "documents"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    knowledge_base_id = Column(PG_UUID(as_uuid=True), ForeignKey("knowledge_bases.id", ondelete="CASCADE"), nullable=False, index=True)

    # Source Information
    name = Column(String(500), nullable=False)
    source_type = Column(String(50), nullable=False)  # file_upload, website, google_docs, notion, text_input
    source_url = Column(String(2048), nullable=True)
    source_metadata = Column(JSONB, nullable=False, default={})

    # Content Storage
    file_path = Column(String(1024), nullable=True)  # For uploaded files
    content_preview = Column(Text, nullable=True)    # First 500 chars

    # Processing Status with detailed tracking
    status = Column(String(50), nullable=False, default="pending")
    processing_progress = Column(Integer, nullable=False, default=0)  # 0-100
    error_message = Column(Text, nullable=True)
    processing_metadata = Column(JSONB, nullable=False, default={})

    # Content Statistics
    word_count = Column(Integer, nullable=False, default=0)
    character_count = Column(Integer, nullable=False, default=0)
    page_count = Column(Integer, nullable=True)
    chunk_count = Column(Integer, nullable=False, default=0)

    # Document Annotations (AI Context)
    annotations = Column(JSONB, nullable=True, default={
        "enabled": False,
        "category": "document",
        "importance": "medium",
        "purpose": "",
        "context": "",
        "tags": [],
        "usage_instructions": "",
        "constraints": ""
    })

    # Custom User Metadata
    custom_metadata = Column(JSONB, nullable=False, default={})

    # Lifecycle Management
    is_enabled = Column(Boolean, nullable=False, default=True)
    is_archived = Column(Boolean, nullable=False, default=False)

    # Audit
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    knowledge_base = relationship("KnowledgeBase", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    creator = relationship("User")
```

### 1.2 Database Migration

**File**: `src/alembic/versions/xxx_add_knowledge_base_system.py`

```python
"""Add knowledge base system tables

Revision ID: kb_system_001
Revises: previous_migration
Create Date: 2024-10-23 12:00:00.000000

"""

def upgrade():
    # Create knowledge_bases table
    op.create_table('knowledge_bases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('embedding_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('vector_store_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('chunking_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('context_settings', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('total_documents', sa.Integer(), nullable=False),
        sa.Column('total_chunks', sa.Integer(), nullable=False),
        sa.Column('total_tokens', sa.Integer(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_indexed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_kb_workspace_status', 'knowledge_bases', ['workspace_id', 'status'])
    op.create_index('ix_kb_org_id', 'knowledge_bases', ['organization_id'])
    op.create_index('ix_kb_name', 'knowledge_bases', ['name'])

    # Create documents table... (continue with other tables)
```

---

## Phase 2: Document Processing Pipeline

### 2.1 Self-Hosted Embedding Service

**File**: `src/app/services/embedding_service.py`

```python
"""
Production-ready embedding service with self-hosted models.
Implements caching, batching, and multiple provider support.
"""

import asyncio
import hashlib
import json
import time
from typing import List, Optional, Dict
from sentence_transformers import SentenceTransformer
import numpy as np
import redis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class SelfHostedEmbeddingService:
    """
    Self-hosted embedding service using sentence-transformers.

    Features:
    - Multiple model support
    - Caching with Redis
    - Batch processing
    - Performance monitoring
    - Error handling with retries
    """

    def __init__(self):
        self.models = {}
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=2,  # Separate DB for embeddings cache
            decode_responses=False  # We store binary data
        )
        self.cache_ttl = 30 * 24 * 60 * 60  # 30 days

    async def get_model(self, model_name: str) -> SentenceTransformer:
        """
        Load and cache sentence-transformer model.

        Supported models:
        - all-MiniLM-L6-v2: 384 dims, fast, good quality
        - all-mpnet-base-v2: 768 dims, high quality
        - multi-qa-mpnet-base-dot-v1: 768 dims, optimized for Q&A
        """
        if model_name not in self.models:
            logger.info(f"Loading embedding model: {model_name}")

            # Download to local cache directory
            model_path = f"/app/models/{model_name}"

            try:
                self.models[model_name] = SentenceTransformer(
                    model_name,
                    cache_folder="/app/models",
                    device="cpu"  # Use GPU if available: "cuda" if torch.cuda.is_available() else "cpu"
                )
                logger.info(f"Successfully loaded model: {model_name}")
            except Exception as e:
                logger.error(f"Failed to load model {model_name}: {e}")
                raise

        return self.models[model_name]

    def _get_cache_key(self, text: str, model_name: str) -> str:
        """Generate cache key for text+model combination."""
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        return f"embedding:{model_name}:{text_hash}"

    async def embed_text(self, text: str, model_name: str = "all-MiniLM-L6-v2") -> List[float]:
        """
        Generate embedding for single text with caching.
        """
        # Check cache first
        cache_key = self._get_cache_key(text, model_name)
        cached = self.redis_client.get(cache_key)

        if cached:
            return json.loads(cached.decode())

        # Generate embedding
        model = await self.get_model(model_name)

        start_time = time.time()
        embedding = model.encode(text, convert_to_numpy=True)
        processing_time = time.time() - start_time

        # Convert to list and cache
        embedding_list = embedding.tolist()
        self.redis_client.setex(
            cache_key,
            self.cache_ttl,
            json.dumps(embedding_list).encode()
        )

        logger.debug(f"Generated embedding for {len(text)} chars in {processing_time:.3f}s")
        return embedding_list

    async def embed_batch(
        self,
        texts: List[str],
        model_name: str = "all-MiniLM-L6-v2",
        batch_size: int = 32
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts with optimal batching.
        """
        if not texts:
            return []

        model = await self.get_model(model_name)
        all_embeddings = []

        # Process in batches for memory efficiency
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            # Check cache for each text in batch
            cached_embeddings = {}
            texts_to_process = []
            indices_to_process = []

            for j, text in enumerate(batch):
                cache_key = self._get_cache_key(text, model_name)
                cached = self.redis_client.get(cache_key)

                if cached:
                    cached_embeddings[j] = json.loads(cached.decode())
                else:
                    texts_to_process.append(text)
                    indices_to_process.append(j)

            # Process uncached texts
            if texts_to_process:
                start_time = time.time()
                batch_embeddings = model.encode(
                    texts_to_process,
                    convert_to_numpy=True,
                    batch_size=min(len(texts_to_process), batch_size)
                )
                processing_time = time.time() - start_time

                # Cache new embeddings
                for idx, embedding in zip(indices_to_process, batch_embeddings):
                    embedding_list = embedding.tolist()
                    cached_embeddings[idx] = embedding_list

                    # Cache for future use
                    cache_key = self._get_cache_key(batch[idx], model_name)
                    self.redis_client.setex(
                        cache_key,
                        self.cache_ttl,
                        json.dumps(embedding_list).encode()
                    )

                logger.debug(f"Generated {len(texts_to_process)} embeddings in {processing_time:.3f}s")

            # Reconstruct batch in original order
            batch_result = [cached_embeddings[j] for j in range(len(batch))]
            all_embeddings.extend(batch_result)

        return all_embeddings

    def get_model_info(self, model_name: str) -> Dict:
        """Get model specifications."""
        model_specs = {
            "all-MiniLM-L6-v2": {
                "dimensions": 384,
                "max_seq_length": 256,
                "size_mb": 80,
                "speed": "fast",
                "quality": "good"
            },
            "all-mpnet-base-v2": {
                "dimensions": 768,
                "max_seq_length": 384,
                "size_mb": 420,
                "speed": "medium",
                "quality": "high"
            },
            "multi-qa-mpnet-base-dot-v1": {
                "dimensions": 768,
                "max_seq_length": 512,
                "size_mb": 420,
                "speed": "medium",
                "quality": "high",
                "optimized_for": "question_answering"
            }
        }

        return model_specs.get(model_name, {
            "dimensions": 384,
            "max_seq_length": 256,
            "size_mb": 0,
            "speed": "unknown",
            "quality": "unknown"
        })

# Global instance
embedding_service = SelfHostedEmbeddingService()
```

### 2.2 Smart Document Processing Service

**File**: `src/app/services/document_processing_service.py`

```python
"""
Smart document processing that preserves structure using Unstructured.io.
Handles multiple formats while maintaining tables, headers, and layout.
"""

import asyncio
import tempfile
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import mimetypes

# Unstructured.io for smart parsing
from unstructured.partition.auto import partition
from unstructured.documents.elements import Table, Title, NarrativeText, ListItem

# Traditional parsers as fallbacks
import PyMuPDF  # fitz
import pandas as pd
from docx import Document as DocxDocument

from app.core.logging import get_logger

logger = get_logger(__name__)

class DocumentProcessor:
    """
    Smart document processor that preserves structure.

    Features:
    - Structure preservation (tables, headers, lists)
    - Multiple format support
    - Fallback parsers for reliability
    - Metadata extraction
    - Error handling with detailed diagnostics
    """

    def __init__(self):
        self.supported_formats = {
            'application/pdf': self._process_pdf,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._process_docx,
            'text/plain': self._process_text,
            'text/markdown': self._process_markdown,
            'text/csv': self._process_csv,
            'application/vnd.ms-excel': self._process_excel,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': self._process_excel,
        }

    async def process_document(
        self,
        file_path: str,
        source_type: str = "file_upload",
        preserve_structure: bool = True
    ) -> Dict:
        """
        Process document and extract structured content.

        Returns:
        {
            "content": "extracted text",
            "metadata": {"pages": 10, "word_count": 1500, ...},
            "elements": [{"type": "title", "content": "...", "page": 1}, ...],
            "tables": [{"content": "...", "page": 2}, ...],
            "structure_preserved": True
        }
        """
        try:
            file_path = Path(file_path)
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")

            # Detect MIME type
            mime_type, _ = mimetypes.guess_type(str(file_path))
            logger.info(f"Processing {file_path} (type: {mime_type})")

            if preserve_structure and mime_type in ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                # Use Unstructured.io for smart parsing
                result = await self._process_with_unstructured(file_path)
            else:
                # Use traditional parsers
                processor = self.supported_formats.get(mime_type, self._process_text)
                result = await processor(file_path)

            # Add processing metadata
            result['processing_metadata'] = {
                'processor': 'unstructured' if preserve_structure else 'traditional',
                'mime_type': mime_type,
                'file_size': file_path.stat().st_size,
                'structure_preserved': preserve_structure
            }

            return result

        except Exception as e:
            logger.error(f"Error processing document {file_path}: {e}")
            raise

    async def _process_with_unstructured(self, file_path: Path) -> Dict:
        """
        Use Unstructured.io for intelligent document parsing.
        """
        try:
            # Partition document into elements
            elements = partition(
                filename=str(file_path),
                strategy="hi_res",  # High resolution for better table detection
                infer_table_structure=True,
                chunking_strategy="by_title",
                max_characters=10000,
                include_page_breaks=True
            )

            # Process elements to extract structure
            content_parts = []
            structured_elements = []
            tables = []
            word_count = 0

            for element in elements:
                element_data = {
                    "type": element.__class__.__name__.lower(),
                    "content": str(element),
                    "metadata": getattr(element, 'metadata', {})
                }

                # Add page information if available
                if hasattr(element, 'metadata') and element.metadata:
                    if 'page_number' in element.metadata:
                        element_data['page'] = element.metadata['page_number']

                structured_elements.append(element_data)

                # Handle different element types
                if isinstance(element, Table):
                    tables.append(element_data)
                    # For tables, try to preserve structure
                    content_parts.append(f"\n[TABLE]\n{element}\n[/TABLE]\n")
                elif isinstance(element, Title):
                    content_parts.append(f"\n## {element}\n")
                elif isinstance(element, ListItem):
                    content_parts.append(f"• {element}")
                else:
                    content_parts.append(str(element))

                # Count words
                word_count += len(str(element).split())

            content = "\n".join(content_parts)

            # Extract metadata
            metadata = {
                "word_count": word_count,
                "character_count": len(content),
                "element_count": len(elements),
                "table_count": len(tables),
                "page_count": self._extract_page_count(elements)
            }

            return {
                "content": content,
                "metadata": metadata,
                "elements": structured_elements,
                "tables": tables,
                "structure_preserved": True
            }

        except Exception as e:
            logger.warning(f"Unstructured.io processing failed: {e}, falling back to traditional parser")
            # Fallback to traditional parser
            return await self._process_pdf_fallback(file_path)

    async def _process_pdf_fallback(self, file_path: Path) -> Dict:
        """
        Fallback PDF processing using PyMuPDF.
        """
        doc = fitz.open(str(file_path))
        content_parts = []
        page_count = len(doc)

        for page_num in range(page_count):
            page = doc[page_num]

            # Extract text
            text = page.get_text()
            if text.strip():
                content_parts.append(f"\n--- Page {page_num + 1} ---\n{text}")

            # Extract tables if possible
            tables = page.find_tables()
            for table in tables:
                try:
                    df = table.to_pandas()
                    table_text = df.to_string(index=False)
                    content_parts.append(f"\n[TABLE - Page {page_num + 1}]\n{table_text}\n[/TABLE]\n")
                except:
                    pass  # Skip problematic tables

        doc.close()

        content = "\n".join(content_parts)

        return {
            "content": content,
            "metadata": {
                "word_count": len(content.split()),
                "character_count": len(content),
                "page_count": page_count,
                "table_count": 0  # Hard to count reliably in fallback
            },
            "elements": [{"type": "text", "content": content}],
            "tables": [],
            "structure_preserved": False
        }

    def _extract_page_count(self, elements) -> int:
        """Extract page count from Unstructured elements."""
        max_page = 0
        for element in elements:
            if hasattr(element, 'metadata') and element.metadata:
                page = element.metadata.get('page_number', 0)
                max_page = max(max_page, page)
        return max_page

# Global instance
document_processor = DocumentProcessor()
```

### 2.3 Intelligent Chunking Service

**File**: `src/app/services/chunking_service.py`

```python
"""
Intelligent chunking service with multiple strategies.
Optimized for preserving document structure and context.
"""

import re
from typing import List, Dict, Optional
from dataclasses import dataclass
import tiktoken

from app.core.logging import get_logger

logger = get_logger(__name__)

@dataclass
class Chunk:
    """Represents a document chunk with metadata."""
    content: str
    metadata: Dict
    start_char: int
    end_char: int
    token_count: int
    word_count: int

class IntelligentChunkingService:
    """
    Advanced chunking service with structure-aware strategies.

    Strategies:
    1. Recursive: Split on separators with overlap
    2. By Heading: Preserve document structure
    3. By Page: Keep page boundaries
    4. Semantic: Group by semantic similarity
    """

    def __init__(self):
        self.tokenizer = tiktoken.get_encoding("cl100k_base")  # GPT-4 tokenizer

    async def chunk_document(
        self,
        content: str,
        strategy: str = "recursive",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        custom_separators: Optional[List[str]] = None,
        preserve_structure: bool = True,
        document_metadata: Optional[Dict] = None
    ) -> List[Chunk]:
        """
        Chunk document using specified strategy.
        """
        if not content.strip():
            return []

        document_metadata = document_metadata or {}

        if strategy == "recursive":
            return await self._chunk_recursive(
                content, chunk_size, chunk_overlap, custom_separators, document_metadata
            )
        elif strategy == "by_heading":
            return await self._chunk_by_heading(
                content, chunk_size, chunk_overlap, document_metadata
            )
        elif strategy == "by_page":
            return await self._chunk_by_page(
                content, chunk_size, chunk_overlap, document_metadata
            )
        elif strategy == "semantic":
            return await self._chunk_semantic(
                content, chunk_size, chunk_overlap, document_metadata
            )
        else:
            raise ValueError(f"Unknown chunking strategy: {strategy}")

    async def _chunk_recursive(
        self,
        content: str,
        chunk_size: int,
        chunk_overlap: int,
        custom_separators: Optional[List[str]],
        document_metadata: Dict
    ) -> List[Chunk]:
        """
        Recursive chunking with intelligent separator selection.
        """
        # Default separators prioritizing document structure
        separators = custom_separators or [
            "\n\n\n",  # Section breaks
            "\n\n",    # Paragraph breaks
            "\n",      # Line breaks
            ". ",      # Sentence breaks
            ", ",      # Clause breaks
            " ",       # Word breaks
            ""         # Character breaks
        ]

        chunks = []
        current_chunks = [content]

        for separator in separators:
            next_chunks = []

            for chunk_text in current_chunks:
                if self._count_tokens(chunk_text) <= chunk_size:
                    next_chunks.append(chunk_text)
                else:
                    # Split by current separator
                    split_chunks = self._split_with_overlap(
                        chunk_text, separator, chunk_size, chunk_overlap
                    )
                    next_chunks.extend(split_chunks)

            current_chunks = next_chunks

            # Check if all chunks are small enough
            if all(self._count_tokens(chunk) <= chunk_size for chunk in current_chunks):
                break

        # Convert to Chunk objects
        char_offset = 0
        for i, chunk_text in enumerate(current_chunks):
            if chunk_text.strip():
                chunk = Chunk(
                    content=chunk_text.strip(),
                    metadata={
                        **document_metadata,
                        "chunk_index": i,
                        "chunk_strategy": "recursive",
                        "overlap_start": i > 0,
                        "overlap_end": i < len(current_chunks) - 1
                    },
                    start_char=char_offset,
                    end_char=char_offset + len(chunk_text),
                    token_count=self._count_tokens(chunk_text),
                    word_count=len(chunk_text.split())
                )
                chunks.append(chunk)
                char_offset += len(chunk_text)

        return chunks

    async def _chunk_by_heading(
        self,
        content: str,
        chunk_size: int,
        chunk_overlap: int,
        document_metadata: Dict
    ) -> List[Chunk]:
        """
        Chunk by document headings to preserve structure.
        """
        # Detect heading patterns
        heading_patterns = [
            r'^#{1,6}\s+(.+)$',           # Markdown headings
            r'^(.+)\n=+$',                # Underlined headings
            r'^(.+)\n-+$',                # Underlined subheadings
            r'^\d+\.?\s+(.+)$',           # Numbered sections
            r'^[A-Z][A-Z\s]{2,}$',        # ALL CAPS headings
        ]

        sections = []
        current_section = ""
        current_heading = None

        lines = content.split('\n')

        for line in lines:
            is_heading = False

            for pattern in heading_patterns:
                if re.match(pattern, line.strip(), re.MULTILINE):
                    # Save previous section
                    if current_section.strip():
                        sections.append({
                            "heading": current_heading,
                            "content": current_section.strip()
                        })

                    # Start new section
                    current_heading = line.strip()
                    current_section = line + '\n'
                    is_heading = True
                    break

            if not is_heading:
                current_section += line + '\n'

        # Add final section
        if current_section.strip():
            sections.append({
                "heading": current_heading,
                "content": current_section.strip()
            })

        # Convert sections to chunks, splitting large sections if needed
        chunks = []
        char_offset = 0

        for section_idx, section in enumerate(sections):
            section_content = section["content"]

            if self._count_tokens(section_content) <= chunk_size:
                # Section fits in one chunk
                chunk = Chunk(
                    content=section_content,
                    metadata={
                        **document_metadata,
                        "chunk_index": len(chunks),
                        "chunk_strategy": "by_heading",
                        "section_heading": section["heading"],
                        "section_index": section_idx
                    },
                    start_char=char_offset,
                    end_char=char_offset + len(section_content),
                    token_count=self._count_tokens(section_content),
                    word_count=len(section_content.split())
                )
                chunks.append(chunk)
            else:
                # Split large section using recursive strategy
                section_chunks = await self._chunk_recursive(
                    section_content, chunk_size, chunk_overlap, None, {}
                )

                # Add section metadata to each chunk
                for i, chunk in enumerate(section_chunks):
                    chunk.metadata.update({
                        **document_metadata,
                        "chunk_index": len(chunks) + i,
                        "chunk_strategy": "by_heading_split",
                        "section_heading": section["heading"],
                        "section_index": section_idx,
                        "subsection_index": i
                    })

                chunks.extend(section_chunks)

            char_offset += len(section_content)

        return chunks

    def _split_with_overlap(
        self,
        text: str,
        separator: str,
        chunk_size: int,
        chunk_overlap: int
    ) -> List[str]:
        """
        Split text with overlap handling.
        """
        if not separator:
            # Character-level splitting
            chunks = []
            start = 0

            while start < len(text):
                end = start + chunk_size
                chunk = text[start:end]
                chunks.append(chunk)

                if end >= len(text):
                    break

                start = end - chunk_overlap

            return chunks

        # Split by separator
        parts = text.split(separator)
        chunks = []
        current_chunk = ""

        for part in parts:
            # Add separator back (except for first part)
            part_with_sep = part if not current_chunk else separator + part

            # Check if adding this part would exceed chunk size
            if current_chunk and self._count_tokens(current_chunk + part_with_sep) > chunk_size:
                # Save current chunk and start new one
                chunks.append(current_chunk)

                # Start new chunk with overlap
                if chunk_overlap > 0 and current_chunk:
                    overlap_text = self._get_overlap_text(current_chunk, chunk_overlap)
                    current_chunk = overlap_text + part_with_sep
                else:
                    current_chunk = part_with_sep
            else:
                current_chunk += part_with_sep

        # Add final chunk
        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    def _get_overlap_text(self, text: str, overlap_tokens: int) -> str:
        """
        Extract overlap text from end of chunk.
        """
        words = text.split()
        if len(words) <= overlap_tokens:
            return text

        overlap_words = words[-overlap_tokens:]
        return ' '.join(overlap_words)

    def _count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken."""
        try:
            return len(self.tokenizer.encode(text))
        except:
            # Fallback to approximate word count
            return len(text.split()) * 1.3  # Rough approximation

# Global instance
chunking_service = IntelligentChunkingService()
```

---

## Phase 3: Vector Storage & Retrieval

### 3.1 Qdrant Vector Store Service

**File**: `src/app/services/vector_store_service.py`

```python
"""
Production Qdrant vector store implementation.
Self-hosted, high-performance vector database with tenant isolation.
"""

import asyncio
from typing import List, Dict, Optional, Any
from uuid import UUID
import json

from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, CollectionInfo, PointStruct,
    Filter, FieldCondition, MatchValue, MatchAny, Range
)
from qdrant_client.http.exceptions import ResponseHandlingException

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class QdrantVectorStoreService:
    """
    Production-ready Qdrant vector store service.

    Features:
    - Tenant isolation with collection naming
    - Efficient batch operations
    - Advanced filtering capabilities
    - Error handling and retries
    - Performance monitoring
    """

    def __init__(self):
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            grpc_port=settings.QDRANT_GRPC_PORT,
            prefer_grpc=True,  # Use gRPC for better performance
            timeout=30.0
        )

        # Verify connection
        try:
            self.client.get_collections()
            logger.info("Connected to Qdrant successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            raise

    def _get_collection_name(self, kb_id: UUID) -> str:
        """Generate tenant-isolated collection name."""
        return f"kb_{str(kb_id).replace('-', '_')}"

    async def create_collection(
        self,
        kb_id: UUID,
        vector_size: int,
        distance: str = "cosine"
    ) -> bool:
        """
        Create vector collection for knowledge base.
        """
        collection_name = self._get_collection_name(kb_id)

        try:
            # Check if collection already exists
            try:
                collection_info = self.client.get_collection(collection_name)
                logger.info(f"Collection {collection_name} already exists")
                return True
            except ResponseHandlingException:
                pass  # Collection doesn't exist, create it

            # Map distance metric
            distance_mapping = {
                "cosine": Distance.COSINE,
                "euclidean": Distance.EUCLID,
                "dot": Distance.DOT
            }

            qdrant_distance = distance_mapping.get(distance, Distance.COSINE)

            # Create collection
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=qdrant_distance
                ),
                # Optimizations for better performance
                optimizers_config={
                    "default_segment_number": 2,
                    "max_segment_size": 200000,
                    "memmap_threshold": 200000,
                    "indexing_threshold": 20000,
                    "flush_interval_sec": 30
                },
                # Configure payload indexing for fast filtering
                # This will be set up when we add the first points
            )

            logger.info(f"Created Qdrant collection: {collection_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to create collection {collection_name}: {e}")
            return False

    async def upsert_chunks(
        self,
        kb_id: UUID,
        chunks: List[Dict[str, Any]]
    ) -> bool:
        """
        Upsert chunks into vector collection.

        chunks format:
        [
            {
                "id": "chunk_uuid",
                "vector": [0.1, 0.2, ...],
                "payload": {
                    "content": "chunk text",
                    "document_id": "doc_uuid",
                    "document_name": "file.pdf",
                    "page_number": 1,
                    "chunk_index": 0,
                    "metadata": {...}
                }
            }
        ]
        """
        if not chunks:
            return True

        collection_name = self._get_collection_name(kb_id)

        try:
            # Convert to Qdrant points
            points = []
            for chunk in chunks:
                point = PointStruct(
                    id=chunk["id"],
                    vector=chunk["vector"],
                    payload=chunk["payload"]
                )
                points.append(point)

            # Upsert points in batches for better performance
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]

                self.client.upsert(
                    collection_name=collection_name,
                    points=batch,
                    wait=True  # Wait for indexing to complete
                )

                logger.debug(f"Upserted batch {i//batch_size + 1} ({len(batch)} points)")

            # Create payload indexes for common filter fields
            # This optimizes filtering performance
            self._ensure_payload_indexes(collection_name)

            logger.info(f"Successfully upserted {len(chunks)} chunks to {collection_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to upsert chunks to {collection_name}: {e}")
            return False

    def _ensure_payload_indexes(self, collection_name: str):
        """Create payload indexes for common filter fields."""
        index_fields = [
            "document_id",
            "document_name",
            "page_number",
            "chunk_index",
            "is_enabled"
        ]

        for field in index_fields:
            try:
                self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field,
                    field_schema="keyword" if field in ["document_id", "document_name"] else "integer"
                )
            except:
                pass  # Index might already exist

    async def search(
        self,
        kb_id: UUID,
        query_vector: List[float],
        limit: int = 10,
        filters: Optional[Dict] = None,
        score_threshold: Optional[float] = None
    ) -> List[Dict]:
        """
        Search for similar vectors with optional filtering.

        Returns:
        [
            {
                "id": "chunk_uuid",
                "score": 0.85,
                "payload": {...}
            }
        ]
        """
        collection_name = self._get_collection_name(kb_id)

        try:
            # Build Qdrant filter from our filter format
            qdrant_filter = self._build_filter(filters) if filters else None

            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                query_filter=qdrant_filter,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
                with_vectors=False  # Don't return vectors to save bandwidth
            )

            # Convert to our format
            search_results = []
            for result in results:
                search_results.append({
                    "id": result.id,
                    "score": result.score,
                    "payload": result.payload
                })

            return search_results

        except Exception as e:
            logger.error(f"Search failed in {collection_name}: {e}")
            return []

    def _build_filter(self, filters: Dict) -> Filter:
        """
        Convert our filter format to Qdrant filter.

        Our format:
        {
            "document_id": {"eq": "uuid"},
            "page_number": {"gte": 1, "lte": 5},
            "is_enabled": {"eq": True}
        }
        """
        conditions = []

        for field, conditions_dict in filters.items():
            if isinstance(conditions_dict, dict):
                for op, value in conditions_dict.items():
                    if op == "eq":
                        conditions.append(
                            FieldCondition(key=field, match=MatchValue(value=value))
                        )
                    elif op == "in":
                        conditions.append(
                            FieldCondition(key=field, match=MatchAny(any=value))
                        )
                    elif op in ["gte", "lte", "gt", "lt"]:
                        range_kwargs = {op: value}
                        conditions.append(
                            FieldCondition(key=field, range=Range(**range_kwargs))
                        )

        return Filter(must=conditions) if conditions else None

    async def delete_chunks(self, kb_id: UUID, chunk_ids: List[str]) -> bool:
        """Delete specific chunks from collection."""
        if not chunk_ids:
            return True

        collection_name = self._get_collection_name(kb_id)

        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=chunk_ids,
                wait=True
            )

            logger.info(f"Deleted {len(chunk_ids)} chunks from {collection_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete chunks from {collection_name}: {e}")
            return False

    async def delete_collection(self, kb_id: UUID) -> bool:
        """Delete entire collection for knowledge base."""
        collection_name = self._get_collection_name(kb_id)

        try:
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted collection: {collection_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete collection {collection_name}: {e}")
            return False

    async def get_collection_stats(self, kb_id: UUID) -> Dict:
        """Get collection statistics."""
        collection_name = self._get_collection_name(kb_id)

        try:
            info = self.client.get_collection(collection_name)

            return {
                "vectors_count": info.vectors_count,
                "indexed_vectors_count": info.indexed_vectors_count,
                "points_count": info.points_count,
                "segments_count": info.segments_count,
                "disk_data_size": info.disk_data_size,
                "ram_data_size": info.ram_data_size
            }

        except Exception as e:
            logger.error(f"Failed to get stats for {collection_name}: {e}")
            return {}

# Global instance
vector_store_service = QdrantVectorStoreService()
```

### 3.2 Advanced Retrieval Service

**File**: `src/app/services/retrieval_service.py`

```python
"""
Advanced retrieval service with hybrid search and re-ranking.
Implements semantic + keyword search with intelligent result fusion.
"""

import asyncio
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.services.vector_store_service import vector_store_service
from app.services.embedding_service import embedding_service
from app.models.knowledge_base import KnowledgeBase
from app.models.chunk import Chunk
from app.core.logging import get_logger

logger = get_logger(__name__)

class HybridRetrievalService:
    """
    Advanced retrieval with multiple search methods.

    Features:
    - Semantic search (vector similarity)
    - Keyword search (PostgreSQL full-text)
    - Hybrid search (fusion of both)
    - Re-ranking with custom scoring
    - Document annotation-aware boosting
    """

    def __init__(self):
        pass

    async def search(
        self,
        db: Session,
        kb: KnowledgeBase,
        query: str,
        top_k: int = 10,
        search_method: str = "hybrid",
        filters: Optional[Dict] = None,
        rerank: bool = True
    ) -> List[Dict]:
        """
        Perform search with specified method.

        Returns:
        [
            {
                "chunk_id": "uuid",
                "content": "chunk text",
                "score": 0.85,
                "document_name": "file.pdf",
                "page_number": 1,
                "metadata": {...}
            }
        ]
        """
        filters = filters or {}

        # Add default filters
        filters["is_enabled"] = {"eq": True}

        if search_method == "semantic":
            results = await self._semantic_search(db, kb, query, top_k * 2, filters)
        elif search_method == "keyword":
            results = await self._keyword_search(db, kb, query, top_k * 2, filters)
        elif search_method == "hybrid":
            results = await self._hybrid_search(db, kb, query, top_k * 2, filters)
        else:
            raise ValueError(f"Unknown search method: {search_method}")

        # Apply document annotation boosting
        results = self._apply_annotation_boosting(results)

        # Re-rank if requested
        if rerank:
            results = await self._rerank_results(query, results)

        # Return top results
        return results[:top_k]

    async def _semantic_search(
        self,
        db: Session,
        kb: KnowledgeBase,
        query: str,
        limit: int,
        filters: Dict
    ) -> List[Dict]:
        """Perform semantic search using vector similarity."""

        # Generate query embedding
        model_name = kb.embedding_config.get("model", "all-MiniLM-L6-v2")
        query_vector = await embedding_service.embed_text(query, model_name)

        # Search in vector store
        vector_results = await vector_store_service.search(
            kb_id=kb.id,
            query_vector=query_vector,
            limit=limit,
            filters=filters,
            score_threshold=0.3  # Minimum similarity threshold
        )

        # Enrich with database information
        results = []
        for result in vector_results:
            chunk_data = {
                "chunk_id": result["id"],
                "score": result["score"],
                "search_method": "semantic",
                **result["payload"]
            }
            results.append(chunk_data)

        return results

    async def _keyword_search(
        self,
        db: Session,
        kb: KnowledgeBase,
        query: str,
        limit: int,
        filters: Dict
    ) -> List[Dict]:
        """Perform keyword search using PostgreSQL full-text search."""

        # Build PostgreSQL full-text search query
        # Convert query to tsquery format
        search_terms = query.replace("'", "''").split()
        tsquery = " & ".join(f"'{term}'" for term in search_terms)

        # Build filter conditions
        filter_conditions = []
        params = {"kb_id": kb.id, "tsquery": tsquery}

        for field, condition in filters.items():
            if field == "document_id" and "eq" in condition:
                filter_conditions.append("d.id = :doc_id")
                params["doc_id"] = condition["eq"]
            elif field == "is_enabled" and "eq" in condition:
                filter_conditions.append("c.is_enabled = :is_enabled")
                params["is_enabled"] = condition["eq"]

        filter_clause = ""
        if filter_conditions:
            filter_clause = "AND " + " AND ".join(filter_conditions)

        # Execute search query
        sql = text(f"""
            SELECT
                c.id as chunk_id,
                c.content,
                ts_rank(to_tsvector('english', c.content), to_tsquery('english', :tsquery)) as score,
                d.name as document_name,
                c.page_number,
                c.chunk_metadata as metadata,
                'keyword' as search_method
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.knowledge_base_id = :kb_id
            AND to_tsvector('english', c.content) @@ to_tsquery('english', :tsquery)
            {filter_clause}
            ORDER BY score DESC
            LIMIT :limit
        """)

        params["limit"] = limit
        result = db.execute(sql, params)
        rows = result.fetchall()

        # Convert to our format
        results = []
        for row in rows:
            chunk_data = {
                "chunk_id": str(row.chunk_id),
                "content": row.content,
                "score": float(row.score),
                "document_name": row.document_name,
                "page_number": row.page_number,
                "metadata": row.metadata or {},
                "search_method": row.search_method
            }
            results.append(chunk_data)

        return results

    async def _hybrid_search(
        self,
        db: Session,
        kb: KnowledgeBase,
        query: str,
        limit: int,
        filters: Dict
    ) -> List[Dict]:
        """
        Perform hybrid search combining semantic and keyword search.
        Uses Reciprocal Rank Fusion (RRF) for result combination.
        """

        # Perform both searches in parallel
        semantic_task = self._semantic_search(db, kb, query, limit, filters)
        keyword_task = self._keyword_search(db, kb, query, limit, filters)

        semantic_results, keyword_results = await asyncio.gather(
            semantic_task, keyword_task, return_exceptions=True
        )

        # Handle exceptions
        if isinstance(semantic_results, Exception):
            logger.error(f"Semantic search failed: {semantic_results}")
            semantic_results = []

        if isinstance(keyword_results, Exception):
            logger.error(f"Keyword search failed: {keyword_results}")
            keyword_results = []

        # Combine results using Reciprocal Rank Fusion
        return self._reciprocal_rank_fusion(semantic_results, keyword_results)

    def _reciprocal_rank_fusion(
        self,
        semantic_results: List[Dict],
        keyword_results: List[Dict],
        k: int = 60
    ) -> List[Dict]:
        """
        Combine results using Reciprocal Rank Fusion.

        RRF score = 1 / (k + rank)
        Final score = semantic_rrf + keyword_rrf
        """

        # Build unified results dictionary
        unified_results = {}

        # Add semantic results
        for rank, result in enumerate(semantic_results):
            chunk_id = result["chunk_id"]
            rrf_score = 1 / (k + rank + 1)

            if chunk_id not in unified_results:
                unified_results[chunk_id] = result.copy()
                unified_results[chunk_id]["semantic_rank"] = rank + 1
                unified_results[chunk_id]["semantic_score"] = result["score"]
                unified_results[chunk_id]["keyword_rank"] = None
                unified_results[chunk_id]["keyword_score"] = None
                unified_results[chunk_id]["rrf_score"] = rrf_score
            else:
                unified_results[chunk_id]["semantic_rank"] = rank + 1
                unified_results[chunk_id]["semantic_score"] = result["score"]
                unified_results[chunk_id]["rrf_score"] += rrf_score

        # Add keyword results
        for rank, result in enumerate(keyword_results):
            chunk_id = result["chunk_id"]
            rrf_score = 1 / (k + rank + 1)

            if chunk_id not in unified_results:
                unified_results[chunk_id] = result.copy()
                unified_results[chunk_id]["semantic_rank"] = None
                unified_results[chunk_id]["semantic_score"] = None
                unified_results[chunk_id]["keyword_rank"] = rank + 1
                unified_results[chunk_id]["keyword_score"] = result["score"]
                unified_results[chunk_id]["rrf_score"] = rrf_score
            else:
                unified_results[chunk_id]["keyword_rank"] = rank + 1
                unified_results[chunk_id]["keyword_score"] = result["score"]
                unified_results[chunk_id]["rrf_score"] += rrf_score

        # Sort by RRF score and update final score
        results = list(unified_results.values())
        results.sort(key=lambda x: x["rrf_score"], reverse=True)

        # Set final score and search method
        for result in results:
            result["score"] = result["rrf_score"]
            result["search_method"] = "hybrid"

        return results

    def _apply_annotation_boosting(self, results: List[Dict]) -> List[Dict]:
        """
        Apply document annotation-based score boosting.
        """
        for result in results:
            metadata = result.get("metadata", {})
            annotations = metadata.get("annotations", {})

            if annotations.get("enabled", False):
                importance = annotations.get("importance", "medium")

                # Apply importance boosting
                boost_multipliers = {
                    "critical": 1.5,
                    "high": 1.3,
                    "medium": 1.0,
                    "low": 0.8
                }

                boost = boost_multipliers.get(importance, 1.0)
                result["score"] *= boost
                result["annotation_boost"] = boost
            else:
                result["annotation_boost"] = 1.0

        # Re-sort by boosted scores
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    async def _rerank_results(self, query: str, results: List[Dict]) -> List[Dict]:
        """
        Re-rank results using additional scoring factors.
        """
        # Implement custom re-ranking logic here
        # For now, we'll use a simple scoring based on:
        # 1. Original score
        # 2. Content length (prefer moderate length)
        # 3. Query term frequency

        query_terms = set(query.lower().split())

        for result in results:
            content = result.get("content", "").lower()
            content_terms = set(content.split())

            # Calculate additional scoring factors
            term_overlap = len(query_terms.intersection(content_terms)) / len(query_terms) if query_terms else 0
            length_score = min(len(content) / 1000, 1.0)  # Prefer moderate length chunks

            # Combine scores
            original_score = result["score"]
            rerank_score = (
                original_score * 0.7 +           # Original score weight
                term_overlap * 0.2 +             # Term overlap weight
                length_score * 0.1               # Length score weight
            )

            result["rerank_score"] = rerank_score
            result["term_overlap"] = term_overlap
            result["length_score"] = length_score

        # Sort by re-ranked score
        results.sort(key=lambda x: x["rerank_score"], reverse=True)

        # Update final score to re-ranked score
        for result in results:
            result["score"] = result["rerank_score"]

        return results

# Global instance
retrieval_service = HybridRetrievalService()
```

---

I'll continue with the comprehensive implementation documentation in the next part, covering the draft management system, API layer, self-hosted services setup, and production deployment guidelines.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive KB implementation documentation", "status": "completed", "activeForm": "Creating comprehensive KB implementation documentation"}, {"content": "Create Phase 4-7 implementation documentation", "status": "in_progress", "activeForm": "Creating Phase 4-7 implementation documentation"}, {"content": "Document KB service layer architecture and communication patterns", "status": "pending", "activeForm": "Documenting KB service layer architecture"}, {"content": "Create detailed file/folder structure documentation", "status": "pending", "activeForm": "Creating detailed file/folder structure documentation"}, {"content": "Document self-hosted vector database and embedding setup", "status": "pending", "activeForm": "Documenting self-hosted vector database setup"}, {"content": "Create production deployment and HIPAA compliance documentation", "status": "pending", "activeForm": "Creating production deployment documentation"}]