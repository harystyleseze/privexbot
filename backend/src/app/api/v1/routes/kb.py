"""
KB Management Routes - CRUD operations and management for Knowledge Bases.

WHY:
- List, view, delete KBs
- Manual re-indexing
- Statistics and health
- Access control

HOW:
- RESTful API endpoints
- Organization-based access control
- Integration with Celery tasks
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.knowledge_base import KnowledgeBase
from app.models.document import Document
from app.models.chunk import Chunk

router = APIRouter(prefix="/kbs", tags=["knowledge_bases"])


# ========================================
# REQUEST/RESPONSE MODELS
# ========================================

class KBResponse(BaseModel):
    """KB summary response"""
    id: str
    name: str
    description: Optional[str]
    workspace_id: str
    status: str
    stats: dict
    created_at: str
    updated_at: Optional[str]
    created_by: str

    class Config:
        from_attributes = True


class KBDetailResponse(BaseModel):
    """Detailed KB response with configuration"""
    id: str
    name: str
    description: Optional[str]
    workspace_id: str
    status: str
    config: dict
    embedding_config: dict
    vector_store_config: dict
    indexing_method: str
    stats: dict
    error_message: Optional[str]
    created_at: str
    updated_at: Optional[str]
    created_by: str

    class Config:
        from_attributes = True


# ========================================
# CRUD ENDPOINTS
# ========================================

@router.get("/", response_model=List[KBResponse])
async def list_kbs(
    workspace_id: Optional[UUID] = Query(None, description="Filter by specific workspace (if not provided, returns all KBs from all workspaces in user's org)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    context: Optional[str] = Query(None, description="Filter by context: chatbot, chatflow, or both"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List KBs accessible to current user with workspace scoping.

    ACCESS CONTROL:
    - User must be in organization
    - If workspace_id provided: Returns KBs from that specific workspace only
    - If workspace_id not provided: Returns KBs from ALL workspaces in user's organization
    - Optionally filter by context (chatbot/chatflow/both)

    WORKSPACE SCOPING:
    - workspace_id=None → All workspaces in organization
    - workspace_id=<uuid> → Specific workspace only

    Returns:
        List of KB summaries
    """

    # Build base query with organization check
    query = db.query(KnowledgeBase).join(
        KnowledgeBase.workspace
    ).filter(
        KnowledgeBase.workspace.has(organization_id=current_user.org_id)
    )

    # Apply workspace filter if provided (workspace-scoped access)
    if workspace_id:
        # Verify user has access to this workspace
        from app.models.workspace import Workspace
        workspace = db.query(Workspace).filter(
            Workspace.id == workspace_id,
            Workspace.organization_id == current_user.org_id
        ).first()

        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found or access denied"
            )

        query = query.filter(KnowledgeBase.workspace_id == workspace_id)

    # Apply status filter
    if status:
        query = query.filter(KnowledgeBase.status == status)

    # Apply context filter
    if context:
        if context not in ["chatbot", "chatflow", "both"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid context. Must be 'chatbot', 'chatflow', or 'both'"
            )
        query = query.filter(KnowledgeBase.context == context)

    # Order by most recent
    kbs = query.order_by(KnowledgeBase.created_at.desc()).all()

    # Convert to response model
    return [
        KBResponse(
            id=str(kb.id),
            name=kb.name,
            description=kb.description,
            workspace_id=str(kb.workspace_id),
            status=kb.status,
            stats=kb.stats or {},
            created_at=kb.created_at.isoformat(),
            updated_at=kb.updated_at.isoformat() if kb.updated_at else None,
            created_by=str(kb.created_by)
        )
        for kb in kbs
    ]


