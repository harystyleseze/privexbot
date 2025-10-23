# Source Management Module

**Purpose**: Unified ingestion of documents from multiple sources with consistent processing
**Scope**: Web scraping, file uploads, cloud services, text input, and source combination
**Integration**: Works with [Processing Pipeline](02_PROCESSING_PIPELINE.md) and [Configuration Management](03_CONFIGURATION_MANAGEMENT.md)

---

## 🎯 Module Overview

The Source Management Module provides a **unified abstraction layer** for ingesting content from any source while preserving source-specific capabilities and metadata. All sources flow through the same processing pipeline but maintain their unique characteristics.

## 🏗️ Architecture Pattern

### **Universal Source Adapter Interface**

```
┌─────────────────────────────────────────────────────────────┐
│                  SOURCE ABSTRACTION LAYER                   │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │    Web      │    │    File     │    │   Cloud     │    │
│  │  Adapter    │    │  Adapter    │    │  Adapter    │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│          │                   │                   │         │
│          └───────────────────┼───────────────────┘         │
│                              │                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           COMMON SOURCE INTERFACE                   │  │
│  │  • extract_content()                               │  │
│  │  • get_metadata()                                  │  │
│  │  • validate_source()                              │  │
│  │  • track_changes()                                 │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DRAFT STORAGE (REDIS)                    │
│  All sources → Normalized format → Draft storage            │
└─────────────────────────────────────────────────────────────┘
```

## 📥 Source Types Implementation

### 1. **Web Sources** - Advanced Web Content Extraction

#### **Capabilities Supported**
- **Scrape**: Single URL → LLM-ready content (markdown, structured data, screenshots)
- **Crawl**: Website → All pages with content extraction
- **Map**: Website → URL discovery (extremely fast sitemap generation)
- **Search**: Web search → Full content from results
- **Extract**: Structured data extraction with AI

#### **Implementation Pattern**

```python
# File: services/web_source_service.py
class WebSourceAdapter(SourceAdapter):
    """Web content extraction with multiple strategies."""

    def __init__(self):
        self.crawl4ai = Crawl4AIAdapter()
        self.firecrawl = FirecrawlAdapter()
        self.jina = JinaAdapter()

    async def extract_content(self, source_config: dict) -> SourceContent:
        """Extract web content based on operation type."""

        operation = source_config["operation"]  # scrape|crawl|map|search|extract

        if operation == "scrape":
            return await self._scrape_single_url(source_config)
        elif operation == "crawl":
            return await self._crawl_website(source_config)
        elif operation == "map":
            return await self._map_website(source_config)
        elif operation == "search":
            return await self._search_web(source_config)
        elif operation == "extract":
            return await self._extract_structured(source_config)

    async def _scrape_single_url(self, config: dict) -> SourceContent:
        """Scrape single URL with format options."""

        url = config["url"]
        output_format = config.get("format", "markdown")  # markdown|json|html

        # Use Crawl4AI for comprehensive extraction
        result = await self.crawl4ai.scrape_url(
            url=url,
            output_format=output_format,
            include_images=config.get("include_images", False),
            include_tables=config.get("include_tables", True),
            css_selector=config.get("css_selector"),
            exclude_selectors=config.get("exclude_selectors", [])
        )

        return SourceContent(
            content=result.content,
            title=result.title,
            metadata={
                "url": url,
                "scraped_at": datetime.utcnow().isoformat(),
                "word_count": result.word_count,
                "images_found": len(result.images),
                "tables_found": len(result.tables),
                "links_found": len(result.links),
                "format": output_format
            },
            source_type="web_scrape"
        )

    async def _crawl_website(self, config: dict) -> SourceContent:
        """Crawl entire website with depth control."""

        base_url = config["url"]
        max_depth = config.get("max_depth", 3)
        max_pages = config.get("max_pages", 100)

        # Get sitemap or discover URLs
        urls = await self.crawl4ai.discover_urls(
            base_url=base_url,
            max_depth=max_depth,
            respect_robots=config.get("respect_robots", True),
            include_patterns=config.get("include_patterns", []),
            exclude_patterns=config.get("exclude_patterns", [])
        )

        # Limit URLs if needed
        if len(urls) > max_pages:
            urls = urls[:max_pages]

        # Scrape all URLs concurrently
        scrape_tasks = [
            self.crawl4ai.scrape_url(url) for url in urls
        ]
        results = await asyncio.gather(*scrape_tasks, return_exceptions=True)

        # Combine all content
        combined_content = ""
        all_metadata = []

        for url, result in zip(urls, results):
            if isinstance(result, Exception):
                continue  # Skip failed pages

            combined_content += f"\n\n# {result.title}\nSource: {url}\n\n{result.content}"
            all_metadata.append({
                "url": url,
                "title": result.title,
                "word_count": result.word_count
            })

        return SourceContent(
            content=combined_content,
            title=f"Website Crawl: {base_url}",
            metadata={
                "base_url": base_url,
                "pages_crawled": len(all_metadata),
                "total_words": sum(m["word_count"] for m in all_metadata),
                "crawl_depth": max_depth,
                "pages_metadata": all_metadata
            },
            source_type="web_crawl"
        )
```

