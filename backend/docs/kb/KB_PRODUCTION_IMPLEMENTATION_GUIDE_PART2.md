# 🚀 Knowledge Base Production Implementation Guide - Part 2

**Continuation of the comprehensive KB implementation guide**

**Covers**: Phases 4-7 (Draft Management, APIs, Self-Hosted Services, Production Deployment)

---

## Phase 4: Draft Management System

### 4.1 Enhanced Draft Service

**File**: `src/app/services/kb_draft_service.py`

```python
"""
Production-ready KB draft service with comprehensive preview capabilities.
Extends existing draft functionality with real-time preview and validation.
"""

import asyncio
import json
import tempfile
from pathlib import Path
from typing import List, Dict, Optional, Any
from uuid import UUID

from app.services.draft_service import draft_service, DraftType
from app.services.document_processing_service import document_processor
from app.services.chunking_service import chunking_service
from app.services.embedding_service import embedding_service
from app.core.logging import get_logger

logger = get_logger(__name__)

class ProductionKBDraftService:
    """
    Enhanced KB draft service with production features.

    Features:
    - Real-time chunk preview
    - Document processing pipeline
    - Validation and error handling
    - Cost estimation
    - Source management
    """

    def __init__(self):
        self.temp_storage = Path("/tmp/kb_drafts")
        self.temp_storage.mkdir(exist_ok=True)

    async def create_kb_draft(
        self,
        workspace_id: UUID,
        created_by: UUID,
        name: str,
        description: Optional[str] = None
    ) -> str:
        """Create new KB draft with initial configuration."""

        initial_data = {
            "name": name,
            "description": description or "",
            "sources": [],
            "chunking_config": {
                "strategy": "recursive",
                "chunk_size": 1000,
                "chunk_overlap": 200,
                "separators": ["\n\n", "\n", ". ", " "]
            },
            "embedding_config": {
                "provider": "sentence_transformers",
                "model": "all-MiniLM-L6-v2",
                "dimensions": 384,
                "batch_size": 32
            },
            "vector_store_config": {
                "provider": "qdrant",
                "distance_metric": "cosine",
                "enable_hybrid_search": True
            },
            "processing_status": {
                "sources_added": 0,
                "sources_processed": 0,
                "estimated_chunks": 0,
                "estimated_cost": 0.0
            }
        }

        draft_id = draft_service.create_draft(
            draft_type=DraftType.KB,
            workspace_id=workspace_id,
            created_by=created_by,
            initial_data=initial_data
        )

        logger.info(f"Created KB draft: {draft_id}")
        return draft_id

    async def add_file_source(
        self,
        draft_id: str,
        file_path: str,
        original_filename: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Add file upload source to draft."""

        try:
            # Process document to extract metadata
            processing_result = await document_processor.process_document(
                file_path=file_path,
                source_type="file_upload",
                preserve_structure=True
            )

            # Create source entry
            source = {
                "id": f"source_{len(self._get_sources(draft_id))}",
                "type": "file_upload",
                "name": original_filename,
                "status": "completed",
                "file_path": file_path,
                "metadata": {
                    **(metadata or {}),
                    **processing_result["metadata"],
                    "original_filename": original_filename,
                    "processing_metadata": processing_result["processing_metadata"]
                },
                "content_preview": processing_result["content"][:500],
                "processing_result": processing_result
            }

            # Add to draft
            self._add_source_to_draft(draft_id, source)

            # Update processing status
            await self._update_processing_status(draft_id)

            logger.info(f"Added file source to draft {draft_id}: {original_filename}")
            return source

        except Exception as e:
            logger.error(f"Failed to add file source: {e}")
            raise

    async def add_website_source(
        self,
        draft_id: str,
        url: str,
        crawl_config: Dict,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Add website crawling source to draft."""

        source = {
            "id": f"source_{len(self._get_sources(draft_id))}",
            "type": "website_crawl",
            "name": f"Website: {url}",
            "status": "pending",
            "url": url,
            "crawl_config": crawl_config,
            "metadata": metadata or {},
            "content_preview": "",
            "pages_found": 0,
            "pages_processed": 0
        }

        # Add to draft
        self._add_source_to_draft(draft_id, source)

        # Start background crawling task
        from app.tasks.crawling_tasks import crawl_website_task
        crawl_website_task.delay(draft_id, source["id"], url, crawl_config)

        logger.info(f"Started website crawl for draft {draft_id}: {url}")
        return source

    async def add_text_source(
        self,
        draft_id: str,
        title: str,
        content: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Add direct text input source to draft."""

        # Basic text processing
        word_count = len(content.split())
        char_count = len(content)

        source = {
            "id": f"source_{len(self._get_sources(draft_id))}",
            "type": "text_input",
            "name": title,
            "status": "completed",
            "content": content,
            "metadata": {
                **(metadata or {}),
                "word_count": word_count,
                "character_count": char_count
            },
            "content_preview": content[:500],
            "processing_result": {
                "content": content,
                "metadata": {
                    "word_count": word_count,
                    "character_count": char_count
                },
                "elements": [{"type": "text", "content": content}],
                "tables": [],
                "structure_preserved": False
            }
        }

        # Add to draft
        self._add_source_to_draft(draft_id, source)

        # Update processing status
        await self._update_processing_status(draft_id)

        logger.info(f"Added text source to draft {draft_id}: {title}")
        return source

    async def preview_chunks(
        self,
        draft_id: str,
        source_id: Optional[str] = None
    ) -> Dict:
        """
        Generate chunk preview for sources in draft.
        This shows exactly how documents will be chunked without saving to database.
        """

        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise ValueError(f"Draft not found: {draft_id}")

        sources = draft["data"]["sources"]
        chunking_config = draft["data"]["chunking_config"]

        # Filter sources if specific source requested
        if source_id:
            sources = [s for s in sources if s["id"] == source_id]

        if not sources:
            return {"chunks": [], "total_chunks": 0, "total_tokens": 0}

        all_chunks = []
        total_tokens = 0

        for source in sources:
            if source["status"] != "completed":
                continue

            # Get content from source
            content = ""
            if source["type"] == "file_upload":
                processing_result = source.get("processing_result", {})
                content = processing_result.get("content", "")
            elif source["type"] == "text_input":
                content = source.get("content", "")
            elif source["type"] == "website_crawl":
                # For website crawl, combine all page contents
                pages = source.get("pages", [])
                content = "\n\n".join(page.get("content", "") for page in pages)

            if not content:
                continue

            # Generate chunks
            chunks = await chunking_service.chunk_document(
                content=content,
                strategy=chunking_config["strategy"],
                chunk_size=chunking_config["chunk_size"],
                chunk_overlap=chunking_config["chunk_overlap"],
                custom_separators=chunking_config.get("separators"),
                document_metadata={
                    "source_id": source["id"],
                    "source_type": source["type"],
                    "source_name": source["name"]
                }
            )

            # Convert chunks to preview format
            for i, chunk in enumerate(chunks):
                chunk_preview = {
                    "id": f"{source['id']}_chunk_{i}",
                    "content": chunk.content,
                    "token_count": chunk.token_count,
                    "word_count": chunk.word_count,
                    "char_count": len(chunk.content),
                    "source_id": source["id"],
                    "source_name": source["name"],
                    "chunk_index": i,
                    "metadata": chunk.metadata
                }
                all_chunks.append(chunk_preview)
                total_tokens += chunk.token_count

        # Calculate preview statistics
        preview_stats = {
            "chunks": all_chunks,
            "total_chunks": len(all_chunks),
            "total_tokens": total_tokens,
            "avg_chunk_size": sum(c["char_count"] for c in all_chunks) / len(all_chunks) if all_chunks else 0,
            "avg_token_count": total_tokens / len(all_chunks) if all_chunks else 0,
            "estimated_embedding_cost": self._estimate_embedding_cost(total_tokens, draft["data"]["embedding_config"])
        }

        return preview_stats

    async def validate_draft(self, draft_id: str) -> Dict:
        """
        Comprehensive draft validation before finalization.
        """

        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise ValueError(f"Draft not found: {draft_id}")

        errors = []
        warnings = []
        data = draft["data"]

        # Basic validation
        if not data.get("name", "").strip():
            errors.append("Knowledge base name is required")

        sources = data.get("sources", [])
        if not sources:
            errors.append("At least one source must be added")

        # Check source completion
        completed_sources = [s for s in sources if s["status"] == "completed"]
        if not completed_sources:
            errors.append("At least one source must be successfully processed")

        pending_sources = [s for s in sources if s["status"] == "pending"]
        if pending_sources:
            warnings.append(f"{len(pending_sources)} sources are still being processed")

        failed_sources = [s for s in sources if s["status"] == "error"]
        if failed_sources:
            warnings.append(f"{len(failed_sources)} sources failed to process")

        # Configuration validation
        chunking_config = data.get("chunking_config", {})
        if chunking_config.get("chunk_size", 0) < 100:
            warnings.append("Chunk size is very small, may result in fragmented context")

        if chunking_config.get("chunk_size", 0) > 4000:
            warnings.append("Chunk size is very large, may exceed model context limits")

        # Estimate total cost and processing time
        preview = await self.preview_chunks(draft_id)
        total_tokens = preview["total_tokens"]

        if total_tokens > 1000000:  # 1M tokens
            warnings.append(f"Large knowledge base ({total_tokens:,} tokens) will take significant time to process")

        validation_result = {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "stats": {
                "total_sources": len(sources),
                "completed_sources": len(completed_sources),
                "pending_sources": len(pending_sources),
                "failed_sources": len(failed_sources),
                "estimated_chunks": preview["total_chunks"],
                "estimated_tokens": total_tokens,
                "estimated_cost": preview["estimated_embedding_cost"],
                "estimated_processing_time": self._estimate_processing_time(total_tokens)
            }
        }

        return validation_result

    async def finalize_draft(self, db, draft_id: str) -> UUID:
        """
        Finalize draft and create KB with background processing.
        """

        # Validate first
        validation = await self.validate_draft(draft_id)
        if not validation["valid"]:
            raise ValueError(f"Draft validation failed: {validation['errors']}")

        draft = draft_service.get_draft(DraftType.KB, draft_id)
        data = draft["data"]

        # Create KB record
        from app.models.knowledge_base import KnowledgeBase

        kb = KnowledgeBase(
            workspace_id=UUID(draft["workspace_id"]),
            name=data["name"],
            description=data.get("description"),
            embedding_config=data["embedding_config"],
            vector_store_config=data["vector_store_config"],
            chunking_config=data["chunking_config"],
            context_settings=data.get("context_settings", {}),
            status="processing",
            created_by=UUID(draft["created_by"])
        )

        db.add(kb)
        db.flush()  # Get KB ID

        # Set collection name for vector store
        kb.vector_store_config["collection_name"] = f"kb_{str(kb.id).replace('-', '_')}"

        # Create document records for each completed source
        document_ids = []
        for source in data["sources"]:
            if source["status"] != "completed":
                continue

            from app.models.document import Document

            doc = Document(
                knowledge_base_id=kb.id,
                name=source["name"],
                source_type=source["type"],
                source_url=source.get("url"),
                source_metadata=source["metadata"],
                file_path=source.get("file_path"),
                content_preview=source.get("content_preview", "")[:500],
                custom_metadata=source.get("custom_metadata", {}),
                status="pending",
                created_by=UUID(draft["created_by"])
            )

            db.add(doc)
            db.flush()
            document_ids.append(doc.id)

        db.commit()

        # Queue background processing for each document
        from app.tasks.document_tasks import process_kb_document_task

        for doc_id in document_ids:
            process_kb_document_task.delay(str(doc_id))

        # Delete draft
        draft_service.delete_draft(DraftType.KB, draft_id)

        logger.info(f"Finalized KB draft {draft_id} -> KB {kb.id}")
        return kb.id

    def _get_sources(self, draft_id: str) -> List[Dict]:
        """Get sources from draft."""
        draft = draft_service.get_draft(DraftType.KB, draft_id)
        return draft["data"]["sources"] if draft else []

    def _add_source_to_draft(self, draft_id: str, source: Dict):
        """Add source to draft."""
        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise ValueError(f"Draft not found: {draft_id}")

        sources = draft["data"]["sources"]
        sources.append(source)

        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={"data": {"sources": sources}}
        )

    async def _update_processing_status(self, draft_id: str):
        """Update processing status statistics."""
        sources = self._get_sources(draft_id)

        completed_sources = [s for s in sources if s["status"] == "completed"]
        total_chunks = 0
        total_cost = 0.0

        for source in completed_sources:
            processing_result = source.get("processing_result", {})
            metadata = processing_result.get("metadata", {})
            total_chunks += metadata.get("estimated_chunks", 0)

        # Update draft with new status
        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={
                "data": {
                    "processing_status": {
                        "sources_added": len(sources),
                        "sources_processed": len(completed_sources),
                        "estimated_chunks": total_chunks,
                        "estimated_cost": total_cost
                    }
                }
            }
        )

    def _estimate_embedding_cost(self, total_tokens: int, embedding_config: Dict) -> float:
        """Estimate embedding cost based on model and token count."""
        # Cost estimates (per 1M tokens)
        cost_per_million = {
            "all-MiniLM-L6-v2": 0.0,  # Free (self-hosted)
            "all-mpnet-base-v2": 0.0,  # Free (self-hosted)
            "text-embedding-ada-002": 100.0,  # OpenAI pricing
            "text-embedding-3-small": 20.0,
            "text-embedding-3-large": 130.0
        }

        model = embedding_config.get("model", "all-MiniLM-L6-v2")
        cost_per_mil = cost_per_million.get(model, 0.0)

        return (total_tokens / 1_000_000) * cost_per_mil

    def _estimate_processing_time(self, total_tokens: int) -> int:
        """Estimate processing time in seconds."""
        # Rough estimates based on typical performance
        tokens_per_second = 1000  # Conservative estimate
        return max(60, total_tokens // tokens_per_second)

# Global instance
kb_draft_service = ProductionKBDraftService()
```

