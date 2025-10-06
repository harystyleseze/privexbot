"""
Chunking Service - Split documents into chunks for embedding.

WHY:
- Documents too large for single embedding
- Need semantic chunks for retrieval
- Different strategies for different content types
- Overlap for context preservation

HOW:
- Recursive character splitting
- Sentence-based splitting
- Token-aware chunking
- Preserve metadata per chunk

PSEUDOCODE follows the existing codebase patterns.
"""

from typing import List, Optional
from uuid import UUID
import re

from sqlalchemy.orm import Session


class ChunkingService:
    """
    Document chunking with multiple strategies.

    WHY: Split documents into embeddable chunks
    HOW: Strategy pattern for different chunking methods
    """

    def chunk_document(
        self,
        text: str,
        strategy: str = "recursive",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Chunk document text.

        WHY: Split text into manageable pieces
        HOW: Use specified strategy

        ARGS:
            text: Document text to chunk
            strategy: "recursive" | "sentence" | "token"
            chunk_size: Target chunk size (characters or tokens)
            chunk_overlap: Overlap between chunks
            separators: Custom separators (for recursive)

        RETURNS:
            [
                {
                    "content": "Chunk text...",
                    "index": 0,
                    "start_pos": 0,
                    "end_pos": 1000,
                    "token_count": 250
                }
            ]
        """

        if strategy == "recursive":
            return self._recursive_chunk(text, chunk_size, chunk_overlap, separators)

        elif strategy == "sentence":
            return self._sentence_chunk(text, chunk_size, chunk_overlap)

        elif strategy == "token":
            return self._token_chunk(text, chunk_size, chunk_overlap)

        else:
            raise ValueError(f"Unknown chunking strategy: {strategy}")


    def _recursive_chunk(
        self,
        text: str,
        chunk_size: int,
        chunk_overlap: int,
        separators: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Recursive character-based chunking.

        WHY: Most versatile strategy
        HOW: Try separators in order (paragraphs → sentences → words)

        DEFAULT SEPARATORS:
        1. Double newline (paragraphs)
        2. Single newline (lines)
        3. Space (words)
        """

        if separators is None:
            separators = ["\n\n", "\n", " ", ""]

        chunks = []
        current_chunk = ""
        chunk_index = 0

        # Split by first separator
        splits = text.split(separators[0]) if separators else [text]

        for split in splits:
            # If split fits in current chunk
            if len(current_chunk) + len(split) + len(separators[0]) <= chunk_size:
                if current_chunk:
                    current_chunk += separators[0] + split
                else:
                    current_chunk = split

            # If split itself is larger than chunk size
            elif len(split) > chunk_size:
                # Save current chunk
                if current_chunk:
                    chunks.append(self._create_chunk_metadata(
                        current_chunk,
                        chunk_index
                    ))
                    chunk_index += 1
                    current_chunk = ""

                # Recursively chunk the large split
                if len(separators) > 1:
                    sub_chunks = self._recursive_chunk(
                        split,
                        chunk_size,
                        chunk_overlap,
                        separators[1:]
                    )
                    for sub_chunk in sub_chunks:
                        sub_chunk["index"] = chunk_index
                        chunks.append(sub_chunk)
                        chunk_index += 1
                else:
                    # Force split at character level
                    for i in range(0, len(split), chunk_size - chunk_overlap):
                        chunks.append(self._create_chunk_metadata(
                            split[i:i + chunk_size],
                            chunk_index
                        ))
                        chunk_index += 1

            # Start new chunk
            else:
                if current_chunk:
                    chunks.append(self._create_chunk_metadata(
                        current_chunk,
                        chunk_index
                    ))
                    chunk_index += 1

                # Start with overlap from previous chunk
                overlap_start = max(0, len(current_chunk) - chunk_overlap)
                current_chunk = current_chunk[overlap_start:] + separators[0] + split if current_chunk else split

        # Save final chunk
        if current_chunk:
            chunks.append(self._create_chunk_metadata(
                current_chunk,
                chunk_index
            ))

        return chunks


    def _sentence_chunk(
        self,
        text: str,
        chunk_size: int,
        chunk_overlap: int
    ) -> List[dict]:
        """
        Sentence-based chunking.

        WHY: Preserve sentence boundaries
        HOW: Split by sentences, group into chunks
        """

        # Simple sentence splitting (production would use NLTK or spaCy)
        sentences = re.split(r'[.!?]+\s+', text)

        chunks = []
        current_chunk = ""
        chunk_index = 0

        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(self._create_chunk_metadata(
                        current_chunk.strip(),
                        chunk_index
                    ))
                    chunk_index += 1

                current_chunk = sentence + ". "

        # Save final chunk
        if current_chunk:
            chunks.append(self._create_chunk_metadata(
                current_chunk.strip(),
                chunk_index
            ))

        return chunks


    def _token_chunk(
        self,
        text: str,
        chunk_size: int,
        chunk_overlap: int
    ) -> List[dict]:
        """
        Token-aware chunking.

        WHY: Respect token limits for embeddings
        HOW: Estimate tokens, chunk accordingly

        TOKEN ESTIMATION:
        - ~4 characters = 1 token (rough estimate)
        - Production would use tiktoken
        """

        # Simple token estimation (4 chars ≈ 1 token)
        char_per_token = 4
        chunk_size_chars = chunk_size * char_per_token
        chunk_overlap_chars = chunk_overlap * char_per_token

        # Use recursive chunking with token-adjusted sizes
        return self._recursive_chunk(
            text,
            chunk_size_chars,
            chunk_overlap_chars
        )


    def _create_chunk_metadata(self, content: str, index: int) -> dict:
        """
        Create chunk metadata.

        WHY: Track chunk information
        HOW: Add index, position, token count
        """

        # Estimate token count (4 chars ≈ 1 token)
        estimated_tokens = len(content) // 4

        return {
            "content": content,
            "index": index,
            "start_pos": 0,  # Would calculate actual position
            "end_pos": len(content),
            "token_count": estimated_tokens
        }


    def create_chunks_for_document(
        self,
        db: Session,
        document_id: UUID,
        strategy: str = "recursive",
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> List[UUID]:
        """
        Create and save chunks for document.

        WHY: Persist chunks to database
        HOW: Chunk document, create Chunk records

        ARGS:
            db: Database session
            document_id: Document to chunk
            strategy: Chunking strategy
            chunk_size: Target chunk size
            chunk_overlap: Overlap between chunks

        RETURNS:
            List of created chunk IDs
        """

        from app.models.document import Document
        from app.models.chunk import Chunk

        # Get document
        document = db.query(Document).get(document_id)
        if not document:
            raise ValueError("Document not found")

        # Chunk text
        chunks = self.chunk_document(
            text=document.content,
            strategy=strategy,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        # Create Chunk records
        chunk_ids = []
        for chunk_data in chunks:
            chunk = Chunk(
                document_id=document_id,
                kb_id=document.kb_id,
                content=chunk_data["content"],
                chunk_index=chunk_data["index"],
                metadata={
                    "token_count": chunk_data["token_count"],
                    "strategy": strategy,
                    "chunk_size": chunk_size
                }
            )

            db.add(chunk)
            db.flush()
            chunk_ids.append(chunk.id)

        db.commit()

        return chunk_ids


# Global instance
chunking_service = ChunkingService()