#### **User Experience Flow**

```
1. User selects "Web Source" → Shows operation types
2. User chooses "Scrape URL" → Shows URL input + options
3. User configures:
   - Output format (markdown/JSON/HTML)
   - Include images/tables
   - CSS selectors for specific content
   - Exclude patterns
4. Real-time preview shows extracted content
5. User can adjust settings and re-preview
6. Content added to draft with full metadata
```

### 2. **File Upload Sources** - Comprehensive File Format Support

#### **Supported File Types**

| Category | Formats | Parser Used |
|----------|---------|-------------|
| **Documents** | PDF, DOC, DOCX, ODT, RTF | Unstructured.io + PyMuPDF |
| **Spreadsheets** | XLS, XLSX, CSV, TSV | pandas + openpyxl |
| **Presentations** | PPT, PPTX | python-pptx + Unstructured.io |
| **Web/Markup** | HTML, XML, MD, RST | BeautifulSoup + python-markdown |
| **Text** | TXT, ORG | Direct reading with encoding detection |
| **Email** | EML, MSG, P7S | email package + Unstructured.io |
| **Images** | PNG, JPG, TIFF, BMP, HEIC | OCR with Tesseract + structure detection |
| **Ebooks** | EPUB | ebooklib + text extraction |

#### **Smart File Processing Implementation**

```python
# File: services/file_source_service.py
class FileSourceAdapter(SourceAdapter):
    """Smart file processing with structure preservation."""

    def __init__(self):
        self.unstructured = UnstructuredAdapter()
        self.parsers = {
            'pdf': [self._parse_pdf_pymupdf, self._parse_pdf_unstructured],
            'docx': [self._parse_docx_python_docx, self._parse_docx_unstructured],
            'xlsx': [self._parse_excel_pandas, self._parse_excel_openpyxl],
            'image': [self._parse_image_ocr, self._parse_image_structured]
        }

    async def extract_content(self, source_config: dict) -> SourceContent:
        """Extract content with intelligent parser selection."""

        file_path = source_config["file_path"]
        original_filename = source_config["filename"]

        # Detect file type and select optimal parser
        file_extension = Path(original_filename).suffix.lower()
        file_type = self._detect_file_type(file_extension)

        # Try parsers in order of preference
        for parser in self.parsers.get(file_type, [self._parse_generic]):
            try:
                result = await parser(file_path, source_config)
                if result.content:  # Successfully extracted content
                    break
            except Exception as e:
                logging.warning(f"Parser {parser.__name__} failed: {e}")
                continue
        else:
            raise ValueError(f"All parsers failed for {original_filename}")

        # Enhance with file metadata
        file_stats = os.stat(file_path)
        result.metadata.update({
            "original_filename": original_filename,
            "file_size": file_stats.st_size,
            "file_type": file_type,
            "parser_used": parser.__name__,
            "uploaded_at": datetime.utcnow().isoformat()
        })

        return result

    async def _parse_pdf_pymupdf(self, file_path: str, config: dict) -> SourceContent:
        """Parse PDF preserving tables, images, and structure."""

        import fitz  # PyMuPDF

        doc = fitz.open(file_path)
        structured_content = []
        all_text = ""
        tables = []
        images = []

        for page_num in range(doc.page_count):
            page = doc[page_num]

            # Extract structured content blocks
            blocks = page.get_text("dict")

            for block in blocks["blocks"]:
                if "lines" in block:  # Text block
                    block_text = ""
                    for line in block["lines"]:
                        for span in line["spans"]:
                            block_text += span["text"]

                    if block_text.strip():
                        structured_content.append({
                            "type": "text",
                            "content": block_text,
                            "page": page_num + 1,
                            "bbox": block["bbox"]
                        })
                        all_text += block_text + "\n"

                elif "image" in block:  # Image block
                    images.append({
                        "type": "image",
                        "page": page_num + 1,
                        "bbox": block["bbox"],
                        "description": "[Image/Chart/Diagram]"
                    })
                    all_text += "[Image/Chart/Diagram]\n"

            # Extract tables separately
            page_tables = page.find_tables()
            for table in page_tables:
                table_data = table.extract()
                tables.append({
                    "page": page_num + 1,
                    "data": table_data,
                    "bbox": table.bbox
                })

                # Convert table to markdown
                markdown_table = self._table_to_markdown(table_data)
                all_text += f"\n{markdown_table}\n"

        return SourceContent(
            content=all_text,
            title=config.get("title", "PDF Document"),
            metadata={
                "page_count": doc.page_count,
                "tables_found": len(tables),
                "images_found": len(images),
                "structured_blocks": len(structured_content),
                "tables": tables,
                "images": images
            },
            source_type="file_upload"
        )
```

