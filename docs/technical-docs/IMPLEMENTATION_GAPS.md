# Implementation Gaps Based on Technical Documentation

After reviewing all technical documentation in `/docs/technical-docs/privexbot-design/`, here are the **missing components** that need to be added to the authentication pseudocode implementation.

## ✅ Already Implemented (Authentication Layer)

- [x] User authentication (email + wallet)
- [x] Multi-tenancy (Organization → Workspace)
- [x] Chatbot and Chatflow separation
- [x] RBAC permissions
- [x] JWT token management

## ❌ Missing Components (Knowledge Base & RAG System)

### 1. Knowledge Base Models

Based on the documentation, we need additional models:

#### `models/knowledge_base.py` - MISSING
```
WHY: Store knowledge base metadata and settings
FIELDS:
- id: UUID
- name: str
- description: str | None
- workspace_id: UUID (TENANT ISOLATION)
- permission: enum ('only_me', 'all_team', 'partial_team')
- indexing_method: str
- embedding_model: str
- retrieval_settings: JSONB
- created_by: UUID
- created_at, updated_at

RELATIONSHIPS:
- workspace: Workspace (many-to-one)
- documents: list[Document] (one-to-many)
- linked_chatbots: list[Chatbot] (many-to-many through association table)
- linked_chatflows: list[Chatflow] (many-to-many through association table)
```

#### `models/document.py` - MISSING
```
WHY: Store individual documents within knowledge base
FIELDS:
- id: UUID
- knowledge_base_id: UUID
- name: str
- source_type: enum ('file', 'text', 'website', 'google_docs', 'notion')
- source_url: str | None
- file_path: str | None
- content_type: str (mime type)
- status: enum ('pending', 'processing', 'completed', 'failed', 'disabled', 'archived')
- metadata: JSONB (custom user metadata)
- indexing_status: JSONB
- created_by: UUID
- created_at, updated_at
- disabled_at: datetime | None
- archived_at: datetime | None

RELATIONSHIPS:
- knowledge_base: KnowledgeBase (many-to-one)
- chunks: list[Chunk] (one-to-many)
```

#### `models/chunk.py` - MISSING
```
WHY: Store text chunks from documents for RAG retrieval
FIELDS:
- id: UUID
- document_id: UUID
- content: text (actual chunk text)
- position: int (chunk position in document)
- chunk_index: int
- metadata: JSONB
    - page_number: int | None
    - heading: str | None
    - original_element_id: str | None
- embedding: vector (pgvector type) - for semantic search
- keywords: list[str] | None
- is_enabled: bool
- is_edited: bool
- word_count: int
- character_count: int
- created_at, updated_at

RELATIONSHIPS:
- document: Document (many-to-one)

INDEXES:
- embedding (vector index for similarity search)
- document_id + position
```

#### `models/chunking_config.py` - MISSING
```
WHY: Store chunking strategy configuration per knowledge base
FIELDS:
- id: UUID
- knowledge_base_id: UUID
- strategy: enum ('size_based', 'by_heading', 'by_page', 'by_similarity')
- max_characters: int (default: 1000)
- combine_under_n_chars: int | None
- new_after_n_chars: int | None
- overlap: int (default: 0)
- overlap_all: bool
- similarity_threshold: float | None (for topic-based)
- multipage_sections: bool
- include_original_elements: bool
- enable_contextual_chunking: bool
- created_at, updated_at

RELATIONSHIPS:
- knowledge_base: KnowledgeBase (one-to-one)
```

#### `models/web_crawler_config.py` - MISSING
```
WHY: Store website import configuration
FIELDS:
- id: UUID
- knowledge_base_id: UUID
- provider: enum ('firecrawl', 'jina_reader')
- api_key: str (encrypted)
- base_url: str
- include_subpages: bool
- max_pages: int | None
- crawl_depth: int | None
- exclude_paths: list[str]
- include_paths: list[str]
- use_sitemap: bool
- last_crawl_at: datetime | None
- created_at, updated_at

RELATIONSHIPS:
- knowledge_base: KnowledgeBase (one-to-one)
```

### 2. Association Tables

#### `models/chatbot_knowledge_base.py` - MISSING
```
WHY: Link chatbots to knowledge bases (many-to-many)
FIELDS:
- id: UUID
- chatbot_id: UUID
- knowledge_base_id: UUID
- created_at

CONSTRAINTS:
- unique(chatbot_id, knowledge_base_id)
```

#### `models/chatflow_knowledge_base.py` - MISSING
```
WHY: Link chatflows to knowledge bases (many-to-many)
FIELDS:
- id: UUID
- chatflow_id: UUID
- knowledge_base_id: UUID
- created_at

CONSTRAINTS:
- unique(chatflow_id, knowledge_base_id)
```

### 3. Updated Models Needed

#### `models/chatbot.py` - UPDATE NEEDED
Add relationship:
```python
knowledge_bases: list[KnowledgeBase] (many-to-many through ChatbotKnowledgeBase)
```

#### `models/chatflow.py` - UPDATE NEEDED
Add relationship:
```python
knowledge_bases: list[KnowledgeBase] (many-to-many through ChatflowKnowledgeBase)
```

#### `models/workspace.py` - UPDATE NEEDED
Add relationship:
```python
knowledge_bases: list[KnowledgeBase] (one-to-many)
```

### 4. Schemas Needed

