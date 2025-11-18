# Knowledge Base API Testing Guide

**Date:** 2025-01-16
**Version:** 1.0
**Purpose:** Comprehensive guide for testing all KB inspection and document CRUD endpoints

---

## Overview

This guide covers testing for all KB-related API endpoints, including:
1. Draft Inspection Endpoints (preview data)
2. KB Inspection Endpoints (finalized data)
3. Document CRUD Operations
4. Background Processing Tasks

---

## Prerequisites

```bash
# Set base URL
export BASE_URL="http://localhost:8000"

# Get authentication token
export TOKEN="your_jwt_token_here"

# Set headers
HEADERS=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
```

---

## Part 1: Draft Inspection Endpoints

### 1.1 List Draft Pages

**Purpose:** View all scraped pages from preview

**Endpoint:** `GET /api/v1/kb-drafts/{draft_id}/pages`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**
```bash
curl -X GET "$BASE_URL/api/v1/kb-drafts/{draft_id}/pages?page=1&limit=10" \
  "${HEADERS[@]}"
```

**Expected Response:**
```json
{
  "draft_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_pages": 5,
  "pages": [
    {
      "index": 0,
      "url": "https://docs.example.com/getting-started",
      "title": "Getting Started",
      "content_preview": "Welcome to our documentation...",
      "word_count": 450,
      "character_count": 2800,
      "chunks": 3,
      "scraped_at": "2025-01-16T10:30:00Z"
    }
  ]
}
```

**Test Cases:**
- ✓ Draft exists and has preview data
- ✓ Pagination works correctly
- ✓ Draft without preview returns empty array with helpful message
- ✓ Unauthorized access returns 403
- ✓ Non-existent draft returns 404

---

### 1.2 Get Specific Draft Page

**Purpose:** View detailed content of a specific page

**Endpoint:** `GET /api/v1/kb-drafts/{draft_id}/pages/{page_index}`

**Example Request:**
```bash
curl -X GET "$BASE_URL/api/v1/kb-drafts/{draft_id}/pages/0" \
  "${HEADERS[@]}"
```

**Expected Response:**
```json
{
  "draft_id": "550e8400-e29b-41d4-a716-446655440000",
  "page_index": 0,
  "url": "https://docs.example.com/getting-started",
  "title": "Getting Started",
  "full_content": "# Getting Started\n\nWelcome to our documentation...",
  "word_count": 450,
  "character_count": 2800,
  "chunks": 3,
  "scraped_at": "2025-01-16T10:30:00Z"
}
```

**Test Cases:**
- ✓ Valid page index returns full content
- ✓ Invalid page index returns 404
- ✓ Page content is clean markdown (no HTML tags)

---

### 1.3 List Draft Chunks

**Purpose:** View preview chunks with pagination

**Endpoint:** `GET /api/v1/kb-drafts/{draft_id}/chunks`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `page_index` (optional): Filter chunks from specific page

**Example Request:**
```bash
curl -X GET "$BASE_URL/api/v1/kb-drafts/{draft_id}/chunks?page=1&limit=20&page_index=0" \
  "${HEADERS[@]}"
```

**Expected Response:**
```json
{
  "draft_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_chunks": 15,
  "page": 1,
  "limit": 20,
  "total_pages": 1,
  "chunks": [
    {
      "global_index": 0,
      "page_index": 0,
      "chunk_index": 0,
      "content": "# Getting Started\n\nWelcome to our API...",
      "word_count": 150,
      "character_count": 950,
      "source_page": {
        "index": 0,
        "url": "https://docs.example.com/getting-started",
        "title": "Getting Started"
      }
    }
  ]
}
```

---

## Part 2: KB Inspection Endpoints

### 2.1 List KB Documents

**Purpose:** List all documents in a finalized knowledge base

**Endpoint:** `GET /api/v1/kbs/{kb_id}/documents`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (pending, processing, completed, failed)
- `source_type` (optional): Filter by source (web_scraping, manual, file_upload)
- `search` (optional): Search in name/URL
- `include_disabled` (optional): Include disabled documents (admin only)
- `include_archived` (optional): Include archived documents (admin only)

**Example Request:**
```bash
curl -X GET "$BASE_URL/api/v1/kbs/{kb_id}/documents?status=completed&page=1&limit=20" \
  "${HEADERS[@]}"
```