### 3. **Cloud Service Sources** - Real-time Sync Integration

#### **Supported Cloud Services**
- **Google Workspace**: Docs, Sheets, Slides, Drive folders
- **Notion**: Pages, databases, entire workspaces
- **Microsoft 365**: Word Online, Excel Online, PowerPoint Online
- **Dropbox**: File sync and sharing
- **Box**: Enterprise file management

#### **Cloud Integration Pattern**

```python
# File: services/cloud_source_service.py
class CloudSourceAdapter(SourceAdapter):
    """Unified cloud service integration."""

    def __init__(self):
        self.integrations = {
            'google_docs': GoogleDocsAdapter(),
            'google_sheets': GoogleSheetsAdapter(),
            'notion': NotionAdapter(),
            'dropbox': DropboxAdapter()
        }

    async def extract_content(self, source_config: dict) -> SourceContent:
        """Extract content from cloud service."""

        service_type = source_config["service_type"]
        credential_id = source_config["credential_id"]

        adapter = self.integrations[service_type]

        # Get fresh credentials
        credentials = await self._get_credentials(credential_id)

        # Extract content based on service type
        if service_type == "google_docs":
            return await self._extract_google_doc(adapter, credentials, source_config)
        elif service_type == "notion":
            return await self._extract_notion_content(adapter, credentials, source_config)

    async def _extract_google_doc(self, adapter, credentials, config):
        """Extract Google Doc with formatting preservation."""

        doc_id = config["document_id"]

        # Get document content and structure
        doc_data = await adapter.get_document_content(
            credentials=credentials,
            document_id=doc_id,
            include_formatting=True,
            include_comments=config.get("include_comments", False)
        )

        # Convert to markdown while preserving structure
        markdown_content = self._convert_gdoc_to_markdown(doc_data)

        return SourceContent(
            content=markdown_content,
            title=doc_data["title"],
            metadata={
                "document_id": doc_id,
                "last_modified": doc_data["modified_time"],
                "authors": doc_data["authors"],
                "word_count": doc_data["word_count"],
                "comments_count": len(doc_data.get("comments", [])),
                "service": "google_docs"
            },
            source_type="cloud_service"
        )

    async def setup_auto_sync(self, source_id: str, sync_config: dict):
        """Setup automatic syncing for cloud sources."""

        # Store sync configuration
        sync_job = {
            "source_id": source_id,
            "frequency": sync_config["frequency"],  # hourly/daily/weekly
            "last_sync": None,
            "enabled": True
        }

        # Schedule background sync task
        await self._schedule_sync_task(sync_job)
```

### 4. **Text Input Sources** - Rich Text Processing

#### **Text Input Capabilities**
- **Direct paste**: Rich text with formatting preservation
- **Markdown input**: Native markdown processing
- **Structured text**: Tables, lists, code blocks
- **Multi-language**: UTF-8 with language detection

#### **Implementation**

