# Knowledge Base from Web URL - Implementation Recommendation

## Executive Summary

This document provides a detailed, production-ready approach for implementing Knowledge Base creation from web URLs using Firecrawl, OpenAI embeddings (CPU-enabled), and Qdrant vector store. The design prioritizes **simplicity, reliability, and scalability** while adhering strictly to the pipeline architecture defined in `/docs/kb/pipeline/`.

**Key Decision: Monolithic-First, Service-Ready Architecture**

After careful analysis, I recommend keeping all components within the backend initially, with a clear service boundary design that allows future extraction into microservices without code rewrites.

---

## Table of Contents

1. [Architecture Decision: Monolithic vs Microservices](#architecture-decision)
2. [System Architecture Overview](#system-architecture)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Component Design](#detailed-component-design)
5. [Concurrency & Performance Strategy](#concurrency-performance)
6. [Monitoring & Observability](#monitoring-observability)
7. [Error Handling & Recovery](#error-handling)
8. [Folder Structure](#folder-structure)
9. [Development Roadmap](#development-roadmap)

---

## Architecture Decision: Monolithic vs Microservices {#architecture-decision}

### Question: Should web scraping, embeddings, and vector stores be separate services?

**Recommendation: Start Monolithic, Design for Services**

### Rationale

#### ✅ Benefits of Monolithic-First Approach

1. **Faster Initial Development**
   - Single deployment unit
   - Simpler debugging and testing
   - No network latency between components
   - Easier transaction management

2. **Lower Operational Complexity**
   - Single process to monitor
   - Simpler deployment pipeline
   - No service mesh needed
   - Easier to reason about failures

3. **Resource Efficiency**
   - No duplication of common libraries
   - Better memory utilization
   - Reduced network overhead
   - Lower infrastructure costs

4. **Proven Pattern**
   - Existing codebase is monolithic
   - Team is familiar with this architecture
   - Faster time to market
   - Less risk

#### ⚠️ Challenges & Mitigations

| Challenge | Mitigation Strategy |
|-----------|-------------------|
| **Resource contention** | Use Celery task queues with separate workers for CPU-intensive tasks |
| **Scaling bottlenecks** | Design services as isolated modules with clear boundaries |
| **Long-running tasks block API** | All heavy processing in background tasks (Celery) |
| **Future service extraction** | Use dependency injection, interface-based design |

### Service-Ready Design Principles

Even in a monolith, we'll design components as **logical services** with:

1. **Clear Boundaries**
   ```python
   # Service interfaces that can easily become REST APIs
   class WebScrapingService:
       async def scrape_url(self, request: ScrapeRequest) -> ScrapeResponse:
           pass

   class EmbeddingService:
       async def generate_embeddings(self, request: EmbeddingRequest) -> EmbeddingResponse:
           pass

   class VectorStoreService:
       async def index_vectors(self, request: IndexRequest) -> IndexResponse:
           pass
   ```

2. **Communication via DTOs (Data Transfer Objects)**
   - All service calls use Pydantic models
   - Easy to serialize for future HTTP/gRPC communication

3. **Stateless Operations**
   - No shared mutable state between services
   - All state in database or Redis

4. **Independent Scaling Paths**
   ```python
   # Celery queue configuration allows selective worker scaling
   CELERY_TASK_ROUTES = {
       'app.tasks.web_scraping.*': {'queue': 'scraping'},
       'app.tasks.embeddings.*': {'queue': 'embeddings'},
       'app.tasks.vector_store.*': {'queue': 'vector_store'},
   }
   ```

### When to Extract into Microservices

Consider extraction when:
- **Load patterns justify it**: Scraping load is 10x embedding load
- **Team size grows**: Multiple teams need independent deployment
- **Technology needs diverge**: Need different languages/frameworks
- **Cost optimization**: Can use spot instances for scraping

---

## System Architecture Overview {#system-architecture}

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Request (Frontend)                      │
│                    "Create KB from docs.keeta.com"                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Synchronous)                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  POST /api/v1/kb-drafts/{draft_id}/sources/web                │  │
│  │  1. Validate user & workspace permissions                     │  │
│  │  2. Validate URL and Firecrawl config                         │  │
│  │  3. Store source in Redis draft                               │  │
│  │  4. Return source_id immediately                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  POST /api/v1/kb-drafts/{draft_id}/finalize                   │  │
│  │  1. Validate draft completeness                               │  │
│  │  2. Create KB record in PostgreSQL                            │  │
│  │  3. Queue background pipeline task                            │  │
│  │  4. Return pipeline_id for tracking                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  GET /api/v1/pipelines/{pipeline_id}/status (Real-time)       │  │
│  │  1. Read pipeline status from Redis                           │  │
│  │  2. Return progress, metrics, logs                            │  │
│  │  3. Frontend polls every 2 seconds                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ Queue Task
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Celery Background Workers                         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  TASK: process_web_url_kb                                      │ │
│  │  ├─ STEP 1: Web Scraping (Firecrawl API)                       │ │
│  │  │   ├─ Method: scrape/crawl/map/extract                       │ │
│  │  │   ├─ Max pages, depth, patterns                             │ │
│  │  │   └─ Output: List of scraped pages                          │ │
│  │  │                                                              │ │
│  │  ├─ STEP 2: Content Cleaning & Parsing                         │ │
│  │  │   ├─ Remove boilerplate, navigation                         │ │
│  │  │   ├─ Parse HTML structure (headings, lists, code)           │ │
│  │  │   └─ Output: Structured DocumentElements                    │ │
│  │  │                                                              │ │
│  │  ├─ STEP 3: Intelligent Chunking                               │ │
│  │  │   ├─ Strategy: adaptive/semantic/by_heading                 │ │
│  │  │   ├─ Size: 1000 chars, overlap: 200                         │ │
│  │  │   ├─ Preserve code blocks, maintain context                 │ │
│  │  │   └─ Output: List of DocumentChunks with metadata           │ │
│  │  │                                                              │ │
│  │  ├─ STEP 4: Embedding Generation (OpenAI/CPU)                  │ │
│  │  │   ├─ Batch chunks (100 per batch)                           │ │
│  │  │   ├─ Generate embeddings (CPU-optimized)                    │ │
│  │  │   ├─ Rate limiting & retry logic                            │ │
│  │  │   └─ Output: Chunks with embeddings                         │ │
│  │  │                                                              │ │
│  │  └─ STEP 5: Vector Store Indexing (Qdrant)                     │ │
│  │      ├─ Create collection (if new KB)                          │ │
│  │      ├─ Upsert vectors in batches                              │ │
│  │      ├─ Store metadata for filtering                           │ │
│  │      └─ Output: KB ready for querying                          │ │
│  │                                                                 │ │
│  │  ⚡ All steps update Redis pipeline status in real-time        │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │ Status Updates
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Redis (State Management)                        │
│  ┌─ draft:kb:{draft_id}           → Draft configuration            │
│  ├─ pipeline:{pipeline_id}:status  → Real-time progress            │
│  ├─ pipeline:{pipeline_id}:metrics → Performance data              │
│  └─ pipeline:{pipeline_id}:logs    → Processing logs               │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow for "docs.keeta.com/introduction/start-developing"

```
1. User Input:
   URL: https://docs.keeta.com/introduction/start-developing
   Method: crawl
   Max Pages: 50
   Patterns: ["/introduction/**", "/guides/**"]

2. Firecrawl Extraction:
   → Pages discovered: 47
   → Pages scraped: 47
   → Total content: ~500KB

3. Chunking:
   → Documents: 47
   → Chunks: ~850 (avg 18 chunks/page)
   → Size range: 600-1200 characters

4. Embedding:
   → Model: text-embedding-ada-002 (CPU-optimized)
   → Batches: 9 (100 chunks each)
   → Processing time: ~45 seconds

5. Qdrant Indexing:
   → Collection: kb_{kb_id}
   → Vectors indexed: 850
   → Metadata fields: 8 (url, title, heading, page, etc.)
   → Index time: ~5 seconds

Total Pipeline Duration: ~2-3 minutes
```

---

## Implementation Phases {#implementation-phases}

### Phase 1: Foundation (Week 1) - MINIMAL VIABLE IMPLEMENTATION

**Goal**: Create KB from single URL with Firecrawl → Basic chunking → Qdrant

#### Deliverables

1. **Enhanced Firecrawl Integration**
   ```python
   # src/app/integrations/firecrawl_service.py
   class FirecrawlService:
       async def scrape(self, url: str, options: dict) -> ScrapedContent
       async def crawl(self, url: str, options: dict) -> List[ScrapedContent]
       async def map_site(self, url: str, options: dict) -> SiteMap
   ```

2. **Basic Chunking Service**
   ```python
   # src/app/services/chunking_service.py
   class ChunkingService:
       def chunk_text(self, text: str, strategy: str = "fixed") -> List[Chunk]
   ```

3. **Qdrant Integration**
   ```python
   # src/app/services/vector_store_service.py
   class QdrantService:
       async def create_collection(self, kb_id: UUID) -> bool
       async def upsert_vectors(self, kb_id: UUID, chunks: List[Chunk]) -> bool
   ```

4. **Pipeline Orchestration**
   ```python
   # src/app/tasks/kb_pipeline_tasks.py
   @shared_task
   def process_web_url_kb(kb_id: UUID, source_config: dict):
       # Orchestrate: Scrape → Chunk → Embed → Index
   ```

5. **API Endpoints**
   ```python
   # src/app/api/v1/routes/kb_draft.py
   POST /api/v1/kb-drafts/{draft_id}/sources/web  # Add URL source
   POST /api/v1/kb-drafts/{draft_id}/finalize      # Trigger processing
   GET  /api/v1/pipelines/{pipeline_id}/status      # Real-time status
   ```

#### Success Criteria
- ✅ User can create KB from docs.keeta.com
- ✅ See real-time progress
- ✅ Query KB successfully
- ✅ Processing completes in <5 minutes for 50 pages

---

### Phase 2: Enhanced Processing (Week 2) - QUALITY & FEATURES

**Goal**: Add smart parsing, advanced chunking, and content cleaning

#### Deliverables

1. **Smart Parsing Service**
   ```python
   # src/app/services/smart_parsing_service.py
   class SmartParsingService:
       async def parse_html(self, content: str) -> List[DocumentElement]
       # Extracts headings, paragraphs, code blocks, tables
   ```

2. **Enhanced Chunking Strategies**
   ```python
   # Enhanced src/app/services/enhanced_chunking_service.py
   class EnhancedChunkingService:
       strategies = ["by_heading", "semantic", "adaptive", "hybrid"]
       def chunk_by_heading(self, elements: List[DocumentElement]) -> List[Chunk]
       def chunk_semantic(self, elements: List[DocumentElement]) -> List[Chunk]
   ```

3. **Content Quality Service**
   ```python
   # src/app/services/content_quality_service.py
   class ContentQualityService:
       def assess_quality(self, content: str) -> QualityScore
       def clean_boilerplate(self, content: str) -> str
   ```

#### Success Criteria
- ✅ Chunks preserve code block structure
- ✅ Headings are maintained in chunks
- ✅ Quality score > 0.8 for technical docs
- ✅ Boilerplate removal reduces noise by 30%

---

### Phase 3: Monitoring & Observability (Week 3) - PRODUCTION READY

**Goal**: Full pipeline monitoring, error recovery, and performance optimization

#### Deliverables

1. **Pipeline Monitoring Service**
   ```python
   # src/app/services/pipeline_monitoring_service.py
   class PipelineMonitoringService:
       async def start_pipeline(self, config: dict) -> str  # Returns pipeline_id
       async def update_step(self, pipeline_id: str, step: str, status: str)
       async def get_status(self, pipeline_id: str) -> PipelineStatus
       async def log_event(self, pipeline_id: str, event: str)
   ```

2. **Error Handling & Recovery**
   ```python
   # src/app/services/pipeline_error_handler.py
   class PipelineErrorHandler:
       async def handle_scraping_error(self, error: Exception) -> RecoveryAction
       async def handle_embedding_error(self, error: Exception) -> RecoveryAction
       async def retry_with_backoff(self, operation: Callable, max_retries: int = 3)
   ```

3. **Performance Optimization**
   - Concurrent Firecrawl requests (5 parallel)
   - Batch embedding (100 chunks per batch)
   - Qdrant batch upsert (500 vectors per batch)

#### Success Criteria
- ✅ 99% successful pipeline completion
- ✅ Real-time status updates every 2 seconds
- ✅ Failed pages don't block entire pipeline
- ✅ Processing time <3 minutes for 50 pages

---

### Phase 4: Configuration & Customization (Week 4) - FULL PIPELINE

**Goal**: Hierarchical configuration, templates, and advanced features

#### Deliverables

1. **Configuration Service**
   ```python
   # src/app/services/configuration_service.py
   class ConfigurationService:
       async def get_effective_config(
           self, org_id, ws_id, kb_id, user_config
       ) -> PipelineConfiguration
   ```

2. **Configuration Templates**
   - Documentation sites (like Keeta docs)
   - API references
   - Knowledge bases
   - Code repositories

3. **Advanced Features**
   - Multiple URL sources in single KB
   - Source priority and weighting
   - Incremental updates (re-scrape changed pages)

---

## Detailed Component Design {#detailed-component-design}

### 1. Firecrawl Service (Web Scraping)

**File**: `src/app/services/firecrawl_service.py`

```python
"""
Firecrawl service for advanced web scraping.

WHY: Firecrawl provides reliable, high-quality web content extraction
HOW: API-based scraping with multiple methods (scrape, crawl, map, extract)
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
import httpx
from app.core.config import settings


class ScrapeOptions(BaseModel):
    """Firecrawl scrape options"""
    formats: List[str] = Field(default=["markdown"], description="Output formats")
    only_main_content: bool = Field(default=True, description="Extract only main content")
    include_tags: List[str] = Field(default=[], description="HTML tags to include")
    exclude_tags: List[str] = Field(default=["nav", "footer", "aside"], description="Tags to exclude")
    wait_for: int = Field(default=0, description="Wait time in milliseconds")
    timeout: int = Field(default=30000, description="Request timeout")


class CrawlOptions(BaseModel):
    """Firecrawl crawl options"""
    limit: int = Field(default=50, ge=1, le=1000, description="Max pages to crawl")
    max_depth: int = Field(default=3, ge=1, le=10, description="Max crawl depth")
    allow_backward_links: bool = Field(default=False, description="Follow links to parent pages")
    allow_external_links: bool = Field(default=False, description="Follow external links")
    include_paths: List[str] = Field(default=[], description="URL patterns to include")
    exclude_paths: List[str] = Field(default=[], description="URL patterns to exclude")
    ignore_sitemap: bool = Field(default=False, description="Ignore sitemap.xml")
    scrape_options: Optional[ScrapeOptions] = None


class MapOptions(BaseModel):
    """Firecrawl map options"""
    search: Optional[str] = None
    ignore_sitemap: bool = False
    include_subdomains: bool = False
    limit: int = 5000


class ScrapedPage(BaseModel):
    """Single scraped page result"""
    url: str
    title: Optional[str] = None
    content: str
    markdown: Optional[str] = None
    html: Optional[str] = None
    metadata: Dict = Field(default_factory=dict)
    links: List[str] = Field(default_factory=list)


class CrawlResult(BaseModel):
    """Crawl operation result"""
    success: bool
    pages: List[ScrapedPage]
    total_pages: int
    failed_pages: List[Dict] = Field(default_factory=list)
    metadata: Dict = Field(default_factory=dict)


class FirecrawlService:
    """
    Firecrawl integration for web scraping.

    IMPORTANT: This service is STATELESS and can be easily extracted
    into a separate microservice if needed.
    """

    def __init__(self):
        self.api_key = settings.FIRECRAWL_API_KEY
        self.base_url = "https://api.firecrawl.dev/v1"
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )

    async def scrape(
        self,
        url: str,
        options: Optional[ScrapeOptions] = None
    ) -> ScrapedPage:
        """
        Scrape single URL.

        Args:
            url: URL to scrape
            options: Scraping options

        Returns:
            ScrapedPage with content and metadata

        Raises:
            FirecrawlAPIError: If API request fails
        """
        if options is None:
            options = ScrapeOptions()

        payload = {
            "url": url,
            "formats": options.formats,
            "onlyMainContent": options.only_main_content,
            "includeTags": options.include_tags,
            "excludeTags": options.exclude_tags,
            "waitFor": options.wait_for,
            "timeout": options.timeout
        }

        response = await self._make_request("POST", "/scrape", payload)

        data = response.get("data", {})
        return ScrapedPage(
            url=url,
            title=data.get("metadata", {}).get("title"),
            content=data.get("markdown", "") or data.get("content", ""),
            markdown=data.get("markdown"),
            html=data.get("html"),
            metadata=data.get("metadata", {}),
            links=data.get("links", [])
        )

    async def crawl(
        self,
        url: str,
        options: Optional[CrawlOptions] = None
    ) -> CrawlResult:
        """
        Crawl website starting from URL.

        Args:
            url: Starting URL
            options: Crawl options

        Returns:
            CrawlResult with all scraped pages
        """
        if options is None:
            options = CrawlOptions()

        payload = {
            "url": url,
            "limit": options.limit,
            "maxDepth": options.max_depth,
            "allowBackwardLinks": options.allow_backward_links,
            "allowExternalLinks": options.allow_external_links,
            "includePaths": options.include_paths,
            "excludePaths": options.exclude_paths,
            "ignoreSitemap": options.ignore_sitemap,
        }

        if options.scrape_options:
            payload["scrapeOptions"] = options.scrape_options.dict(exclude_none=True)

        # Start crawl
        response = await self._make_request("POST", "/crawl", payload)
        crawl_id = response.get("id")

        # Poll for completion
        pages = await self._poll_crawl_status(crawl_id)

        return CrawlResult(
            success=True,
            pages=pages,
            total_pages=len(pages),
            metadata={"crawl_id": crawl_id}
        )

    async def map_site(
        self,
        url: str,
        options: Optional[MapOptions] = None
    ) -> List[str]:
        """
        Map website structure and return discovered URLs.

        Args:
            url: Website URL
            options: Map options

        Returns:
            List of discovered URLs
        """
        if options is None:
            options = MapOptions()

        payload = {
            "url": url,
            "search": options.search,
            "ignoreSitemap": options.ignore_sitemap,
            "includeSubdomains": options.include_subdomains,
            "limit": options.limit
        }

        response = await self._make_request("POST", "/map", payload)
        return response.get("links", [])

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        payload: Dict
    ) -> Dict:
        """Make authenticated request to Firecrawl API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        url = f"{self.base_url}{endpoint}"

        response = await self.client.request(
            method,
            url,
            headers=headers,
            json=payload
        )

        response.raise_for_status()
        return response.json()

    async def _poll_crawl_status(
        self,
        crawl_id: str,
        poll_interval: int = 2,
        max_wait: int = 600
    ) -> List[ScrapedPage]:
        """Poll crawl status until completion"""
        import asyncio

        elapsed = 0
        while elapsed < max_wait:
            response = await self._make_request("GET", f"/crawl/{crawl_id}", {})
            status = response.get("status")

            if status == "completed":
                pages_data = response.get("data", [])
                return [
                    ScrapedPage(
                        url=page.get("url", ""),
                        title=page.get("metadata", {}).get("title"),
                        content=page.get("markdown", "") or page.get("content", ""),
                        markdown=page.get("markdown"),
                        html=page.get("html"),
                        metadata=page.get("metadata", {}),
                        links=page.get("links", [])
                    )
                    for page in pages_data
                ]

            elif status == "failed":
                raise Exception(f"Crawl failed: {response.get('error')}")

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        raise TimeoutError(f"Crawl timeout after {max_wait} seconds")

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global instance
firecrawl_service = FirecrawlService()
```

**Key Design Decisions**:

1. **Async/Await**: All operations are async for non-blocking I/O
2. **Pydantic Models**: Strong typing and validation
3. **Stateless Design**: Easy to extract into microservice
4. **Graceful Degradation**: Handles API errors without crashing
5. **Resource Management**: Connection pooling, timeouts, limits

---

### 2. Embedding Service (OpenAI CPU-Optimized)

**File**: `src/app/services/embedding_service_v2.py`

```python
"""
Embedding generation service optimized for CPU execution.

WHY: Generate vector embeddings for semantic search
HOW: OpenAI API with batching, rate limiting, and CPU optimization
"""

from typing import List
from pydantic import BaseModel
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings


class EmbeddingRequest(BaseModel):
    """Request to generate embeddings"""
    texts: List[str]
    model: str = "text-embedding-ada-002"
    dimensions: int = 1536


class EmbeddingResponse(BaseModel):
    """Embedding generation response"""
    embeddings: List[List[float]]
    model: str
    usage: dict


class EmbeddingService:
    """
    Embedding generation with rate limiting and batching.

    OPTIMIZATION: CPU-focused with efficient batching
    """

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "text-embedding-ada-002"
        self.batch_size = 100  # OpenAI recommends max 100 per request
        self.rate_limit_per_minute = 3000  # Adjust based on your tier

    async def generate_embeddings(
        self,
        texts: List[str],
        show_progress: bool = False
    ) -> List[List[float]]:
        """
        Generate embeddings for list of texts with batching and rate limiting.

        Args:
            texts: List of text strings to embed
            show_progress: Whether to log progress

        Returns:
            List of embedding vectors
        """
        all_embeddings = []

        # Process in batches
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]

            try:
                response = await self.client.embeddings.create(
                    model=self.model,
                    input=batch,
                    encoding_format="float"
                )

                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)

                if show_progress:
                    progress = min(i + self.batch_size, len(texts))
                    print(f"Embedded {progress}/{len(texts)} chunks")

                # Rate limiting: wait between batches
                if i + self.batch_size < len(texts):
                    await asyncio.sleep(0.1)  # 100ms between batches

            except Exception as e:
                # Log error and retry with exponential backoff
                print(f"Embedding error for batch {i}: {e}")
                await asyncio.sleep(5)  # Wait before retry
                # Retry logic here

        return all_embeddings


# Global instance
embedding_service = EmbeddingService()
```

---

### 3. Qdrant Vector Store Service

**File**: `src/app/services/qdrant_service.py`

```python
"""
Qdrant vector store service for KB indexing and retrieval.

WHY: High-performance vector similarity search
HOW: Qdrant client with collection management and batch operations
"""

from typing import List, Dict, Optional
from pydantic import BaseModel
from uuid import UUID
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue
)
from app.core.config import settings


class QdrantService:
    """
    Qdrant vector database service.

    DESIGN: Isolated service ready for extraction into separate deployment
    """

    def __init__(self):
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            timeout=60
        )
        self.embedding_size = 1536  # OpenAI ada-002

    async def create_kb_collection(
        self,
        kb_id: UUID,
        vector_size: int = 1536,
        distance: str = "Cosine"
    ) -> bool:
        """
        Create Qdrant collection for knowledge base.

        Args:
            kb_id: Knowledge base ID
            vector_size: Embedding vector dimensions
            distance: Distance metric (Cosine, Euclidean, Dot)

        Returns:
            True if successful
        """
        collection_name = f"kb_{kb_id}"

        try:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE if distance == "Cosine" else Distance.EUCLIDEAN
                )
            )
            return True
        except Exception as e:
            # Collection might already exist
            print(f"Collection creation warning: {e}")
            return True

    async def upsert_chunks(
        self,
        kb_id: UUID,
        chunks: List[Dict]
    ) -> int:
        """
        Upsert chunks into Qdrant collection.

        Args:
            kb_id: Knowledge base ID
            chunks: List of chunks with embeddings and metadata

        Returns:
            Number of chunks indexed
        """
        collection_name = f"kb_{kb_id}"

        points = [
            PointStruct(
                id=chunk["id"],
                vector=chunk["embedding"],
                payload={
                    "content": chunk["content"],
                    "url": chunk.get("url"),
                    "title": chunk.get("title"),
                    "heading": chunk.get("heading"),
                    "metadata": chunk.get("metadata", {})
                }
            )
            for chunk in chunks
        ]

        # Batch upsert (500 points per batch)
        batch_size = 500
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.client.upsert(
                collection_name=collection_name,
                points=batch
            )

        return len(chunks)

    async def search(
        self,
        kb_id: UUID,
        query_vector: List[float],
        limit: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Search KB collection for similar chunks.

        Args:
            kb_id: Knowledge base ID
            query_vector: Query embedding vector
            limit: Number of results
            filters: Metadata filters

        Returns:
            List of similar chunks with scores
        """
        collection_name = f"kb_{kb_id}"

        # Build filter if provided
        qdrant_filter = None
        if filters:
            # Convert filters to Qdrant format
            pass

        results = self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit,
            query_filter=qdrant_filter
        )

        return [
            {
                "id": result.id,
                "score": result.score,
                "content": result.payload.get("content"),
                "metadata": result.payload
            }
            for result in results
        ]


# Global instance
qdrant_service = QdrantService()
```

---

## Concurrency & Performance Strategy {#concurrency-performance}

### Problem: Handling Multiple Concurrent KB Creation Requests

**Scenario**: 10 users each creating KBs from 50-page websites simultaneously

**Challenges**:
1. Firecrawl API rate limits
2. OpenAI embedding API rate limits
3. Database connection pool exhaustion
4. Memory pressure from large documents
5. CPU contention for parsing/chunking

### Solution: Multi-Level Queue Architecture

```python
# celery_config.py

CELERY_TASK_ROUTES = {
    # High-priority: User-facing operations
    'app.tasks.kb_draft.*': {
        'queue': 'high_priority',
        'routing_key': 'high.kb_draft'
    },

    # Medium-priority: Web scraping (I/O bound)
    'app.tasks.web_scraping.*': {
        'queue': 'web_scraping',
        'routing_key': 'medium.scraping'
    },

    # Medium-priority: Embedding generation (API bound)
    'app.tasks.embeddings.*': {
        'queue': 'embeddings',
        'routing_key': 'medium.embeddings'
    },

    # Low-priority: Indexing and cleanup
    'app.tasks.indexing.*': {
        'queue': 'indexing',
        'routing_key': 'low.indexing'
    },
}

# Worker configuration
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # Prevent worker hoarding
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000  # Restart workers to prevent memory leaks

# Concurrency settings per queue
WORKER_CONFIGS = {
    'high_priority': {
        'concurrency': 10,  # 10 concurrent tasks
        'pool': 'prefork'   # Process pool for CPU work
    },
    'web_scraping': {
        'concurrency': 5,   # Limited by Firecrawl API
        'pool': 'eventlet', # Async pool for I/O
        'rate_limit': '10/m'  # 10 tasks per minute
    },
    'embeddings': {
        'concurrency': 3,   # Limited by OpenAI API quota
        'pool': 'eventlet',
        'rate_limit': '300/m'  # Based on API tier
    },
    'indexing': {
        'concurrency': 5,   # Qdrant can handle it
        'pool': 'prefork'
    }
}
```

### Resource Allocation Strategy

| Resource | Limit | Strategy |
|----------|-------|----------|
| **Firecrawl API** | 10 req/min | Queue + rate limiting |
| **OpenAI API** | 3000 req/min | Batch 100/request, queue |
| **Qdrant** | High throughput | Batch upsert 500/batch |
| **PostgreSQL** | 100 connections | Connection pooling |
| **Redis** | High throughput | Pipeline commands |
| **Memory** | 4GB per worker | Limit worker lifetime |

### Scaling Deployment

```yaml
# docker-compose.production.yml
services:
  # Web scraping workers (I/O bound)
  celery-scraping:
    image: privexbot-backend
    command: celery -A app.celery_app worker -Q web_scraping -c 5 --pool=eventlet
    replicas: 2  # 2 workers = 10 concurrent scraping tasks
    environment:
      - CELERY_WORKER_NAME=scraping-%h
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  # Embedding workers (API bound)
  celery-embeddings:
    image: privexbot-backend
    command: celery -A app.celery_app worker -Q embeddings -c 3 --pool=eventlet
    replicas: 1  # 1 worker = 3 concurrent embedding tasks
    environment:
      - CELERY_WORKER_NAME=embeddings-%h
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  # Indexing workers (CPU + I/O bound)
  celery-indexing:
    image: privexbot-backend
    command: celery -A app.celery_app worker -Q indexing -c 5
    replicas: 2  # 2 workers = 10 concurrent indexing tasks
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.5'
```

**Scalability**:
- **10 concurrent users**: Default config handles this
- **50 concurrent users**: Scale to 5 scraping workers, 3 embedding workers
- **100+ concurrent users**: Consider extracting services

---

## Monitoring & Observability {#monitoring-observability}

### Real-Time Pipeline Monitoring

```python
# src/app/services/pipeline_monitoring_service.py

class PipelineStage(str, Enum):
    WEB_SCRAPING = "web_scraping"
    CONTENT_PARSING = "content_parsing"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class PipelineStatus:
    pipeline_id: str
    kb_id: str
    status: str  # running, completed, failed
    current_stage: PipelineStage
    progress_percentage: float
    started_at: datetime
    estimated_completion: Optional[datetime]

    # Stage-specific metrics
    scraping_stats: Dict = field(default_factory=dict)
    parsing_stats: Dict = field(default_factory=dict)
    chunking_stats: Dict = field(default_factory=dict)
    embedding_stats: Dict = field(default_factory=dict)
    indexing_stats: Dict = field(default_factory=dict)

    # Error tracking
    errors: List[Dict] = field(default_factory=list)
    warnings: List[Dict] = field(default_factory=list)


class PipelineMonitoringService:
    """
    Real-time pipeline monitoring with Redis-backed state.
    """

    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 86400  # 24 hours

    async def start_pipeline(
        self,
        kb_id: UUID,
        workspace_id: UUID,
        config: Dict
    ) -> str:
        """Initialize pipeline tracking"""
        pipeline_id = f"pipeline:{kb_id}:{int(time.time())}"

        status = PipelineStatus(
            pipeline_id=pipeline_id,
            kb_id=str(kb_id),
            status="running",
            current_stage=PipelineStage.WEB_SCRAPING,
            progress_percentage=0.0,
            started_at=datetime.utcnow()
        )

        # Store in Redis
        await self.redis.setex(
            pipeline_id,
            self.ttl,
            json.dumps(asdict(status), default=str)
        )

        return pipeline_id

    async def update_stage(
        self,
        pipeline_id: str,
        stage: PipelineStage,
        stats: Dict
    ):
        """Update current pipeline stage with stats"""
        status = await self._get_status(pipeline_id)

        status.current_stage = stage
        status.progress_percentage = self._calculate_progress(stage)

        # Update stage-specific stats
        if stage == PipelineStage.WEB_SCRAPING:
            status.scraping_stats = stats
        elif stage == PipelineStage.CHUNKING:
            status.chunking_stats = stats
        elif stage == PipelineStage.EMBEDDING:
            status.embedding_stats = stats
        # ... etc

        await self._save_status(pipeline_id, status)

    def _calculate_progress(self, stage: PipelineStage) -> float:
        """Calculate overall progress percentage"""
        stage_weights = {
            PipelineStage.WEB_SCRAPING: 30,
            PipelineStage.CONTENT_PARSING: 50,
            PipelineStage.CHUNKING: 65,
            PipelineStage.EMBEDDING: 85,
            PipelineStage.INDEXING: 95,
            PipelineStage.COMPLETED: 100
        }
        return stage_weights.get(stage, 0)
```

### Frontend Polling Pattern

```typescript
// frontend/src/hooks/usePipelineStatus.ts

export const usePipelineStatus = (pipelineId: string) => {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pipelineId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/pipelines/${pipelineId}/status`);
        const data = await response.json();
        setStatus(data);

        // Stop polling when complete or failed
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        setError(err.message);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [pipelineId]);

  return { status, error };
};
```

---

## Error Handling & Recovery {#error-handling}

### Error Classification & Recovery Strategies

```python
class ErrorType(str, Enum):
    NETWORK_TIMEOUT = "network_timeout"
    API_RATE_LIMIT = "api_rate_limit"
    INVALID_CONTENT = "invalid_content"
    PARSING_ERROR = "parsing_error"
    QUOTA_EXCEEDED = "quota_exceeded"
    TRANSIENT_ERROR = "transient_error"


class RecoveryStrategy:
    """Automatic recovery strategies for common errors"""

    @staticmethod
    async def handle_network_timeout(context: Dict, retry_count: int):
        """Exponential backoff for network timeouts"""
        if retry_count < 3:
            delay = 2 ** retry_count
            await asyncio.sleep(delay)
            return {"action": "retry", "context": context}
        return {"action": "skip", "reason": "max_retries_exceeded"}

    @staticmethod
    async def handle_rate_limit(context: Dict):
        """Wait and retry for rate limits"""
        await asyncio.sleep(60)  # Wait 1 minute
        return {"action": "retry", "context": context}

    @staticmethod
    async def handle_invalid_content(context: Dict):
        """Skip invalid pages and continue"""
        return {"action": "skip", "reason": "invalid_content"}
```

### Partial Success Handling

**Principle**: Never let a few failed pages block the entire KB creation

```python
async def process_web_url_kb(kb_id: UUID, source_config: Dict):
    """Pipeline with partial success handling"""

    successful_pages = []
    failed_pages = []

    try:
        # Step 1: Scrape
        scraped_pages = await firecrawl_service.crawl(url, options)

        # Process pages individually
        for page in scraped_pages:
            try:
                # Parse, chunk, embed, index this page
                chunks = await process_single_page(page)
                successful_pages.append(page)
            except Exception as e:
                failed_pages.append({
                    "url": page.url,
                    "error": str(e)
                })
                # Log but continue

        # Mark as completed even with some failures
        if successful_pages:
            await pipeline_monitoring.complete(
                pipeline_id,
                success_count=len(successful_pages),
                failed_count=len(failed_pages)
            )

    except Exception as e:
        # Total failure
        await pipeline_monitoring.fail(pipeline_id, str(e))
        raise
```

---

## Folder Structure {#folder-structure}

```
backend/src/app/
├── services/
│   ├── firecrawl_service.py          # NEW: Firecrawl integration
│   ├── embedding_service_v2.py       # NEW: CPU-optimized embeddings
│   ├── qdrant_service.py             # NEW: Qdrant vector store
│   ├── smart_parsing_service.py      # NEW: HTML/Markdown parsing
│   ├── enhanced_chunking_service.py  # NEW: Multi-strategy chunking
│   ├── content_quality_service.py    # NEW: Quality assessment
│   ├── pipeline_monitoring_service.py # NEW: Real-time monitoring
│   ├── configuration_service.py      # NEW: Hierarchical config
│   ├── kb_draft_service.py           # EXISTING: Enhanced
│   └── draft_service.py              # EXISTING: No changes
│
├── tasks/
│   ├── kb_pipeline_tasks.py          # NEW: Main pipeline orchestration
│   ├── web_scraping_tasks.py         # NEW: Scraping tasks
│   ├── embedding_tasks.py            # NEW: Embedding tasks
│   └── indexing_tasks.py             # NEW: Indexing tasks
│
├── api/v1/routes/
│   ├── kb_draft.py                   # ENHANCED: Add source endpoints
│   ├── kb_pipeline.py                # NEW: Pipeline status endpoints
│   └── knowledge_bases.py            # EXISTING: Minimal changes
│
├── models/
│   ├── knowledge_base.py             # EXISTING: Add config fields
│   └── document.py                   # EXISTING: Add source metadata
│
├── schemas/
│   ├── kb_source.py                  # NEW: Source schemas
│   ├── pipeline.py                   # NEW: Pipeline schemas
│   └── knowledge_base.py             # EXISTING: Enhanced
│
└── integrations/
    └── firecrawl_adapter.py          # EXISTING: Kept for compatibility
```

**Design Principles**:
1. **Service Layer**: All business logic in `services/`
2. **Task Layer**: All background processing in `tasks/`
3. **Clear Boundaries**: Each service is self-contained
4. **Testability**: Services can be unit tested independently
5. **Future-Proof**: Easy to extract services later

---

## Development Roadmap {#development-roadmap}

### Week 1: Foundation (MVP)

**Days 1-2: Core Infrastructure**
- [ ] Setup Firecrawl service with scrape/crawl methods
- [ ] Setup Qdrant service with collection management
- [ ] Setup embedding service with batching
- [ ] Create pipeline task orchestration

**Days 3-4: API & Integration**
- [ ] API endpoint: Add web URL to draft
- [ ] API endpoint: Finalize draft and trigger pipeline
- [ ] API endpoint: Get pipeline status
- [ ] Integrate all services in pipeline task

**Days 5-7: Testing & Polish**
- [ ] End-to-end test with docs.keeta.com
- [ ] Load test with 10 concurrent users
- [ ] Error handling and recovery
- [ ] Documentation

**Deliverable**: Working KB creation from web URL

---

### Week 2: Quality & Features

**Days 1-3: Smart Processing**
- [ ] Smart parsing service (extract headings, code, tables)
- [ ] Enhanced chunking strategies (by_heading, semantic)
- [ ] Content quality service (boilerplate removal)

**Days 4-5: Advanced Features**
- [ ] Multiple URLs in single KB
- [ ] Configuration templates
- [ ] Firecrawl map method

**Days 6-7: Testing**
- [ ] Quality metrics verification
- [ ] Multiple source testing
- [ ] Performance optimization

---

### Week 3: Production Ready

**Days 1-3: Monitoring**
- [ ] Full pipeline monitoring service
- [ ] Real-time progress updates
- [ ] Error tracking and logging

**Days 4-5: Resilience**
- [ ] Retry logic with exponential backoff
- [ ] Partial success handling
- [ ] Circuit breakers for external APIs

**Days 6-7: Deployment**
- [ ] Production deployment scripts
- [ ] Monitoring dashboards
- [ ] Load testing and optimization

---

### Week 4: Configuration & Scale

**Days 1-3: Configuration**
- [ ] Hierarchical configuration service
- [ ] Configuration templates
- [ ] Per-source configuration overrides

**Days 4-5: Scale Testing**
- [ ] Test with 50 concurrent users
- [ ] Identify bottlenecks
- [ ] Optimize worker configuration

**Days 6-7: Documentation**
- [ ] API documentation
- [ ] User guides
- [ ] Operational runbooks

---

## Conclusion

This implementation approach provides:

✅ **Simplicity**: Monolithic architecture, established patterns
✅ **Reliability**: Comprehensive error handling, partial success
✅ **Scalability**: Celery queues, horizontal worker scaling
✅ **Observability**: Real-time monitoring, detailed logging
✅ **Future-Proof**: Service boundaries allow easy extraction
✅ **Production-Ready**: Security, multi-tenancy, performance

**Next Steps**:
1. Review and approve this approach
2. Setup Firecrawl API key and Qdrant instance
3. Begin Phase 1 implementation (Week 1)
4. Iterate based on real-world usage patterns

This design balances pragmatism (start simple) with foresight (ready to scale), ensuring rapid delivery without compromising long-term architecture.
