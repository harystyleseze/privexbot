# Module 2: Processing & Chunking Pipeline

## Overview

Build an intelligent processing pipeline that preserves document structure while providing configurable chunking strategies. The system builds on existing `chunking_service.py` and `embedding_service.py` while adding smart parsing capabilities.

## Enhanced Processing Architecture

### Smart Document Parser
The foundation of intelligent processing that preserves document structure:

```python
# backend/src/app/services/smart_parsing_service.py
"""
Smart document parsing that preserves structure and context.

WHY: Maintain document hierarchy for better chunking and retrieval
HOW: Parse documents into structural elements before chunking
BUILDS ON: Existing document_processing_service.py
"""

from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum

class ElementType(Enum):
    """Document element types for structure preservation"""
    HEADING_1 = "h1"
    HEADING_2 = "h2"
    HEADING_3 = "h3"
    HEADING_4 = "h4"
    PARAGRAPH = "paragraph"
    LIST_ITEM = "list_item"
    TABLE = "table"
    CODE_BLOCK = "code_block"
    QUOTE = "quote"
    IMAGE = "image"
    FOOTNOTE = "footnote"
    METADATA = "metadata"

@dataclass
class DocumentElement:
    """Structured document element with context"""
    type: ElementType
    content: str
    metadata: Dict
    parent_id: Optional[str] = None
    children_ids: List[str] = None
    position: int = 0

    def __post_init__(self):
        if self.children_ids is None:
            self.children_ids = []

class SmartParsingService:
    """
    Intelligent document parsing that preserves structure.

    PHILOSOPHY: Structure-aware parsing enables better chunking and retrieval
    """

    def __init__(self):
        self.parsers = {
            "pdf": self._parse_pdf_structure,
            "docx": self._parse_docx_structure,
            "html": self._parse_html_structure,
            "markdown": self._parse_markdown_structure,
            "txt": self._parse_text_structure
        }

    async def parse_document(
        self,
        content: str,
        source_type: str,
        parse_config: Dict
    ) -> List[DocumentElement]:
        """
        Parse document into structured elements.

        parse_config = {
            "preserve_hierarchy": true,
            "extract_tables": true,
            "detect_sections": true,
            "merge_short_paragraphs": false,
            "min_element_length": 50
        }
        """

        parser = self.parsers.get(source_type, self._parse_text_structure)
        elements = await parser(content, parse_config)

        # Post-processing based on config
        if parse_config.get("merge_short_paragraphs", False):
            elements = self._merge_short_paragraphs(elements, parse_config)

        if parse_config.get("detect_sections", True):
            elements = self._detect_sections(elements)

        return elements

    async def _parse_pdf_structure(self, content: str, config: Dict) -> List[DocumentElement]:
        """
        Parse PDF with structure awareness.

        FEATURES:
        - Heading detection by font size/style
        - Table boundary detection
        - Page break preservation
        - Reading order maintenance
        """
        elements = []

        # Split by pages first (if page markers exist)
        pages = content.split("--- Page ")

        for page_num, page_content in enumerate(pages):
            if not page_content.strip():
                continue

            # Detect headings by looking for common patterns
            lines = page_content.split('\n')
            current_position = 0

            for line_num, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue

                element_type = self._detect_element_type(line, lines, line_num)

                element = DocumentElement(
                    type=element_type,
                    content=line,
                    metadata={
                        "page_number": page_num + 1,
                        "line_number": line_num,
                        "confidence": self._get_detection_confidence(line, element_type)
                    },
                    position=current_position
                )

                elements.append(element)
                current_position += 1

        return elements

    async def _parse_markdown_structure(self, content: str, config: Dict) -> List[DocumentElement]:
        """
        Parse Markdown with perfect structure preservation.

        FEATURES:
        - Native heading hierarchy (# ## ### ####)
        - Code block detection (```)
        - List and table parsing
        - Link and image extraction
        """
        import re

        elements = []
        lines = content.split('\n')
        current_position = 0
        in_code_block = False
        code_block_content = []

        for line_num, line in enumerate(lines):
            # Handle code blocks
            if line.strip().startswith('```'):
                if in_code_block:
                    # End of code block
                    elements.append(DocumentElement(
                        type=ElementType.CODE_BLOCK,
                        content='\n'.join(code_block_content),
                        metadata={"language": code_block_content[0] if code_block_content else ""},
                        position=current_position
                    ))
                    code_block_content = []
                    in_code_block = False
                else:
                    # Start of code block
                    in_code_block = True
                    if len(line.strip()) > 3:
                        code_block_content.append(line.strip()[3:])  # Language
                current_position += 1
                continue

            if in_code_block:
                code_block_content.append(line)
                continue

            # Detect element type
            if re.match(r'^#{1,6}\s+', line):
                # Heading
                level = len(line.split()[0])
                heading_type = {
                    1: ElementType.HEADING_1,
                    2: ElementType.HEADING_2,
                    3: ElementType.HEADING_3,
                    4: ElementType.HEADING_4
                }.get(level, ElementType.HEADING_4)

                elements.append(DocumentElement(
                    type=heading_type,
                    content=line.lstrip('#').strip(),
                    metadata={"heading_level": level, "raw_markdown": line},
                    position=current_position
                ))

            elif re.match(r'^\s*[-*+]\s+', line):
                # List item
                elements.append(DocumentElement(
                    type=ElementType.LIST_ITEM,
                    content=re.sub(r'^\s*[-*+]\s+', '', line),
                    metadata={"list_marker": re.search(r'[-*+]', line).group(), "indent_level": len(line) - len(line.lstrip())},
                    position=current_position
                ))

            elif line.strip().startswith('|') and line.strip().endswith('|'):
                # Table row
                elements.append(DocumentElement(
                    type=ElementType.TABLE,
                    content=line.strip(),
                    metadata={"is_table_row": True},
                    position=current_position
                ))

            elif line.strip():
                # Regular paragraph
                elements.append(DocumentElement(
                    type=ElementType.PARAGRAPH,
                    content=line.strip(),
                    metadata={},
                    position=current_position
                ))

            current_position += 1

        return elements

    def _detect_element_type(self, line: str, all_lines: List[str], line_num: int) -> ElementType:
        """Intelligent element type detection"""

        # Heading patterns
        if (line.isupper() and len(line) < 100) or \
           (line.endswith(':') and len(line.split()) <= 8) or \
           (len(line) < 50 and not line.endswith('.')):
            return ElementType.HEADING_2

        # List patterns
        if re.match(r'^\s*[-•*]\s+', line) or re.match(r'^\s*\d+\.\s+', line):
            return ElementType.LIST_ITEM

        # Table patterns
        if '|' in line and line.count('|') >= 2:
            return ElementType.TABLE

        # Code patterns
        if line.strip().startswith(('def ', 'class ', 'function ', 'import ', 'from ')):
            return ElementType.CODE_BLOCK

        return ElementType.PARAGRAPH

    def _get_detection_confidence(self, line: str, element_type: ElementType) -> float:
        """Calculate confidence score for element type detection"""
        # Simple heuristic-based confidence scoring
        if element_type == ElementType.HEADING_2:
            if line.isupper():
                return 0.9
            elif line.endswith(':'):
                return 0.8
            else:
                return 0.6
        elif element_type == ElementType.LIST_ITEM:
            return 0.95
        elif element_type == ElementType.TABLE:
            return 0.85
        else:
            return 0.7
```

### Enhanced Chunking Service
Building on the existing chunking service with structure-aware strategies:

```python
# backend/src/app/services/enhanced_chunking_service.py
"""
Enhanced chunking service with structure-aware strategies.