---

## Phase 5: API Layer

### 5.1 KB Draft API Routes

**File**: `src/app/api/v1/routes/kb_draft.py`

```python
"""
KB Draft API endpoints for draft mode knowledge base creation.
Provides RESTful API for the entire draft workflow.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_db, get_current_user, verify_workspace_access
from app.services.kb_draft_service import kb_draft_service
from app.services.tenant_service import tenant_service
from app.schemas.kb_draft import *
from app.models.user import User
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.post("/", response_model=KBDraftResponse)
async def create_kb_draft(
    request: CreateKBDraftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new KB draft.

    - **name**: Knowledge base name
    - **description**: Optional description
    - **workspace_id**: Target workspace ID
    """
    try:
        # Verify workspace access
        await tenant_service.verify_workspace_access(
            db, current_user.id, request.workspace_id, required_permission="kb:create"
        )

        draft_id = await kb_draft_service.create_kb_draft(
            workspace_id=request.workspace_id,
            created_by=current_user.id,
            name=request.name,
            description=request.description
        )

        return KBDraftResponse(
            draft_id=draft_id,
            status="created",
            message="KB draft created successfully"
        )

    except Exception as e:
        logger.error(f"Failed to create KB draft: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{draft_id}", response_model=KBDraftDetails)
async def get_kb_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get KB draft details."""
    try:
        from app.services.draft_service import draft_service, DraftType

        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        # Verify user access (user must be creator or have workspace access)
        if draft["created_by"] != str(current_user.id):
            # TODO: Add workspace permission check
            pass

        return KBDraftDetails(**draft)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get KB draft: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{draft_id}/sources/upload", response_model=SourceResponse)
async def upload_file_source(
    draft_id: str,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    metadata: Optional[str] = Form("{}"),  # JSON string
    current_user: User = Depends(get_current_user)
):
    """
    Upload file to KB draft.

    Supports: PDF, DOCX, TXT, MD, CSV files
    """
    try:
        import json
        import tempfile
        import shutil
        from pathlib import Path

        # Validate file type
        allowed_types = {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
            "text/csv"
        }

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )

        # Save to temporary location
        temp_dir = Path("/tmp/kb_uploads")
        temp_dir.mkdir(exist_ok=True)

        file_path = temp_dir / f"{draft_id}_{file.filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse metadata
        parsed_metadata = json.loads(metadata) if metadata != "{}" else {}

        # Add file source
        source = await kb_draft_service.add_file_source(
            draft_id=draft_id,
            file_path=str(file_path),
            original_filename=file.filename,
            metadata=parsed_metadata
        )

        return SourceResponse(**source)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload file: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{draft_id}/sources/website", response_model=SourceResponse)
async def add_website_source(
    draft_id: str,
    request: WebsiteSourceRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Add website crawling source to KB draft.
    """
    try:
        source = await kb_draft_service.add_website_source(
            draft_id=draft_id,
            url=request.url,
            crawl_config=request.crawl_config.dict(),
            metadata=request.metadata
        )

        return SourceResponse(**source)

    except Exception as e:
        logger.error(f"Failed to add website source: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{draft_id}/sources/text", response_model=SourceResponse)
async def add_text_source(
    draft_id: str,
    request: TextSourceRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Add direct text input source to KB draft.
    """
    try:
        source = await kb_draft_service.add_text_source(
            draft_id=draft_id,
            title=request.title,
            content=request.content,
            metadata=request.metadata
        )

        return SourceResponse(**source)

    except Exception as e:
        logger.error(f"Failed to add text source: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{draft_id}/sources", response_model=List[SourceResponse])
async def list_draft_sources(
    draft_id: str,
    current_user: User = Depends(get_current_user)
):
    """List all sources in KB draft."""
    try:
        from app.services.draft_service import draft_service, DraftType

        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        sources = draft["data"]["sources"]
        return [SourceResponse(**source) for source in sources]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list sources: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{draft_id}/sources/{source_id}")
async def remove_source(
    draft_id: str,
    source_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove source from KB draft."""
    try:
        from app.services.draft_service import draft_service, DraftType

        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        sources = draft["data"]["sources"]
        sources = [s for s in sources if s["id"] != source_id]

        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={"data": {"sources": sources}}
        )

        return {"message": "Source removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove source: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{draft_id}/preview-chunks", response_model=ChunkPreviewResponse)
async def preview_chunks(
    draft_id: str,
    request: Optional[ChunkPreviewRequest] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Generate chunk preview for KB draft.
    Shows exactly how documents will be chunked.
    """
    try:
        source_id = request.source_id if request else None

        preview = await kb_draft_service.preview_chunks(
            draft_id=draft_id,
            source_id=source_id
        )

        return ChunkPreviewResponse(**preview)

    except Exception as e:
        logger.error(f"Failed to preview chunks: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{draft_id}/validate", response_model=ValidationResponse)
async def validate_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Validate KB draft before finalization.
    """
    try:
        validation = await kb_draft_service.validate_draft(draft_id)
        return ValidationResponse(**validation)

    except Exception as e:
        logger.error(f"Failed to validate draft: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{draft_id}/finalize", response_model=FinalizeResponse)
async def finalize_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finalize KB draft and create knowledge base.
    This starts background processing for all documents.
    """
    try:
        kb_id = await kb_draft_service.finalize_draft(db, draft_id)

        return FinalizeResponse(
            kb_id=kb_id,
            status="processing",
            message="Knowledge base created successfully. Documents are being processed in the background."
        )

    except Exception as e:
        logger.error(f"Failed to finalize draft: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{draft_id}/config", response_model=ConfigUpdateResponse)
async def update_draft_config(
    draft_id: str,
    request: ConfigUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update KB draft configuration (chunking, embedding, etc.).
    """
    try:
        from app.services.draft_service import draft_service, DraftType

        updates = {}
        if request.chunking_config:
            updates["chunking_config"] = request.chunking_config.dict()
        if request.embedding_config:
            updates["embedding_config"] = request.embedding_config.dict()
        if request.vector_store_config:
            updates["vector_store_config"] = request.vector_store_config.dict()

        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={"data": updates}
        )

        return ConfigUpdateResponse(
            message="Configuration updated successfully"
        )

    except Exception as e:
        logger.error(f"Failed to update config: {e}")
        raise HTTPException(status_code=400, detail=str(e))
```

