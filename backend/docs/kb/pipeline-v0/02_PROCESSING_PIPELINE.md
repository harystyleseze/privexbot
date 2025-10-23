# Processing Pipeline Module

**Purpose**: Debuggable ETL pipeline with smart parsing and structure preservation
**Scope**: Parse → Chunk → Embed → Index with full visibility and control
**Integration**: Processes content from [Source Management](01_SOURCE_MANAGEMENT.md) using [Configuration Management](03_CONFIGURATION_MANAGEMENT.md)

---

## 🎯 Module Overview

The Processing Pipeline Module implements a **fully debuggable ETL pipeline** where every step from document parsing to vector indexing is visible, controllable, and optimizable. Users can inspect each stage, swap components, and understand exactly where processing succeeds or fails.

## 🏗️ Pipeline Architecture

### **Visual Pipeline Design**

```
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE ORCHESTRATOR                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Step      │ │   Monitor   │ │   Control   │          │
│  │ Execution   │ │ & Debug     │ │ & Config    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     PIPELINE STEPS                          │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │   PARSE  │──▶│  CHUNK   │──▶│  EMBED   │──▶│  INDEX   │ │
│  │ & CLEAN  │   │ & SPLIT  │   │ & VECTOR │   │ & STORE  │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│       │              │              │              │       │
│       ▼              ▼              ▼              ▼       │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │ Debug    │   │ Debug    │   │ Debug    │   │ Debug    │ │
│  │ Info     │   │ Info     │   │ Info     │   │ Info     │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PIPELINE STATE STORAGE                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Redis     │ │ PostgreSQL  │ │   Vector    │           │
│  │(Debug Data) │ │(Metadata)   │ │   Store     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Step 1: Smart Parsing & Structure Preservation

### **Parsing Engine Design**

```python
# File: services/parsing/smart_parser.py
class SmartParsingEngine:
    """Structure-preserving document parser with debugging."""

    def __init__(self):
        self.parsers = {
            'pdf': AdvancedPDFParser(),
            'docx': StructuredDocxParser(),
            'html': SemanticHTMLParser(),
            'markdown': EnhancedMarkdownParser()
        }

    async def parse_document(self, source_content: SourceContent, config: dict) -> ParsedDocument:
        """Parse document while preserving all structural elements."""

        # Create parsing context for debugging
        parsing_context = ParsingContext(
            document_id=source_content.id,
            source_type=source_content.source_type,
            config=config
        )

        try:
            # Step 1: Detect document structure
            structure_info = await self._analyze_structure(source_content, parsing_context)

            # Step 2: Extract elements with preservation
            extracted_elements = await self._extract_elements(source_content, structure_info, parsing_context)

            # Step 3: Reconstruct with markup
            reconstructed_content = await self._reconstruct_with_markup(extracted_elements, parsing_context)

            # Step 4: Validate structure preservation
            validation_result = await self._validate_structure(source_content, reconstructed_content, parsing_context)

            return ParsedDocument(
                content=reconstructed_content,
                elements=extracted_elements,
                structure=structure_info,
                metadata=self._generate_parsing_metadata(parsing_context),
                debug_info=parsing_context.debug_data
            )

        except Exception as e:
            parsing_context.add_error(f"Parsing failed: {str(e)}")
            raise ParsingException(str(e), parsing_context.debug_data)

    async def _analyze_structure(self, content: SourceContent, context: ParsingContext):
        """Analyze document structure before parsing."""

        context.log_step("structure_analysis", "Analyzing document structure")

        structure = DocumentStructure()

        if content.source_type == "file_upload":
            # Use Unstructured.io for advanced structure detection
            elements = await self.unstructured.partition(
                content.file_path,
                strategy="hi_res",  # High resolution for better structure
                include_page_breaks=True,
                infer_table_structure=True
            )

            for element in elements:
                if element.category == "Title":
                    structure.add_heading(element.text, level=1, page=element.metadata.page_number)
                elif element.category == "Header":
                    structure.add_heading(element.text, level=2, page=element.metadata.page_number)
                elif element.category == "Table":
                    structure.add_table(element.text, element.metadata)
                elif element.category == "Image":
                    structure.add_image(element.metadata)
                elif element.category == "ListItem":
                    structure.add_list_item(element.text)

        context.log_step_result("structure_analysis", {
            "headings_found": len(structure.headings),
            "tables_found": len(structure.tables),
            "images_found": len(structure.images),
            "structure_score": structure.calculate_score()
        })

        return structure

    async def _extract_elements(self, content: SourceContent, structure: DocumentStructure, context: ParsingContext):
        """Extract all document elements with position tracking."""

        context.log_step("element_extraction", "Extracting document elements")

        elements = []

        if content.source_type == "file_upload" and content.file_extension == ".pdf":
            # Advanced PDF processing with PyMuPDF
            elements = await self._extract_pdf_elements(content, structure, context)
        elif content.source_type == "web_scrape":
            # Web content with semantic extraction
            elements = await self._extract_web_elements(content, structure, context)

        context.log_step_result("element_extraction", {
            "total_elements": len(elements),
            "element_types": self._count_element_types(elements)
        })

        return elements

    async def _extract_pdf_elements(self, content: SourceContent, structure: DocumentStructure, context: ParsingContext):
        """Extract PDF elements preserving tables, images, and formatting."""

        import fitz  # PyMuPDF

        doc = fitz.open(content.file_path)
        elements = []

        for page_num in range(doc.page_count):
            page = doc[page_num]
            page_elements = []

            # Extract text blocks with formatting
            blocks = page.get_text("dict")

            for block_idx, block in enumerate(blocks["blocks"]):
                if "lines" in block:  # Text block
                    text_element = self._process_text_block(block, page_num, block_idx, context)
                    if text_element:
                        elements.append(text_element)

                elif "image" in block:  # Image block
                    image_element = self._process_image_block(block, page_num, block_idx, context)
                    elements.append(image_element)

            # Extract tables separately for better structure
            tables = page.find_tables()
            for table_idx, table in enumerate(tables):
                table_element = self._process_table_block(table, page_num, table_idx, context)
                elements.append(table_element)

            context.log_debug(f"Page {page_num + 1}: {len(page_elements)} elements extracted")

        return elements

    def _process_text_block(self, block, page_num, block_idx, context):
        """Process text block preserving formatting."""

        text_content = ""
        formatting_info = []

        for line in block["lines"]:
            line_text = ""
            for span in line["spans"]:
                span_text = span["text"]
                line_text += span_text

                # Capture formatting
                formatting_info.append({
                    "text": span_text,
                    "font": span["font"],
                    "size": span["size"],
                    "flags": span["flags"],  # bold, italic, etc.
                    "color": span["color"]
                })

            text_content += line_text + "\n"

        # Determine element type based on formatting
        element_type = self._classify_text_element(formatting_info, text_content)

        return DocumentElement(
            type=element_type,
            content=text_content.strip(),
            page=page_num + 1,
            bbox=block["bbox"],
            formatting=formatting_info,
            metadata={
                "block_index": block_idx,
                "confidence": self._calculate_classification_confidence(formatting_info)
            }
        )

    def _process_table_block(self, table, page_num, table_idx, context):
        """Process table preserving structure and data relationships."""

        # Extract table data
        table_data = table.extract()

        # Convert to structured format
        structured_table = {
            "headers": table_data[0] if table_data else [],
            "rows": table_data[1:] if len(table_data) > 1 else [],
            "column_count": len(table_data[0]) if table_data else 0,
            "row_count": len(table_data) - 1 if table_data else 0
        }

        # Generate markdown representation
        markdown_table = self._table_to_markdown(table_data)

        # Generate natural language description for AI
        table_description = self._generate_table_description(structured_table)

        return DocumentElement(
            type="table",
            content=markdown_table,
            page=page_num + 1,
            bbox=table.bbox,
            structured_data=structured_table,
            ai_description=table_description,
            metadata={
                "table_index": table_idx,
                "data_types": self._infer_column_types(structured_table)
            }
        )

    async def _reconstruct_with_markup(self, elements: List[DocumentElement], context: ParsingContext):
        """Reconstruct document with semantic markup preservation."""

        context.log_step("content_reconstruction", "Reconstructing content with markup")

        reconstructed_content = ""
        current_section = None

        for element in elements:
            if element.type == "heading":
                # Add heading with proper markdown level
                level = self._determine_heading_level(element)
                reconstructed_content += f"\n{'#' * level} {element.content}\n\n"
                current_section = element.content

            elif element.type == "paragraph":
                # Add paragraph with context
                reconstructed_content += f"{element.content}\n\n"

            elif element.type == "table":
                # Add table with description
                reconstructed_content += f"### Table: {element.ai_description}\n\n"
                reconstructed_content += f"{element.content}\n\n"

            elif element.type == "image":
                # Add image placeholder with description
                reconstructed_content += f"![{element.ai_description}](image_{element.metadata['image_index']})\n\n"

            elif element.type == "list":
                # Add list items
                reconstructed_content += f"{element.content}\n\n"

            elif element.type == "code":
                # Add code block
                language = element.metadata.get("language", "")
                reconstructed_content += f"```{language}\n{element.content}\n```\n\n"

        context.log_step_result("content_reconstruction", {
            "total_length": len(reconstructed_content),
            "sections_identified": len([e for e in elements if e.type == "heading"]),
            "markup_elements": len([e for e in elements if e.type in ["table", "image", "code"]])
        })

        return reconstructed_content
