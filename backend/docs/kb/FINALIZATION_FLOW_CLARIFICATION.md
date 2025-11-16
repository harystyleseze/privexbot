# KB Finalization Flow - Critical Clarification

## Question: When Should PostgreSQL Save Happen?

**Answer: PostgreSQL save happens IMMEDIATELY when user clicks "Finalize", BEFORE background processing starts.**

---

## ✅ **Correct Flow (Recommended)**

```
╔════════════════════════════════════════════════════════════════╗
║ PHASE 1: DRAFT MODE (Redis Only - NO Database Writes)         ║
╚════════════════════════════════════════════════════════════════╝

User Actions:
  1. Create KB draft                    → Redis
  2. Add web URL source                 → Redis
  3. Configure chunking strategy        → Redis
  4. Configure embedding model          → Redis
  5. Preview chunks (optional)          → Redis (ephemeral)
  6. Adjust chunk size                  → Redis
  7. Select vector store                → Redis

Database State: NOTHING in PostgreSQL
Duration: User-controlled (seconds to hours)


╔════════════════════════════════════════════════════════════════╗
║ PHASE 2: FINALIZATION (Create DB Records - Synchronous)       ║
╚════════════════════════════════════════════════════════════════╝

User clicks "Create Knowledge Base" button
  ↓
API Endpoint: POST /kb-drafts/{id}/finalize
  ↓
1. Create KB record in PostgreSQL
   ├─ name: "Keeta Documentation"
   ├─ status: "processing"              ← NOT "ready" yet!
   ├─ config: {...chunking, embedding, etc.}
   └─ created_at: 2025-11-15 10:30:00
  ↓
2. Create Document placeholders
   ├─ Document 1: source_url="docs.keeta.com/intro"
   │              status="pending"
   └─ Document 2: source_url="docs.keeta.com/guides"
                  status="pending"
  ↓
3. Create PipelineExecution record (optional)
   ├─ pipeline_id: "pipeline:kb_123:1731668400"
   └─ status: "queued"
  ↓
4. Queue Celery background task
   └─ Task ID: "celery-task-uuid-123"
  ↓
5. Delete draft from Redis
  ↓
6. Return response to frontend
   {
     "kb_id": "uuid-123",
     "pipeline_id": "pipeline:kb_123:1731668400",
     "status": "processing"
   }

Database State: KB EXISTS but EMPTY (no chunks, no vectors)
Duration: <100ms (synchronous operation)
User sees: KB appears in dashboard with "Processing..." status


╔════════════════════════════════════════════════════════════════╗
║ PHASE 3: BACKGROUND PROCESSING (Populate Content)             ║
╚════════════════════════════════════════════════════════════════╝

Celery Task Runs Asynchronously:

STEP 1: Web Scraping
  ├─ Firecrawl API calls
  ├─ Update Document.status = "scraping"
  └─ Update pipeline status in Redis

STEP 2: Content Parsing
  ├─ Parse HTML structure
  ├─ Extract headings, paragraphs, code blocks
  └─ Update Document.status = "parsing"

STEP 3: Chunking
  ├─ Apply chunking strategy
  ├─ Create Chunk records in PostgreSQL    ← CHUNKS SAVED HERE!
  │   └─ For each chunk:
  │       ├─ Chunk(content="...", metadata={})
  │       └─ db.add(chunk)
  └─ Update Document.status = "chunking"

STEP 4: Embedding Generation
  ├─ Generate embeddings via OpenAI
  ├─ Update Chunk records with embeddings   ← EMBEDDINGS SAVED HERE!
  │   └─ chunk.embedding = [0.123, 0.456, ...]
  └─ Update Document.status = "embedding"

STEP 5: Vector Indexing
  ├─ Index vectors in Qdrant
  ├─ Update Document.status = "indexed"
  └─ Update KB.status = "ready"            ← NOW QUERYABLE!

Database State: KB FULLY POPULATED with chunks and embeddings
Duration: 2-10 minutes (asynchronous)
User sees: Progress updates every 2 seconds via polling
```

---

## Why This Flow?

### ✅ Benefits of Saving to DB Before Processing

1. **Immediate User Feedback**
   - User sees KB in dashboard immediately
   - Clear "Processing..." status visible
   - Can track progress via pipeline_id

2. **Progress Tracking**
   - Frontend can poll `/api/v1/pipelines/{pipeline_id}/status`
   - Real-time updates: "Scraping 15/50 pages..."
   - User doesn't wonder if anything is happening

3. **Error Recovery**
   - If processing fails, KB record exists
   - Can retry processing without recreating KB
   - Audit trail: know when KB was created vs processed

