"""
KB Draft Routes - Draft mode endpoints for knowledge base creation.

WHY:
- Dedicated draft endpoints for KB workflow
- Document management in draft mode
- Web crawling configuration
- Cloud sync setup

HOW:
- FastAPI router
- Redis-based draft storage
- Document upload in draft
- Finalization triggers processing

PSEUDOCODE follows the existing codebase patterns.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.services.draft_service import draft_service
from app.services.kb_draft_service import kb_draft_service

router = APIRouter(prefix="/kb-drafts", tags=["kb_drafts"])


@router.post("/")
async def create_kb_draft(
    workspace_id: UUID,
    initial_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new KB draft.

    WHY: Start KB creation workflow
    HOW: Create draft in Redis

    BODY:
        {
            "name": "Product Documentation",
            "description": "Product guides and FAQs",
            "chunking_config": {
                "strategy": "recursive",
                "chunk_size": 1000,
                "chunk_overlap": 200
            },
            "embedding_model": "text-embedding-ada-002"
        }

    RETURNS:
        {
            "draft_id": "draft_kb_abc123",
            "expires_at": "2025-10-02T12:00:00Z"
        }
    """

    from app.models.workspace import Workspace

    # Validate workspace access
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.org_id == current_user.org_id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Create draft
    draft_id = draft_service.create_draft(
        draft_type="kb",
        workspace_id=workspace_id,
        created_by=current_user.id,
        initial_data=initial_data
    )

    draft = draft_service.get_draft(draft_id)

    return {
        "draft_id": draft_id,
        "expires_at": draft["expires_at"]
    }


