Knowledge Base ETL Pipeline - How It All Works

Let me break down this Debuggable ETL Pipeline feature in simple terms, showing exactly how it's implemented and how all the pieces fit together.

🎯 What This Feature Is About

The Knowledge Pipeline is a visual, controllable ETL system where every step from document upload to final embedding is transparent and debuggable. Think of it like a factory assembly line
where you can see, test, and modify each station.

🏗️ High-Level Architecture

Frontend UI → Draft API → Processing Pipeline → Vector Store
↓ ↓ ↓ ↓
Preview Redis Draft Background Tasks PostgreSQL

📋 Backend Flow Implementation

1. Draft Creation (/src/app/services/draft_service.py)

# User starts KB creation

POST /api/v1/kb-drafts/
{
"name": "Product Docs",
"chunking_config": {...}
}

# Creates Redis draft (NOT database)

draft_service.create_draft(
draft_type="kb",
workspace_id=workspace_id,
initial_data=form_data
)

Why Redis: Keeps PostgreSQL clean during experimentation
File: services/draft_service.py:80-120

2. Document Upload Pipeline (/src/app/api/v1/routes/kb_draft.py)

# Step 1: Upload document to draft

POST /api/v1/kb-drafts/{id}/documents/upload

# Step 2: Preview parsing (without saving)

POST /api/v1/kb-drafts/{id}/preview-parsing

# Step 3: Preview chunking

POST /api/v1/kb-drafts/{id}/preview-chunks

# Step 4: Finalize (commit to database)

POST /api/v1/kb-drafts/{id}/finalize

File Flow:

- api/v1/routes/kb_draft.py:168-210 - Upload endpoint
- services/document_processing_service.py:43-108 - Smart parsing
- services/chunking_service.py:34-77 - Chunking strategies

🔍 Smart Parsing Implementation

Document Processing (/src/app/services/document_processing_service.py)

def \_process_pdf(self, file_path: str) -> dict:
"""Smart PDF parsing that preserves structure."""

      # Uses PyMuPDF for structure preservation
      import fitz  # PyMuPDF

      doc = fitz.open(file_path)
      structured_content = []

      for page in doc:
          # Extract text blocks with position
          blocks = page.get_text("dict")

          # Preserve tables, images, formatting
          for block in blocks["blocks"]:
              if "lines" in block:  # Text block
                  structured_content.append({
                      "type": "text",
                      "content": block_text,
                      "bbox": block["bbox"],  # Position
                      "page": page.number
                  })
              elif "image" in block:  # Image block
                  structured_content.append({
                      "type": "image",
                      "description": "Chart/Diagram",
                      "bbox": block["bbox"]
                  })

External Services Integration:

- integrations/unstructured_adapter.py - Advanced document parsing
- integrations/crawl4ai_adapter.py - Web content extraction
- Uses Unstructured.io for table/image preservation

🧩 Debuggable ETL Pipeline Flow

Pipeline Visualization (/src/app/services/pipeline_service.py)

class ETLPipelineStep:
"""Each step in the pipeline is inspectable."""

      def __init__(self, step_name, input_data, processor):
          self.step_name = step_name
          self.input_data = input_data
          self.processor = processor
          self.output_data = None
          self.errors = []
          self.metadata = {}

      async def execute(self):
          """Execute step with full debugging info."""
          try:
              self.output_data = await self.processor(self.input_data)
              self.status = "completed"
          except Exception as e:
              self.errors.append(str(e))
              self.status = "failed"

          return {
              "step": self.step_name,
              "status": self.status,
              "input_preview": str(self.input_data)[:200],
              "output_preview": str(self.output_data)[:200],
              "errors": self.errors
          }

Pipeline Steps Breakdown

# 1. Document Parsing Step

parsing_step = ETLPipelineStep(
"document_parsing",
raw_file_content,
document_processing_service.parse_document
)

# 2. Chunking Step

chunking_step = ETLPipelineStep(
"text_chunking",
parsed_content,
chunking_service.chunk_document
)

# 3. Embedding Step

embedding_step = ETLPipelineStep(
"embedding_generation",
chunks,
embedding_service.generate_embeddings
)

# 4. Vector Storage Step

indexing_step = ETLPipelineStep(
"vector_indexing",
embeddings,
vector_store_service.upsert_vectors
)