4. **User Experience**
   - User can navigate away and come back later
   - KB shows in list with status indicator
   - Can cancel processing if needed

5. **System Reliability**
   - If Celery worker crashes, KB record exists
   - Can restart processing from checkpoint
   - No lost work if background task fails

---

## ❌ Problems with Saving AFTER Processing

If we waited to save to DB until processing completes:

```
Draft (Redis) → Background Processing (10 min) → Save to PostgreSQL
```

**Problems**:

1. ❌ **No Tracking**: User clicks "Create" and waits 10 minutes with no feedback
2. ❌ **No Reference**: Can't show KB in dashboard during processing
3. ❌ **No Progress**: Can't poll status without a KB ID
4. ❌ **Lost Work**: If user closes browser, can't find their KB later
5. ❌ **No Retry**: If processing fails, no record of attempt
6. ❌ **Poor UX**: User thinks nothing happened and clicks again

---

## Database Schema Design

### KnowledgeBase Table

```sql
CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    status VARCHAR(20) NOT NULL,  -- 'processing', 'ready', 'failed'
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,        -- Set when status → 'ready'
    updated_at TIMESTAMP
);
```

**Status Values**:
- `processing`: KB created, background task running
- `ready`: Processing complete, KB queryable
- `failed`: Processing failed, can retry

### Document Table

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    kb_id UUID NOT NULL REFERENCES knowledge_bases(id),
    source_url VARCHAR(500),
    source_type VARCHAR(50),
    status VARCHAR(20) NOT NULL,  -- 'pending', 'scraping', 'chunking', 'ready'
    metadata JSONB,
    created_at TIMESTAMP NOT NULL
);
```

### Chunk Table

```sql
CREATE TABLE chunks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id),
    kb_id UUID NOT NULL REFERENCES knowledge_bases(id),
    content TEXT NOT NULL,
    embedding VECTOR(1536),       -- pgvector extension
    metadata JSONB,
    chunk_index INTEGER,
    created_at TIMESTAMP NOT NULL
);
```

**IMPORTANT**: Chunks are created DURING background processing, not during finalization.

---

## Code Implementation

### Finalization Endpoint (Synchronous)

```python
# src/app/api/v1/routes/kb_draft.py

