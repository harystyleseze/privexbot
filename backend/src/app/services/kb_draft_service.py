"""
KB Draft Service - Knowledge base draft management.

WHY:
- KB creation in draft mode before deployment
- Add documents incrementally
- Preview embeddings and chunks
- Deploy when ready

HOW:
- Store KB draft in Redis
- Track document uploads
- Generate embeddings on deploy
- Create KB in database

PSEUDOCODE follows the existing codebase patterns.
"""

from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.services.draft_service import draft_service, DraftType


class KBDraftService:
    """
    Knowledge Base draft-specific operations.

    WHY: Specialized draft handling for KBs
    HOW: Extends base draft service with KB-specific logic
    """

    def add_document_to_draft(
        self,
        draft_id: str,
        document_data: dict
    ):
        """
        Add document to KB draft.

        WHY: Build KB incrementally
        HOW: Update draft sources in Redis

        ARGS:
            draft_id: KB draft ID
            document_data: {
                "type": "file" | "url" | "text",
                "source": "path/url/text content",
                "name": "Document name",
                "metadata": {...}
            }
        """

        # Get draft
        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise ValueError("KB draft not found")

        # Add to sources
        sources = draft["data"].get("sources", [])
        sources.append(document_data)

        # Update draft
        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={
                "data": {
                    "sources": sources
                }
            }
        )


    def remove_document_from_draft(
        self,
        draft_id: str,
        source_index: int
    ):
        """
        Remove document from KB draft.

        WHY: Allow users to remove documents before deployment
        HOW: Remove from sources list in Redis

        ARGS:
            draft_id: KB draft ID
            source_index: Index of source to remove
        """

        # Get draft
        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise ValueError("KB draft not found")

        # Remove source
        sources = draft["data"].get("sources", [])
        if 0 <= source_index < len(sources):
            sources.pop(source_index)

        # Update draft
        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={
                "data": {
                    "sources": sources
                }
            }
        )


    def update_embedding_config(
        self,
        draft_id: str,
        embedding_config: dict
    ):
        """
        Update embedding configuration.

        WHY: Configure embedding model and settings
        HOW: Update draft config in Redis

        ARGS:
            draft_id: KB draft ID
            embedding_config: {
                "provider": "openai",
                "model": "text-embedding-ada-002",
                "dimensions": 1536,
                "chunk_size": 1000,
                "chunk_overlap": 200
            }
        """

        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={
                "data": {
                    "embedding_config": embedding_config
                }
            }
        )


    def update_chunking_config(
        self,
        draft_id: str,
        chunking_config: dict
    ):
        """
        Update chunking configuration.

        WHY: Configure how documents are split
        HOW: Update draft config in Redis

        ARGS:
            draft_id: KB draft ID
            chunking_config: {
                "strategy": "recursive",  # "recursive" | "sentence" | "paragraph"
                "chunk_size": 1000,
                "chunk_overlap": 200,
                "separators": ["\n\n", "\n", " "]
            }
        """

        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={
                "data": {
                    "chunking_config": chunking_config
                }
            }
        )


    async def preview_chunks(
        self,
        db: Session,
        draft_id: str,
        source_index: int
    ) -> list[dict]:
        """
        Preview document chunks (without saving).

        WHY: Test chunking before deployment
        HOW: Load document, chunk, return preview

        ARGS:
            db: Database session
            draft_id: KB draft ID
            source_index: Index of source to preview

        RETURNS:
            [
                {
                    "chunk_index": 0,
                    "content": "Chunk text...",
                    "token_count": 250,
                    "metadata": {"page": 1}
                }
            ]
        """

        # Get draft
        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise ValueError("KB draft not found")

        sources = draft["data"].get("sources", [])
        if source_index >= len(sources):
            raise ValueError("Source index out of range")

        source = sources[source_index]
        chunking_config = draft["data"].get("chunking_config", {})

        # Load and chunk document (placeholder - would use chunking_service)
        chunks = []
        # chunks = await chunking_service.chunk_document(source, chunking_config)

        return chunks


    def finalize_draft(
        self,
        db: Session,
        draft_id: str
    ) -> UUID:
        """
        Deploy KB draft to database.

        WHY: Finalize KB creation
        HOW: Create KB record, trigger background processing

        FLOW:
        1. Get draft from Redis
        2. Create KB in database
        3. Trigger Celery tasks for document processing
        4. Delete draft from Redis

        RETURNS:
            kb_id: Created knowledge base ID
        """

        from app.models.knowledge_base import KnowledgeBase

        # Get draft
        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise ValueError("KB draft not found")

        data = draft["data"]

        # Create KB record
        kb = KnowledgeBase(
            workspace_id=UUID(draft["workspace_id"]),
            name=data["name"],
            description=data.get("description"),
            config=data,
            created_by=UUID(draft["created_by"])
        )

        db.add(kb)
        db.commit()
        db.refresh(kb)

        # Trigger background processing for each source
        # (placeholder - would use Celery tasks)
        # for source in data.get("sources", []):
        #     process_document_task.delay(kb.id, source)

        # Delete draft
        draft_service.delete_draft(DraftType.KB, draft_id)

        return kb.id


# Global instance
kb_draft_service = KBDraftService()