**Expected Response:**
```json
{
  "kb_id": "660e8400-e29b-41d4-a716-446655440000",
  "total_documents": 25,
  "page": 1,
  "limit": 20,
  "total_pages": 2,
  "documents": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "kb_id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "API Documentation",
      "source_type": "web_scraping",
      "source_url": "https://docs.example.com/api",
      "content_preview": "API Documentation\n\nWelcome to our API...",
      "status": "completed",
      "word_count": 1500,
      "character_count": 9500,
      "chunk_count": 15,
      "is_enabled": true,
      "created_at": "2025-01-16T10:00:00Z",
      "updated_at": "2025-01-16T10:05:00Z"
    }
  ]
}
```

**Test Cases:**
- ✓ List all documents with pagination
- ✓ Filter by status
- ✓ Filter by source type
- ✓ Search by name/URL
- ✓ Admin-only disabled/archived documents
- ✓ RBAC: Viewers can read, editors can edit
- ✓ Proper error handling for invalid KB ID

---

### 2.2 Get Document Details

**Purpose:** Get full details of a specific document

**Endpoint:** `GET /api/v1/kbs/{kb_id}/documents/{doc_id}`

**Example Request:**
```bash
curl -X GET "$BASE_URL/api/v1/kbs/{kb_id}/documents/{doc_id}" \
  "${HEADERS[@]}"
```

**Expected Response:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "kb_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "880e8400-e29b-41d4-a716-446655440000",
  "name": "API Documentation",
  "source_type": "web_scraping",
  "source_url": "https://docs.example.com/api",
  "source_metadata": {
    "scraped_at": "2025-01-16T10:00:00Z",
    "content_length": 9500
  },
  "content_preview": "API Documentation\n\nWelcome to our API...",
  "status": "completed",
  "processing_progress": 100,
  "word_count": 1500,
  "character_count": 9500,
  "chunk_count": 15,
  "custom_metadata": {},
  "annotations": null,
  "is_enabled": true,
  "is_archived": false,
  "created_by": "990e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-16T10:00:00Z",
  "updated_at": "2025-01-16T10:05:00Z"
}
```

---

### 2.3 List KB Chunks

**Purpose:** List all chunks in a knowledge base

**Endpoint:** `GET /api/v1/kbs/{kb_id}/chunks`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 200)

**Example Request:**
```bash
curl -X GET "$BASE_URL/api/v1/kbs/{kb_id}/chunks?page=1&limit=50" \
  "${HEADERS[@]}"
```

**Expected Response:**
```json
{
  "kb_id": "660e8400-e29b-41d4-a716-446655440000",
  "total_chunks": 150,
  "page": 1,
  "limit": 50,
  "total_pages": 3,
  "chunks": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "document_id": "770e8400-e29b-41d4-a716-446655440000",
      "document_name": "API Documentation",
      "content": "# API Authentication\n\nUse Bearer tokens...",
      "position": 0,
      "chunk_index": 0,
      "word_count": 150,
      "character_count": 950,
      "source_url": "https://docs.example.com/api",
      "created_at": "2025-01-16T10:05:00Z"
    }
  ]
}
```

---

## Part 3: Document CRUD Operations

### 3.1 Create Document

**Purpose:** Manually add a document to the knowledge base

**Endpoint:** `POST /api/v1/kbs/{kb_id}/documents`

**Required Permissions:** `edit`

**Request Body:**
```json
{
  "name": "Custom Documentation",
  "content": "This is the document content that must be at least 50 characters long...",
  "source_type": "manual",
  "source_url": "https://example.com/custom-doc",
  "custom_metadata": {
    "author": "John Doe",
    "version": "1.0"
  },
  "annotations": "Important reference document"
}
```

**Example Request:**
```bash
curl -X POST "$BASE_URL/api/v1/kbs/{kb_id}/documents" \
  "${HEADERS[@]}" \
  -d '{
    "name": "Custom Documentation",
    "content": "This is the document content with more than 50 characters...",
    "source_type": "manual"
  }'
```

**Expected Response (201):**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "processing_job_id": "celery-task-12345"
}
```

**Validation Rules:**
- ✓ Content minimum: 50 characters
- ✓ Content maximum: 10MB
- ✓ Name length: 1-500 characters
- ✓ Document limit per KB: 10,000
- ✓ Status automatically set to "processing"

