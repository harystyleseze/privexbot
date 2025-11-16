"""
KB Maintenance Tasks - Scheduled and manual maintenance tasks for KB management.

WHY:
- Periodic cleanup of expired pipeline data
- Re-indexing of stale/outdated KBs
- Health checks for vector store
- Manual re-indexing support

HOW:
- Celery Beat scheduled tasks
- Low priority queue
- Database and Redis operations
"""

from celery import shared_task
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json
import asyncio

from app.db.session import SessionLocal
from app.services.draft_service import draft_service
from app.services.qdrant_service import qdrant_service
from app.models.knowledge_base import KnowledgeBase
from app.models.document import Document
from app.models.chunk import Chunk
from uuid import UUID


@shared_task(bind=True, name="cleanup_expired_pipelines")
def cleanup_expired_pipelines_task(self):
    """
    Clean up expired pipeline tracking data from Redis.

    SCHEDULE: Every hour
    QUEUE: low_priority
    DURATION: <1 minute

    WHY: Pipeline status data has 24hr TTL, but we can clean up completed ones sooner
    HOW: Find completed pipelines older than 1 hour, delete from Redis

    Returns:
        {
            "cleaned": int,
            "message": str
        }
    """

    try:
        # Get all pipeline keys from Redis
        pipeline_keys = draft_service.redis_client.keys("pipeline:*:status")

        cleaned = 0
        now = datetime.utcnow()

        for key in pipeline_keys:
            try:
                data_json = draft_service.redis_client.get(key)
                if not data_json:
                    continue

                data = json.loads(data_json)
                status = data.get("status")
                updated_at = data.get("updated_at")

                # Clean up if completed/failed and older than 1 hour
                if status in ["completed", "failed", "cancelled"] and updated_at:
                    updated_time = datetime.fromisoformat(updated_at)
                    age = (now - updated_time).total_seconds()

                    if age > 3600:  # 1 hour
                        # Delete status and logs
                        draft_service.redis_client.delete(key)
                        logs_key = key.replace(":status", ":logs")
                        draft_service.redis_client.delete(logs_key)
                        cleaned += 1

            except Exception as e:
                print(f"Error cleaning pipeline {key}: {e}")
                continue

        return {
            "cleaned": cleaned,
            "message": f"Cleaned {cleaned} expired pipeline(s)"
        }

    except Exception as e:
        print(f"Error in cleanup_expired_pipelines: {e}")
        return {
            "cleaned": 0,
            "message": f"Error: {str(e)}"
        }


@shared_task(bind=True, name="reindex_stale_kbs")
def reindex_stale_kbs_task(self):
    """
    Re-index KBs that haven't been updated in a while.

    SCHEDULE: Daily at 2 AM
    QUEUE: low_priority
    DURATION: Variable (depends on number of KBs)

    WHY: Keep embeddings fresh for frequently changing websites
    HOW: Find KBs older than 30 days, queue re-indexing tasks

    Returns:
        {
            "queued": int,
            "message": str
        }
    """

    db = SessionLocal()

    try:
        # Find KBs that haven't been updated in 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        stale_kbs = db.query(KnowledgeBase).filter(
            KnowledgeBase.status == "ready",
            KnowledgeBase.updated_at < thirty_days_ago
        ).all()

        queued = 0

        for kb in stale_kbs:
            try:
                # Queue re-indexing task
                from app.tasks.kb_pipeline_tasks import reindex_kb_task

                reindex_kb_task.apply_async(
                    kwargs={"kb_id": str(kb.id)},
                    queue="high_priority"
                )

                queued += 1

            except Exception as e:
                print(f"Error queuing re-index for KB {kb.id}: {e}")
                continue

        return {
            "queued": queued,
            "message": f"Queued {queued} KB(s) for re-indexing"
        }

    except Exception as e:
        print(f"Error in reindex_stale_kbs: {e}")
        return {
            "queued": 0,
            "message": f"Error: {str(e)}"
        }

    finally:
        db.close()


@shared_task(bind=True, name="health_check_qdrant_collections")
def health_check_qdrant_collections_task(self):
    """
    Health check for Qdrant collections.

    SCHEDULE: Every 6 hours
    QUEUE: low_priority
    DURATION: <1 minute

    WHY: Ensure vector store collections are healthy
    HOW: Check collection existence and stats for all active KBs

    Returns:
        {
            "total_kbs": int,
            "healthy": int,
            "unhealthy": int,
            "issues": List[str]
        }
    """

    db = SessionLocal()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        # Get all ready KBs
        kbs = db.query(KnowledgeBase).filter(
            KnowledgeBase.status.in_(["ready", "ready_with_warnings"])
        ).all()

        total_kbs = len(kbs)
        healthy = 0
        unhealthy = 0
        issues = []

        for kb in kbs:
            try:
                # Check if collection exists
                collection_exists = loop.run_until_complete(
                    qdrant_service.check_collection_exists(kb.id)
                )

                if collection_exists:
                    # Get collection stats
                    stats = loop.run_until_complete(
                        qdrant_service.get_collection_stats(kb.id)
                    )

                    # Verify point count matches chunk count
                    chunk_count = db.query(Chunk).filter(
                        Chunk.kb_id == kb.id
                    ).count()

                    if stats.get("vectors_count", 0) == chunk_count:
                        healthy += 1
                    else:
                        unhealthy += 1
                        issues.append(
                            f"KB {kb.id}: Vector count mismatch "
                            f"(Qdrant: {stats.get('vectors_count', 0)}, DB: {chunk_count})"
                        )

                else:
                    unhealthy += 1
                    issues.append(f"KB {kb.id}: Collection not found in Qdrant")

            except Exception as e:
                unhealthy += 1
                issues.append(f"KB {kb.id}: Health check error - {str(e)}")

        return {
            "total_kbs": total_kbs,
            "healthy": healthy,
            "unhealthy": unhealthy,
            "issues": issues[:10]  # Limit to first 10 issues
        }

    except Exception as e:
        print(f"Error in health_check_qdrant_collections: {e}")
        return {
            "total_kbs": 0,
            "healthy": 0,
            "unhealthy": 0,
            "issues": [f"Health check error: {str(e)}"]
        }

    finally:
        db.close()
        loop.close()


@shared_task(bind=True, name="manual_cleanup_kb")
def manual_cleanup_kb_task(self, kb_id: str):
    """
    Manual cleanup of a specific KB (delete from Qdrant and database).

    QUEUE: low_priority
    DURATION: Variable

    WHY: Allow manual KB deletion with full cleanup
    HOW: Delete Qdrant collection, then cascade delete in PostgreSQL

    Args:
        kb_id: Knowledge base UUID

    Returns:
        {
            "kb_id": str,
            "status": str,
            "message": str
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
            return {
                "kb_id": kb_id,
                "status": "error",
                "message": "KB not found"
            }

        # Delete Qdrant collection
        try:
            loop.run_until_complete(
                qdrant_service.delete_kb_collection(UUID(kb_id))
            )
        except Exception as e:
            print(f"Warning: Failed to delete Qdrant collection: {e}")

        # Delete from database (CASCADE will delete documents and chunks)
        db.delete(kb)
        db.commit()

        return {
            "kb_id": kb_id,
            "status": "success",
            "message": f"KB '{kb.name}' deleted successfully"
        }

    except Exception as e:
        db.rollback()
        return {
            "kb_id": kb_id,
            "status": "error",
            "message": f"Error deleting KB: {str(e)}"
        }

    finally:
        db.close()
        loop.close()
