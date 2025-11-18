# KB Inspection & Document CRUD - Implementation Documentation

**Date:** 2025-01-16
**Author:** System
**Status:** Design & Implementation Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Design](#architecture-design)
3. [Endpoint Specifications](#endpoint-specifications)
4. [RBAC Strategy](#rbac-strategy)
5. [Edge Cases & Error Handling](#edge-cases--error-handling)
6. [Implementation Plan](#implementation-plan)
7. [Testing Strategy](#testing-strategy)
8. [UX Benefits](#ux-benefits)

---

## Overview

### Purpose

Add inspection and CRUD capabilities to the Knowledge Base system to:
- **Transparency:** Allow users to see exactly what content is stored in their KBs
- **Control:** Enable direct manipulation of documents and content
- **Debugging:** Help users understand what went into the KB during processing
- **Flexibility:** Support manual document addition, editing, and removal

### Scope

**1. Draft Inspection Endpoints (Pre-Finalization)**
- View scraped pages from web sources
- Inspect generated chunks before indexing
- Preview content quality

**2. KB Inspection Endpoints (Post-Finalization)**
- List all documents in a KB
- View specific document content
- List all chunks with filtering and pagination

**3. Document CRUD Operations**
- Create new documents manually (text input, file upload)
- Update existing document content
- Delete documents with cascade cleanup
- Proper chunk/embedding regeneration on updates

---

## Architecture Design

### Current State

```
Organization
  └─ Workspace
      └─ KnowledgeBase
          └─ Document (PostgreSQL)
              └─ Chunk (PostgreSQL + pgvector)
                  ├─ Embedding (pgvector 384 dims)
                  └─ Qdrant Index (external vector store)
```

### Permission Hierarchy

```
KB Creator (full access)
  ↓
Workspace Admin (full access to all KBs in workspace)
  ↓
KB Admin Member (admin permissions)
  ↓
KB Editor Member (edit permissions)
  ↓
KB Viewer Member (read-only permissions)
```

### Data Flow

#### Inspection (Read-Only)
```
User Request
  ↓
RBAC Check (has_kb_permission: "read")
  ↓
Fetch from Database
  ↓
Return JSON Response
```

#### Document CRUD (Write Operations)
```
User Request (Create/Update/Delete)
  ↓
RBAC Check (has_kb_permission: "edit")
  ↓
Validate Input
  ↓
Database Transaction:
  ├─ Update/Create Document
  ├─ Regenerate Chunks
  ├─ Generate Embeddings
  └─ Sync to Qdrant
  ↓
Return Success/Error
```

---

## Endpoint Specifications

### 1. Draft Inspection Endpoints

These endpoints work with **KB drafts in Redis** (before finalization).

#### 1.1 Get Draft Pages

```
GET /api/v1/kb-drafts/{draft_id}/pages
```

**Purpose:** List all scraped pages from web sources (preview what will become documents).

**RBAC:** User must own the draft (stored in Redis).

**Response:**
```json
{
  "draft_id": "draft_abc123",
  "total_pages": 25,
  "pages": [
    {
      "index": 0,
      "url": "https://docs.example.com/intro",
      "title": "Introduction",
      "content_preview": "Welcome to our API documentation...",
      "word_count": 523,
      "scraped_at": "2025-01-16T10:30:00Z"
    },
    ...
  ]
}
```

**Implementation Notes:**
- Pages stored in Redis during preview/crawl
- Lightweight operation (<100ms)
- No database queries needed

---

#### 1.2 Get Specific Draft Page

```
GET /api/v1/kb-drafts/{draft_id}/pages/{page_index}
```

**Purpose:** View full content of a specific scraped page.

**RBAC:** User must own the draft.

**Response:**
```json
{
  "page_index": 0,
  "url": "https://docs.example.com/intro",
  "title": "Introduction",
  "content": "# Introduction\n\nWelcome to our API documentation...",
  "content_type": "text/markdown",
  "metadata": {
    "description": "API intro page",
    "author": null,
    "scraped_at": "2025-01-16T10:30:00Z"
  },
  "word_count": 523,
  "character_count": 2847,
  "links": [
    {"url": "https://docs.example.com/getting-started", "text": "Getting Started"}
  ]
}
```

---

#### 1.3 Get Draft Chunks (Preview)

```
GET /api/v1/kb-drafts/{draft_id}/chunks?page=1&limit=20
```

**Purpose:** Preview chunks that will be generated (if preview was run).

**RBAC:** User must own the draft.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `page_index`: Filter chunks from specific scraped page

**Response:**
```json
{
  "draft_id": "draft_abc123",
  "total_chunks": 150,
  "page": 1,
  "limit": 20,
  "chunks": [
    {
      "index": 0,
      "content": "# Introduction\n\nWelcome to our API...",
      "word_count": 95,
      "character_count": 523,
      "source_page": {
        "index": 0,
        "url": "https://docs.example.com/intro",
        "title": "Introduction"
      }
    },
    ...
  ]
}
```

---

### 2. KB Inspection Endpoints (Post-Finalization)

These endpoints work with **finalized KBs in PostgreSQL**.

#### 2.1 List KB Documents

```
GET /api/v1/kbs/{kb_id}/documents?page=1&limit=20&status=completed&source_type=web_scraping
```

**Purpose:** List all documents in a knowledge base with filtering and pagination.

**RBAC:** `verify_kb_access(kb_id, user_id, "read")`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (pending, processing, completed, failed)
- `source_type`: Filter by source (web_scraping, file_upload, text_input)
- `search`: Search in document names/URLs

**Response:**
```json
{
  "kb_id": "kb_abc123",
  "total_documents": 25,
  "page": 1,
  "limit": 20,
  "documents": [
    {
      "id": "doc_123",
      "name": "Introduction",
      "url": "https://docs.example.com/intro",
      "source_type": "web_scraping",
      "status": "completed",
      "content_preview": "# Introduction\n\nWelcome to...",
      "word_count": 523,
      "character_count": 2847,
      "chunk_count": 3,
      "created_at": "2025-01-16T10:30:00Z",
      "updated_at": "2025-01-16T10:32:15Z",
      "created_by": "user_xyz"
    },
    ...
  ]
}
```

---

#### 2.2 Get Specific Document

```
GET /api/v1/kbs/{kb_id}/documents/{doc_id}
```

**Purpose:** Get full document details including complete content.

**RBAC:** `verify_kb_access(kb_id, user_id, "read")`

**Response:**
```json
{
  "id": "doc_123",
  "kb_id": "kb_abc123",
  "name": "Introduction",
  "url": "https://docs.example.com/intro",
  "source_type": "web_scraping",
  "source_metadata": {
    "crawled_at": "2025-01-16T10:30:00Z",
    "crawl_depth": 0,
    "title": "Introduction - API Docs"
  },
  "content": "# Introduction\n\nWelcome to our API documentation...",
  "content_preview": "# Introduction\n\nWelcome to...",
  "status": "completed",
  "processing_metadata": {
    "started_at": "2025-01-16T10:30:00Z",
    "completed_at": "2025-01-16T10:32:15Z",
    "processing_time_seconds": 135,
    "chunks_created": 3,
    "embeddings_generated": 3
  },
  "word_count": 523,
  "character_count": 2847,
  "chunk_count": 3,
  "custom_metadata": {},
  "annotations": null,
  "is_enabled": true,
  "is_archived": false,
  "created_at": "2025-01-16T10:30:00Z",
  "updated_at": "2025-01-16T10:32:15Z",
  "created_by": "user_xyz"
}
```

---

#### 2.3 List KB Chunks

```
GET /api/v1/kbs/{kb_id}/chunks?page=1&limit=20&document_id=doc_123
```

**Purpose:** List all chunks in a knowledge base with filtering and pagination.

**RBAC:** `verify_kb_access(kb_id, user_id, "read")`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `document_id`: Filter chunks from specific document
- `search`: Search in chunk content

**Response:**
```json
{
  "kb_id": "kb_abc123",
  "total_chunks": 150,
  "page": 1,
  "limit": 20,
  "chunks": [
    {
      "id": "chunk_456",
      "document_id": "doc_123",
      "document_name": "Introduction",
      "document_url": "https://docs.example.com/intro",
      "content": "# Introduction\n\nWelcome to our API...",
      "position": 0,
      "page_number": null,
      "word_count": 95,
      "character_count": 523,
      "is_enabled": true,
      "created_at": "2025-01-16T10:31:00Z"
    },
    ...
  ]
}
```

---

### 3. Document CRUD Operations

#### 3.1 Create Document

```
POST /api/v1/kbs/{kb_id}/documents
```

**Purpose:** Manually add a new document to the KB (text input or file upload).

**RBAC:** `verify_kb_access(kb_id, user_id, "edit")`

**Request:**
```json
{
  "name": "Custom API Guide",
  "content": "# Custom Guide\n\n## Overview\n\nThis is custom content...",
  "source_type": "text_input",
  "custom_metadata": {
    "category": "guide",
    "importance": "high"
  },
  "annotations": {
    "enabled": true,
    "category": "guide",
    "importance": "high",
    "purpose": "Manual documentation",
    "tags": ["api", "guide", "custom"]
  }
}
```

**Response:**
```json
{
  "id": "doc_new123",
  "kb_id": "kb_abc123",
  "name": "Custom API Guide",
  "content_preview": "# Custom Guide\n\n## Overview...",
  "status": "processing",
  "message": "Document created and processing started",
  "processing_job_id": "task_xyz789"
}
```

**Processing Flow:**
1. Create Document record in PostgreSQL (status: "processing")
2. Queue background Celery task: `process_document_task(doc_id)`
3. Task does:
   - Chunk content (using KB's chunking config)
   - Generate embeddings (using KB's embedding config)
   - Store chunks in PostgreSQL
   - Index in Qdrant
   - Update status to "completed"

---

#### 3.2 Update Document

```
PUT /api/v1/kbs/{kb_id}/documents/{doc_id}
```

**Purpose:** Update document content (triggers re-chunking and re-indexing).

**RBAC:** `verify_kb_access(kb_id, user_id, "edit")`

**Request:**
```json
{
  "name": "Updated API Guide",
  "content": "# Updated Guide\n\n## New Overview\n\nThis is updated content...",
  "custom_metadata": {
    "category": "guide",
    "version": "2.0"
  }
}
```

**Response:**
```json
{
  "id": "doc_123",
  "kb_id": "kb_abc123",
  "name": "Updated API Guide",
  "status": "processing",
  "message": "Document updated. Re-chunking and re-indexing in progress.",
  "processing_job_id": "task_xyz999"
}
```

**Processing Flow (CRITICAL - Edge Case Handling):**
1. Update Document.content in PostgreSQL
2. Set status = "processing"
3. **Delete old chunks:**
   - Delete from PostgreSQL: `DELETE FROM chunks WHERE document_id = ?`
   - Delete from Qdrant: `qdrant_service.delete_points(kb_id, filter={"document_id": doc_id})`
4. Queue background task: `reprocess_document_task(doc_id)`
5. Task does:
   - Re-chunk updated content
   - Generate new embeddings
   - Store new chunks
   - Re-index in Qdrant
   - Update status to "completed"

**Why this is important:**
- Old chunks must be removed before adding new ones
- Qdrant and PostgreSQL must stay in sync
- Prevents duplicate/stale content in search results

---

#### 3.3 Partial Update Document

```
PATCH /api/v1/kbs/{kb_id}/documents/{doc_id}
```

**Purpose:** Update only specific fields without triggering full reprocessing.

**RBAC:** `verify_kb_access(kb_id, user_id, "edit")`

**Request:**
```json
{
  "name": "Renamed Document",
  "custom_metadata": {
    "version": "2.1"
  },
  "is_enabled": false
}
```

**Response:**
```json
{
  "id": "doc_123",
  "message": "Document updated successfully",
  "changes_applied": ["name", "custom_metadata", "is_enabled"]
}
```

**Processing Flow:**
- Update only specified fields
- **NO re-chunking** if content unchanged
- Update Qdrant metadata if custom_metadata changed
- If `is_enabled` changed, update chunks' is_enabled status

---

#### 3.4 Delete Document

```
DELETE /api/v1/kbs/{kb_id}/documents/{doc_id}
```

**Purpose:** Permanently delete a document and all its chunks/embeddings.

**RBAC:** `verify_kb_access(kb_id, user_id, "edit")` (editors can delete documents they don't own)
OR `verify_kb_access(kb_id, user_id, "delete")` (only admins can delete)

**Response:**
```json
{
  "message": "Document deleted successfully",
  "deleted": {
    "document_id": "doc_123",
    "chunks_deleted": 15,
    "qdrant_points_deleted": 15
  }
}
```

**Processing Flow (CRITICAL - Cascade Cleanup):**
1. Start database transaction
2. **Delete from Qdrant first:**
   ```python
   await qdrant_service.delete_points(
       collection_name=f"kb_{kb_id}",
       points_filter={"document_id": str(doc_id)}
   )
   ```
3. **Delete chunks from PostgreSQL:**
   ```python
   db.query(Chunk).filter(Chunk.document_id == doc_id).delete()
   ```
4. **Delete document:**
   ```python
   db.query(Document).filter(Document.id == doc_id).delete()
   ```
5. Commit transaction
6. If any step fails, rollback entire transaction

**Why order matters:**
- Qdrant delete can fail (network issues) - do it first before DB changes
- PostgreSQL has CASCADE on chunks, but we delete explicitly for clarity
- Transaction ensures atomic operation

---

## RBAC Strategy

### Permission Requirements

| Endpoint | Required Permission | Who Has Access |
|----------|---------------------|----------------|
| GET /kb-drafts/{id}/pages | Draft ownership | Draft creator only |
| GET /kb-drafts/{id}/chunks | Draft ownership | Draft creator only |
| GET /kbs/{id}/documents | `read` | Creator, Workspace Admin, KB Members (all roles) |
| GET /kbs/{id}/documents/{doc_id} | `read` | Creator, Workspace Admin, KB Members (all roles) |
| GET /kbs/{id}/chunks | `read` | Creator, Workspace Admin, KB Members (all roles) |
| POST /kbs/{id}/documents | `edit` | Creator, Workspace Admin, KB Admin, KB Editor |
| PUT /kbs/{id}/documents/{doc_id} | `edit` | Creator, Workspace Admin, KB Admin, KB Editor |
| PATCH /kbs/{id}/documents/{doc_id} | `edit` | Creator, Workspace Admin, KB Admin, KB Editor |
| DELETE /kbs/{id}/documents/{doc_id} | `edit` or `delete` | Creator, Workspace Admin, KB Admin, (KB Editor for own docs) |

### Implementation Pattern

**For Draft Endpoints:**
```python
# No database RBAC - just verify draft ownership
draft = draft_service.get_draft(DraftType.KB, draft_id)
if not draft or draft["created_by"] != str(current_user.id):
    raise HTTPException(403, "Access denied")
```

**For KB Endpoints:**
```python
from app.services.kb_rbac_service import verify_kb_access

# Verify access and get KB in one call
kb = verify_kb_access(db, kb_id, current_user.id, "read")
```

### Workspace Validation

All KB operations must validate workspace membership:

```python
# KB already has workspace_id
# Documents inherit workspace_id from KB
# Automatic validation via KB access check

# User can only access KBs in their organization's workspaces
if kb.workspace.organization_id != current_user.org_id:
    raise HTTPException(403, "Access denied")
```

---

## Edge Cases & Error Handling

### Edge Case 1: Concurrent Document Updates

**Problem:** Two users edit same document simultaneously.

**Solution:**
```python
# Use optimistic locking with updated_at timestamp
document.updated_at = datetime.utcnow()
db.commit()

# Or use database row-level locking
document = db.query(Document).filter(
    Document.id == doc_id
).with_for_update().first()
```

**User Experience:**
- Last write wins
- Return updated_at in response
- Frontend can detect conflicts by comparing timestamps

---

### Edge Case 2: Qdrant Sync Failures

**Problem:** Document deleted from PostgreSQL but Qdrant delete fails.

**Solution: Two-Phase Cleanup with Retry**

```python
try:
    # Phase 1: Delete from Qdrant
    await qdrant_service.delete_points(
        collection_name=f"kb_{kb_id}",
        points_filter={"document_id": str(doc_id)}
    )

    # Phase 2: Delete from PostgreSQL
    db.query(Chunk).filter(Chunk.document_id == doc_id).delete()
    db.query(Document).filter(Document.id == doc_id).delete()
    db.commit()

except QdrantException as e:
    # Log error for background cleanup job
    logger.error(f"Qdrant delete failed for doc {doc_id}: {e}")

    # Mark document for cleanup instead of deleting
    document.status = "pending_deletion"
    document.error_message = f"Qdrant sync failed: {e}"
    db.commit()

    # Background job will retry later
    raise HTTPException(500, "Delete queued for retry due to sync error")
```

**Background Cleanup Job:**
```python
@celery_app.task
def cleanup_orphaned_vectors():
    """
    Periodic task to clean up vectors in Qdrant that don't exist in PostgreSQL.
    """
    # Find documents marked "pending_deletion"
    # Retry Qdrant delete
    # If successful, delete from PostgreSQL
```

---

### Edge Case 3: Large Document Updates

**Problem:** Updating a 10MB document blocks the API.

**Solution: Async Processing**

```python
@router.put("/kbs/{kb_id}/documents/{doc_id}")
async def update_document(...):
    # 1. Validate immediately
    if len(request.content) > 10_000_000:  # 10MB limit
        raise HTTPException(400, "Content too large (max 10MB)")

    # 2. Update document content
    document.content = request.content
    document.status = "processing"
    db.commit()

    # 3. Queue background task
    task = reprocess_document_task.delay(str(doc_id))

    # 4. Return immediately
    return {
        "id": str(doc_id),
        "status": "processing",
        "job_id": task.id
    }
```

---

### Edge Case 4: Chunk Regeneration Strategy

**Problem:** User updates chunking config for KB - what happens to existing documents?

**Solution: Per-Document Reprocessing**

```python
# Option 1: Manual reprocessing (recommended)
@router.post("/kbs/{kb_id}/documents/{doc_id}/reprocess")
async def reprocess_document(kb_id, doc_id):
    """
    Manually trigger reprocessing with new chunking config.
    """
    kb = verify_kb_access(db, kb_id, current_user.id, "edit")

    # Use KB's current chunking config
    task = reprocess_document_task.delay(str(doc_id), kb.config)

    return {"job_id": task.id, "status": "queued"}

# Option 2: Bulk reprocessing
@router.post("/kbs/{kb_id}/reprocess-all")
async def reprocess_all_documents(kb_id):
    """
    Reprocess ALL documents with new chunking config.
    """
    kb = verify_kb_access(db, kb_id, current_user.id, "edit")

    # Queue batch task
    task = reprocess_all_documents_task.delay(str(kb_id))

    return {"job_id": task.id, "message": "Reprocessing started for all documents"}
```

---

### Edge Case 5: Empty or Invalid Content

**Problem:** User creates document with empty content or invalid markdown.

**Solution: Validation + Graceful Handling**

```python
# Validation
if not request.content or len(request.content.strip()) == 0:
    raise HTTPException(400, "Content cannot be empty")

if len(request.content) < 50:
    raise HTTPException(400, "Content too short (min 50 characters)")

# Chunking validation
chunks = chunk_markdown(request.content, kb.config)
if len(chunks) == 0:
    raise HTTPException(
        400,
        "Content produced no chunks. Try adding more text or changing chunking strategy."
    )
```

---

### Edge Case 6: Document Naming Conflicts

**Problem:** User creates document with same name as existing.

**Solution: Allow duplicates but warn**

```python
# Check for existing document with same name
existing = db.query(Document).filter(
    Document.kb_id == kb_id,
    Document.name == request.name
).first()

response = {
    "id": str(new_document.id),
    "name": new_document.name
}

if existing:
    response["warning"] = f"Another document with name '{request.name}' already exists"

return response
```

**Alternative: Enforce uniqueness**
```python
# Add unique constraint in database
# documents table: UNIQUE(kb_id, name)

# Then check in code
if existing:
    raise HTTPException(409, "Document with this name already exists")
```

---

### Edge Case 7: Pagination Performance

**Problem:** Listing 10,000 chunks is slow.

**Solution: Cursor-based Pagination + Caching**

```python
# Use cursor-based pagination for large datasets
@router.get("/kbs/{kb_id}/chunks")
async def list_chunks(
    kb_id: UUID,
    cursor: Optional[str] = None,
    limit: int = Query(20, le=100)
):
    query = db.query(Chunk).filter(Chunk.kb_id == kb_id)

    # Decode cursor (base64-encoded chunk ID)
    if cursor:
        cursor_id = uuid.UUID(base64.b64decode(cursor).decode())
        query = query.filter(Chunk.id > cursor_id)

    query = query.order_by(Chunk.id).limit(limit + 1)
    chunks = query.all()

    # Generate next cursor
    has_more = len(chunks) > limit
    if has_more:
        chunks = chunks[:limit]
        next_cursor = base64.b64encode(str(chunks[-1].id).encode()).decode()
    else:
        next_cursor = None

    return {
        "chunks": [chunk.to_dict() for chunk in chunks],
        "next_cursor": next_cursor,
        "has_more": has_more
    }
```

---

### Edge Case 8: Access Control on Archived/Disabled Documents

**Problem:** Should viewers see disabled documents?

**Solution: Filter by default, allow override**

```python
@router.get("/kbs/{kb_id}/documents")
async def list_documents(
    kb_id: UUID,
    include_disabled: bool = Query(False),
    include_archived: bool = Query(False),
    ...
):
    query = db.query(Document).filter(Document.kb_id == kb_id)

    # Filter disabled/archived by default
    if not include_disabled:
        query = query.filter(Document.is_enabled == True)

    if not include_archived:
        query = query.filter(Document.is_archived == False)

    # Only admins can see disabled/archived
    if include_disabled or include_archived:
        kb = verify_kb_access(db, kb_id, current_user.id, "manage_members")

    return query.all()
```

---

## Implementation Plan

### Phase 1: Draft Inspection Endpoints (2-3 hours)

**Files to modify:**
- `src/app/api/v1/routes/kb_draft.py` (add 3 new endpoints)

**Tasks:**
1. Add `GET /kb-drafts/{draft_id}/pages`
2. Add `GET /kb-drafts/{draft_id}/pages/{page_index}`
3. Add `GET /kb-drafts/{draft_id}/chunks`
4. Update draft service to support pagination
5. Add response models to `src/app/schemas/knowledge_base.py`

**Why first:** Simplest - only Redis reads, no RBAC complexity.

---

### Phase 2: KB Inspection Endpoints (3-4 hours)

**Files to modify:**
- `src/app/api/v1/routes/kb.py` (add 3 new endpoints)
- `src/app/schemas/knowledge_base.py` (add response models)

**Tasks:**
1. Add `GET /kbs/{kb_id}/documents` with pagination, filtering, search
2. Add `GET /kbs/{kb_id}/documents/{doc_id}` with full content
3. Add `GET /kbs/{kb_id}/chunks` with pagination, document filtering
4. Use `verify_kb_access()` from `kb_rbac_service.py`
5. Add database indexes for performance:
   ```sql
   CREATE INDEX idx_documents_kb_status ON documents(kb_id, status);
   CREATE INDEX idx_chunks_document ON chunks(document_id);
   CREATE INDEX idx_chunks_kb ON chunks(kb_id);
   ```

---

### Phase 3: Document CRUD - Create (3-4 hours)

**Files to create/modify:**
- `src/app/api/v1/routes/kb_documents.py` (new file)
- `src/app/tasks/document_processing_tasks.py` (new file)
- `src/app/services/document_service.py` (new file)

**Tasks:**
1. Create `POST /kbs/{kb_id}/documents` endpoint
2. Implement `process_document_task(doc_id)` Celery task:
   - Chunk content
   - Generate embeddings
   - Store chunks
   - Index in Qdrant
   - Update status
3. Add validation for content length, format
4. Support both text input and file upload (future)

---

### Phase 4: Document CRUD - Update (4-5 hours)

**CRITICAL: This is the most complex due to edge cases**

**Tasks:**
1. Add `PUT /kbs/{kb_id}/documents/{doc_id}` endpoint
2. Add `PATCH /kbs/{kb_id}/documents/{doc_id}` endpoint
3. Implement `reprocess_document_task(doc_id)` Celery task:
   - Delete old chunks from PostgreSQL
   - Delete old vectors from Qdrant
   - Re-chunk updated content
   - Generate new embeddings
   - Store new chunks
   - Re-index in Qdrant
   - Handle partial failures with retry logic
4. Add transaction management for atomic updates
5. Implement Qdrant sync error handling

**Edge cases to handle:**
- Concurrent updates (optimistic locking)
- Qdrant sync failures (retry mechanism)
- Large document updates (async processing)

---

### Phase 5: Document CRUD - Delete (2-3 hours)

**Tasks:**
1. Add `DELETE /kbs/{kb_id}/documents/{doc_id}` endpoint
2. Implement cascade cleanup:
   - Delete from Qdrant first
   - Then delete chunks from PostgreSQL
   - Finally delete document
3. Add transaction + rollback on failure
4. Return deletion statistics (chunks deleted, vectors removed)

---

### Phase 6: Background Cleanup & Monitoring (2-3 hours)

**Tasks:**
1. Create `cleanup_orphaned_vectors()` Celery task
2. Create `verify_qdrant_sync()` health check task
3. Add monitoring for:
   - Documents stuck in "processing" status
   - Orphaned vectors in Qdrant
   - Failed reprocessing jobs

---

### Phase 7: Testing (4-5 hours)

**See Testing Strategy section below**

---

## Testing Strategy

### Unit Tests

**Test file:** `tests/api/test_kb_inspection.py`

```python
def test_list_documents_with_pagination():
    """Test pagination works correctly"""

def test_list_documents_rbac_viewer():
    """Test viewer can read documents"""

def test_create_document_rbac_editor():
    """Test editor can create documents"""

def test_create_document_rbac_viewer_denied():
    """Test viewer cannot create documents"""

def test_update_document_chunks_regenerated():
    """Test updating content regenerates chunks"""

def test_delete_document_cascade():
    """Test deleting document removes chunks and Qdrant vectors"""
```

---

### Integration Tests

**Test file:** `tests/integration/test_document_crud_flow.py`

```python
def test_full_document_crud_flow():
    """
    1. Create document
    2. Wait for processing
    3. Verify chunks created
    4. Verify Qdrant indexed
    5. Update document
    6. Verify old chunks deleted
    7. Verify new chunks created
    8. Delete document
    9. Verify complete cleanup
    """
```

---

### End-to-End Tests

**Test file:** `tests/e2e/test_kb_inspection_ui.py`

```python
def test_user_inspects_kb_and_edits_document():
    """
    Simulate user journey:
    1. Create KB from web source
    2. Finalize and wait for processing
    3. List documents
    4. View specific document
    5. Edit document content
    6. Verify changes reflected in search
    7. Delete document
    8. Verify removed from search
    """
```

---

### Performance Tests

```python
def test_list_10000_chunks_performance():
    """Ensure pagination performs well with large datasets"""
    # Create KB with 10,000 chunks
    # Measure query time for each page
    # Assert < 100ms per page

def test_concurrent_document_updates():
    """Test handling of simultaneous updates"""
    # Spawn 5 concurrent update requests
    # Verify all succeed without data corruption
```

---

## UX Benefits

### 1. Transparency

**Before:** "I don't know what went into my KB."

**After:** Users can:
- See exactly which pages were scraped
- View full content of each document
- Inspect individual chunks before they go into search
- Verify clean markdown content (no HTML clutter)

### 2. Control

**Before:** "I can't fix incorrect content without recreating the entire KB."

**After:** Users can:
- Edit individual documents
- Add missing documentation manually
- Remove outdated content
- Fine-tune specific sections

### 3. Debugging

**Before:** "Why isn't my chatbot finding the answer? I don't know what's in the KB."

**After:** Users can:
- Search through actual chunks to see what's indexed
- Verify specific pages were included
- Check if content was chunked correctly
- Identify quality issues (e.g., too-small chunks, missing sections)

### 4. Flexibility

**Before:** "I need to add a FAQ doc but I don't have a URL for it."

**After:** Users can:
- Manually add text documents
- Mix web-scraped and manually-created content
- Upload files (future enhancement)
- Build hybrid knowledge bases

---

## Security Considerations

### 1. Content Size Limits

```python
# Prevent abuse
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB
MAX_DOCUMENTS_PER_KB = 10_000

if len(request.content) > MAX_DOCUMENT_SIZE:
    raise HTTPException(413, "Document too large")

doc_count = db.query(Document).filter(Document.kb_id == kb_id).count()
if doc_count >= MAX_DOCUMENTS_PER_KB:
    raise HTTPException(400, "KB document limit reached")
```

### 2. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/kbs/{kb_id}/documents")
@limiter.limit("10/minute")  # Max 10 document creations per minute
async def create_document(...):
    ...
```

### 3. Input Sanitization

```python
# Prevent XSS in document names
from markupsafe import escape

document.name = escape(request.name)

# Validate markdown content doesn't contain malicious scripts
# (Markdown renderers should escape by default, but verify)
```

### 4. RBAC Enforcement

```python
# ALWAYS verify access before ANY operation
kb = verify_kb_access(db, kb_id, current_user.id, required_permission)

# Never trust client-provided IDs - always validate ownership
if kb.workspace.organization_id != current_user.org_id:
    raise HTTPException(403, "Access denied")
```

---

## Database Migration

**Migration file:** `migrations/versions/xxx_add_kb_inspection_indexes.py`

```python
def upgrade():
    # Add indexes for performance
    op.create_index(
        'idx_documents_kb_status',
        'documents',
        ['kb_id', 'status']
    )
    op.create_index(
        'idx_documents_kb_enabled',
        'documents',
        ['kb_id', 'is_enabled', 'is_archived']
    )
    op.create_index(
        'idx_chunks_document',
        'chunks',
        ['document_id']
    )
    op.create_index(
        'idx_chunks_kb_enabled',
        'chunks',
        ['kb_id', 'is_enabled']
    )

def downgrade():
    op.drop_index('idx_documents_kb_status')
    op.drop_index('idx_documents_kb_enabled')
    op.drop_index('idx_chunks_document')
    op.drop_index('idx_chunks_kb_enabled')
```

---

## API Response Time Targets

| Endpoint | Target | Notes |
|----------|--------|-------|
| GET /kb-drafts/{id}/pages | < 50ms | Redis read |
| GET /kb-drafts/{id}/chunks | < 100ms | Redis read with filtering |
| GET /kbs/{id}/documents | < 150ms | PostgreSQL with pagination |
| GET /kbs/{id}/documents/{doc_id} | < 100ms | Single document lookup |
| GET /kbs/{id}/chunks | < 200ms | PostgreSQL with joins |
| POST /kbs/{id}/documents | < 300ms | Create + queue task |
| PUT /kbs/{id}/documents/{doc_id} | < 300ms | Update + queue task |
| DELETE /kbs/{id}/documents/{doc_id} | < 500ms | Cleanup + Qdrant sync |

---

## Monitoring & Alerts

### Metrics to Track

1. **Document Processing Success Rate**
   - Target: > 95%
   - Alert if < 90% over 1 hour

2. **Qdrant Sync Success Rate**
   - Target: > 99%
   - Alert if < 95% over 15 minutes

3. **Average Processing Time per Document**
   - Target: < 30 seconds
   - Alert if > 2 minutes

4. **Orphaned Vector Count**
   - Target: 0
   - Alert if > 100

### Health Checks

```python
@router.get("/kbs/{kb_id}/health")
async def kb_health_check(kb_id: UUID):
    """
    Check KB health:
    - Documents vs chunks count consistency
    - Chunks vs Qdrant vectors consistency
    - Processing failures
    """
    kb = verify_kb_access(db, kb_id, current_user.id, "read")

    doc_count = db.query(Document).filter(Document.kb_id == kb_id).count()
    chunk_count = db.query(Chunk).filter(Chunk.kb_id == kb_id).count()

    # Check Qdrant
    collection_info = await qdrant_service.get_collection_info(f"kb_{kb_id}")
    qdrant_vector_count = collection_info.points_count

    # Find discrepancies
    orphaned_vectors = qdrant_vector_count - chunk_count

    return {
        "kb_id": str(kb_id),
        "status": "healthy" if orphaned_vectors == 0 else "degraded",
        "stats": {
            "documents": doc_count,
            "chunks": chunk_count,
            "qdrant_vectors": qdrant_vector_count,
            "orphaned_vectors": orphaned_vectors
        }
    }
```

---

## Summary

This implementation provides:

1. **Complete Transparency:** Users see exactly what's in their KB
2. **Full Control:** CRUD operations on documents with proper validation
3. **Robust RBAC:** Granular permissions using existing `kb_rbac_service`
4. **Edge Case Handling:** Qdrant sync failures, concurrent updates, large documents
5. **Performance:** Pagination, indexing, async processing
6. **Security:** Input validation, rate limiting, size limits
7. **Monitoring:** Health checks, metrics, cleanup jobs

**Total Implementation Time:** ~20-25 hours

**Minimal Code Changes:** Reuse existing services (`kb_rbac_service`, `qdrant_service`, `embedding_service`)

**No Over-Engineering:** Simple, focused endpoints that solve specific UX needs

**Next Steps:** Proceed with Phase 1 implementation (Draft Inspection Endpoints).