### 5.2 Pydantic Schemas

**File**: `src/app/schemas/kb_draft.py`

```python
"""
Pydantic schemas for KB draft API.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime

class CreateKBDraftRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    workspace_id: UUID

class KBDraftResponse(BaseModel):
    draft_id: str
    status: str
    message: str

class ChunkingConfig(BaseModel):
    strategy: str = Field(..., regex="^(recursive|by_heading|by_page|semantic)$")
    chunk_size: int = Field(..., ge=100, le=4000)
    chunk_overlap: int = Field(..., ge=0, le=1000)
    separators: Optional[List[str]] = None

class EmbeddingConfig(BaseModel):
    provider: str = Field(..., regex="^(sentence_transformers|openai|cohere)$")
    model: str
    dimensions: int = Field(..., ge=256, le=4096)
    batch_size: int = Field(32, ge=1, le=100)

class VectorStoreConfig(BaseModel):
    provider: str = Field(..., regex="^(qdrant|faiss|weaviate|milvus)$")
    distance_metric: str = Field("cosine", regex="^(cosine|euclidean|dot)$")
    enable_hybrid_search: bool = True

class WebsiteCrawlConfig(BaseModel):
    max_depth: int = Field(3, ge=1, le=10)
    max_pages: int = Field(100, ge=1, le=1000)
    include_patterns: List[str] = []
    exclude_patterns: List[str] = []

class WebsiteSourceRequest(BaseModel):
    url: str = Field(..., regex=r'^https?://.+')
    crawl_config: WebsiteCrawlConfig
    metadata: Optional[Dict[str, Any]] = {}

class TextSourceRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=10)
    metadata: Optional[Dict[str, Any]] = {}

class SourceResponse(BaseModel):
    id: str
    type: str
    name: str
    status: str
    metadata: Dict[str, Any]
    content_preview: str
    created_at: Optional[datetime] = None

class ChunkPreviewRequest(BaseModel):
    source_id: Optional[str] = None

class ChunkPreview(BaseModel):
    id: str
    content: str
    token_count: int
    word_count: int
    char_count: int
    source_id: str
    source_name: str
    chunk_index: int
    metadata: Dict[str, Any]

class ChunkPreviewResponse(BaseModel):
    chunks: List[ChunkPreview]
    total_chunks: int
    total_tokens: int
    avg_chunk_size: float
    avg_token_count: float
    estimated_embedding_cost: float

class ValidationResponse(BaseModel):
    valid: bool
    errors: List[str]
    warnings: List[str]
    stats: Dict[str, Any]

class FinalizeResponse(BaseModel):
    kb_id: UUID
    status: str
    message: str

class ConfigUpdateRequest(BaseModel):
    chunking_config: Optional[ChunkingConfig] = None
    embedding_config: Optional[EmbeddingConfig] = None
    vector_store_config: Optional[VectorStoreConfig] = None

class ConfigUpdateResponse(BaseModel):
    message: str

class KBDraftDetails(BaseModel):
    id: str
    type: str
    workspace_id: str
    created_by: str
    status: str
    created_at: str
    updated_at: str
    data: Dict[str, Any]
```