@router.post("/{draft_id}/finalize")
async def finalize_kb_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Finalize KB draft: Create DB records and queue processing.

    CRITICAL: This is a FAST synchronous operation (<100ms).
    Heavy processing happens in background Celery task.
    """

    # Get draft from Redis
    draft = await draft_service.get_draft(DraftType.KB, draft_id)
    if not draft:
        raise HTTPException(404, "Draft not found")

    # Validate draft
    validation = await kb_draft_service.validate_draft(draft)
    if not validation["is_valid"]:
        raise HTTPException(400, f"Invalid draft: {validation['errors']}")

    # ========================================
    # PHASE 2: CREATE DATABASE RECORDS
    # ========================================

    # Create KB record (status="processing")
    kb = KnowledgeBase(
        workspace_id=UUID(draft["workspace_id"]),
        name=draft["data"]["name"],
        description=draft["data"].get("description"),
        config=draft["data"]["config"],
        status="processing",  # ← Will be "ready" after background processing
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(kb)
    db.flush()  # Get kb.id without committing yet

    # Create document placeholders
    for source in draft["data"]["sources"]:
        document = Document(
            kb_id=kb.id,
            workspace_id=kb.workspace_id,
            source_type=source["type"],
            source_url=source.get("url"),
            status="pending",
            metadata=source,
            created_at=datetime.utcnow()
        )
        db.add(document)

    # Commit to PostgreSQL
    db.commit()
    db.refresh(kb)

    # ========================================
    # PHASE 3: QUEUE BACKGROUND PROCESSING
    # ========================================

    # Create pipeline execution tracking in Redis
    pipeline_id = f"pipeline:{kb.id}:{int(time.time())}"
    await redis_client.setex(
        pipeline_id,
        86400,  # 24 hour TTL
        json.dumps({
            "kb_id": str(kb.id),
            "status": "queued",
            "created_at": datetime.utcnow().isoformat()
        })
    )

    # Queue background task
    from app.tasks.kb_pipeline_tasks import process_web_kb_task

    task = process_web_kb_task.apply_async(
        kwargs={
            "kb_id": str(kb.id),
            "pipeline_id": pipeline_id,
            "sources": draft["data"]["sources"],
            "config": draft["data"]["config"]
        },
        queue="web_scraping"
    )

    # Delete draft from Redis
    await draft_service.delete_draft(DraftType.KB, draft_id)

    # Return immediately (don't wait for background task)
    return {
        "kb_id": str(kb.id),
        "pipeline_id": pipeline_id,
        "status": "processing",
        "message": "KB created successfully. Processing in background.",
        "tracking_url": f"/api/v1/pipelines/{pipeline_id}/status",
        "estimated_completion_minutes": validation["estimated_duration"]
    }
```

### Background Task (Asynchronous)

```python
# src/app/tasks/kb_pipeline_tasks.py

@shared_task(bind=True, name="process_web_kb")
def process_web_kb_task(
    self,
    kb_id: str,
    pipeline_id: str,
    sources: List[Dict],
    config: Dict
):
    """
    Background task to process KB sources.

    This runs AFTER KB record exists in PostgreSQL.
    """

    db = SessionLocal()

    try:
        # Get KB from database
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
        if not kb:
            raise Exception(f"KB {kb_id} not found")

        # Update pipeline status
        await update_pipeline_status(pipeline_id, "running")

        # Process each source
        for source in sources:
            # STEP 1: Scrape web pages
            pages = await firecrawl_service.crawl(source["url"], source["config"])

            # STEP 2: Parse content
            parsed_pages = await smart_parsing_service.parse_html(pages)

            # STEP 3: Create chunks
            all_chunks = []
            for page in parsed_pages:
                chunks = await chunking_service.chunk_content(
                    page.content,
                    strategy=config["chunking"]["strategy"]
                )

                # Save chunks to PostgreSQL
                for i, chunk in enumerate(chunks):
                    db_chunk = Chunk(
                        kb_id=UUID(kb_id),
                        document_id=page.document_id,
                        content=chunk.content,
                        metadata=chunk.metadata,
                        chunk_index=i
                    )
                    db.add(db_chunk)
                    all_chunks.append(db_chunk)

            db.commit()

            # STEP 4: Generate embeddings
            texts = [chunk.content for chunk in all_chunks]
            embeddings = await embedding_service.generate_embeddings(texts)

            # Update chunks with embeddings
            for chunk, embedding in zip(all_chunks, embeddings):
                chunk.embedding = embedding

            db.commit()

            # STEP 5: Index in Qdrant
            await qdrant_service.upsert_chunks(kb_id, all_chunks)

        # Update KB status to "ready"
        kb.status = "ready"
        kb.processed_at = datetime.utcnow()
        db.commit()

        # Update pipeline status
        await update_pipeline_status(pipeline_id, "completed")

    except Exception as e:
        # Update KB status to "failed"
        kb.status = "failed"
        kb.error_message = str(e)
        db.commit()

        # Update pipeline status
        await update_pipeline_status(pipeline_id, "failed", str(e))

        raise

    finally:
        db.close()
```

---

## Timeline Example: docs.keeta.com

```
T+0s:    User clicks "Create KB"
         └─ API creates KB record (status="processing")
         └─ Returns kb_id and pipeline_id

T+1s:    Frontend starts polling /pipelines/{id}/status
         └─ Shows "Initializing pipeline..."

T+2s:    Celery task starts
         └─ Status: "Scraping web pages..."

T+15s:   Scraped 10/50 pages
         └─ Frontend shows progress bar: 20%

T+45s:   Scraped 50/50 pages
         └─ Status: "Parsing content..."

T+60s:   Parsing complete
         └─ Status: "Creating chunks..."
         └─ Chunks saved to PostgreSQL

T+75s:   Chunking complete (850 chunks)
         └─ Status: "Generating embeddings..."

T+120s:  Embeddings complete
         └─ Chunks updated with embeddings
         └─ Status: "Indexing vectors..."

T+130s:  Indexing complete
         └─ KB.status = "ready"
         └─ Frontend shows "KB Ready!"

Total: ~2 minutes
```

---

## Best Practice Summary

### ✅ DO

- Save KB metadata to PostgreSQL immediately on finalize
- Use status field to track processing state
- Queue heavy processing as background tasks
- Provide real-time progress updates via polling
- Save chunks incrementally during processing
- Support partial success (some pages fail, KB still created)

### ❌ DON'T

- Wait for processing to complete before saving KB
- Make finalization endpoint wait for background tasks
- Save everything in one transaction at the end
- Leave user without feedback during processing
- Fail entire KB creation if one page fails
- Skip progress tracking

---

## Conclusion

**The PostgreSQL save happens in 3 stages**:

1. **Finalization**: KB metadata + Document placeholders
2. **Background Processing**: Chunks created and saved incrementally
3. **Completion**: KB status updated to "ready"

This provides the best balance of:
- User experience (immediate feedback)
- System reliability (can retry on failure)
- Progress tracking (real-time updates)
- Data integrity (partial success handling)

**This is the correct implementation and matches the pipeline documentation.**