@router.get("/{kb_id}", response_model=KBDetailResponse)
async def get_kb(
    kb_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed KB information.

    ACCESS CONTROL:
    - User must be in same organization as KB's workspace

    Returns:
        Detailed KB information including configuration
    """

    kb = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )

    # Check access
    if kb.workspace.organization_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return KBDetailResponse(
        id=str(kb.id),
        name=kb.name,
        description=kb.description,
        workspace_id=str(kb.workspace_id),
        status=kb.status,
        config=kb.config or {},
        embedding_config=kb.embedding_config or {},
        vector_store_config=kb.vector_store_config or {},
        indexing_method=kb.indexing_method or "by_heading",
        stats=kb.stats or {},
        error_message=kb.error_message,
        created_at=kb.created_at.isoformat(),
        updated_at=kb.updated_at.isoformat() if kb.updated_at else None,
        created_by=str(kb.created_by)
    )


@router.delete("/{kb_id}")
async def delete_kb(
    kb_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a KB and all associated data.

    ACCESS CONTROL:
    - User must be in same organization
    - Only creator or org admin can delete (future: add role check)

    IMPORTANT:
    - Queues background task to delete Qdrant collection
    - Immediately deletes PostgreSQL records (CASCADE)

    Returns:
        Success message
    """

    kb = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )

    # Check access
    if kb.workspace.organization_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Queue background cleanup task (delete Qdrant collection)
    from app.tasks.kb_maintenance_tasks import manual_cleanup_kb_task

    manual_cleanup_kb_task.apply_async(
        kwargs={"kb_id": str(kb_id)},
        queue="low_priority"
    )

    return {
        "message": f"KB '{kb.name}' deletion queued",
        "kb_id": str(kb_id),
        "note": "Qdrant collection deletion is processing in background"
    }


# ========================================
# MANAGEMENT ENDPOINTS
# ========================================

@router.post("/{kb_id}/reindex")
async def reindex_kb(
    kb_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger KB re-indexing.

    WHY: Keep embeddings fresh for frequently changing websites
    HOW: Queues high-priority Celery task

    ACCESS CONTROL:
    - User must be in same organization
    - Only creator or org admin can re-index (future: add role check)

    FLOW:
    1. Verify KB exists and user has access
    2. Check KB is in re-indexable state
    3. Queue reindex_kb_task (high priority)
    4. Return task ID for tracking

    Returns:
        {
            "message": str,
            "kb_id": str,
            "status": "queued"
        }
    """

    kb = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )

    # Check access
    if kb.workspace.organization_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Check if KB is in re-indexable state
    if kb.status not in ["ready", "ready_with_warnings", "failed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot re-index KB with status '{kb.status}'. Wait for current processing to complete."
        )

    # Queue re-indexing task (high priority)
    from app.tasks.kb_pipeline_tasks import reindex_kb_task

    task = reindex_kb_task.apply_async(
        kwargs={"kb_id": str(kb_id)},
        queue="high_priority"
    )

    return {
        "message": f"Re-indexing queued for KB '{kb.name}'",
        "kb_id": str(kb_id),
        "task_id": task.id,
        "status": "queued",
        "note": "Re-indexing will regenerate all embeddings and update Qdrant. This may take several minutes."
    }


@router.get("/{kb_id}/stats")
async def get_kb_stats(
    kb_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed KB statistics.

    Returns:
        {
            "kb_id": str,
            "name": str,
            "status": str,
            "documents": {
                "total": int,
                "by_status": {...}
            },
            "chunks": {
                "total": int,
                "avg_per_document": float
            },
            "storage": {
                "total_content_size": int (bytes),
                "avg_chunk_size": int (bytes)
            },
            "health": {
                "qdrant_healthy": bool,
                "vector_count_match": bool
            }
        }
    """

    kb = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )

    # Check access
    if kb.workspace.organization_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get document stats
    documents = db.query(Document).filter(
        Document.kb_id == kb_id
    ).all()

    doc_by_status = {}
    for doc in documents:
        doc_by_status[doc.status] = doc_by_status.get(doc.status, 0) + 1

    # Get chunk stats
    chunks = db.query(Chunk).filter(
        Chunk.kb_id == kb_id
    ).all()

    total_content_size = sum(len(chunk.content or "") for chunk in chunks)
    avg_chunk_size = total_content_size / len(chunks) if chunks else 0

    # Health check (quick)
    try:
        from app.services.qdrant_service import qdrant_service
        import asyncio

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        collection_exists = loop.run_until_complete(
            qdrant_service.check_collection_exists(kb_id)
        )

        qdrant_stats = None
        if collection_exists:
            qdrant_stats = loop.run_until_complete(
                qdrant_service.get_collection_stats(kb_id)
            )

        loop.close()

        qdrant_healthy = collection_exists
        vector_count_match = (
            qdrant_stats.get("vectors_count", 0) == len(chunks)
            if qdrant_stats else False
        )

    except Exception as e:
        qdrant_healthy = False
        vector_count_match = False

    return {
        "kb_id": str(kb_id),
        "name": kb.name,
        "status": kb.status,
        "documents": {
            "total": len(documents),
            "by_status": doc_by_status
        },
        "chunks": {
            "total": len(chunks),
            "avg_per_document": len(chunks) / len(documents) if documents else 0
        },
        "storage": {
            "total_content_size": total_content_size,
            "avg_chunk_size": int(avg_chunk_size)
        },
        "health": {
            "qdrant_healthy": qdrant_healthy,
            "vector_count_match": vector_count_match
        }
    }