**Background Processing:**
After creation, the document goes through:
1. Chunking (using KB's chunking configuration)
2. Embedding generation
3. PostgreSQL storage
4. Qdrant indexing
5. Status update to "completed"

**Error Responses:**
- `400`: Content too short/long, invalid data
- `403`: Insufficient permissions
- `404`: KB not found
- `413`: Content exceeds size limit

---

### 3.2 Update Document

**Purpose:** Update document content or metadata

**Endpoint:** `PUT /api/v1/kbs/{kb_id}/documents/{doc_id}`

**Required Permissions:** `edit` (own documents) or `delete` (any document)

**Request Body (Smart Reprocessing):**
```json
{
  "name": "Updated Name",
  "content": "New content triggers re-chunking and re-embedding...",
  "custom_metadata": {"version": "2.0"},
  "is_enabled": true
}
```

**Example Request (Content Update):**
```bash
curl -X PUT "$BASE_URL/api/v1/kbs/{kb_id}/documents/{doc_id}" \
  "${HEADERS[@]}" \
  -d '{
    "content": "Updated content that is longer than 50 characters and triggers reprocessing..."
  }'
```

**Expected Response (Content Changed):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Document updated. Re-chunking and re-indexing in progress.",
  "processing_job_id": "celery-task-67890"
}
```

**Example Request (Metadata Only):**
```bash
curl -X PUT "$BASE_URL/api/v1/kbs/{kb_id}/documents/{doc_id}" \
  "${HEADERS[@]}" \
  -d '{
    "name": "New Document Name",
    "custom_metadata": {"version": "2.0"}
  }'
```

**Expected Response (Metadata Only):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "message": "Document updated successfully",
  "changes_applied": ["name", "custom_metadata"]
}
```

**Smart Reprocessing Logic:**
- **Content changed**: Full reprocessing (delete old chunks → re-chunk → re-embed → re-index)
- **Metadata only**: Immediate update (no reprocessing)
- **is_enabled changed**: Update all chunks' is_enabled status

**Test Cases:**
- ✓ Update content triggers reprocessing
- ✓ Update metadata only (no reprocessing)
- ✓ Enable/disable document updates chunks
- ✓ RBAC: Editors can update own documents, admins can update any
- ✓ Validation for content length

---

### 3.3 Delete Document

**Purpose:** Delete a document and all its chunks

**Endpoint:** `DELETE /api/v1/kbs/{kb_id}/documents/{doc_id}`

**Required Permissions:** `edit` (own documents) or `delete` (any document)

**Example Request:**
```bash
curl -X DELETE "$BASE_URL/api/v1/kbs/{kb_id}/documents/{doc_id}" \
  "${HEADERS[@]}"
```

**Expected Response (200):**
```json
{
  "message": "Document 'API Documentation' deleted successfully",
  "deleted": {
    "document_id": "770e8400-e29b-41d4-a716-446655440000",
    "chunks_deleted": 15,
    "qdrant_points_deleted": 15
  }
}
```

**Qdrant-First Deletion Strategy:**
1. **Delete from Qdrant FIRST** (external system, can retry)
2. If Qdrant deletion succeeds → Delete from PostgreSQL
3. If Qdrant deletion fails → Mark document as "pending_deletion" for retry

**Error Response (Qdrant Failure):**
```json
{
  "detail": "Failed to delete from vector store. Document marked for retry."
}
```