@router.get("/{draft_id}")
async def get_kb_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get KB draft.

    WHY: Retrieve draft for editing
    HOW: Get from Redis
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found or expired"
        )

    # Verify access
    from app.models.workspace import Workspace
    workspace = db.query(Workspace).filter(
        Workspace.id == UUID(draft["workspace_id"]),
        Workspace.org_id == current_user.org_id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return draft


@router.patch("/{draft_id}")
async def update_kb_draft(
    draft_id: str,
    updates: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update KB draft configuration.

    WHY: Modify KB settings during creation
    HOW: Update in Redis

    BODY:
        {
            "name": "Updated Name",
            "chunking_config": {
                "chunk_size": 1500
            }
        }
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    # Update draft
    draft_service.update_draft(draft_id, updates)

    return {"status": "updated"}


@router.post("/{draft_id}/documents/upload")
async def upload_document_to_draft(
    draft_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload document to KB draft.

    WHY: Add files during KB creation
    HOW: Store in Redis, parse metadata

    RETURNS:
        {
            "document_id": "temp_doc_xyz789",
            "filename": "guide.pdf",
            "file_size": 1234567,
            "content_type": "application/pdf",
            "status": "parsed"
        }
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    # Read file
    content = await file.read()

    # Add to draft
    result = await kb_draft_service.add_document_to_draft(
        draft_id=draft_id,
        filename=file.filename,
        content=content,
        content_type=file.content_type
    )

    return result


@router.post("/{draft_id}/documents/url")
async def add_url_to_draft(
    draft_id: str,
    url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add web URL to KB draft.

    WHY: Crawl website during KB creation
    HOW: Store URL, will crawl on finalization

    BODY:
        {
            "url": "https://example.com/docs"
        }

    RETURNS:
        {
            "url_id": "temp_url_123",
            "url": "https://example.com/docs",
            "status": "pending"
        }
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    # Add URL to draft
    result = await kb_draft_service.add_url_to_draft(
        draft_id=draft_id,
        url=url
    )

    return result


@router.post("/{draft_id}/documents/cloud")
async def add_cloud_source_to_draft(
    draft_id: str,
    source_type: str,
    source_config: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add cloud source to KB draft.

    WHY: Import from Notion, Google Drive, etc.
    HOW: Store config, will sync on finalization

    BODY:
        {
            "source_type": "notion",
            "source_config": {
                "credential_id": "uuid",
                "page_id": "notion_page_id"
            }
        }

    OR:

        {
            "source_type": "google_drive",
            "source_config": {
                "credential_id": "uuid",
                "folder_id": "google_folder_id"
            }
        }

    RETURNS:
        {
            "source_id": "temp_source_456",
            "source_type": "notion",
            "status": "pending"
        }
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    # Add cloud source to draft
    result = await kb_draft_service.add_cloud_source_to_draft(
        draft_id=draft_id,
        source_type=source_type,
        source_config=source_config
    )

    return result


@router.get("/{draft_id}/documents")
async def list_draft_documents(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all documents in KB draft.

    WHY: View uploaded/added documents
    HOW: Get from Redis draft

    RETURNS:
        {
            "documents": [
                {
                    "id": "temp_doc_123",
                    "type": "upload",
                    "filename": "guide.pdf",
                    "size": 1234567
                },
                {
                    "id": "temp_url_456",
                    "type": "url",
                    "url": "https://example.com"
                }
            ]
        }
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    documents = kb_draft_service.list_draft_documents(draft_id)

    return {"documents": documents}


@router.delete("/{draft_id}/documents/{document_id}")
async def remove_document_from_draft(
    draft_id: str,
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove document from KB draft.

    WHY: Delete unwanted document
    HOW: Remove from Redis draft
    """

    await kb_draft_service.remove_document_from_draft(
        draft_id=draft_id,
        document_id=document_id
    )

    return {"status": "removed"}


@router.post("/{draft_id}/finalize")
async def finalize_kb_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finalize KB draft and process documents.

    WHY: Convert draft to production KB
    HOW: Save to DB, queue processing tasks

    FLOW:
    1. Validate draft (has documents, valid config)
    2. Create KB in database
    3. Create documents in database
    4. Queue Celery tasks:
       - process_document_task for uploads
       - crawl_website_task for URLs
       - sync_notion_page_task for cloud sources
    5. Delete draft from Redis

    RETURNS:
        {
            "kb_id": "uuid",
            "documents_queued": 10,
            "urls_queued": 2,
            "cloud_sources_queued": 1,
            "status": "processing"
        }
    """

    # Finalize draft
    result = await draft_service.finalize_draft(
        db=db,
        draft_id=draft_id,
        finalized_by=current_user.id
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("errors", ["Finalization failed"])
        )

    return result


@router.post("/{draft_id}/validate")
async def validate_kb_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate KB draft before finalization.

    WHY: Check for errors before finalizing
    HOW: Run validation checks

    RETURNS:
        {
            "is_valid": true,
            "errors": [],
            "warnings": [
                "No documents added yet"
            ],
            "stats": {
                "total_documents": 5,
                "total_urls": 2,
                "estimated_chunks": 1234
            }
        }
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    # Validate draft
    validation_result = kb_draft_service.validate_draft(draft)

    return validation_result


@router.delete("/{draft_id}")
async def delete_kb_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete KB draft.

    WHY: Cancel KB creation
    HOW: Delete from Redis
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    # Delete draft
    draft_service.delete_draft(draft_id)

    return {"status": "deleted"}


@router.post("/{draft_id}/extend")
async def extend_kb_draft_expiry(
    draft_id: str,
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extend KB draft expiry time.

    WHY: Keep draft alive longer
    HOW: Update TTL in Redis

    BODY:
        {
            "hours": 48
        }

    RETURNS:
        {
            "draft_id": "draft_kb_abc123",
            "new_expires_at": "2025-10-04T12:00:00Z"
        }
    """

    draft = draft_service.get_draft(draft_id)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    # Extend expiry
    new_expiry = draft_service.extend_draft_expiry(draft_id, hours)

    return {
        "draft_id": draft_id,
        "new_expires_at": new_expiry
    }