```

## ⚡ Step 2: Intelligent Chunking Engine

### **Configurable Chunking Strategies**

```python
# File: services/chunking/intelligent_chunker.py
class IntelligentChunkingEngine:
    """Advanced chunking with structure awareness and debugging."""

    def __init__(self):
        self.strategies = {
            'recursive': RecursiveChunker(),
            'semantic': SemanticChunker(),
            'by_heading': HeadingBasedChunker(),
            'by_page': PageBasedChunker(),
            'smart': SmartAdaptiveChunker()
        }

    async def chunk_document(self, parsed_doc: ParsedDocument, config: ChunkingConfig) -> ChunkedDocument:
        """Chunk document using specified strategy with full debugging."""

        # Create chunking context
        chunking_context = ChunkingContext(
            document_id=parsed_doc.id,
            strategy=config.strategy,
            config=config
        )

        try:
            # Step 1: Select optimal chunking strategy
            strategy = await self._select_strategy(parsed_doc, config, chunking_context)

            # Step 2: Pre-process for chunking
            preprocessed_doc = await self._preprocess_for_chunking(parsed_doc, config, chunking_context)

            # Step 3: Execute chunking strategy
            chunks = await strategy.chunk(preprocessed_doc, config, chunking_context)

            # Step 4: Post-process chunks
            processed_chunks = await self._postprocess_chunks(chunks, config, chunking_context)

            # Step 5: Quality assessment
            quality_metrics = await self._assess_chunk_quality(processed_chunks, chunking_context)

            return ChunkedDocument(
                chunks=processed_chunks,
                metadata=self._generate_chunking_metadata(chunking_context),
                quality_metrics=quality_metrics,
                debug_info=chunking_context.debug_data
            )

        except Exception as e:
            chunking_context.add_error(f"Chunking failed: {str(e)}")
            raise ChunkingException(str(e), chunking_context.debug_data)

    async def _select_strategy(self, parsed_doc: ParsedDocument, config: ChunkingConfig, context: ChunkingContext):
        """Intelligently select chunking strategy based on document characteristics."""

        context.log_step("strategy_selection", "Selecting optimal chunking strategy")

        if config.strategy == "smart":
            # Analyze document to select best strategy
            doc_characteristics = self._analyze_document_characteristics(parsed_doc)

            if doc_characteristics["has_clear_headings"] and doc_characteristics["heading_ratio"] > 0.1:
                selected_strategy = "by_heading"
            elif doc_characteristics["has_pages"] and doc_characteristics["uniform_page_size"]:
                selected_strategy = "by_page"
            elif doc_characteristics["semantic_coherence"] > 0.8:
                selected_strategy = "semantic"
            else:
                selected_strategy = "recursive"

            context.log_debug(f"Auto-selected strategy: {selected_strategy} based on characteristics: {doc_characteristics}")
        else:
            selected_strategy = config.strategy

        context.log_step_result("strategy_selection", {"selected_strategy": selected_strategy})

        return self.strategies[selected_strategy]