**Test Cases:**
- ✓ Successful deletion removes all chunks
- ✓ Qdrant failure marks for retry (doesn't delete from PostgreSQL)
- ✓ RBAC: Editors can delete own documents, admins can delete any
- ✓ Cascade deletion: chunks automatically deleted with document
- ✓ Non-existent document returns 404

---

## Part 4: Background Tasks

### 4.1 Check Task Status

After creating or updating documents, you can check the Celery task status:

**Using Flower (Celery Monitoring):**
```bash
# Access Flower UI
open http://localhost:5555

# Find task by ID
curl http://localhost:5555/api/task/info/celery-task-12345
```

**Task Lifecycle:**
1. `PENDING`: Task queued
2. `STARTED`: Task picked up by worker
3. `PROGRESS`: Processing (you can poll document status)
4. `SUCCESS`: Task completed successfully
5. `FAILURE`: Task failed (check error_message in document)

### 4.2 Monitor Document Processing

Poll the document status endpoint:

```bash
# Check document status
curl -X GET "$BASE_URL/api/v1/kbs/{kb_id}/documents/{doc_id}" \
  "${HEADERS[@]}"

# Check processing_progress field:
# - 0-10: Initializing
# - 10-40: Chunking
# - 40-80: Generating embeddings
# - 80-100: Indexing
# - 100: Completed

# Check status field:
# - "processing": In progress
# - "completed": Finished successfully
# - "failed": Error occurred (see error_message)
# - "pending_deletion": Waiting for Qdrant cleanup
```

---

## Part 5: Error Handling

### Common Error Codes

**400 Bad Request:**
- Content too short (< 50 characters)
- Invalid source_type
- Missing required fields

**401 Unauthorized:**
- Missing or invalid JWT token

**403 Forbidden:**
- Insufficient permissions for the operation
- Attempting to view disabled/archived documents without admin permission
- Attempting to delete another user's document without admin permission

**404 Not Found:**
- KB not found
- Document not found
- Draft not found

**413 Request Entity Too Large:**
- Content exceeds 10MB limit

**500 Internal Server Error:**
- Qdrant sync failures
- Database errors
- Unexpected processing errors

### Error Response Format

```json
{
  "detail": "Specific error message explaining what went wrong"
}
```

---

## Part 6: Testing Checklist

### Draft Inspection
- [ ] List draft pages with pagination
- [ ] Get specific page by index
- [ ] List draft chunks with filtering
- [ ] Handle drafts without preview data
- [ ] Verify ownership enforcement

### KB Inspection
- [ ] List documents with all filters
- [ ] Get document details
- [ ] List chunks with pagination
- [ ] Verify RBAC read permissions
- [ ] Test admin-only disabled/archived access

### Document CRUD
- [ ] Create document with validation
- [ ] Update document content (triggers reprocessing)
- [ ] Update document metadata (no reprocessing)
- [ ] Delete document (Qdrant-first strategy)
- [ ] Verify RBAC edit/delete permissions
- [ ] Test error handling for all validations

### Background Processing
- [ ] Verify process_document_task runs
- [ ] Verify reprocess_document_task runs
- [ ] Check task status in Flower
- [ ] Monitor processing_progress updates
- [ ] Verify final status after completion

### Edge Cases
- [ ] Create document at KB limit (10,000 documents)
- [ ] Update document while processing
- [ ] Delete document while processing
- [ ] Qdrant failure during deletion
- [ ] Concurrent updates to same document
- [ ] Large content (near 10MB limit)

---

## Part 7: Example Test Scripts

### Complete CRUD Test Flow

```bash
#!/bin/bash
set -e

# Configuration
BASE_URL="http://localhost:8000"
TOKEN="your_jwt_token"
KB_ID="your_kb_id"

# 1. Create KB first (if needed)
# KB_ID=$(curl -X POST "$BASE_URL/api/v1/kbs" ...)

# 2. Create a document
DOC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/kbs/$KB_ID/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Document",
    "content": "This is a test document with sufficient content to pass validation requirements.",
    "source_type": "manual"
  }')

DOC_ID=$(echo $DOC_RESPONSE | jq -r '.id')
echo "Created document: $DOC_ID"

# 3. Wait for processing
sleep 5

# 4. Check document status
curl -X GET "$BASE_URL/api/v1/kbs/$KB_ID/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN"

# 5. List all documents
curl -X GET "$BASE_URL/api/v1/kbs/$KB_ID/documents?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 6. Update document
curl -X PUT "$BASE_URL/api/v1/kbs/$KB_ID/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Document",
    "custom_metadata": {"version": "2.0"}
  }'

# 7. Delete document
curl -X DELETE "$BASE_URL/api/v1/kbs/$KB_ID/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN"

echo "Test completed successfully!"
```

---

## Summary

This guide covers all KB inspection and document CRUD endpoints with:
- ✓ Complete API reference
- ✓ Example requests and responses
- ✓ Validation rules and error handling
- ✓ RBAC permission requirements
- ✓ Background task monitoring
- ✓ Testing checklist
- ✓ Example test scripts

For more information, see:
- `/docs/kb/KB_INSPECTION_AND_CRUD_IMPLEMENTATION.md` - Implementation details
- `/docs/kb/REVIEW_RESPONSE.md` - Architecture decisions
- `/src/app/tests/kb/test_kb_inspection_and_crud.py` - Unit tests