---

## Phase 6: Self-Hosted Services Setup

### 6.1 Qdrant Docker Configuration

**File**: `docker-compose.qdrant.yml`

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:v1.7.3
    container_name: privexbot-qdrant
    ports:
      - "6333:6333"  # HTTP API
      - "6334:6334"  # gRPC API (for better performance)
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
      - QDRANT__STORAGE__STORAGE_PATH=/qdrant/storage
      - QDRANT__STORAGE__SNAPSHOTS_PATH=/qdrant/snapshots
      - QDRANT__STORAGE__RAFT_LOGS_PATH=/qdrant/raft_logs
      - QDRANT__LOG_LEVEL=INFO
      - QDRANT__CLUSTER__ENABLED=false
      # Performance optimizations
      - QDRANT__STORAGE__PERFORMANCE__MAX_SEARCH_THREADS=4
      - QDRANT__STORAGE__PERFORMANCE__MAX_OPTIMIZATION_THREADS=2
      # Security settings
      - QDRANT__SERVICE__ENABLE_CORS=false
      - QDRANT__SERVICE__API_KEY=${QDRANT_API_KEY:-}
    volumes:
      - qdrant_storage:/qdrant/storage
      - qdrant_snapshots:/qdrant/snapshots
      - qdrant_raft_logs:/qdrant/raft_logs
    networks:
      - privexbot-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    # Resource limits for production
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
        reservations:
          cpus: '2.0'
          memory: 4G