class RechunkPreviewRequest(BaseModel):
    """Request model for KB re-chunking preview"""
    strategy: str = Field(..., description="New chunking strategy to test")
    chunk_size: int = Field(default=1000, ge=100, le=5000, description="New chunk size")
    chunk_overlap: int = Field(default=200, ge=0, le=1000, description="New chunk overlap")
    sample_documents: int = Field(default=3, ge=1, le=10, description="Number of documents to sample for preview")


@router.post("/{kb_id}/preview-rechunk")
async def preview_kb_rechunking(
    kb_id: UUID,
    request: RechunkPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Preview re-chunking for existing KB with comparison.

    WHY: Users want to optimize chunking strategy for existing KB
    HOW: Re-chunk existing documents and compare with current state

    TYPE: KB Re-chunking Preview (Optimization)
    DURATION: 1-5 seconds (no scraping needed!)
    NON-BLOCKING: Does not modify KB or trigger re-indexing

    USE CASE:
    - KB already exists with scraped content
    - Want to optimize chunking strategy
    - Compare strategies before re-indexing
    - Test configuration changes

    BENEFITS:
    - Extremely fast (documents already scraped)
    - Direct comparison with current state
    - No re-scraping needed
    - Helps optimize existing KBs

    Returns:
        {
            "kb_id": str,
            "kb_name": str,
            "current_config": {...},
            "new_config": {...},
            "comparison": {
                "current": {
                    "total_chunks": int,
                    "avg_chunk_size": int,
                    "min_chunk_size": int,
                    "max_chunk_size": int
                },
                "new": {
                    "total_chunks": int,
                    "avg_chunk_size": int,
                    "min_chunk_size": int,
                    "max_chunk_size": int
                },
                "delta": {
                    "chunks_change": int,
                    "chunks_percent": float,
                    "avg_size_change": int,
                    "recommendation": str
                }
            },
            "sample_chunks": [...],
            "documents_analyzed": int,
            "total_documents": int,
            "note": str
        }
    """

    # Check KB exists
    kb = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )

    # Check access
    if kb.workspace.organization_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # KB must be in ready state (with documents)
    if kb.status not in ["ready", "ready_with_warnings"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"KB must be in 'ready' state for preview. Current status: {kb.status}"
        )

    # Validate strategy
    valid_strategies = [
        "recursive", "semantic", "by_heading", "by_section",
        "adaptive", "sentence_based", "paragraph_based", "hybrid"
    ]
    if request.strategy not in valid_strategies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategy. Must be one of: {', '.join(valid_strategies)}"
        )

    try:
        from app.services.preview_service import preview_service

        preview_data = await preview_service.preview_rechunking_for_kb(
            db_session=db,
            kb_id=str(kb_id),
            strategy=request.strategy,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap,
            sample_documents=request.sample_documents
        )

        if "error" in preview_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=preview_data.get("message", "Preview generation failed")
            )

        return preview_data

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preview generation failed: {str(e)}"
        )