BUILDS ON: Existing chunking_service.py
ADDS: Structure-aware chunking, adaptive strategies, context preservation
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class ChunkingStrategy(Enum):
    """Available chunking strategies"""
    RECURSIVE = "recursive"              # Existing: Split by separators recursively
    SEMANTIC = "semantic"                # NEW: Split by semantic boundaries
    BY_HEADING = "by_heading"           # NEW: Split at heading boundaries
    BY_SECTION = "by_section"           # NEW: Split by detected sections
    ADAPTIVE = "adaptive"               # NEW: Adapt strategy to document type
    SENTENCE_BASED = "sentence_based"   # NEW: Split by sentences
    PARAGRAPH_BASED = "paragraph_based" # NEW: Split by paragraphs
    HYBRID = "hybrid"                   # NEW: Combine multiple strategies

@dataclass
class ChunkConfig:
    """Comprehensive chunking configuration"""
    strategy: ChunkingStrategy
    max_chunk_size: int = 1000          # Characters
    chunk_overlap: int = 200            # Character overlap
    min_chunk_size: int = 100           # Minimum chunk size
    preserve_structure: bool = True     # Maintain element boundaries
    include_metadata: bool = True       # Include structural metadata
    adaptive_sizing: bool = False       # Adjust size based on content type
    context_window: int = 2             # Number of surrounding elements for context

@dataclass
class DocumentChunk:
    """Enhanced chunk with structure and context"""
    content: str
    metadata: Dict
    position: int
    element_type: Optional[ElementType] = None
    parent_heading: Optional[str] = None
    context_before: Optional[str] = None
    context_after: Optional[str] = None
    embedding: Optional[List[float]] = None