volumes:
  qdrant_storage:
    driver: local
  qdrant_snapshots:
    driver: local
  qdrant_raft_logs:
    driver: local

networks:
  privexbot-network:
    external: true
```

### 6.2 Sentence-Transformers Model Setup

**File**: `scripts/setup_embedding_models.py`

```python
#!/usr/bin/env python3
"""
Setup script for downloading and caching sentence-transformer models.
Run this during deployment to pre-cache models locally.
"""

import os
import sys
from pathlib import Path
from sentence_transformers import SentenceTransformer

def setup_models():
    """Download and cache embedding models."""

    models_dir = Path("/app/models")
    models_dir.mkdir(parents=True, exist_ok=True)

    # Production models for different use cases
    models = {
        "all-MiniLM-L6-v2": {
            "description": "Fast, good quality, 384 dimensions",
            "use_case": "General purpose, fast inference"
        },
        "all-mpnet-base-v2": {
            "description": "High quality, 768 dimensions",
            "use_case": "High quality embeddings, slower inference"
        },
        "multi-qa-mpnet-base-dot-v1": {
            "description": "Optimized for Q&A, 768 dimensions",
            "use_case": "Question-answering scenarios"
        }
    }

    for model_name, info in models.items():
        print(f"Downloading {model_name}...")
        print(f"  Description: {info['description']}")
        print(f"  Use case: {info['use_case']}")

        try:
            model = SentenceTransformer(
                model_name,
                cache_folder="/app/models",
                device="cpu"  # Can be changed to "cuda" for GPU
            )

            # Test the model
            test_embedding = model.encode("This is a test sentence.")
            print(f"  ✅ Model loaded successfully (dimensions: {len(test_embedding)})")

        except Exception as e:
            print(f"  ❌ Failed to load model: {e}")
            sys.exit(1)

        print()

    print("✅ All embedding models downloaded and cached successfully!")
    print(f"Models stored in: {models_dir}")