class SmartAdaptiveChunker:
    """Adaptive chunking that adjusts based on content structure."""

    async def chunk(self, parsed_doc: ParsedDocument, config: ChunkingConfig, context: ChunkingContext):
        """Chunk using adaptive strategy."""

        context.log_step("adaptive_chunking", "Performing adaptive chunking")

        chunks = []
        current_chunk = ""
        current_metadata = {}

        for element in parsed_doc.elements:
            if element.type == "heading":
                # Start new chunk at major headings
                if current_chunk.strip():
                    chunk = self._create_chunk(current_chunk, current_metadata, len(chunks), context)
                    chunks.append(chunk)
                    current_chunk = ""

                current_chunk += f"{element.content}\n\n"
                current_metadata = {"section": element.content, "page": element.page}

            elif element.type == "table":
                # Tables get their own chunks for better retrieval
                if current_chunk.strip():
                    chunk = self._create_chunk(current_chunk, current_metadata, len(chunks), context)
                    chunks.append(chunk)

                table_chunk = self._create_chunk(
                    element.content,
                    {**current_metadata, "type": "table", "description": element.ai_description},
                    len(chunks),
                    context
                )
                chunks.append(table_chunk)
                current_chunk = ""

            elif element.type == "paragraph":
                # Add paragraph, chunk if size exceeded
                potential_chunk = current_chunk + element.content + "\n\n"

                if len(potential_chunk) > config.chunk_size:
                    # Save current chunk
                    if current_chunk.strip():
                        chunk = self._create_chunk(current_chunk, current_metadata, len(chunks), context)
                        chunks.append(chunk)

                    # Start new chunk with overlap
                    overlap_text = self._extract_overlap(current_chunk, config.chunk_overlap)
                    current_chunk = overlap_text + element.content + "\n\n"
                else:
                    current_chunk = potential_chunk

        # Save final chunk
        if current_chunk.strip():
            chunk = self._create_chunk(current_chunk, current_metadata, len(chunks), context)
            chunks.append(chunk)

        context.log_step_result("adaptive_chunking", {
            "total_chunks": len(chunks),
            "avg_chunk_size": sum(len(c.content) for c in chunks) / len(chunks) if chunks else 0,
            "table_chunks": len([c for c in chunks if c.metadata.get("type") == "table"])
        })

        return chunks