class EnhancedChunkingService:
    """
    Structure-aware document chunking that preserves context.

    BUILDS ON: Existing chunking patterns
    ENHANCES: Context preservation, adaptive strategies, intelligent splitting
    """

    def __init__(self, smart_parser: SmartParsingService):
        self.smart_parser = smart_parser

        # Strategy implementations
        self.strategies = {
            ChunkingStrategy.RECURSIVE: self._recursive_chunking,
            ChunkingStrategy.SEMANTIC: self._semantic_chunking,
            ChunkingStrategy.BY_HEADING: self._heading_based_chunking,
            ChunkingStrategy.BY_SECTION: self._section_based_chunking,
            ChunkingStrategy.ADAPTIVE: self._adaptive_chunking,
            ChunkingStrategy.SENTENCE_BASED: self._sentence_based_chunking,
            ChunkingStrategy.PARAGRAPH_BASED: self._paragraph_based_chunking,
            ChunkingStrategy.HYBRID: self._hybrid_chunking
        }

    async def chunk_document(
        self,
        document_content: str,
        source_type: str,
        chunk_config: ChunkConfig,
        parse_config: Optional[Dict] = None
    ) -> List[DocumentChunk]:
        """
        Intelligent document chunking with structure preservation.

        FLOW:
        1. Parse document into structured elements
        2. Apply selected chunking strategy
        3. Add context and metadata
        4. Validate and optimize chunks
        """

        # Step 1: Parse document structure
        if parse_config is None:
            parse_config = {"preserve_hierarchy": True, "detect_sections": True}

        elements = await self.smart_parser.parse_document(
            document_content, source_type, parse_config
        )

        # Step 2: Apply chunking strategy
        strategy_func = self.strategies.get(chunk_config.strategy, self._recursive_chunking)
        chunks = await strategy_func(elements, chunk_config)

        # Step 3: Add context and enhance metadata
        enhanced_chunks = self._add_context_to_chunks(chunks, elements, chunk_config)

        # Step 4: Validate and optimize
        optimized_chunks = self._optimize_chunks(enhanced_chunks, chunk_config)

        return optimized_chunks

    async def _heading_based_chunking(
        self,
        elements: List[DocumentElement],
        config: ChunkConfig
    ) -> List[DocumentChunk]:
        """
        Chunk document by heading boundaries.

        STRATEGY: Create chunks that start with headings and include all content
        until the next heading of same or higher level.

        BENEFITS:
        - Preserves logical document structure
        - Maintains context within sections
        - Ideal for documentation and articles
        """
        chunks = []
        current_chunk_elements = []
        current_heading = None

        heading_types = {ElementType.HEADING_1, ElementType.HEADING_2,
                        ElementType.HEADING_3, ElementType.HEADING_4}

        for element in elements:
            if element.type in heading_types:
                # Start new chunk if we have content
                if current_chunk_elements:
                    chunk = self._create_chunk_from_elements(
                        current_chunk_elements, current_heading, config
                    )
                    if chunk:
                        chunks.append(chunk)

                # Start new chunk with this heading
                current_chunk_elements = [element]
                current_heading = element.content

            else:
                current_chunk_elements.append(element)

                # Check if chunk is getting too large
                current_size = sum(len(e.content) for e in current_chunk_elements)
                if current_size > config.max_chunk_size:
                    # Split the current chunk
                    chunk = self._create_chunk_from_elements(
                        current_chunk_elements[:-1], current_heading, config
                    )
                    if chunk:
                        chunks.append(chunk)

                    # Start new chunk with last element
                    current_chunk_elements = [current_chunk_elements[-1]]

        # Handle remaining elements
        if current_chunk_elements:
            chunk = self._create_chunk_from_elements(
                current_chunk_elements, current_heading, config
            )
            if chunk:
                chunks.append(chunk)

        return chunks

    async def _semantic_chunking(
        self,
        elements: List[DocumentElement],
        config: ChunkConfig
    ) -> List[DocumentChunk]:
        """
        Chunk document by semantic boundaries.

        STRATEGY: Use NLP to detect topic changes and semantic breaks.
        Groups related content together regardless of structure.

        BENEFITS:
        - Maintains semantic coherence
        - Better for Q&A and retrieval
        - Handles poorly structured documents
        """
        try:
            # For semantic chunking, we need sentence embeddings
            # This is a simplified implementation - production would use proper NLP models

            chunks = []
            current_elements = []
            current_topic_embedding = None

            for element in elements:
                if element.type == ElementType.PARAGRAPH:
                    # Get embedding for this paragraph (placeholder)
                    element_embedding = await self._get_semantic_embedding(element.content)

                    if current_topic_embedding is None:
                        current_topic_embedding = element_embedding
                        current_elements = [element]
                    else:
                        # Calculate semantic similarity
                        similarity = self._calculate_similarity(current_topic_embedding, element_embedding)

                        if similarity < 0.7:  # Topic change threshold
                            # Create chunk from current elements
                            if current_elements:
                                chunk = self._create_chunk_from_elements(current_elements, None, config)
                                if chunk:
                                    chunks.append(chunk)

                            # Start new topic
                            current_elements = [element]
                            current_topic_embedding = element_embedding
                        else:
                            current_elements.append(element)

                            # Update topic embedding (moving average)
                            current_topic_embedding = self._update_topic_embedding(
                                current_topic_embedding, element_embedding
                            )
                else:
                    # Non-paragraph elements (headings, lists, etc.)
                    current_elements.append(element)

            # Handle remaining elements
            if current_elements:
                chunk = self._create_chunk_from_elements(current_elements, None, config)
                if chunk:
                    chunks.append(chunk)

            return chunks

        except Exception as e:
            # Fallback to heading-based chunking
            return await self._heading_based_chunking(elements, config)

    async def _adaptive_chunking(
        self,
        elements: List[DocumentElement],
        config: ChunkConfig
    ) -> List[DocumentChunk]:
        """
        Adaptive chunking that selects best strategy based on document characteristics.

        STRATEGY: Analyze document structure and content to choose optimal chunking approach.

        DECISION TREE:
        - High heading density → heading_based
        - Low structure, high text → semantic
        - Lists and tables → paragraph_based
        - Code content → preserve_structure
        """

        # Analyze document characteristics
        doc_stats = self._analyze_document_structure(elements)

        # Decision logic based on document characteristics
        if doc_stats["heading_density"] > 0.1:  # > 10% headings
            chosen_strategy = ChunkingStrategy.BY_HEADING
        elif doc_stats["table_density"] > 0.2:  # > 20% tables/lists
            chosen_strategy = ChunkingStrategy.PARAGRAPH_BASED
        elif doc_stats["avg_paragraph_length"] > 500:  # Long paragraphs
            chosen_strategy = ChunkingStrategy.SEMANTIC
        elif doc_stats["code_density"] > 0.1:  # > 10% code
            chosen_strategy = ChunkingStrategy.PARAGRAPH_BASED
        else:
            chosen_strategy = ChunkingStrategy.RECURSIVE  # Fallback

        # Apply chosen strategy
        adapted_config = ChunkConfig(
            strategy=chosen_strategy,
            max_chunk_size=config.max_chunk_size,
            chunk_overlap=config.chunk_overlap,
            preserve_structure=True,  # Always preserve structure in adaptive mode
            include_metadata=True,
            adaptive_sizing=True
        )

        strategy_func = self.strategies[chosen_strategy]
        chunks = await strategy_func(elements, adapted_config)

        # Add adaptive metadata
        for chunk in chunks:
            chunk.metadata["adaptive_strategy_used"] = chosen_strategy.value
            chunk.metadata["document_characteristics"] = doc_stats

        return chunks

    async def _hybrid_chunking(
        self,
        elements: List[DocumentElement],
        config: ChunkConfig
    ) -> List[DocumentChunk]:
        """
        Hybrid chunking that combines multiple strategies for optimal results.

        STRATEGY:
        1. Primary chunking by headings/sections
        2. Secondary semantic splitting for large chunks
        3. Tertiary size-based splitting as fallback
        """

        # Step 1: Primary chunking by structure
        primary_chunks = await self._heading_based_chunking(elements, config)

        # Step 2: Secondary semantic splitting for oversized chunks
        refined_chunks = []
        for chunk in primary_chunks:
            if len(chunk.content) > config.max_chunk_size * 1.5:
                # This chunk is too large, apply semantic splitting
                chunk_elements = self._chunk_content_to_elements(chunk.content)
                semantic_config = ChunkConfig(
                    strategy=ChunkingStrategy.SEMANTIC,
                    max_chunk_size=config.max_chunk_size,
                    chunk_overlap=config.chunk_overlap
                )
                sub_chunks = await self._semantic_chunking(chunk_elements, semantic_config)
                refined_chunks.extend(sub_chunks)
            else:
                refined_chunks.append(chunk)

        # Step 3: Final size validation and splitting
        final_chunks = []
        for chunk in refined_chunks:
            if len(chunk.content) > config.max_chunk_size:
                # Force split by size
                sub_chunks = self._force_split_by_size(chunk, config)
                final_chunks.extend(sub_chunks)
            else:
                final_chunks.append(chunk)

        return final_chunks

    def _create_chunk_from_elements(
        self,
        elements: List[DocumentElement],
        parent_heading: Optional[str],
        config: ChunkConfig
    ) -> Optional[DocumentChunk]:
        """Create chunk from document elements with metadata"""

        if not elements:
            return None

        # Combine element content
        content_parts = []
        for element in elements:
            if element.type in {ElementType.HEADING_1, ElementType.HEADING_2,
                              ElementType.HEADING_3, ElementType.HEADING_4}:
                content_parts.append(f"\n## {element.content}\n")
            elif element.type == ElementType.LIST_ITEM:
                content_parts.append(f"• {element.content}")
            else:
                content_parts.append(element.content)

        content = "\n".join(content_parts).strip()

        if len(content) < config.min_chunk_size:
            return None

        # Build metadata
        metadata = {
            "element_count": len(elements),
            "element_types": [e.type.value for e in elements],
            "primary_element_type": elements[0].type.value if elements else None,
            "parent_heading": parent_heading,
            "chunk_length": len(content),
            "word_count": len(content.split()),
            "contains_headings": any(e.type.value.startswith('h') for e in elements),
            "contains_tables": any(e.type == ElementType.TABLE for e in elements),
            "contains_lists": any(e.type == ElementType.LIST_ITEM for e in elements)
        }

        # Add page numbers if available
        page_numbers = [e.metadata.get("page_number") for e in elements
                       if e.metadata.get("page_number")]
        if page_numbers:
            metadata["page_numbers"] = sorted(set(page_numbers))

        return DocumentChunk(
            content=content,
            metadata=metadata,
            position=elements[0].position if elements else 0,
            element_type=elements[0].type if len(elements) == 1 else None,
            parent_heading=parent_heading
        )

    def _add_context_to_chunks(
        self,
        chunks: List[DocumentChunk],
        elements: List[DocumentElement],
        config: ChunkConfig
    ) -> List[DocumentChunk]:
        """Add contextual information to chunks"""

        if not config.include_metadata:
            return chunks

        enhanced_chunks = []

        for i, chunk in enumerate(chunks):
            enhanced_chunk = chunk

            # Add context from surrounding chunks
            if config.context_window > 0:
                context_before = []
                context_after = []

                # Get context before
                for j in range(max(0, i - config.context_window), i):
                    if j < len(chunks):
                        context_before.append(chunks[j].content[:100] + "...")

                # Get context after
                for j in range(i + 1, min(len(chunks), i + config.context_window + 1)):
                    context_after.append(chunks[j].content[:100] + "...")

                enhanced_chunk.context_before = " ".join(context_before) if context_before else None
                enhanced_chunk.context_after = " ".join(context_after) if context_after else None

            # Add position metadata
            enhanced_chunk.metadata["chunk_index"] = i
            enhanced_chunk.metadata["total_chunks"] = len(chunks)
            enhanced_chunk.metadata["relative_position"] = i / len(chunks) if len(chunks) > 1 else 0

            enhanced_chunks.append(enhanced_chunk)

        return enhanced_chunks

    def _optimize_chunks(
        self,
        chunks: List[DocumentChunk],
        config: ChunkConfig
    ) -> List[DocumentChunk]:
        """Final optimization of chunks"""

        optimized = []

        for chunk in chunks:
            # Skip chunks that are too small unless they contain important elements
            if len(chunk.content) < config.min_chunk_size:
                if chunk.element_type not in {ElementType.HEADING_1, ElementType.HEADING_2,
                                            ElementType.TABLE, ElementType.CODE_BLOCK}:
                    continue  # Skip small, unimportant chunks

            # Truncate chunks that are too large (final safety)
            if len(chunk.content) > config.max_chunk_size * 2:
                chunk.content = chunk.content[:config.max_chunk_size * 2]
                chunk.metadata["truncated"] = True

            optimized.append(chunk)

        return optimized

    # Helper methods for analysis and processing
    def _analyze_document_structure(self, elements: List[DocumentElement]) -> Dict:
        """Analyze document structure characteristics"""

        total_elements = len(elements)
        if total_elements == 0:
            return {}

        heading_count = sum(1 for e in elements if e.type.value.startswith('h'))
        table_count = sum(1 for e in elements if e.type == ElementType.TABLE)
        list_count = sum(1 for e in elements if e.type == ElementType.LIST_ITEM)
        code_count = sum(1 for e in elements if e.type == ElementType.CODE_BLOCK)
        paragraph_lengths = [len(e.content) for e in elements if e.type == ElementType.PARAGRAPH]

        return {
            "total_elements": total_elements,
            "heading_density": heading_count / total_elements,
            "table_density": (table_count + list_count) / total_elements,
            "code_density": code_count / total_elements,
            "avg_paragraph_length": sum(paragraph_lengths) / len(paragraph_lengths) if paragraph_lengths else 0,
            "heading_count": heading_count,
            "table_count": table_count,
            "list_count": list_count,
            "code_count": code_count
        }