```python
# File: services/text_source_service.py
class TextSourceAdapter(SourceAdapter):
    """Direct text input with rich formatting support."""

    async def extract_content(self, source_config: dict) -> SourceContent:
        """Process direct text input."""

        raw_text = source_config["text"]
        input_format = source_config.get("format", "plain")  # plain|markdown|html

        # Detect language
        language = self._detect_language(raw_text)

        # Process based on format
        if input_format == "markdown":
            processed_content = self._process_markdown(raw_text)
        elif input_format == "html":
            processed_content = self._process_html(raw_text)
        else:
            processed_content = self._process_plain_text(raw_text)

        return SourceContent(
            content=processed_content,
            title=source_config.get("title", "Text Input"),
            metadata={
                "input_format": input_format,
                "language": language,
                "character_count": len(raw_text),
                "word_count": len(raw_text.split()),
                "input_at": datetime.utcnow().isoformat()
            },
            source_type="text_input"
        )
```

## 🔄 Source Combination Engine

### **Multi-Source KB Creation**

```python
# File: services/source_combination_service.py
class SourceCombinationService:
    """Combine multiple sources into unified KB."""

    async def combine_sources(self, draft_id: str, combination_config: dict):
        """Combine multiple sources with deduplication."""

        sources = combination_config["sources"]
        dedup_strategy = combination_config.get("deduplication", "content_hash")

        combined_content = []
        source_metadata = []

        for source_config in sources:
            # Extract content from each source
            adapter = self._get_adapter(source_config["type"])
            content = await adapter.extract_content(source_config)

            # Apply deduplication
            if not self._is_duplicate(content, combined_content, dedup_strategy):
                combined_content.append(content)
                source_metadata.append({
                    "source_type": source_config["type"],
                    "source_id": source_config["id"],
                    "content_length": len(content.content),
                    "added_at": datetime.utcnow().isoformat()
                })

        # Store combined sources in draft
        await self._store_combined_draft(draft_id, combined_content, source_metadata)

    def _is_duplicate(self, content, existing_content, strategy):
        """Check for duplicate content using specified strategy."""

        if strategy == "content_hash":
            content_hash = hashlib.md5(content.content.encode()).hexdigest()
            existing_hashes = [
                hashlib.md5(c.content.encode()).hexdigest()
                for c in existing_content
            ]
            return content_hash in existing_hashes

        elif strategy == "semantic_similarity":
            # Use embedding similarity for semantic deduplication
            return await self._check_semantic_similarity(content, existing_content)

        return False
```

## 🎛️ Source Configuration Management

### **Per-Source Settings**

```python
# Each source type supports individual configuration
source_config = {
    "source_type": "web_scrape",
    "source_data": {...},

    # Per-source chunking strategy
    "chunking_config": {
        "strategy": "by_heading",  # Override KB default
        "chunk_size": 1500,
        "overlap": 200,
        "custom_separators": ["\n## ", "\n### "]
    },

    # AI context annotations
    "annotations": {
        "purpose": "Product documentation for API endpoints",
        "context": "Technical reference for developers",
        "importance": "high",
        "tags": ["api", "documentation", "developer"],
        "usage_instructions": "Use for API-related queries only"
    },

    # Preview settings
    "preview_config": {
        "show_structure": True,
        "highlight_tables": True,
        "show_metadata": True
    }
}
```

## 🔐 Compliance Integration

### **HIPAA/SOC2 for Source Management**

1. **Data Encryption**: All source content encrypted in transit and at rest
2. **Audit Logging**: Every source operation logged with full context
3. **Access Control**: Role-based permissions for source types
4. **Data Retention**: Configurable retention policies per source
5. **Privacy Controls**: PII detection and redaction capabilities

## 📊 Performance Optimizations

### **Concurrent Processing**
- Multiple sources processed in parallel
- Background sync for cloud services
- Intelligent retry mechanisms
- Rate limiting for external APIs

### **Caching Strategy**
- Redis caching for frequently accessed sources
- Content-based cache invalidation
- Metadata caching for quick previews
- Smart prefetching for predicted needs

## 🎨 User Experience Patterns

### **Source Selection Flow**
1. **Visual source picker** → Categories with examples
2. **Progressive configuration** → Start simple, add advanced options
3. **Real-time preview** → See content as you configure
4. **Validation feedback** → Clear error messages and suggestions
5. **Batch operations** → Add multiple sources efficiently

### **Error Handling**
- **Graceful degradation** → Partial success when possible
- **Clear error messages** → Actionable feedback for users
- **Automatic retry** → Transparent retry with backoff
- **Recovery suggestions** → Specific steps to resolve issues

---

**Next**: Continue with [Processing Pipeline Module](02_PROCESSING_PIPELINE.md) to understand how source content flows through the ETL pipeline.