```

## 🧠 Step 3: Embedding Generation Engine

### **Multi-Provider Embedding System**

```python
# File: services/embedding/embedding_engine.py
class EmbeddingEngine:
    """Multi-provider embedding generation with optimization."""

    def __init__(self):
        self.providers = {
            'openai': OpenAIEmbeddingProvider(),
            'cohere': CohereEmbeddingProvider(),
            'sentence_transformers': SentenceTransformersProvider(),
            'secret_ai': SecretAIProvider()  # Self-hosted option
        }

    async def generate_embeddings(self, chunked_doc: ChunkedDocument, config: EmbeddingConfig) -> EmbeddedDocument:
        """Generate embeddings with batching and optimization."""

        # Create embedding context
        embedding_context = EmbeddingContext(
            document_id=chunked_doc.id,
            provider=config.provider,
            model=config.model,
            config=config
        )

        try:
            # Step 1: Prepare chunks for embedding
            prepared_chunks = await self._prepare_chunks_for_embedding(chunked_doc, config, embedding_context)

            # Step 2: Generate embeddings in batches
            embedded_chunks = await self._generate_embeddings_batch(prepared_chunks, config, embedding_context)

            # Step 3: Optimize embeddings
            optimized_embeddings = await self._optimize_embeddings(embedded_chunks, config, embedding_context)

            # Step 4: Validate embedding quality
            quality_metrics = await self._validate_embedding_quality(optimized_embeddings, embedding_context)

            return EmbeddedDocument(
                chunks=optimized_embeddings,
                embedding_metadata=self._generate_embedding_metadata(embedding_context),
                quality_metrics=quality_metrics,
                debug_info=embedding_context.debug_data
            )

        except Exception as e:
            embedding_context.add_error(f"Embedding generation failed: {str(e)}")
            raise EmbeddingException(str(e), embedding_context.debug_data)

    async def _prepare_chunks_for_embedding(self, chunked_doc: ChunkedDocument, config: EmbeddingConfig, context: EmbeddingContext):
        """Prepare chunks for optimal embedding generation."""

        context.log_step("chunk_preparation", "Preparing chunks for embedding")

        prepared_chunks = []

        for chunk in chunked_doc.chunks:
            # Add contextual prefix for better embeddings
            contextual_content = self._add_contextual_prefix(chunk, config)

            # Clean and normalize content
            cleaned_content = self._clean_content_for_embedding(contextual_content)

            # Validate content length
            if len(cleaned_content) > config.max_tokens * 4:  # Rough token estimate
                # Split oversized chunks
                sub_chunks = self._split_oversized_chunk(cleaned_content, config)
                for i, sub_chunk in enumerate(sub_chunks):
                    prepared_chunks.append(PreparedChunk(
                        content=sub_chunk,
                        original_chunk_id=chunk.id,
                        sub_chunk_index=i,
                        metadata=chunk.metadata
                    ))
            else:
                prepared_chunks.append(PreparedChunk(
                    content=cleaned_content,
                    original_chunk_id=chunk.id,
                    metadata=chunk.metadata
                ))

        context.log_step_result("chunk_preparation", {
            "original_chunks": len(chunked_doc.chunks),
            "prepared_chunks": len(prepared_chunks),
            "avg_content_length": sum(len(c.content) for c in prepared_chunks) / len(prepared_chunks)
        })

        return prepared_chunks

    async def _generate_embeddings_batch(self, prepared_chunks: List[PreparedChunk], config: EmbeddingConfig, context: EmbeddingContext):
        """Generate embeddings using optimal batching strategy."""

        context.log_step("embedding_generation", "Generating embeddings in batches")

        provider = self.providers[config.provider]
        batch_size = provider.optimal_batch_size
        embedded_chunks = []

        # Split into batches
        batches = [prepared_chunks[i:i + batch_size] for i in range(0, len(prepared_chunks), batch_size)]

        for batch_idx, batch in enumerate(batches):
            context.log_debug(f"Processing batch {batch_idx + 1}/{len(batches)} ({len(batch)} chunks)")

            try:
                # Generate embeddings for batch
                batch_texts = [chunk.content for chunk in batch]
                batch_embeddings = await provider.generate_embeddings(
                    texts=batch_texts,
                    model=config.model,
                    normalize=config.normalize_embeddings
                )

                # Create embedded chunks
                for chunk, embedding in zip(batch, batch_embeddings):
                    embedded_chunks.append(EmbeddedChunk(
                        chunk_id=chunk.original_chunk_id,
                        content=chunk.content,
                        embedding=embedding,
                        metadata=chunk.metadata,
                        embedding_metadata={
                            "provider": config.provider,
                            "model": config.model,
                            "dimensions": len(embedding),
                            "generated_at": datetime.utcnow().isoformat()
                        }
                    ))

            except Exception as e:
                context.add_error(f"Batch {batch_idx} failed: {str(e)}")
                # Continue with next batch
                continue

        context.log_step_result("embedding_generation", {
            "total_embeddings": len(embedded_chunks),
            "successful_batches": len([b for b in batches if b]),
            "embedding_dimensions": len(embedded_chunks[0].embedding) if embedded_chunks else 0
        })

        return embedded_chunks
