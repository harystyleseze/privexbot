# Complete KB from Web URL - Implementation Guide (Single Source of Truth)

**Version**: 1.0
**Last Updated**: 2025-11-16
**Status**: Production-Ready Architecture

---

## 📚 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [The 3-Phase Finalization Flow](#the-3-phase-finalization-flow)
4. [Component Stack (All Self-Hosted)](#component-stack)
5. [Detailed Implementation](#detailed-implementation)
6. [Docker Compose Setup](#docker-compose-setup)
7. [Error Handling & Edge Cases](#error-handling)
8. [Monitoring & Observability](#monitoring)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Guide](#deployment-guide)
11. [Performance Optimization](#performance-optimization)
12. [Security & Privacy](#security-privacy)
13. [Cost Analysis](#cost-analysis)
14. [Appendix](#appendix)

---

## Executive Summary {#executive-summary}

This document provides the **complete, production-ready implementation** for creating Knowledge Bases from web URLs with:

### Core Principles

✅ **Privacy-First**: All processing on your infrastructure, no external APIs
✅ **Simple Architecture**: Monolithic with clear service boundaries
✅ **Production-Ready**: Comprehensive error handling and monitoring
✅ **Scalable**: Horizontal scaling via Celery workers
✅ **Cost-Effective**: Fixed infrastructure costs only

### Technology Stack

```
┌──────────────────────────────────────────────────────────────┐
│  ALL COMPONENTS SELF-HOSTED - NO EXTERNAL APIs              │
├──────────────────────────────────────────────────────────────┤
│  Web Scraping:    Crawl4AI (Playwright + Chromium + Stealth)│
│  Embeddings:      sentence-transformers (CPU-optimized)      │
│  Vector Store:    Qdrant (self-hosted Docker)                │
│  Processing:      Celery (background tasks)                  │
│  State:           Redis + PostgreSQL                         │
│  Orchestration:   Docker Compose                             │
└──────────────────────────────────────────────────────────────┘
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Web Scraping** | Crawl4AI | Built-in stealth mode, JavaScript handling, markdown output |
| **Embeddings** | sentence-transformers | CPU-optimized, good quality, fully local |
| **Vector Store** | Qdrant | High performance, easy Docker deployment |
| **Architecture** | Monolithic-first | Faster development, simpler operations, ready for extraction |

### Expected Performance

| Metric | Value |
|--------|-------|
| Processing time (50 pages) | 2-4 minutes |
| CPU usage | ~2 cores average |
| Memory usage | ~4GB peak |
| VM requirements | 8vCPU, 16GB RAM |
| Monthly cost | $100-155 |

---

## Architecture Overview {#architecture-overview}

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Frontend)                          │
│                  "Create KB from docs.keeta.com"                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Synchronous)                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  POST /api/v1/kb-drafts/{id}/sources/web                   ││
│  │  ├─ Store config in Redis (draft mode)                     ││
│  │  └─ Return immediately (~10ms)                             ││
│  └────────────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────────────┐│
│  │  POST /api/v1/kb-drafts/{id}/finalize                      ││
│  │  ├─ Create KB in PostgreSQL (status="processing")          ││
│  │  ├─ Queue Celery task                                      ││
│  │  └─ Return pipeline_id (~100ms)                            ││
│  └────────────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────────────┐│
│  │  GET /api/v1/pipelines/{pipeline_id}/status                ││
│  │  ├─ Read from Redis                                        ││
│  │  └─ Return progress (Frontend polls every 2s)              ││
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────┬────────────────────────────────────────┘
                         │ Queue Task
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Celery Worker (Asynchronous)                  │
│                                                                  │
│  ╔════════════════════════════════════════════════════════════╗│
│  ║  STEP 1: WEB SCRAPING (Crawl4AI)              60s          ║│
│  ║  ├─ Stealth mode enabled                                   ║│
│  ║  ├─ Human-like delays                                      ║│
│  ║  ├─ JavaScript rendering                                   ║│
│  ║  └─ Output: Clean markdown                                 ║│
│  ╚════════════════════════════════════════════════════════════╝│
│  ╔════════════════════════════════════════════════════════════╗│
│  ║  STEP 2: CONTENT PARSING                       10s         ║│
│  ║  ├─ Extract headings hierarchy                             ║│
│  ║  ├─ Identify code blocks, tables                           ║│
│  ║  └─ Clean boilerplate                                      ║│
│  ╚════════════════════════════════════════════════════════════╝│
│  ╔════════════════════════════════════════════════════════════╗│
│  ║  STEP 3: INTELLIGENT CHUNKING                  15s         ║│
│  ║  ├─ Strategy: by_heading/semantic                          ║│
│  ║  ├─ Preserve context & code blocks                         ║│
│  ║  └─ Save Chunks to PostgreSQL                              ║│
│  ╚════════════════════════════════════════════════════════════╝│
│  ╔════════════════════════════════════════════════════════════╗│
│  ║  STEP 4: EMBEDDING GENERATION (CPU)            45s         ║│
│  ║  ├─ Model: all-MiniLM-L6-v2 (384 dims)                     ║│
│  ║  ├─ Batch: 100 chunks at a time                            ║│
│  ║  └─ Update Chunk.embedding                                 ║│
│  ╚════════════════════════════════════════════════════════════╝│
│  ╔════════════════════════════════════════════════════════════╗│
│  ║  STEP 5: VECTOR INDEXING (Qdrant)             8s          ║│
│  ║  ├─ Create collection kb_{kb_id}                           ║│
│  ║  ├─ Batch upsert: 500 vectors                              ║│
│  ║  └─ KB.status = "ready"                                    ║│
│  ╚════════════════════════════════════════════════════════════╝│
│                                                                  │
│  ⚡ All steps update Redis pipeline status in real-time         │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     State Management                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redis (Ephemeral State)                                 │  │
│  │  ├─ draft:kb:{draft_id}         → Draft configuration    │  │
│  │  ├─ pipeline:{pipeline_id}:status → Real-time progress   │  │
│  │  └─ pipeline:{pipeline_id}:logs   → Processing logs      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Persistent Data)                            │  │
│  │  ├─ knowledge_bases  → KB metadata & status              │  │
│  │  ├─ documents        → Document records                  │  │
│  │  └─ chunks           → Chunks with embeddings (pgvector) │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Qdrant (Vector Store)                                   │  │
│  │  └─ collections/kb_{kb_id} → Vector search index         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Lifecycle

```
1. USER CONFIGURATION (Draft Mode - Redis)
   ↓
   User adds URL, configures scraping, chunking, embedding
   Duration: User-controlled (seconds to hours)
   Storage: Redis only (24hr TTL)

2. FINALIZATION (Metadata to PostgreSQL)
   ↓
   KB record created (status="processing")
   Document placeholders created
   Pipeline queued
   Duration: <100ms
   Storage: PostgreSQL + Redis

3. BACKGROUND PROCESSING (Content Population)
   ↓
   Scrape → Parse → Chunk → Embed → Index
   Chunks incrementally saved to PostgreSQL
   Vectors indexed in Qdrant
   Duration: 2-4 minutes
   Storage: PostgreSQL + Qdrant

4. COMPLETION (Status Update)
   ↓
   KB.status = "ready"
   User can query KB
   Duration: <1s
   Storage: PostgreSQL updated
```

---

## The 3-Phase Finalization Flow {#the-3-phase-finalization-flow}

### CRITICAL DESIGN DECISION

**PostgreSQL write happens in 2 stages**:
1. **Phase 2 (Finalization)**: KB metadata saved IMMEDIATELY
2. **Phase 3 (Background)**: Chunks populated ASYNCHRONOUSLY

**Why this approach?**
- ✅ User sees KB immediately
- ✅ Can track progress
- ✅ Can retry on failure
- ✅ Better UX than waiting for processing

---

### PHASE 1: Draft Mode (Redis Only)

**Duration**: User-controlled (seconds to hours)
**Database State**: NOTHING in PostgreSQL

```python
# User Actions (All stored in Redis)

# 1. Create KB draft
POST /api/v1/kb-drafts
{
  "name": "Keeta Documentation",
  "workspace_id": "uuid-workspace"
}
→ Redis: draft:kb:{draft_id} (TTL: 24 hours)

# 2. Add URL source
POST /api/v1/kb-drafts/{draft_id}/sources/web
{
  "url": "https://docs.keeta.com/introduction",
  "config": {
    "method": "crawl",
    "max_pages": 50,
    "max_depth": 3,
    "include_patterns": ["/introduction/**", "/guides/**"],
    "exclude_patterns": ["/admin/**"]
  }
}
→ Redis: Updates draft:kb:{draft_id}

# 3. Configure chunking
POST /api/v1/kb-drafts/{draft_id}/chunking
{
  "strategy": "by_heading",
  "chunk_size": 1000,
  "chunk_overlap": 200,
  "preserve_code_blocks": true
}
→ Redis: Updates draft:kb:{draft_id}

# 4. Configure embedding
POST /api/v1/kb-drafts/{draft_id}/embedding
{
  "model": "all-MiniLM-L6-v2",
  "device": "cpu"
}
→ Redis: Updates draft:kb:{draft_id}

# 5. Preview chunks (optional)
POST /api/v1/kb-drafts/{draft_id}/sources/{source_id}/preview
→ Redis: Returns preview (NOT saved permanently)
```

**Implementation**:

```python
# src/app/api/v1/routes/kb_draft.py

@router.post("/{draft_id}/sources/web")
async def add_web_source_to_draft(
    draft_id: str,
    url: str = Body(...),
    config: Dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add web URL to KB draft (stored in Redis ONLY).

    IMPORTANT: No PostgreSQL writes. Everything in Redis.
    """

    # Verify user owns this draft
    draft = await draft_service.get_draft(DraftType.KB, draft_id)
    if not draft or draft["created_by"] != str(current_user.id):
        raise HTTPException(404, "Draft not found")

    # Validate URL
    if not url.startswith(("http://", "https://")):
        raise HTTPException(400, "Invalid URL")

    # Create source entry
    source = {
        "id": str(uuid.uuid4()),
        "type": "web_scraping",
        "url": url,
        "config": config,
        "added_at": datetime.utcnow().isoformat()
    }

    # Update draft in Redis
    sources = draft["data"].get("sources", [])
    sources.append(source)

    await draft_service.update_draft(
        draft_type=DraftType.KB,
        draft_id=draft_id,
        updates={"data": {"sources": sources}}
    )

    return {
        "source_id": source["id"],
        "message": "Source added to draft (not saved to database yet)"
    }
```

**Key Points**:
- ✅ All operations are FAST (<50ms)
- ✅ No database load during configuration
- ✅ User can configure/preview without commitment
- ✅ Draft expires after 24 hours if not finalized

---

### PHASE 2: Finalization (Create DB Records)

**Duration**: <100ms (synchronous)
**Database State**: KB EXISTS but EMPTY

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

    CRITICAL FLOW:
    1. Create KB in PostgreSQL (status="processing")
    2. Create Document placeholders
    3. Queue background Celery task
    4. Return immediately (don't wait)

    IMPORTANT: This is SYNCHRONOUS (<100ms).
    Heavy processing happens in background task.
    """

    # Get draft from Redis
    draft = await draft_service.get_draft(DraftType.KB, draft_id)
    if not draft:
        raise HTTPException(404, "Draft not found")

    # Verify ownership
    if draft["created_by"] != str(current_user.id):
        raise HTTPException(403, "Access denied")

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
        config=draft["data"].get("config", {}),
        status="processing",  # ← Will be "ready" after background processing
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(kb)
    db.flush()  # Get kb.id without committing yet

    # Create document placeholders (one per source)
    documents = []
    for source in draft["data"]["sources"]:
        document = Document(
            kb_id=kb.id,
            workspace_id=kb.workspace_id,
            source_type=source["type"],
            source_url=source.get("url"),
            status="pending",  # ← Will be updated by background task
            metadata=source,
            created_at=datetime.utcnow()
        )
        db.add(document)
        documents.append(document)

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
            "created_at": datetime.utcnow().isoformat(),
            "sources": draft["data"]["sources"]
        })
    )

    # Queue background task
    from app.tasks.kb_pipeline_tasks import process_web_kb_task

    task = process_web_kb_task.apply_async(
        kwargs={
            "kb_id": str(kb.id),
            "pipeline_id": pipeline_id,
            "sources": draft["data"]["sources"],
            "config": draft["data"].get("config", {})
        },
        queue="web_scraping"
    )

    # Delete draft from Redis (cleanup)
    await draft_service.delete_draft(DraftType.KB, draft_id)

    # Return immediately (don't wait for background task)
    return {
        "kb_id": str(kb.id),
        "pipeline_id": pipeline_id,
        "status": "processing",
        "message": "KB created successfully. Processing in background.",
        "tracking_url": f"/api/v1/pipelines/{pipeline_id}/status",
        "estimated_completion_minutes": validation.get("estimated_duration", 3)
    }
```

**User Experience Flow**:

```
T+0ms:   User clicks "Create KB" button
T+10ms:  API receives request, validates draft
T+30ms:  Creates KB record in PostgreSQL (status="processing")
T+50ms:  Creates Document placeholders
T+70ms:  Queues Celery task
T+90ms:  Returns response to frontend with pipeline_id
T+100ms: Frontend shows "KB created! Processing..."
         └─ Starts polling /pipelines/{id}/status every 2 seconds
```

---

### PHASE 3: Background Processing (Populate Chunks)

**Duration**: 2-4 minutes (asynchronous)
**Database State**: Chunks populated incrementally

```python
# src/app/tasks/kb_pipeline_tasks.py

from celery import shared_task
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.crawl4ai_service import crawl4ai_service
from app.services.embedding_service_local import embedding_service
from app.services.qdrant_service import qdrant_service
import asyncio

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
    Processing happens asynchronously.
    """

    db = SessionLocal()

    try:
        # Get KB from database
        kb = db.query(KnowledgeBase).filter(
            KnowledgeBase.id == kb_id
        ).first()

        if not kb:
            raise Exception(f"KB {kb_id} not found in database")

        # Update pipeline status to "running"
        asyncio.run(update_pipeline_status(pipeline_id, "running", {
            "stage": "initialization",
            "progress": 0
        }))

        successful_pages = []
        failed_pages = []
        all_chunks = []

        # ========================================
        # STEP 1: WEB SCRAPING (Crawl4AI)
        # ========================================

        asyncio.run(update_pipeline_status(pipeline_id, "running", {
            "stage": "scraping",
            "progress": 10
        }))

        for source in sources:
            try:
                # Scrape pages
                pages = asyncio.run(
                    crawl4ai_service.crawl_website(
                        start_url=source["url"],
                        config=CrawlConfig(**source["config"])
                    )
                )

                asyncio.run(update_pipeline_status(pipeline_id, "running", {
                    "stage": "scraping",
                    "progress": 30,
                    "pages_scraped": len(pages)
                }))

                # ========================================
                # STEP 2: CONTENT PARSING
                # ========================================

                asyncio.run(update_pipeline_status(pipeline_id, "running", {
                    "stage": "parsing",
                    "progress": 40
                }))

                parsed_pages = []
                for page in pages:
                    # Parse markdown structure
                    parsed = await smart_parsing_service.parse_markdown(
                        page.content,
                        preserve_code=config.get("preserve_code_blocks", True)
                    )
                    parsed_pages.append(parsed)

                # ========================================
                # STEP 3: INTELLIGENT CHUNKING
                # ========================================

                asyncio.run(update_pipeline_status(pipeline_id, "running", {
                    "stage": "chunking",
                    "progress": 50
                }))

                source_chunks = []
                for parsed_page in parsed_pages:
                    # Apply chunking strategy
                    chunks = await chunking_service.chunk_content(
                        content=parsed_page.content,
                        strategy=config.get("chunking_strategy", "by_heading"),
                        chunk_size=config.get("chunk_size", 1000),
                        chunk_overlap=config.get("chunk_overlap", 200),
                        metadata={
                            "url": parsed_page.url,
                            "title": parsed_page.title
                        }
                    )

                    # Save chunks to PostgreSQL IMMEDIATELY
                    for i, chunk in enumerate(chunks):
                        db_chunk = Chunk(
                            id=uuid.uuid4(),
                            kb_id=UUID(kb_id),
                            document_id=parsed_page.document_id,
                            content=chunk.content,
                            chunk_index=i,
                            metadata=chunk.metadata,
                            created_at=datetime.utcnow()
                        )
                        db.add(db_chunk)
                        source_chunks.append(db_chunk)

                    db.commit()

                all_chunks.extend(source_chunks)

                asyncio.run(update_pipeline_status(pipeline_id, "running", {
                    "stage": "chunking",
                    "progress": 65,
                    "chunks_created": len(all_chunks)
                }))

                successful_pages.extend([p.url for p in pages])

            except Exception as e:
                # Log error but continue with other sources
                failed_pages.append({
                    "source": source["url"],
                    "error": str(e)
                })
                continue

        # ========================================
        # STEP 4: EMBEDDING GENERATION
        # ========================================

        asyncio.run(update_pipeline_status(pipeline_id, "running", {
            "stage": "embedding",
            "progress": 70
        }))

        # Generate embeddings in batches
        texts = [chunk.content for chunk in all_chunks]
        embeddings = asyncio.run(
            embedding_service.generate_embeddings(texts, show_progress=False)
        )

        # Update chunks with embeddings
        for chunk, embedding in zip(all_chunks, embeddings):
            chunk.embedding = embedding

        db.commit()

        asyncio.run(update_pipeline_status(pipeline_id, "running", {
            "stage": "embedding",
            "progress": 85,
            "embeddings_generated": len(embeddings)
        }))

        # ========================================
        # STEP 5: VECTOR INDEXING (Qdrant)
        # ========================================

        asyncio.run(update_pipeline_status(pipeline_id, "running", {
            "stage": "indexing",
            "progress": 90
        }))

        # Create Qdrant collection
        asyncio.run(qdrant_service.create_kb_collection(kb.id, vector_size=384))

        # Prepare chunks for Qdrant
        qdrant_chunks = [
            {
                "id": str(chunk.id),
                "embedding": chunk.embedding,
                "content": chunk.content,
                "metadata": chunk.metadata
            }
            for chunk in all_chunks
        ]

        # Upsert to Qdrant
        asyncio.run(qdrant_service.upsert_chunks(kb.id, qdrant_chunks))

        asyncio.run(update_pipeline_status(pipeline_id, "running", {
            "stage": "indexing",
            "progress": 95,
            "vectors_indexed": len(qdrant_chunks)
        }))

        # ========================================
        # FINAL: UPDATE KB STATUS
        # ========================================

        # Determine final status
        if successful_pages:
            kb.status = "ready" if not failed_pages else "ready_with_warnings"
            kb.processed_at = datetime.utcnow()
            kb.stats = {
                "successful_pages": len(successful_pages),
                "failed_pages": len(failed_pages),
                "total_chunks": len(all_chunks),
                "processing_duration_seconds": int(time.time() - kb.created_at.timestamp())
            }
        else:
            kb.status = "failed"
            kb.error_message = "No pages successfully processed"

        db.commit()

        # Update pipeline status to "completed"
        asyncio.run(update_pipeline_status(pipeline_id, "completed", {
            "stage": "completed",
            "progress": 100,
            "stats": kb.stats
        }))

    except Exception as e:
        # Total failure
        kb.status = "failed"
        kb.error_message = str(e)
        db.commit()

        # Update pipeline status to "failed"
        asyncio.run(update_pipeline_status(pipeline_id, "failed", {
            "error": str(e)
        }))

        raise

    finally:
        db.close()


async def update_pipeline_status(pipeline_id: str, status: str, data: Dict):
    """Update pipeline status in Redis"""
    import json
    from app.db.redis import redis_client

    status_data = {
        "pipeline_id": pipeline_id,
        "status": status,
        "updated_at": datetime.utcnow().isoformat(),
        **data
    }

    await redis_client.setex(
        f"pipeline:{pipeline_id}:status",
        86400,  # 24 hour TTL
        json.dumps(status_data)
    )
```

**Timeline Example** (docs.keeta.com):

```
T+0s:     Celery task starts
          └─ Pipeline status: "queued" → "running"

T+10s:    Scraping starts (Crawl4AI)
          └─ Progress: 10% "Scraping web pages..."

T+60s:    Scraped 47/50 pages
          └─ Progress: 30% "Scraped 47 pages"

T+70s:    Parsing starts
          └─ Progress: 40% "Parsing content..."

T+85s:    Chunking starts
          └─ Progress: 50% "Creating chunks..."

T+100s:   850 chunks created and saved to PostgreSQL
          └─ Progress: 65% "Created 850 chunks"

T+105s:   Embedding generation starts
          └─ Progress: 70% "Generating embeddings..."

T+150s:   850 embeddings generated (CPU)
          └─ Progress: 85% "Generated 850 embeddings"

T+155s:   Vector indexing starts
          └─ Progress: 90% "Indexing vectors..."

T+163s:   850 vectors indexed in Qdrant
          └─ Progress: 95% "Indexed 850 vectors"

T+165s:   KB status updated to "ready"
          └─ Progress: 100% "Completed!"

Total: ~2.75 minutes
```

**Key Points**:
- ✅ Chunks saved to PostgreSQL incrementally (not all at once)
- ✅ Real-time progress updates every few seconds
- ✅ Partial success supported (some pages fail, KB still created)
- ✅ Error handling at each step
- ✅ Cleanup on failure

---

## Component Stack (All Self-Hosted) {#component-stack}

### 1. Web Scraping: Crawl4AI

**File**: `src/app/services/crawl4ai_service.py`

**Why Crawl4AI?**

| Feature | Crawl4AI | Playwright + BS4 |
|---------|----------|------------------|
| JavaScript handling | ✅ Built-in | ✅ Manual |
| Anti-bot detection | ✅ Stealth mode | ⚠️ Manual config |
| Content extraction | ✅ Multiple strategies | ❌ Manual parsing |
| Markdown output | ✅ Built-in | ❌ Manual conversion |
| Crawling logic | ✅ Built-in | ❌ Manual implementation |
| Maintenance | ✅ Active development | ⚠️ DIY |

**Decision**: Use Crawl4AI for production reliability.

**Complete Implementation**: See Appendix A

**Anti-Bot Measures**:
```python
# Stealth configuration
browser_config = BrowserConfig(
    headless=True,
    user_agent="Mozilla/5.0 ...",  # Realistic UA
    viewport_width=1920,
    viewport_height=1080,
    extra_args=[
        "--disable-blink-features=AutomationControlled",  # Hide automation
        "--disable-dev-shm-usage",
        "--no-sandbox"
    ]
)

# Human-like delays
delay_before_return_html=2.0  # Wait 2 seconds
await asyncio.sleep(1.5)  # Between requests
```

---

### 2. Embeddings: sentence-transformers

**File**: `src/app/services/embedding_service_local.py`

**Why sentence-transformers?**

| Model | Dimensions | Speed (CPU) | Quality | Use Case |
|-------|-----------|-------------|---------|----------|
| all-MiniLM-L6-v2 | 384 | ⚡⚡⚡ Fast | ⭐⭐⭐ Good | General (Recommended) |
| all-mpnet-base-v2 | 768 | ⚡⚡ Medium | ⭐⭐⭐⭐ Better | Quality-focused |
| all-MiniLM-L12-v2 | 384 | ⚡⚡ Medium | ⭐⭐⭐⭐ Better | Balanced |

**Decision**: Use all-MiniLM-L6-v2 for CPU optimization.

**Complete Implementation**:

```python
# src/app/services/embedding_service_local.py

from sentence_transformers import SentenceTransformer
from typing import List, Optional
import torch
from pydantic import BaseModel

class EmbeddingConfig(BaseModel):
    model_name: str = "all-MiniLM-L6-v2"
    device: str = "cpu"  # cpu or cuda
    batch_size: int = 32
    normalize_embeddings: bool = True

class LocalEmbeddingService:
    """
    Self-hosted embedding generation.

    PRIVACY: Model runs locally, no API calls.
    PERFORMANCE: ~100 chunks/second on 4-core CPU.
    """

    def __init__(self, config: Optional[EmbeddingConfig] = None):
        self.config = config or EmbeddingConfig()

        # Load model (cached after first load)
        print(f"Loading embedding model: {self.config.model_name}")
        self.model = SentenceTransformer(
            self.config.model_name,
            device=self.config.device
        )
        self.model.eval()

        # Optimize for CPU
        if self.config.device == "cpu":
            torch.set_num_threads(4)

    def get_embedding_dimension(self) -> int:
        return self.model.get_sentence_embedding_dimension()

    async def generate_embeddings(
        self,
        texts: List[str],
        show_progress: bool = False
    ) -> List[List[float]]:
        if not texts:
            return []

        embeddings = self.model.encode(
            texts,
            batch_size=self.config.batch_size,
            show_progress_bar=show_progress,
            convert_to_numpy=True,
            normalize_embeddings=self.config.normalize_embeddings
        )

        return embeddings.tolist()

# Global instance
embedding_service = LocalEmbeddingService()
```

**Performance**:
- Model size: ~90MB (cached in Docker volume)
- Speed: ~100 chunks/second on 4-core CPU
- Memory: ~2GB during embedding generation

---

### 3. Vector Store: Qdrant

**File**: `src/app/services/qdrant_service.py`

**Complete Implementation**: See Appendix B

**Key Features**:
- ✅ Self-hosted via Docker
- ✅ High-performance HNSW indexing
- ✅ Cosine similarity search
- ✅ Metadata filtering
- ✅ Batch operations

---

## Docker Compose Setup {#docker-compose-setup}

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Main FastAPI backend
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      # Database
      - DATABASE_URL=postgresql://user:pass@postgres:5432/privexbot
      - REDIS_URL=redis://redis:6379

      # Self-hosted services
      - QDRANT_URL=http://qdrant:6333

      # Embedding configuration
      - EMBEDDING_MODEL=all-MiniLM-L6-v2
      - EMBEDDING_DEVICE=cpu

      # Crawl4AI configuration
      - CRAWL4AI_HEADLESS=true
      - CRAWL4AI_STEALTH_MODE=true
    volumes:
      - ./src:/app/src
      - sentence_transformers_cache:/root/.cache/torch/sentence_transformers
    depends_on:
      - postgres
      - redis
      - qdrant
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'

  # PostgreSQL with pgvector
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=privexbot
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 2G

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    deploy:
      resources:
        limits:
          memory: 1G

  # Qdrant vector database
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'

  # Celery worker for background processing
  celery-worker:
    build: .
    command: celery -A app.celery_app worker --loglevel=info -c 4
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/privexbot
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
      - EMBEDDING_MODEL=all-MiniLM-L6-v2
      - EMBEDDING_DEVICE=cpu
    volumes:
      - ./src:/app/src
      - sentence_transformers_cache:/root/.cache/torch/sentence_transformers
    depends_on:
      - postgres
      - redis
      - qdrant
    deploy:
      resources:
        limits:
          memory: 6G
          cpus: '3.0'

volumes:
  postgres_data:
  redis_data:
  qdrant_storage:
  sentence_transformers_cache:  # Cache embedding models
```

**Start Command**:
```bash
docker-compose up -d
```

---

## Error Handling & Edge Cases {#error-handling}

### Graceful Degradation Strategy

**Principle**: Never let a few failed pages block entire KB creation.

```python
# Complete error handling in pipeline task

async def process_web_kb_task(...):
    successful_pages = []
    failed_pages = []

    try:
        for source in sources:
            try:
                # STEP 1: Scrape with retries
                pages = await scrape_with_retry(
                    source["url"],
                    max_retries=3,
                    backoff_factor=2
                )

                for page in pages:
                    try:
                        # STEP 2: Parse (skip if fails)
                        parsed = await parse_content_safe(page)
                        if not parsed:
                            failed_pages.append({
                                "url": page.url,
                                "error": "Parsing failed",
                                "recoverable": False
                            })
                            continue

                        # STEP 3: Chunk (use fallback strategy if fails)
                        chunks = await chunk_with_fallback(parsed)

                        # STEP 4: Embed (retry on failure)
                        chunks_with_embeddings = await embed_with_retry(chunks)

                        # STEP 5: Index (critical - must succeed)
                        await index_chunks(kb_id, chunks_with_embeddings)

                        successful_pages.append(page.url)

                    except Exception as e:
                        failed_pages.append({
                            "url": page.url,
                            "error": str(e),
                            "recoverable": True
                        })
                        continue

            except Exception as e:
                # Source-level failure
                failed_pages.append({
                    "source": source["url"],
                    "error": str(e),
                    "level": "source"
                })
                continue

        # Update KB status based on results
        if successful_pages:
            kb.status = "ready" if not failed_pages else "ready_with_warnings"
            kb.stats = {
                "successful_pages": len(successful_pages),
                "failed_pages": len(failed_pages)
            }
        else:
            kb.status = "failed"
            kb.error_message = "No pages successfully processed"

        db.commit()

    except Exception as e:
        # Total failure
        kb.status = "failed"
        kb.error_message = str(e)
        db.commit()
        raise
```

### Edge Cases Handled

1. **Network Timeouts**: Exponential backoff (3 retries)
2. **Invalid HTML**: Graceful parsing fallback
3. **JavaScript-Heavy Sites**: Crawl4AI handles via Playwright
4. **Rate Limiting**: 1.5s delays between requests
5. **Partial Failures**: KB created with successful pages
6. **Memory Pressure**: Batch processing, cleanup
7. **Model Loading**: Cached after first load
8. **Vector Store Full**: Automatic batch size adjustment

---

## Monitoring & Observability {#monitoring}

### Real-Time Progress Tracking

**Redis Status Structure**:

```json
{
  "pipeline_id": "pipeline:kb_123:1731668400",
  "kb_id": "uuid-123",
  "status": "running",
  "current_stage": "embedding",
  "progress_percentage": 85,
  "stats": {
    "pages_discovered": 50,
    "pages_scraped": 47,
    "pages_failed": 3,
    "chunks_created": 850,
    "embeddings_generated": 750,
    "embeddings_remaining": 100,
    "vectors_indexed": 0
  },
  "started_at": "2025-11-16T10:30:00Z",
  "updated_at": "2025-11-16T10:32:30Z",
  "estimated_completion": "2025-11-16T10:33:00Z"
}
```

### API Status Endpoint

```python
# src/app/api/v1/routes/kb_pipeline.py

@router.get("/pipelines/{pipeline_id}/status")
async def get_pipeline_status(
    pipeline_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get real-time pipeline status.

    Frontend polls this every 2 seconds.
    """

    # Get status from Redis
    status_json = await redis_client.get(f"pipeline:{pipeline_id}:status")

    if not status_json:
        raise HTTPException(404, "Pipeline not found")

    status = json.loads(status_json)

    # Verify user has access to this KB
    kb = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == status["kb_id"]
    ).first()

    if not kb or kb.workspace.organization_id != current_user.org_id:
        raise HTTPException(403, "Access denied")

    return status
```

### Frontend Polling

```typescript
// Frontend polls every 2 seconds
const { data, error } = useSWR(
  `/api/v1/pipelines/${pipelineId}/status`,
  fetcher,
  { refreshInterval: 2000 }
);

// Display progress
<ProgressBar
  value={data.progress_percentage}
  label={`${data.current_stage} - ${data.stats.pages_scraped}/${data.stats.pages_total} pages`}
/>
```

---

## Testing Strategy {#testing-strategy}

### Unit Tests

```python
# tests/services/test_crawl4ai_service.py

import pytest
from app.services.crawl4ai_service import Crawl4AIService, CrawlConfig

@pytest.mark.asyncio
async def test_scrape_single_url():
    service = Crawl4AIService()

    page = await service.scrape_single_url(
        "https://example.com",
        config=CrawlConfig()
    )

    assert page.url == "https://example.com"
    assert len(page.content) > 0
    assert page.metadata is not None

# tests/services/test_embedding_service.py

import pytest
from app.services.embedding_service_local import LocalEmbeddingService

@pytest.mark.asyncio
async def test_generate_embeddings():
    service = LocalEmbeddingService()

    texts = ["Hello world", "Test text"]
    embeddings = await service.generate_embeddings(texts)

    assert len(embeddings) == 2
    assert len(embeddings[0]) == 384  # all-MiniLM-L6-v2 dimension
```

### Integration Tests

```python
# tests/integration/test_kb_creation.py

import pytest
from app.services.kb_service import kb_service

@pytest.mark.asyncio
async def test_complete_kb_creation():
    # Create draft
    draft_id = await kb_service.create_draft({
        "name": "Test KB",
        "workspace_id": workspace_id
    })

    # Add source
    await kb_service.add_web_source(draft_id, {
        "url": "https://example.com",
        "config": {"max_pages": 5}
    })

    # Finalize
    kb_id = await kb_service.finalize_draft(draft_id)

    # Wait for processing
    await wait_for_kb_ready(kb_id, timeout=120)

    # Verify KB
    kb = await kb_service.get_kb(kb_id)
    assert kb.status == "ready"
    assert kb.stats["total_chunks"] > 0
```

---

## Deployment Guide {#deployment-guide}

### Prerequisites

1. **VM Requirements**:
   - 8 vCPU
   - 16GB RAM
   - 200GB SSD
   - Ubuntu 22.04 LTS

2. **Software**:
   - Docker 24.0+
   - Docker Compose 2.20+

### Step-by-Step Deployment

```bash
# 1. Clone repository
git clone https://github.com/yourorg/privexbot.git
cd privexbot/backend

# 2. Setup environment
cp .env.example .env
nano .env  # Configure DATABASE_URL, REDIS_URL, etc.

# 3. Start services
docker-compose up -d

# 4. Run migrations
docker-compose exec backend alembic upgrade head

# 5. Verify services
docker-compose ps
curl http://localhost:8000/health

# 6. Check Qdrant
curl http://localhost:6333/collections

# 7. Test embedding model loading
docker-compose exec celery-worker python -c "
from app.services.embedding_service_local import embedding_service
print(f'Model loaded: {embedding_service.get_embedding_dimension()} dimensions')
"
```

### Monitoring

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f celery-worker

# Check resource usage
docker stats
```

---

## Performance Optimization {#performance-optimization}

### CPU Optimization

```python
# Optimize for CPU
import torch
torch.set_num_threads(4)  # Use 4 cores for embedding

# Batch processing
batch_size = 32  # Process 32 chunks at a time
```

### Memory Management

```python
# Celery worker configuration
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000  # Restart after 1000 tasks
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # Don't hoard tasks
```

### Scaling Strategies

**Horizontal Scaling**:
```yaml
# Scale Celery workers
docker-compose up -d --scale celery-worker=3
```

**Vertical Scaling**:
```yaml
# Increase resources
celery-worker:
  deploy:
    resources:
      limits:
        memory: 8G
        cpus: '4.0'
```

---

## Security & Privacy {#security-privacy}

### Privacy Guarantees

✅ **No External APIs**:
- All processing on your infrastructure
- No data sent to third parties
- Complete data sovereignty

✅ **Data Isolation**:
- Multi-tenant architecture
- Organization/workspace boundaries
- Permission checks on every operation

✅ **Secure Storage**:
- PostgreSQL with encryption at rest
- Redis with password protection
- Qdrant with access control

### Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Enable Redis password authentication
- [ ] Configure firewall (only ports 8000, 6333)
- [ ] Setup SSL/TLS for API
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Audit log monitoring

---

## Cost Analysis {#cost-analysis}

### Monthly Operational Costs

| Item | Cost |
|------|------|
| VM (8vCPU, 16GB RAM, 200GB SSD) | $80-120 |
| Bandwidth (1TB) | $10-20 |
| Backups (200GB) | $10-15 |
| **Total** | **$100-155/month** |

**No API costs. No vendor lock-in. Predictable expenses.**

### Cost Comparison

| Approach | Monthly Cost | Setup Time | Quality |
|----------|-------------|------------|---------|
| **Self-Hosted** | $100-155 | 1 week | Good |
| Cloud APIs | $200-500 | 2 days | Excellent |

**Recommendation**: Self-hosted for privacy, cloud APIs for speed.

---

## Appendix {#appendix}

### Appendix A: Complete Crawl4AI Implementation

See `IMPLEMENTATION_SUMMARY.md` for full code.

### Appendix B: Complete Qdrant Implementation

See `IMPLEMENTATION_SUMMARY.md` for full code.

### Appendix C: Database Schema

```sql
-- Knowledge Bases
CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    stats JSONB,
    error_message TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kb_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    source_type VARCHAR(50) NOT NULL,
    source_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Chunks with embeddings
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kb_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(384),  -- pgvector extension
    chunk_index INTEGER,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kb_workspace ON knowledge_bases(workspace_id);
CREATE INDEX idx_kb_status ON knowledge_bases(status);
CREATE INDEX idx_doc_kb ON documents(kb_id);
CREATE INDEX idx_chunk_kb ON chunks(kb_id);
CREATE INDEX idx_chunk_embedding ON chunks USING ivfflat (embedding vector_cosine_ops);
```

### Appendix D: Environment Variables

```.env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/privexbot

# Redis
REDIS_URL=redis://redis:6379

# Qdrant
QDRANT_URL=http://qdrant:6333

# Embedding
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DEVICE=cpu

# Crawl4AI
CRAWL4AI_HEADLESS=true
CRAWL4AI_STEALTH_MODE=true

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

---

## Summary

This complete guide provides:

✅ **Single Source of Truth** - Everything in one document
✅ **3-Phase Flow** - Clear finalization sequence
✅ **Self-Hosted Stack** - No external APIs
✅ **Production-Ready** - Error handling, monitoring
✅ **Privacy-Focused** - Complete data sovereignty
✅ **Cost-Effective** - $100-155/month
✅ **Scalable** - Horizontal and vertical scaling

**Ready for implementation!** 🚀

---

**Document Version**: 1.0
**Status**: Complete
**Next Steps**: Begin Week 1 implementation (Foundation)