🖥️ Frontend Integration

KB Creation Wizard (/frontend/src/components/kb/)

// Step 1: Document Upload
<FileUploader
onUpload={(file) => uploadToQraft(draftId, file)}
onParsePreview={() => previewParsing(draftId, fileId)}
/>

// Step 2: Parsing Preview
<DocumentParsingPreview
onShowStructure={() => showDocumentStructure()}
onShowTables={() => highlightTables()}
onShowImages={() => showImagePlaceholders()}
/>

// Step 3: Chunking Configuration
<ChunkConfigPanel
onConfigChange={(config) => updateChunkingConfig(config)}
onPreview={() => previewChunks(draftId, config)}
/>

// Step 4: Pipeline Visualization
<ETLPipelineViewer
steps={pipelineSteps}
onStepInspect={(step) => inspectStep(step)}
onStepModify={(step) => modifyStepConfig(step)}
/>

Real-time Pipeline Status

// WebSocket connection for live updates
const pipelineSocket = new WebSocket(`/ws/pipeline/${draftId}`);

pipelineSocket.onmessage = (event) => {
const update = JSON.parse(event.data);

    // Update UI with step progress
    updatePipelineStep(update.step_name, {
      status: update.status,
      progress: update.progress,
      preview: update.output_preview,
      errors: update.errors
    });

};

Frontend Files:

- components/kb/ETLPipelineViewer.tsx - Pipeline visualization
- components/kb/DocumentParsingPreview.tsx - Structure preview
- components/kb/ChunkPreview.tsx - Chunking preview

🔄 Redis Draft System Implementation

How Redis Keeps PostgreSQL Clean

# services/draft_service.py

class UnifiedDraftService:

      def create_draft(self, draft_type: str, workspace_id: UUID, initial_data: dict):
          """Create draft in Redis, NOT database."""

          draft_id = f"draft_{draft_type}_{uuid4()}"

          draft_data = {
              "id": draft_id,
              "type": draft_type,
              "workspace_id": str(workspace_id),
              "data": initial_data,
              "created_at": datetime.utcnow().isoformat(),
              "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
              "pipeline_steps": [],  # Track each step
              "preview_data": {}     # Store preview results
          }

          # Store in Redis with TTL
          redis_client.setex(
              draft_id,
              86400,  # 24 hours
              json.dumps(draft_data)
          )

          return draft_id

      def finalize_draft(self, db: Session, draft_id: str):
          """Move from Redis to PostgreSQL when ready."""

          # Get draft from Redis
          draft = self.get_draft(draft_id)

          # Create KB in database
          kb = KnowledgeBase(**draft["data"])
          db.add(kb)
          db.commit()

          # Queue background processing
          process_kb_documents_task.delay(str(kb.id))

          # Delete from Redis
          redis_client.delete(draft_id)

⚡ Background Processing Implementation

Celery Task Chain (/src/app/tasks/document_tasks.py)

@shared_task(bind=True)
def process_document_task(self, document_id: str, kb_id: str):
"""Process document without blocking API."""

      # Update status in real-time
      self.update_state(
          state='PROGRESS',
          meta={'step': 'parsing', 'progress': 20}
      )

      # Step 1: Parse document
      parsed = document_processing_service.process_file(document_id)

      self.update_state(
          state='PROGRESS',
          meta={'step': 'chunking', 'progress': 50}
      )

      # Step 2: Create chunks
      chunks = chunking_service.create_chunks_for_document(document_id)

      self.update_state(
          state='PROGRESS',
          meta={'step': 'embedding', 'progress': 80}
      )

      # Step 3: Generate embeddings
      embeddings = embedding_service.generate_embeddings(chunks)

      # Step 4: Index in vector store
      vector_store_service.upsert_vectors(kb_id, embeddings)

      return {'status': 'completed', 'chunks_created': len(chunks)}

🔒 HIPAA/SOC2 Native Implementation

Data Encryption (/src/app/core/security.py)