```

## 🗄️ Step 4: Vector Indexing Engine

### **Multi-Provider Vector Storage**

```python
# File: services/vector/vector_indexing_engine.py
class VectorIndexingEngine:
    """Multi-provider vector storage with optimization."""

    def __init__(self):
        self.providers = {
            'qdrant': QdrantVectorStore(),
            'faiss': FAISSVectorStore(),
            'weaviate': WeaviateVectorStore(),
            'pinecone': PineconeVectorStore()
        }

    async def index_embeddings(self, embedded_doc: EmbeddedDocument, kb_config: KBConfig) -> IndexedDocument:
        """Index embeddings in vector store with optimization."""

        # Create indexing context
        indexing_context = IndexingContext(
            document_id=embedded_doc.id,
            kb_id=kb_config.kb_id,
            vector_store=kb_config.vector_store_config,
            config=kb_config
        )

        try:
            # Step 1: Initialize vector store collection
            collection_info = await self._ensure_vector_collection(kb_config, indexing_context)

            # Step 2: Prepare vectors for indexing
            prepared_vectors = await self._prepare_vectors_for_indexing(embedded_doc, kb_config, indexing_context)

            # Step 3: Index vectors in batches
            indexed_vectors = await self._index_vectors_batch(prepared_vectors, kb_config, indexing_context)

            # Step 4: Update metadata indexes
            await self._update_metadata_indexes(indexed_vectors, kb_config, indexing_context)

            # Step 5: Validate indexing
            validation_result = await self._validate_indexing(indexed_vectors, kb_config, indexing_context)

            return IndexedDocument(
                document_id=embedded_doc.id,
                indexed_chunks=len(indexed_vectors),
                collection_id=collection_info["collection_id"],
                indexing_metadata=self._generate_indexing_metadata(indexing_context),
                validation_result=validation_result,
                debug_info=indexing_context.debug_data
            )

        except Exception as e:
            indexing_context.add_error(f"Vector indexing failed: {str(e)}")
            raise IndexingException(str(e), indexing_context.debug_data)

    async def _prepare_vectors_for_indexing(self, embedded_doc: EmbeddedDocument, kb_config: KBConfig, context: IndexingContext):
        """Prepare vectors with metadata for indexing."""

        context.log_step("vector_preparation", "Preparing vectors for indexing")

        prepared_vectors = []

        for chunk in embedded_doc.chunks:
            vector_data = {
                "id": str(chunk.chunk_id),
                "vector": chunk.embedding,
                "metadata": {
                    # Core metadata
                    "document_id": str(embedded_doc.id),
                    "kb_id": str(kb_config.kb_id),
                    "workspace_id": str(kb_config.workspace_id),
                    "chunk_index": chunk.metadata.get("position", 0),

                    # Content metadata
                    "content": chunk.content[:1000],  # Truncated for storage
                    "content_hash": hashlib.md5(chunk.content.encode()).hexdigest(),
                    "word_count": len(chunk.content.split()),
                    "character_count": len(chunk.content),

                    # Source metadata
                    "source_type": chunk.metadata.get("source_type"),
                    "page_number": chunk.metadata.get("page"),
                    "section": chunk.metadata.get("section"),

                    # Processing metadata
                    "chunking_strategy": kb_config.chunking_config.strategy,
                    "embedding_model": chunk.embedding_metadata["model"],
                    "indexed_at": datetime.utcnow().isoformat(),

                    # Custom metadata from annotations
                    **chunk.metadata.get("custom_metadata", {})
                }
            }

            prepared_vectors.append(vector_data)

        context.log_step_result("vector_preparation", {
            "vectors_prepared": len(prepared_vectors),
            "avg_metadata_size": sum(len(str(v["metadata"])) for v in prepared_vectors) / len(prepared_vectors)
        })

        return prepared_vectors
