"""
KB Pipeline Tasks - Celery background task for web KB processing.

PHASE 3: Background Processing (Celery Task)
- Scrape → Parse → Chunk → Embed → Index
- Real-time progress updates to Redis
- Update KB status on completion

This file implements the complete KB web URL processing pipeline.
Triggered after finalization (Phase 2) from kb_draft_service.
"""

from celery import shared_task
from uuid import UUID
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import asyncio
import traceback

from app.db.session import SessionLocal
from app.services.crawl4ai_service import crawl4ai_service, CrawlConfig
from app.services.embedding_service_local import embedding_service
from app.services.qdrant_service import qdrant_service, QdrantChunk
from app.services.chunking_service import chunking_service
from app.services.draft_service import draft_service
from app.models.knowledge_base import KnowledgeBase
from app.models.document import Document
from app.models.chunk import Chunk


class PipelineProgressTracker:
    """
    Track pipeline progress in Redis.

    WHY: Real-time progress updates for frontend polling
    HOW: Update Redis key with current stage, stats, timestamps
    """

    def __init__(self, pipeline_id: str, kb_id: str):
        self.pipeline_id = pipeline_id
        self.kb_id = kb_id
        self.redis_key = f"pipeline:{pipeline_id}:status"

        # Initialize stats
        self.stats = {
            "pages_discovered": 0,
            "pages_scraped": 0,
            "pages_failed": 0,
            "chunks_created": 0,
            "embeddings_generated": 0,
            "vectors_indexed": 0
        }

    def update_status(
        self,
        status: str,
        current_stage: str,
        progress_percentage: int,
        error: Optional[str] = None
    ):
        """
        Update pipeline status in Redis.

        Args:
            status: "queued" | "running" | "completed" | "failed" | "cancelled"
            current_stage: Human-readable current stage
            progress_percentage: 0-100
            error: Error message if failed
        """

        # Get existing pipeline data
        existing_json = draft_service.redis_client.get(self.redis_key)
        if existing_json:
            pipeline_data = json.loads(existing_json)
        else:
            pipeline_data = {
                "pipeline_id": self.pipeline_id,
                "kb_id": self.kb_id,
                "started_at": datetime.utcnow().isoformat()
            }

        # Update status
        pipeline_data.update({
            "status": status,
            "current_stage": current_stage,
            "progress_percentage": progress_percentage,
            "stats": self.stats,
            "updated_at": datetime.utcnow().isoformat()
        })

        if error:
            pipeline_data["error"] = error

        # Save to Redis (24 hour TTL)
        draft_service.redis_client.setex(
            self.redis_key,
            86400,
            json.dumps(pipeline_data)
        )

    def update_stats(self, **kwargs):
        """Update specific stats counters."""
        self.stats.update(kwargs)

    def add_log(self, level: str, message: str, details: Optional[Dict] = None):
        """
        Add log entry to Redis.

        Args:
            level: "info" | "warning" | "error"
            message: Log message
            details: Optional additional details
        """

        logs_key = f"pipeline:{self.pipeline_id}:logs"

        # Get existing logs
        logs_json = draft_service.redis_client.get(logs_key)
        logs = json.loads(logs_json) if logs_json else []

        # Add new log
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message
        }
        if details:
            log_entry["details"] = details

        logs.append(log_entry)

        # Save logs (keep last 1000 entries, 24 hour TTL)
        draft_service.redis_client.setex(
            logs_key,
            86400,
            json.dumps(logs[-1000:])
        )