class HIpaCompliantEncryption:
"""HIPAA-compliant encryption for sensitive data."""

      def encrypt_document_content(self, content: str) -> str:
          """Encrypt document content at rest."""

          # AES-256 encryption
          key = Fernet.generate_key()
          cipher = Fernet(key)

          encrypted_content = cipher.encrypt(content.encode())

          # Store key in separate secure storage
          self.store_encryption_key(document_id, key)

          return encrypted_content

      def audit_log_access(self, user_id: UUID, resource_id: UUID, action: str):
          """Log all data access for compliance."""

          audit_entry = {
              "timestamp": datetime.utcnow().isoformat(),
              "user_id": str(user_id),
              "resource_id": str(resource_id),
              "action": action,
              "ip_address": request.remote_addr,
              "user_agent": request.headers.get("User-Agent")
          }

          # Write to append-only audit log
          audit_logger.info(json.dumps(audit_entry))

Access Control (/src/app/services/permission_service.py)

def verify_hipaa_access(self, user: User, document_id: UUID) -> bool:
"""HIPAA-compliant access verification."""

      # 1. Check workspace membership
      if not self.is_workspace_member(user, document.workspace_id):
          self.audit_log_access(user.id, document_id, "ACCESS_DENIED")
          return False

      # 2. Check role-based permissions
      required_permission = "document:read"
      if not self.has_permission(user, required_permission):
          self.audit_log_access(user.id, document_id, "PERMISSION_DENIED")
          return False

      # 3. Log successful access
      self.audit_log_access(user.id, document_id, "ACCESS_GRANTED")

      return True

🚀 Performance & Speed Optimizations

1. Concurrent Processing (/src/app/services/embedding_service.py)

async def generate_embeddings_batch(self, chunks: List[str]) -> List[List[float]]:
"""Process multiple chunks concurrently."""

      # Split into optimal batch sizes
      batch_size = 50  # Optimal for most embedding APIs
      batches = [chunks[i:i+batch_size] for i in range(0, len(chunks), batch_size)]

      # Process batches concurrently
      tasks = [self._process_batch(batch) for batch in batches]
      results = await asyncio.gather(*tasks)

      # Flatten results
      return [embedding for batch_result in results for embedding in batch_result]

2. Redis Caching (/src/app/services/vector_store_service.py)

async def search_with_cache(self, kb_id: UUID, query: str, top_k: int):
"""Cache search results for performance."""

      # Generate cache key
      cache_key = f"search:{kb_id}:{hashlib.md5(query.encode()).hexdigest()}:{top_k}"

      # Check cache first
      cached_result = redis_client.get(cache_key)
      if cached_result:
          return json.loads(cached_result)

      # Perform search
      results = await self.search_vectors(kb_id, query, top_k)

      # Cache for 1 hour
      redis_client.setex(cache_key, 3600, json.dumps(results))

      return results

3. Connection Pooling (/src/app/core/config.py)

# Database connection pool

DATABASE_POOL_SIZE = 20
DATABASE_MAX_OVERFLOW = 30

# Redis connection pool

REDIS_CONNECTION_POOL = redis.ConnectionPool(
host=settings.REDIS_HOST,
port=settings.REDIS_PORT,
max_connections=50
)

# Vector store connection pool

QDRANT_CONNECTION_POOL = {
"pool_size": 10,
"timeout": 30
}

📁 File Structure & Connections

/src/app/
├── api/v1/routes/
│ ├── kb_draft.py # Draft API endpoints
│ └── knowledge_bases.py # Production KB API
├── services/
│ ├── draft_service.py # Redis draft management
│ ├── document_processing_service.py # Smart parsing
│ ├── chunking_service.py # Chunking strategies
│ ├── embedding_service.py # Embedding generation
│ └── vector_store_service.py # Vector operations
├── tasks/
│ └── document_tasks.py # Background processing
├── integrations/
│ ├── unstructured_adapter.py # Document parsing
│ └── crawl4ai_adapter.py # Web scraping
└── models/
├── knowledge_base.py # KB data model
├── document.py # Document model
└── chunk.py # Chunk model

🔗 How It All Connects

1. Frontend calls /api/v1/kb-drafts/ endpoints
2. API routes use draft_service for Redis operations
3. Background tasks handle heavy processing
4. Services orchestrate the ETL pipeline
5. Integrations connect to external parsing services
6. Models define data structure in PostgreSQL

The key insight: Redis drafts + Background processing + Smart parsing + Visual debugging = Fast, reliable, debuggable KB creation that doesn't pollute your database during experimentation.