if __name__ == "__main__":
    setup_models()
```

### 6.3 Production Environment Configuration

**File**: `.env.production`

```bash
# Production Environment Configuration for KB Features

# ===== CORE SETTINGS =====
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-super-secure-secret-key-here

# ===== DATABASE =====
DATABASE_URL=postgresql://privexbot:secure_password@localhost:5432/privexbot
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30

# ===== REDIS =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password
REDIS_DB_CACHE=0
REDIS_DB_DRAFTS=1
REDIS_DB_EMBEDDINGS=2

# ===== QDRANT VECTOR DATABASE =====
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_GRPC_PORT=6334
QDRANT_API_KEY=your-qdrant-api-key-here

# ===== EMBEDDING MODELS =====
EMBEDDING_MODELS_PATH=/app/models
DEFAULT_EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_CACHE_TTL=2592000  # 30 days

# ===== DOCUMENT PROCESSING =====
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=pdf,docx,txt,md,csv,xlsx
TEMP_UPLOAD_PATH=/tmp/uploads
PERMANENT_STORAGE_PATH=/app/storage

# ===== BACKGROUND PROCESSING =====
CELERY_BROKER_URL=redis://localhost:6379/3
CELERY_RESULT_BACKEND=redis://localhost:6379/4
CELERY_WORKER_CONCURRENCY=4
CELERY_TASK_TIMEOUT=3600  # 1 hour

# ===== UNSTRUCTURED.IO =====
UNSTRUCTURED_API_URL=http://localhost:8000  # If using API server
UNSTRUCTURED_API_KEY=your-unstructured-api-key

# ===== CRAWL4AI =====
CRAWL4AI_MAX_CONCURRENT=5
CRAWL4AI_TIMEOUT=30
CRAWL4AI_USER_AGENT=PrivexBot/1.0

# ===== SECURITY & COMPLIANCE =====
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_LEVEL=INFO
ENCRYPT_FILES_AT_REST=true
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# ===== PERFORMANCE =====
CHUNK_PROCESSING_BATCH_SIZE=100
EMBEDDING_BATCH_SIZE=32
VECTOR_UPSERT_BATCH_SIZE=100

# ===== MONITORING =====
ENABLE_METRICS=true
METRICS_PORT=9090
LOG_LEVEL=INFO
```

### 6.4 Docker Compose for Complete Stack

**File**: `docker-compose.kb-stack.yml`

```yaml
version: '3.8'

services:
  # Vector Database
  qdrant:
    image: qdrant/qdrant:v1.7.3
    container_name: privexbot-qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
      - QDRANT__STORAGE__STORAGE_PATH=/qdrant/storage
    volumes:
      - qdrant_storage:/qdrant/storage
    networks:
      - privexbot-network
    restart: unless-stopped

  # Unstructured.io API (for document processing)
  unstructured-api:
    image: quay.io/unstructured-io/unstructured-api:latest
    container_name: privexbot-unstructured
    ports:
      - "8001:8000"
    environment:
      - UNSTRUCTURED_API_KEY=${UNSTRUCTURED_API_KEY}
    networks:
      - privexbot-network
    restart: unless-stopped

  # Background task processor
  celery-worker:
    build: .
    container_name: privexbot-celery-worker
    command: celery -A app.celery_app worker --loglevel=info --concurrency=4
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - QDRANT_HOST=qdrant
      - QDRANT_PORT=6333
    volumes:
      - ./models:/app/models
      - ./storage:/app/storage
    networks:
      - privexbot-network
    depends_on:
      - qdrant
      - redis
    restart: unless-stopped

  # Redis for caching and task queue
  redis:
    image: redis:7-alpine
    container_name: privexbot-redis
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - privexbot-network
    restart: unless-stopped