@shared_task(bind=True, name="process_web_kb")
def process_web_kb_task(
    self,
    kb_id: str,
    pipeline_id: str,
    sources: List[Dict[str, Any]],
    config: Dict[str, Any]
):
    """
    Process web KB: Scrape → Parse → Chunk → Embed → Index.

    PHASE: 3 (Background Processing)
    DURATION: 2-30 minutes (depends on pages)

    FLOW:
    1. Initialize progress tracker
    2. Create Qdrant collection
    3. For each source:
       a. Scrape web pages (single or crawl)
       b. Parse markdown content
       c. Chunk content
       d. Generate embeddings
       e. Index in Qdrant
       f. Create Document + Chunk records
    4. Update KB status to "ready"
    5. Clean up progress tracking

    Args:
        kb_id: Knowledge base UUID
        pipeline_id: Pipeline tracking ID
        sources: List of web sources with configs
        config: KB configuration (chunking, embedding)

    Returns:
        {
            "kb_id": str,
            "status": "completed",
            "stats": {...},
            "duration_seconds": int
        }
    """

    db = SessionLocal()
    start_time = datetime.utcnow()
    tracker = PipelineProgressTracker(pipeline_id, kb_id)

    try:
        # ========================================
        # STEP 0: INITIALIZATION
        # ========================================

        tracker.update_status(
            status="running",
            current_stage="Initializing pipeline",
            progress_percentage=0
        )
        tracker.add_log("info", f"Starting KB processing pipeline for KB {kb_id}")

        # Get KB from database
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == UUID(kb_id)).first()
        if not kb:
            raise ValueError(f"KB not found: {kb_id}")

        # Check if pipeline was cancelled
        pipeline_status_json = draft_service.redis_client.get(f"pipeline:{pipeline_id}:status")
        if pipeline_status_json:
            pipeline_status = json.loads(pipeline_status_json)
            if pipeline_status.get("status") == "cancelled":
                tracker.add_log("warning", "Pipeline cancelled by user")
                kb.status = "failed"
                kb.error_message = "Pipeline cancelled by user"
                db.commit()
                return {
                    "kb_id": kb_id,
                    "status": "cancelled",
                    "message": "Pipeline cancelled by user"
                }

        # Extract config
        chunking_config = config.get("chunking_config", {})
        embedding_config = config.get("embedding_config", {})

        chunk_strategy = chunking_config.get("strategy", "by_heading")
        chunk_size = chunking_config.get("chunk_size", 1000)
        chunk_overlap = chunking_config.get("chunk_overlap", 200)

        # ========================================
        # STEP 1: CREATE QDRANT COLLECTION
        # ========================================

        tracker.update_status(
            status="running",
            current_stage="Creating vector store collection",
            progress_percentage=5
        )
        tracker.add_log("info", f"Creating Qdrant collection for KB {kb_id}")

        # Create collection in Qdrant
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            loop.run_until_complete(
                qdrant_service.create_kb_collection(
                    kb_id=UUID(kb_id),
                    vector_size=embedding_service.get_embedding_dimension()
                )
            )
            tracker.add_log("info", "Qdrant collection created successfully")
        except Exception as e:
            tracker.add_log("warning", f"Qdrant collection creation warning: {str(e)}")
            # Collection might already exist, continue

        # ========================================
        # STEP 2: PROCESS EACH SOURCE
        # ========================================

        total_sources = len(sources)
        tracker.update_stats(pages_discovered=total_sources)

        all_failed = True  # Track if ALL sources fail

        for source_idx, source in enumerate(sources):
            source_url = source.get("url")
            source_config = source.get("config", {})

            tracker.update_status(
                status="running",
                current_stage=f"Processing source {source_idx + 1}/{total_sources}: {source_url}",
                progress_percentage=10 + int((source_idx / total_sources) * 80)
            )
            tracker.add_log("info", f"Processing source: {source_url}")

            try:
                # ========================================
                # STEP 2a: SCRAPE WEB PAGES
                # ========================================

                tracker.add_log("info", f"Scraping {source_url}")

                # Build crawl config
                crawl_config = CrawlConfig(
                    max_pages=source_config.get("max_pages", 50),
                    max_depth=source_config.get("max_depth", 3),
                    include_patterns=source_config.get("include_patterns", []),
                    exclude_patterns=source_config.get("exclude_patterns", []),
                    stealth_mode=source_config.get("stealth_mode", True)
                )

                # Scrape (single or crawl)
                method = source_config.get("method", "single")

                if method == "crawl":
                    scraped_pages = loop.run_until_complete(
                        crawl4ai_service.crawl_website(
                            start_url=source_url,
                            config=crawl_config
                        )
                    )
                else:
                    # Single page scrape
                    scraped_page = loop.run_until_complete(
                        crawl4ai_service.scrape_single_url(
                            url=source_url,
                            config=crawl_config
                        )
                    )
                    scraped_pages = [scraped_page]

                tracker.update_stats(pages_scraped=tracker.stats["pages_scraped"] + len(scraped_pages))
                tracker.add_log("info", f"Scraped {len(scraped_pages)} pages from {source_url}")

                # ========================================
                # STEP 2b: PROCESS EACH PAGE
                # ========================================

                for page_idx, scraped_page in enumerate(scraped_pages):
                    try:
                        # Check for cancellation
                        pipeline_status_json = draft_service.redis_client.get(f"pipeline:{pipeline_id}:status")
                        if pipeline_status_json:
                            pipeline_status = json.loads(pipeline_status_json)
                            if pipeline_status.get("status") == "cancelled":
                                raise Exception("Pipeline cancelled by user")

                        page_url = scraped_page.url
                        page_content = scraped_page.content

                        # Skip if no content
                        if not page_content or len(page_content.strip()) < 50:
                            tracker.add_log("warning", f"Skipping page with insufficient content: {page_url}")
                            continue

                        # ========================================
                        # STEP 2c: CHUNK CONTENT
                        # ========================================

                        chunks_data = chunking_service.chunk_document(
                            text=page_content,
                            strategy="recursive",  # Use recursive for web content
                            chunk_size=chunk_size,
                            chunk_overlap=chunk_overlap
                        )

                        if not chunks_data:
                            tracker.add_log("warning", f"No chunks created for page: {page_url}")
                            continue

                        tracker.update_stats(chunks_created=tracker.stats["chunks_created"] + len(chunks_data))

                        # ========================================
                        # STEP 2d: GENERATE EMBEDDINGS
                        # ========================================

                        chunk_texts = [chunk["content"] for chunk in chunks_data]

                        embeddings = loop.run_until_complete(
                            embedding_service.generate_embeddings(chunk_texts)
                        )

                        tracker.update_stats(
                            embeddings_generated=tracker.stats["embeddings_generated"] + len(embeddings)
                        )

                        # ========================================
                        # STEP 2e: CREATE DOCUMENT + CHUNKS
                        # ========================================

                        # Create Document record
                        document = Document(
                            kb_id=UUID(kb_id),
                            workspace_id=kb.workspace_id,
                            name=scraped_page.title or page_url,
                            source_type="web_scraping",
                            source_url=page_url,
                            content=page_content,
                            source_metadata={
                                "scraped_at": scraped_page.scraped_at,
                                "content_length": len(page_content),
                                "metadata": scraped_page.metadata
                            },
                            status="processed",
                            created_by=kb.created_by,
                            created_at=datetime.utcnow()
                        )
                        db.add(document)
                        db.flush()  # Get document.id

                        # Create Chunk records and prepare for Qdrant
                        qdrant_chunks = []

                        for chunk_idx, (chunk_data, embedding) in enumerate(zip(chunks_data, embeddings)):
                            # Create Chunk in PostgreSQL
                            chunk = Chunk(
                                document_id=document.id,
                                kb_id=UUID(kb_id),
                                workspace_id=kb.workspace_id,
                                content=chunk_data["content"],
                                chunk_index=chunk_idx,
                                embedding=embedding,  # pgvector
                                chunk_metadata={
                                    "token_count": chunk_data.get("token_count", 0),
                                    "strategy": "recursive",
                                    "chunk_size": chunk_size,
                                    "page_url": page_url,
                                    "page_title": scraped_page.title
                                },
                                created_at=datetime.utcnow()
                            )
                            db.add(chunk)
                            db.flush()  # Get chunk.id

                            # Prepare for Qdrant
                            qdrant_chunks.append(
                                QdrantChunk(
                                    id=str(chunk.id),
                                    embedding=embedding,
                                    content=chunk_data["content"],
                                    metadata={
                                        "document_id": str(document.id),
                                        "kb_id": kb_id,
                                        "workspace_id": str(kb.workspace_id),
                                        "chunk_index": chunk_idx,
                                        "page_url": page_url,
                                        "page_title": scraped_page.title or "",
                                        "token_count": chunk_data.get("token_count", 0)
                                    }
                                )
                            )

                        db.commit()

                        # ========================================
                        # STEP 2f: INDEX IN QDRANT
                        # ========================================

                        loop.run_until_complete(
                            qdrant_service.upsert_chunks(
                                kb_id=UUID(kb_id),
                                chunks=qdrant_chunks
                            )
                        )

                        tracker.update_stats(
                            vectors_indexed=tracker.stats["vectors_indexed"] + len(qdrant_chunks)
                        )

                        tracker.add_log(
                            "info",
                            f"Processed page: {page_url}",
                            {
                                "chunks": len(chunks_data),
                                "embeddings": len(embeddings)
                            }
                        )

                        # Mark that we successfully processed at least one page
                        all_failed = False

                    except Exception as page_error:
                        tracker.update_stats(pages_failed=tracker.stats["pages_failed"] + 1)
                        tracker.add_log(
                            "error",
                            f"Failed to process page: {scraped_page.url}",
                            {"error": str(page_error)}
                        )
                        # Continue with next page
                        continue

            except Exception as source_error:
                tracker.update_stats(pages_failed=tracker.stats["pages_failed"] + 1)
                tracker.add_log(
                    "error",
                    f"Failed to process source: {source_url}",
                    {"error": str(source_error), "traceback": traceback.format_exc()}
                )
                # Continue with next source
                continue

        # ========================================
        # STEP 3: UPDATE KB STATUS
        # ========================================

        duration = (datetime.utcnow() - start_time).total_seconds()

        # Determine final status
        if all_failed:
            # ALL sources failed
            kb.status = "failed"
            kb.error_message = "All sources failed to process"
            tracker.update_status(
                status="failed",
                current_stage="Completed with all failures",
                progress_percentage=100,
                error="All sources failed to process"
            )
            tracker.add_log("error", "Pipeline failed: All sources failed to process")

        elif tracker.stats["pages_failed"] > 0:
            # Some pages failed, but some succeeded
            kb.status = "ready_with_warnings"
            kb.error_message = f"{tracker.stats['pages_failed']} pages failed to process"
            tracker.update_status(
                status="completed",
                current_stage="Completed with warnings",
                progress_percentage=100
            )
            tracker.add_log(
                "warning",
                f"Pipeline completed with warnings: {tracker.stats['pages_failed']} pages failed"
            )

        else:
            # All succeeded
            kb.status = "ready"
            kb.error_message = None
            tracker.update_status(
                status="completed",
                current_stage="Completed successfully",
                progress_percentage=100
            )
            tracker.add_log("info", "Pipeline completed successfully")

        # Update KB metadata
        kb.stats = {
            "total_documents": tracker.stats["pages_scraped"] - tracker.stats["pages_failed"],
            "total_chunks": tracker.stats["chunks_created"],
            "total_vectors": tracker.stats["vectors_indexed"],
            "processing_duration_seconds": int(duration)
        }

        db.commit()

        # Return result
        return {
            "kb_id": kb_id,
            "status": kb.status,
            "stats": tracker.stats,
            "duration_seconds": int(duration)
        }

    except Exception as e:
        # ========================================
        # ERROR HANDLING
        # ========================================

        error_message = str(e)
        error_traceback = traceback.format_exc()

        tracker.update_status(
            status="failed",
            current_stage="Failed with error",
            progress_percentage=100,
            error=error_message
        )
        tracker.add_log(
            "error",
            f"Pipeline failed with error: {error_message}",
            {"traceback": error_traceback}
        )

        # Update KB status
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == UUID(kb_id)).first()
        if kb:
            kb.status = "failed"
            kb.error_message = error_message
            db.commit()

        # Re-raise for Celery
        raise

    finally:
        db.close()
        loop.close()