```

## 📊 Pipeline Debugging & Monitoring

### **Real-Time Pipeline Monitoring**

```python
# File: services/pipeline/pipeline_monitor.py
class PipelineMonitor:
    """Real-time pipeline monitoring and debugging."""

    def __init__(self):
        self.redis_client = redis.Redis()
        self.websocket_manager = WebSocketManager()

    async def track_pipeline_execution(self, pipeline_id: str, steps: List[PipelineStep]):
        """Track pipeline execution with real-time updates."""

        pipeline_state = PipelineState(
            pipeline_id=pipeline_id,
            steps=steps,
            status="running",
            started_at=datetime.utcnow()
        )

        # Store initial state
        await self._store_pipeline_state(pipeline_state)

        # Send initial update to frontend
        await self._broadcast_pipeline_update(pipeline_state)

        for step in steps:
            try:
                # Update step status
                step.status = "running"
                await self._update_step_status(pipeline_id, step)

                # Execute step with monitoring
                result = await self._execute_step_with_monitoring(step, pipeline_state)

                # Update step with results
                step.status = "completed"
                step.result = result
                step.completed_at = datetime.utcnow()

            except Exception as e:
                step.status = "failed"
                step.error = str(e)
                step.failed_at = datetime.utcnow()

                # Handle step failure
                await self._handle_step_failure(pipeline_id, step, e)

            # Update pipeline state
            await self._store_pipeline_state(pipeline_state)
            await self._broadcast_pipeline_update(pipeline_state)

        # Complete pipeline
        pipeline_state.status = "completed" if all(s.status == "completed" for s in steps) else "failed"
        pipeline_state.completed_at = datetime.utcnow()

        await self._store_pipeline_state(pipeline_state)
        await self._broadcast_pipeline_update(pipeline_state)

    async def _execute_step_with_monitoring(self, step: PipelineStep, pipeline_state: PipelineState):
        """Execute pipeline step with detailed monitoring."""

        step_monitor = StepMonitor(step.name, pipeline_state.pipeline_id)

        # Monitor resource usage
        step_monitor.start_resource_monitoring()

        try:
            # Execute step
            result = await step.execute()

            # Collect execution metrics
            execution_metrics = step_monitor.get_execution_metrics()

            # Store debug information
            debug_info = {
                "execution_time": execution_metrics["duration"],
                "memory_usage": execution_metrics["peak_memory"],
                "cpu_usage": execution_metrics["avg_cpu"],
                "input_size": execution_metrics["input_size"],
                "output_size": execution_metrics["output_size"],
                "warnings": step_monitor.get_warnings(),
                "performance_score": step_monitor.calculate_performance_score()
            }

            # Store step debug info
            await self._store_step_debug_info(pipeline_state.pipeline_id, step.name, debug_info)

            return result

        finally:
            step_monitor.stop_resource_monitoring()

    async def get_pipeline_debug_info(self, pipeline_id: str) -> dict:
        """Get comprehensive debug information for pipeline."""

        pipeline_state = await self._get_pipeline_state(pipeline_id)

        debug_info = {
            "pipeline_overview": {
                "pipeline_id": pipeline_id,
                "status": pipeline_state.status,
                "total_steps": len(pipeline_state.steps),
                "completed_steps": len([s for s in pipeline_state.steps if s.status == "completed"]),
                "failed_steps": len([s for s in pipeline_state.steps if s.status == "failed"]),
                "total_duration": (pipeline_state.completed_at - pipeline_state.started_at).total_seconds() if pipeline_state.completed_at else None
            },
            "step_details": [],
            "performance_metrics": await self._get_pipeline_performance_metrics(pipeline_id),
            "error_analysis": await self._get_pipeline_error_analysis(pipeline_id)
        }

        for step in pipeline_state.steps:
            step_debug = await self._get_step_debug_info(pipeline_id, step.name)

            debug_info["step_details"].append({
                "step_name": step.name,
                "status": step.status,
                "duration": step_debug.get("execution_time"),
                "input_preview": str(step.input_data)[:200] if hasattr(step, 'input_data') else None,
                "output_preview": str(step.result)[:200] if step.result else None,
                "errors": [step.error] if step.error else [],
                "warnings": step_debug.get("warnings", []),
                "performance_score": step_debug.get("performance_score"),
                "resource_usage": {
                    "memory": step_debug.get("memory_usage"),
                    "cpu": step_debug.get("cpu_usage")
                }
            })

        return debug_info