volumes:
  qdrant_storage:
    driver: local
  redis_data:
    driver: local

networks:
  privexbot-network:
    driver: bridge
```

---

## Phase 7: Production Deployment

### 7.1 HIPAA/SOC2 Compliance Configuration

**File**: `docs/kb/COMPLIANCE_CONFIGURATION.md`

```markdown
# HIPAA/SOC2 Compliance Configuration

## Required Security Measures

### 1. Data Encryption

**At Rest**:
- PostgreSQL: Enable transparent data encryption (TDE)
- Redis: Configure AUTH and encryption
- Qdrant: Enable API key authentication
- File storage: Encrypt uploaded documents

**In Transit**:
- TLS 1.3 for all API communications
- HTTPS only for web traffic
- Encrypted Redis connections
- Secure gRPC for Qdrant

### 2. Access Control

**User Authentication**:
- Multi-factor authentication required
- Strong password policies
- Session timeout enforcement
- Account lockout after failed attempts

**API Security**:
- JWT tokens with short expiration
- Rate limiting per user/IP
- API key rotation policies
- Request signing for sensitive operations

### 3. Audit Logging

**Required Logs**:
- All document access and modifications
- User authentication events
- Permission changes
- Data export activities
- System configuration changes

**Log Format**:
```json
{
  "timestamp": "2024-10-23T12:00:00Z",
  "event_type": "document_access",
  "user_id": "uuid",
  "organization_id": "uuid",
  "workspace_id": "uuid",
  "resource_id": "uuid",
  "action": "read",
  "ip_address": "10.0.0.1",
  "user_agent": "...",
  "success": true,
  "details": {}
}
```

### 4. Data Retention and Deletion

**Document Lifecycle**:
- Automatic deletion after retention period
- Secure deletion (multiple overwrites)
- Deletion confirmation logs
- Export capabilities before deletion

**User Data**:
- Right to deletion compliance
- Data portability features
- Anonymization procedures
- Backup encryption requirements
```

### 7.2 Production Deployment Script

**File**: `scripts/deploy_production.sh`

```bash
#!/bin/bash

# Production deployment script for KB features
set -e

echo "🚀 Starting PrivexBot KB Production Deployment"

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."

    command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required"; exit 1; }

    if [ ! -f ".env.production" ]; then
        echo "❌ .env.production file not found"
        exit 1
    fi

    echo "✅ Prerequisites check passed"
}

# Setup directories
setup_directories() {
    echo "📁 Setting up directories..."

    sudo mkdir -p /app/{models,storage,logs}
    sudo mkdir -p /var/lib/qdrant/{storage,snapshots,raft_logs}
    sudo mkdir -p /var/lib/redis

    # Set permissions
    sudo chown -R $USER:$USER /app
    sudo chmod -R 755 /app

    echo "✅ Directories setup complete"
}

# Download embedding models
setup_embedding_models() {
    echo "🤖 Setting up embedding models..."

    python3 scripts/setup_embedding_models.py

    echo "✅ Embedding models ready"
}

# Start core services
start_core_services() {
    echo "🔧 Starting core services..."

    # Start Qdrant
    docker-compose -f docker-compose.qdrant.yml up -d

    # Wait for Qdrant to be ready
    echo "⏳ Waiting for Qdrant to be ready..."
    until curl -f http://localhost:6333/health > /dev/null 2>&1; do
        sleep 5
    done
    echo "✅ Qdrant is ready"

    # Start Redis
    docker-compose -f docker-compose.kb-stack.yml up -d redis

    echo "✅ Core services started"
}

# Run database migrations
run_migrations() {
    echo "🗄️ Running database migrations..."

    cd src
    alembic upgrade head
    cd ..

    echo "✅ Database migrations complete"
}

# Start application services
start_application() {
    echo "🚀 Starting application services..."

    # Start all services
    docker-compose -f docker-compose.kb-stack.yml up -d

    # Wait for application to be ready
    echo "⏳ Waiting for application to be ready..."
    until curl -f http://localhost:8000/health > /dev/null 2>&1; do
        sleep 5
    done

    echo "✅ Application is ready"
}

# Run health checks
run_health_checks() {
    echo "🏥 Running health checks..."

    # Check Qdrant
    if curl -f http://localhost:6333/health > /dev/null 2>&1; then
        echo "✅ Qdrant: Healthy"
    else
        echo "❌ Qdrant: Unhealthy"
        exit 1
    fi

    # Check Redis
    if docker exec privexbot-redis redis-cli ping | grep -q PONG; then
        echo "✅ Redis: Healthy"
    else
        echo "❌ Redis: Unhealthy"
        exit 1
    fi

    # Check application
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Application: Healthy"
    else
        echo "❌ Application: Unhealthy"
        exit 1
    fi

    echo "✅ All health checks passed"
}