```

### Pipeline Status Monitoring

```python
# backend/src/app/services/pipeline_monitoring_service.py
"""
Pipeline monitoring service for debugging and transparency.

WHY: Users need visibility into processing pipeline for debugging
HOW: Track each step, provide real-time status, enable drill-down debugging
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import time
import json

class PipelineStage(Enum):
    """Processing pipeline stages"""
    DOCUMENT_UPLOAD = "document_upload"
    CONTENT_EXTRACTION = "content_extraction"
    STRUCTURE_PARSING = "structure_parsing"
    CHUNKING = "chunking"
    EMBEDDING_GENERATION = "embedding_generation"
    VECTOR_STORAGE = "vector_storage"
    INDEXING = "indexing"
    COMPLETION = "completion"

@dataclass
class StageResult:
    """Result of a pipeline stage"""
    stage: PipelineStage
    status: str  # "pending", "running", "completed", "failed"
    start_time: float
    end_time: Optional[float] = None
    duration: Optional[float] = None
    input_size: Optional[int] = None
    output_size: Optional[int] = None
    metadata: Dict = None
    error_message: Optional[str] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class PipelineMonitoringService:
    """
    Monitor and debug document processing pipeline.

    FEATURES:
    - Real-time stage tracking
    - Performance metrics
    - Error debugging
    - Pipeline visualization data
    """

    def __init__(self, redis_client):
        self.redis = redis_client

    def start_pipeline(self, document_id: str, pipeline_config: Dict) -> str:
        """Initialize pipeline monitoring for document"""

        pipeline_id = f"pipeline:{document_id}:{int(time.time())}"

        pipeline_data = {
            "pipeline_id": pipeline_id,
            "document_id": document_id,
            "config": pipeline_config,
            "stages": {},
            "started_at": time.time(),
            "status": "running",
            "current_stage": PipelineStage.DOCUMENT_UPLOAD.value
        }

        # Store in Redis with 24 hour expiry
        self.redis.setex(
            pipeline_id,
            86400,  # 24 hours
            json.dumps(pipeline_data, default=str)
        )

        return pipeline_id

    def start_stage(
        self,
        pipeline_id: str,
        stage: PipelineStage,
        input_data: Optional[Dict] = None
    ) -> None:
        """Mark start of pipeline stage"""

        pipeline_data = self._get_pipeline_data(pipeline_id)
        if not pipeline_data:
            return

        stage_result = StageResult(
            stage=stage,
            status="running",
            start_time=time.time(),
            input_size=len(str(input_data)) if input_data else None,
            metadata={"input_summary": self._summarize_input(input_data)}
        )

        pipeline_data["stages"][stage.value] = stage_result.__dict__
        pipeline_data["current_stage"] = stage.value

        self._update_pipeline_data(pipeline_id, pipeline_data)

    def complete_stage(
        self,
        pipeline_id: str,
        stage: PipelineStage,
        output_data: Optional[Dict] = None,
        metrics: Optional[Dict] = None
    ) -> None:
        """Mark completion of pipeline stage"""

        pipeline_data = self._get_pipeline_data(pipeline_id)
        if not pipeline_data or stage.value not in pipeline_data["stages"]:
            return

        stage_data = pipeline_data["stages"][stage.value]
        stage_data["status"] = "completed"
        stage_data["end_time"] = time.time()
        stage_data["duration"] = stage_data["end_time"] - stage_data["start_time"]
        stage_data["output_size"] = len(str(output_data)) if output_data else None

        if metrics:
            stage_data["metadata"].update(metrics)

        if output_data:
            stage_data["metadata"]["output_summary"] = self._summarize_output(output_data, stage)

        self._update_pipeline_data(pipeline_id, pipeline_data)

    def fail_stage(
        self,
        pipeline_id: str,
        stage: PipelineStage,
        error: str,
        error_details: Optional[Dict] = None
    ) -> None:
        """Mark failure of pipeline stage"""

        pipeline_data = self._get_pipeline_data(pipeline_id)
        if not pipeline_data:
            return

        if stage.value not in pipeline_data["stages"]:
            # Create stage entry if it doesn't exist
            pipeline_data["stages"][stage.value] = StageResult(
                stage=stage,
                status="failed",
                start_time=time.time(),
                error_message=error
            ).__dict__
        else:
            stage_data = pipeline_data["stages"][stage.value]
            stage_data["status"] = "failed"
            stage_data["end_time"] = time.time()
            stage_data["duration"] = stage_data["end_time"] - stage_data.get("start_time", time.time())
            stage_data["error_message"] = error

        if error_details:
            pipeline_data["stages"][stage.value]["metadata"]["error_details"] = error_details

        pipeline_data["status"] = "failed"
        pipeline_data["failed_at"] = time.time()

        self._update_pipeline_data(pipeline_id, pipeline_data)

    def get_pipeline_status(self, pipeline_id: str) -> Dict:
        """Get current pipeline status for UI display"""

        pipeline_data = self._get_pipeline_data(pipeline_id)
        if not pipeline_data:
            return {"error": "Pipeline not found"}

        # Calculate overall progress
        total_stages = len(PipelineStage)
        completed_stages = sum(1 for stage in pipeline_data["stages"].values()
                             if stage["status"] == "completed")

        progress_percentage = (completed_stages / total_stages) * 100

        # Build status response
        status = {
            "pipeline_id": pipeline_id,
            "document_id": pipeline_data["document_id"],
            "status": pipeline_data["status"],
            "progress_percentage": progress_percentage,
            "current_stage": pipeline_data.get("current_stage"),
            "started_at": pipeline_data["started_at"],
            "total_duration": time.time() - pipeline_data["started_at"],
            "stages": []
        }

        # Add stage details
        for stage_enum in PipelineStage:
            stage_name = stage_enum.value
            if stage_name in pipeline_data["stages"]:
                stage_data = pipeline_data["stages"][stage_name]
                status["stages"].append({
                    "name": stage_name,
                    "display_name": stage_name.replace("_", " ").title(),
                    "status": stage_data["status"],
                    "duration": stage_data.get("duration"),
                    "error_message": stage_data.get("error_message"),
                    "metadata": stage_data.get("metadata", {})
                })
            else:
                status["stages"].append({
                    "name": stage_name,
                    "display_name": stage_name.replace("_", " ").title(),
                    "status": "pending"
                })

        return status

    def get_debug_info(self, pipeline_id: str) -> Dict:
        """Get detailed debug information for troubleshooting"""

        pipeline_data = self._get_pipeline_data(pipeline_id)
        if not pipeline_data:
            return {"error": "Pipeline not found"}

        debug_info = {
            "pipeline_config": pipeline_data["config"],
            "stage_details": {},
            "performance_metrics": {},
            "error_analysis": {}
        }

        # Detailed stage information
        for stage_name, stage_data in pipeline_data["stages"].items():
            debug_info["stage_details"][stage_name] = {
                "input_size": stage_data.get("input_size"),
                "output_size": stage_data.get("output_size"),
                "duration": stage_data.get("duration"),
                "metadata": stage_data.get("metadata", {}),
                "error_message": stage_data.get("error_message")
            }

        # Performance analysis
        durations = [stage.get("duration", 0) for stage in pipeline_data["stages"].values()
                    if stage.get("duration")]
        if durations:
            debug_info["performance_metrics"] = {
                "total_processing_time": sum(durations),
                "average_stage_time": sum(durations) / len(durations),
                "slowest_stage": max(pipeline_data["stages"].items(),
                                   key=lambda x: x[1].get("duration", 0))[0],
                "stage_durations": {name: data.get("duration")
                                  for name, data in pipeline_data["stages"].items()}
            }

        # Error analysis
        failed_stages = [name for name, data in pipeline_data["stages"].items()
                        if data["status"] == "failed"]
        if failed_stages:
            debug_info["error_analysis"] = {
                "failed_stages": failed_stages,
                "error_messages": {name: pipeline_data["stages"][name].get("error_message")
                                 for name in failed_stages}
            }

        return debug_info

    # Helper methods
    def _get_pipeline_data(self, pipeline_id: str) -> Optional[Dict]:
        """Get pipeline data from Redis"""
        data = self.redis.get(pipeline_id)
        return json.loads(data) if data else None

    def _update_pipeline_data(self, pipeline_id: str, data: Dict) -> None:
        """Update pipeline data in Redis"""
        self.redis.setex(pipeline_id, 86400, json.dumps(data, default=str))

    def _summarize_input(self, input_data: Optional[Dict]) -> Dict:
        """Create summary of input data for monitoring"""
        if not input_data:
            return {}

        summary = {
            "data_type": type(input_data).__name__,
            "size": len(str(input_data))
        }

        if isinstance(input_data, dict):
            summary["keys"] = list(input_data.keys())[:5]  # First 5 keys
        elif isinstance(input_data, list):
            summary["length"] = len(input_data)
        elif isinstance(input_data, str):
            summary["text_length"] = len(input_data)
            summary["preview"] = input_data[:100] + "..." if len(input_data) > 100 else input_data

        return summary

    def _summarize_output(self, output_data: Optional[Dict], stage: PipelineStage) -> Dict:
        """Create summary of output data for monitoring"""
        if not output_data:
            return {}

        summary = self._summarize_input(output_data)

        # Stage-specific summaries
        if stage == PipelineStage.CHUNKING and isinstance(output_data, list):
            summary["chunk_count"] = len(output_data)
            summary["avg_chunk_size"] = sum(len(str(chunk)) for chunk in output_data) / len(output_data)

        elif stage == PipelineStage.EMBEDDING_GENERATION and isinstance(output_data, list):
            summary["embedding_count"] = len(output_data)
            if output_data and isinstance(output_data[0], list):
                summary["embedding_dimensions"] = len(output_data[0])

        return summary
```

## Integration with Existing Services

### Enhanced Document Processing Flow
```python
# Integration example in existing document_processing_service.py

async def process_document_enhanced(
    self,
    db: Session,
    document_id: UUID,
    processing_config: Dict
) -> Dict:
    """
    Enhanced document processing with monitoring and smart chunking.

    BUILDS ON: Existing process_file, process_url, process_text methods
    ADDS: Pipeline monitoring, structure-aware processing, configurable chunking
    """

    # Initialize pipeline monitoring
    pipeline_id = self.pipeline_monitor.start_pipeline(str(document_id), processing_config)

    try:
        # Stage 1: Content Extraction
        self.pipeline_monitor.start_stage(pipeline_id, PipelineStage.CONTENT_EXTRACTION)

        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise ValueError("Document not found")

        # Use existing extraction methods
        if document.source_type == "file_upload":
            content = await self.process_file(...)
        elif document.source_type == "website":
            content = await self.process_url(...)
        else:
            content = await self.process_text(...)

        self.pipeline_monitor.complete_stage(
            pipeline_id,
            PipelineStage.CONTENT_EXTRACTION,
            {"content_length": len(content["text"])}
        )

        # Stage 2: Smart Parsing
        self.pipeline_monitor.start_stage(pipeline_id, PipelineStage.STRUCTURE_PARSING)

        smart_parser = SmartParsingService()
        elements = await smart_parser.parse_document(
            content["text"],
            document.source_type,
            processing_config.get("parse_config", {})
        )

        self.pipeline_monitor.complete_stage(
            pipeline_id,
            PipelineStage.STRUCTURE_PARSING,
            {"element_count": len(elements)},
            {"element_types": [e.type.value for e in elements]}
        )

        # Stage 3: Enhanced Chunking
        self.pipeline_monitor.start_stage(pipeline_id, PipelineStage.CHUNKING)

        enhanced_chunker = EnhancedChunkingService(smart_parser)
        chunks = await enhanced_chunker.chunk_document(
            content["text"],
            document.source_type,
            ChunkConfig(**processing_config.get("chunk_config", {}))
        )

        self.pipeline_monitor.complete_stage(
            pipeline_id,
            PipelineStage.CHUNKING,
            {"chunk_count": len(chunks)},
            {"avg_chunk_size": sum(len(c.content) for c in chunks) / len(chunks)}
        )

        # Continue with existing embedding and indexing pipeline...

        return {
            "document_id": str(document_id),
            "pipeline_id": pipeline_id,
            "chunks_created": len(chunks),
            "status": "completed"
        }

    except Exception as e:
        # Log failure and provide debugging info
        current_stage = PipelineStage.CONTENT_EXTRACTION  # Determine current stage
        self.pipeline_monitor.fail_stage(pipeline_id, current_stage, str(e))
        raise
```

## Summary

This enhanced processing pipeline:

1. **Builds on existing services** - Extends chunking_service.py, embedding_service.py with smart capabilities
2. **Preserves document structure** - Intelligent parsing maintains hierarchy and context
3. **Provides configurable strategies** - Multiple chunking approaches for different document types
4. **Enables pipeline debugging** - Real-time monitoring and detailed error reporting
5. **Maintains performance** - Efficient processing with adaptive optimization
6. **Supports multi-tenancy** - All processing respects workspace boundaries and access controls

The system provides the intelligent processing capabilities users need while maintaining the existing draft-first architecture and multi-tenant security model.