```

## 🔒 Compliance Integration

### **Native HIPAA/SOC2 in Pipeline**

```python
# File: services/pipeline/compliance_integration.py
class CompliancePipelineWrapper:
    """HIPAA/SOC2 compliant pipeline execution."""

    def __init__(self):
        self.audit_logger = ComplianceAuditLogger()
        self.encryption_service = HIAAEncryptionService()
        self.access_controller = SOC2AccessController()

    async def execute_compliant_pipeline(self, pipeline_config: dict, user_context: dict):
        """Execute pipeline with full compliance monitoring."""

        # Step 1: Validate access permissions
        await self._validate_compliance_access(user_context, pipeline_config)

        # Step 2: Initialize audit trail
        audit_context = await self._initialize_audit_trail(pipeline_config, user_context)

        # Step 3: Execute pipeline with encryption
        result = await self._execute_with_encryption(pipeline_config, audit_context)

        # Step 4: Finalize audit trail
        await self._finalize_audit_trail(audit_context, result)

        return result

    async def _validate_compliance_access(self, user_context: dict, pipeline_config: dict):
        """Validate user access for compliance."""

        # Check RBAC permissions
        required_permissions = self._determine_required_permissions(pipeline_config)

        for permission in required_permissions:
            if not await self.access_controller.has_permission(user_context["user_id"], permission):
                audit_entry = {
                    "event": "access_denied",
                    "user_id": user_context["user_id"],
                    "resource": pipeline_config["resource_id"],
                    "permission": permission,
                    "timestamp": datetime.utcnow().isoformat()
                }
                await self.audit_logger.log_security_event(audit_entry)
                raise ComplianceException(f"Access denied for permission: {permission}")

    async def _execute_with_encryption(self, pipeline_config: dict, audit_context: dict):
        """Execute pipeline with data encryption at each step."""

        encrypted_data = None

        for step_config in pipeline_config["steps"]:
            # Encrypt data before processing
            if encrypted_data is None:
                encrypted_data = await self.encryption_service.encrypt_data(
                    pipeline_config["input_data"]
                )

            # Log step execution
            await self.audit_logger.log_processing_step({
                "step": step_config["name"],
                "data_hash": self._calculate_data_hash(encrypted_data),
                "audit_context": audit_context,
                "timestamp": datetime.utcnow().isoformat()
            })

            # Execute step on encrypted data
            encrypted_result = await self._execute_encrypted_step(step_config, encrypted_data)
            encrypted_data = encrypted_result

        # Decrypt final result
        final_result = await self.encryption_service.decrypt_data(encrypted_data)

        return final_result
```

---

**Next**: Continue with [Configuration Management Module](03_CONFIGURATION_MANAGEMENT.md) to understand per-source settings and annotations.