# Setup monitoring
setup_monitoring() {
    echo "📊 Setting up monitoring..."

    # Create monitoring configuration
    cat > /app/logs/monitoring.conf << EOF
[loggers]
keys=root,app,audit

[handlers]
keys=fileHandler,auditHandler

[formatters]
keys=jsonFormatter

[logger_root]
level=INFO
handlers=fileHandler

[logger_app]
level=INFO
handlers=fileHandler
qualname=app

[logger_audit]
level=INFO
handlers=auditHandler
qualname=audit

[handler_fileHandler]
class=FileHandler
level=INFO
formatter=jsonFormatter
args=('/app/logs/app.log',)

[handler_auditHandler]
class=FileHandler
level=INFO
formatter=jsonFormatter
args=('/app/logs/audit.log',)

[formatter_jsonFormatter]
format={"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}
EOF

    echo "✅ Monitoring setup complete"
}

# Main deployment flow
main() {
    check_prerequisites
    setup_directories
    setup_embedding_models
    start_core_services
    run_migrations
    start_application
    run_health_checks
    setup_monitoring

    echo ""
    echo "🎉 KB Production Deployment Complete!"
    echo ""
    echo "Services:"
    echo "  - Application: http://localhost:8000"
    echo "  - Qdrant: http://localhost:6333"
    echo "  - Redis: localhost:6379"
    echo ""
    echo "Logs:"
    echo "  - Application: /app/logs/app.log"
    echo "  - Audit: /app/logs/audit.log"
    echo ""
    echo "Next steps:"
    echo "  1. Configure SSL/TLS certificates"
    echo "  2. Set up backup procedures"
    echo "  3. Configure monitoring alerts"
    echo "  4. Review security settings"
}

main "$@"
```

### 7.3 Backup and Recovery Procedures

**File**: `scripts/backup_kb_data.sh`

```bash
#!/bin/bash

# Backup script for KB data
# Includes PostgreSQL, Qdrant, and file storage

BACKUP_DIR="/app/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Starting KB data backup to $BACKUP_DIR"

# Backup PostgreSQL
echo "📊 Backing up PostgreSQL..."
pg_dump $DATABASE_URL > "$BACKUP_DIR/postgres.sql"
gzip "$BACKUP_DIR/postgres.sql"

# Backup Qdrant
echo "🔍 Backing up Qdrant collections..."
docker exec privexbot-qdrant curl -X POST "http://localhost:6333/collections/snapshots" \
  -H "Content-Type: application/json" \
  -d '{"name": "backup_'$(date +%Y%m%d_%H%M%S)'"}'

# Copy snapshots
docker cp privexbot-qdrant:/qdrant/snapshots "$BACKUP_DIR/qdrant_snapshots"

# Backup file storage
echo "📁 Backing up file storage..."
tar -czf "$BACKUP_DIR/storage.tar.gz" /app/storage

# Backup configurations
echo "⚙️ Backing up configurations..."
cp .env.production "$BACKUP_DIR/"
cp docker-compose*.yml "$BACKUP_DIR/"

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "components": [
    "postgresql",
    "qdrant",
    "file_storage",
    "configurations"
  ],
  "size_mb": $(du -sm "$BACKUP_DIR" | cut -f1)
}
EOF

echo "✅ Backup complete: $BACKUP_DIR"
```

---

## Testing Strategy

### Production Testing Checklist

```markdown
# KB System Testing Checklist

## Unit Tests
- [ ] Document processing service
- [ ] Chunking strategies
- [ ] Embedding generation
- [ ] Vector search functionality
- [ ] Draft management operations

## Integration Tests
- [ ] End-to-end KB creation flow
- [ ] Multi-source document processing
- [ ] Vector store operations
- [ ] Search accuracy tests
- [ ] API endpoint functionality

## Performance Tests
- [ ] Large document processing (100MB+)
- [ ] Batch embedding generation (10,000+ chunks)
- [ ] Vector search latency (<100ms)
- [ ] Concurrent user operations
- [ ] Memory usage under load

## Security Tests
- [ ] Tenant isolation verification
- [ ] Access control enforcement
- [ ] Input validation and sanitization
- [ ] File upload security
- [ ] API rate limiting

## Compliance Tests
- [ ] Audit logging functionality
- [ ] Data encryption verification
- [ ] Secure deletion procedures
- [ ] Backup and recovery tests
- [ ] GDPR compliance features
```

---

## Monitoring & Observability

### Key Metrics to Monitor

```python
# Production monitoring metrics
METRICS = {
    "performance": [
        "document_processing_time",
        "embedding_generation_time",
        "vector_search_latency",
        "api_response_time",
        "concurrent_users"
    ],
    "business": [
        "documents_processed_daily",
        "knowledge_bases_created",
        "search_queries_count",
        "user_engagement_rate"
    ],
    "infrastructure": [
        "qdrant_memory_usage",
        "redis_memory_usage",
        "celery_queue_length",
        "disk_usage_growth",
        "cpu_utilization"
    ],
    "security": [
        "failed_authentication_attempts",
        "unauthorized_access_attempts",
        "data_export_events",
        "admin_actions_count"
    ]
}
```

This completes the comprehensive production implementation guide for the knowledge base system. The documentation provides everything needed to build, deploy, and maintain a production-ready KB system that meets all the specified requirements for speed, privacy, compliance, and enterprise-grade reliability.