@shared_task(bind=True, name="reindex_kb")
def reindex_kb_task(self, kb_id: str):
    """
    Re-index an existing KB (refresh embeddings and Qdrant vectors).

    QUEUE: high_priority
    DURATION: Variable (depends on KB size)

    WHY: Keep embeddings fresh for frequently changing websites
    HOW: Re-fetch sources, regenerate embeddings, update Qdrant

    Args:
        kb_id: Knowledge base UUID

    Returns:
        {
            "kb_id": str,
            "status": str,
            "stats": dict
        }
    """

    db = SessionLocal()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        # Get KB
        kb = db.query(KnowledgeBase).filter(
            KnowledgeBase.id == UUID(kb_id)
        ).first()

        if not kb:
            raise ValueError(f"KB not found: {kb_id}")

        # Update KB status
        kb.status = "reindexing"
        db.commit()

        # Get all documents for this KB
        documents = db.query(Document).filter(
            Document.kb_id == UUID(kb_id)
        ).all()

        # Delete old chunks and vectors
        db.query(Chunk).filter(
            Chunk.kb_id == UUID(kb_id)
        ).delete()
        db.commit()

        # Delete and recreate Qdrant collection
        loop.run_until_complete(
            qdrant_service.delete_kb_collection(UUID(kb_id))
        )
        loop.run_until_complete(
            qdrant_service.create_kb_collection(
                kb_id=UUID(kb_id),
                vector_size=embedding_service.get_embedding_dimension()
            )
        )

        # Re-process each document
        total_chunks = 0
        total_vectors = 0

        for document in documents:
            if not document.content:
                continue

            # Chunk content
            chunks_data = chunking_service.chunk_document(
                text=document.content,
                strategy="recursive",
                chunk_size=1000,
                chunk_overlap=200
            )

            # Generate embeddings
            chunk_texts = [chunk["content"] for chunk in chunks_data]
            embeddings = loop.run_until_complete(
                embedding_service.generate_embeddings(chunk_texts)
            )

            # Create chunks and index in Qdrant
            qdrant_chunks = []

            for chunk_idx, (chunk_data, embedding) in enumerate(zip(chunks_data, embeddings)):
                # Create Chunk in PostgreSQL
                chunk = Chunk(
                    document_id=document.id,
                    kb_id=UUID(kb_id),
                    workspace_id=kb.workspace_id,
                    content=chunk_data["content"],
                    chunk_index=chunk_idx,
                    embedding=embedding,
                    chunk_metadata={
                        "token_count": chunk_data.get("token_count", 0),
                        "strategy": "recursive",
                        "reindexed_at": datetime.utcnow().isoformat()
                    },
                    created_at=datetime.utcnow()
                )
                db.add(chunk)
                db.flush()

                # Prepare for Qdrant
                qdrant_chunks.append(
                    QdrantChunk(
                        id=str(chunk.id),
                        embedding=embedding,
                        content=chunk_data["content"],
                        metadata={
                            "document_id": str(document.id),
                            "kb_id": kb_id,
                            "workspace_id": str(kb.workspace_id),
                            "chunk_index": chunk_idx
                        }
                    )
                )

            db.commit()

            # Index in Qdrant
            loop.run_until_complete(
                qdrant_service.upsert_chunks(
                    kb_id=UUID(kb_id),
                    chunks=qdrant_chunks
                )
            )

            total_chunks += len(chunks_data)
            total_vectors += len(qdrant_chunks)

        # Update KB status
        kb.status = "ready"
        kb.updated_at = datetime.utcnow()
        kb.stats = {
            "total_documents": len(documents),
            "total_chunks": total_chunks,
            "total_vectors": total_vectors,
            "reindexed_at": datetime.utcnow().isoformat()
        }
        db.commit()

        return {
            "kb_id": kb_id,
            "status": "completed",
            "stats": {
                "documents": len(documents),
                "chunks": total_chunks,
                "vectors": total_vectors
            }
        }

    except Exception as e:
        # Update KB status
        kb = db.query(KnowledgeBase).filter(
            KnowledgeBase.id == UUID(kb_id)
        ).first()
        if kb:
            kb.status = "failed"
            kb.error_message = f"Re-indexing failed: {str(e)}"
            db.commit()

        raise

    finally:
        db.close()
        loop.close()