#### `schemas/knowledge_base.py` - MISSING
- KnowledgeBaseCreate
- KnowledgeBaseUpdate
- KnowledgeBaseResponse
- KnowledgeBaseSettings

#### `schemas/document.py` - MISSING
- DocumentCreate (text or file)
- DocumentUpdate
- DocumentResponse
- DocumentListResponse
- DocumentStatus

#### `schemas/chunk.py` - MISSING
- ChunkCreate
- ChunkUpdate
- ChunkResponse
- ChunkListResponse

### 5. Services Needed

#### `services/knowledge_base_service.py` - MISSING
Functions:
- create_knowledge_base()
- get_knowledge_bases_for_workspace()
- update_knowledge_base_settings()
- link_to_chatbot()
- link_to_chatflow()

#### `services/document_service.py` - MISSING
Functions:
- create_document_from_text()
- create_document_from_file()
- update_document()
- get_document_status()
- archive_document()
- delete_document()
- auto_disable_old_documents() # After 20 days

#### `services/chunk_service.py` - MISSING
Functions:
- create_chunks_from_document()
- update_chunk()
- get_chunks_for_document()
- reconfigure_chunking()
- generate_embeddings()

#### `services/web_crawler_service.py` - MISSING
Functions:
- crawl_with_firecrawl()
- crawl_with_jina_reader()
- import_website_content()

#### `services/embedding_service.py` - MISSING
Functions:
- generate_embedding()
- batch_generate_embeddings()
- search_similar_chunks()

### 6. Permissions Updates Needed

#### `services/permission_service.py` - UPDATE
Add knowledge base permissions:
```python
"knowledge:create": True,
"knowledge:read": True,
"knowledge:write": True,
"knowledge:delete": True,
"document:create": True,
"document:edit": True,
"document:delete": True,
"chunk:edit": True,
```

### 7. API Routes Needed

#### `api/v1/routes/knowledge_base.py` - MISSING
- POST /knowledge-bases
- GET /knowledge-bases
- GET /knowledge-bases/{id}
- PUT /knowledge-bases/{id}
- DELETE /knowledge-bases/{id}
- GET /knowledge-bases/{id}/linked-apps

#### `api/v1/routes/document.py` - MISSING
- POST /knowledge-bases/{kb_id}/documents (text)
- POST /knowledge-bases/{kb_id}/documents/file
- GET /knowledge-bases/{kb_id}/documents
- GET /knowledge-bases/{kb_id}/documents/{id}
- PUT /knowledge-bases/{kb_id}/documents/{id}
- DELETE /knowledge-bases/{kb_id}/documents/{id}
- POST /knowledge-bases/{kb_id}/documents/{id}/archive
- GET /knowledge-bases/{kb_id}/documents/{id}/status

#### `api/v1/routes/chunk.py` - MISSING
- GET /documents/{doc_id}/chunks
- POST /documents/{doc_id}/chunks
- PUT /documents/{doc_id}/chunks/{id}
- DELETE /documents/{doc_id}/chunks/{id}

#### `api/v1/routes/metadata.py` - MISSING
- POST /knowledge-bases/{kb_id}/metadata
- PATCH /knowledge-bases/{kb_id}/metadata/{id}
- DELETE /knowledge-bases/{kb_id}/metadata/{id}
- POST /knowledge-bases/{kb_id}/documents/metadata (assign)

#### `api/v1/routes/retrieve.py` - MISSING
- POST /knowledge-bases/{kb_id}/retrieve (search)

### 8. Database Extensions Needed

#### PostgreSQL Extensions
```sql
-- For vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- pgvector for embedding storage
-- Each chunk.embedding will be a vector(768) or vector(1536) depending on model
```

### 9. External Service Integrations Needed

#### File Processing
- PDF parser
- DOCX parser
- Excel/CSV parser
- HTML parser
- Markdown parser

#### Web Crawlers
- Firecrawl API client
- Jina Reader API client

#### Embedding Models
- Integration with embedding API (Secret AI or OpenAI)
- Model: sentence-transformers/multi-qa-mpnet-base-dot-v1

### 10. Background Tasks Needed

#### `tasks/document_processor.py` - MISSING
- Process uploaded documents
- Parse and chunk documents
- Generate embeddings
- Update indexing status

#### `tasks/web_crawler.py` - MISSING
- Crawl websites
- Parse web content to markdown
- Import as documents

#### `tasks/auto_disable.py` - MISSING
- Auto-disable documents after 20 days
- Cleanup old embeddings

## Summary

The current implementation covers the **Authentication & Multi-Tenancy** layer completely.

To have a **full RAG-enabled chatbot platform**, we need to add:

1. **6 new models** (KnowledgeBase, Document, Chunk, ChunkingConfig, WebCrawlerConfig, association tables)
2. **2 model updates** (Chatbot, Chatflow, Workspace)
3. **4 new schema files**
4. **5 new service files**
5. **Permission updates**
6. **5 new API route files**
7. **PostgreSQL pgvector extension**
8. **Background task workers**
9. **External service integrations** (file parsers, web crawlers, embedding APIs)

This represents approximately **50-60% additional work** beyond the authentication foundation.

## Next Steps

1. Decide if knowledge base implementation should be done now or later
2. If now, start with models → schemas → services → routes
3. Set up PostgreSQL with pgvector extension
4. Configure Celery for background tasks
5. Integrate external services (Firecrawl, Jina Reader, embedding models)
