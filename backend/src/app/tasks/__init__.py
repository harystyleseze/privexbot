"""
Tasks package - Celery background tasks.

WHY:
- Async processing of long-running operations
- Document parsing and embedding
- Website crawling
- Cloud synchronization
- Scheduled jobs

HOW:
- Celery workers
- Redis as broker
- Task queues by priority
- Result storage
"""

# Import tasks to register them with Celery
from app.tasks.kb_pipeline_tasks import process_web_kb_task  # noqa: F401
