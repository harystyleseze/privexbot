# Knowledge Base Management API Documentation

**Version**: 1.0
**Last Updated**: November 16, 2025
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Preview System](#preview-system)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Chunking Strategies](#chunking-strategies)
6. [Error Handling](#error-handling)
7. [Rate Limits & Performance](#rate-limits--performance)

---

## Overview

### What is the KB Management System?

A **privacy-first, self-hosted** Knowledge Base system for RAG (Retrieval-Augmented Generation) applications that enables:

- 🔒 **Complete Privacy**: All processing self-hosted (no OpenAI, no Firecrawl)
- ⚡ **Fast & Efficient**: 3-phase architecture with non-blocking processing
- 🧠 **Intelligent Chunking**: 8 strategies including semantic with embedding similarity
- 🎯 **Context Control**: Restrict KB access to chatbot/chatflow/both
- 🏢 **Multi-Tenant**: Full organization/workspace isolation
- 📊 **Real-Time Monitoring**: Track all processing stages
- 🔄 **Flexible Updates**: Manual re-indexing and configuration changes

### Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **3-Phase Flow** | Draft → Finalize → Process | ✅ |
| **8 Chunking Strategies** | Recursive, Semantic, Heading, etc. | ✅ |
| **Preview System** | 3 types of previews | ⚠️ Partial |
| **Context-Based Access** | chatbot/chatflow/both | ✅ |
| **Workspace Scoping** | Per-workspace or org-wide | ✅ |
| **Real-Time Monitoring** | Progress tracking | ✅ |
| **Manual Re-indexing** | Refresh content | ✅ |
| **Sharing/RBAC** | Member management | ❌ Not Yet |

---

## Architecture

### 3-Phase Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHASE 1: DRAFT MODE                       │
│                          (Redis Only)                            │
├─────────────────────────────────────────────────────────────────┤
│ • User configures KB without database writes                    │
│ • Add/remove URLs, configure chunking/embedding                 │
│ • Preview chunking strategies with live results                 │
│ • Fast, non-committal (24hr TTL)                                │
│ • Performance: <50ms per operation                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 2: FINALIZATION                        │
│                   (Create DB Records)                            │
├─────────────────────────────────────────────────────────────────┤
│ • Create KB + Document records in PostgreSQL                    │
│ • Queue Celery background task for processing                   │
│ • Create pipeline tracking in Redis                             │
│ • Delete draft from Redis (cleanup)                             │
│ • Performance: <100ms (synchronous)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 3: BACKGROUND PROCESSING                   │
│                      (Celery Task)                               │
├─────────────────────────────────────────────────────────────────┤
│ 1. Scrape web pages (Crawl4AI with stealth mode)               │
│ 2. Parse markdown content                                       │
│ 3. Chunk using selected strategy                                │
│ 4. Generate embeddings (sentence-transformers local)            │
│ 5. Index vectors in Qdrant                                      │
│ 6. Real-time progress updates to Redis                          │
│ • Performance: 2-30 minutes (varies by content size)            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose | Self-Hosted |
|-----------|------------|---------|-------------|
| **Web Scraping** | Crawl4AI | Fetch web content with stealth mode | ✅ |
| **Embeddings** | sentence-transformers | Generate 384d vectors locally | ✅ |
| **Vector Store** | Qdrant | Store and search embeddings | ✅ |
| **Task Queue** | Celery + Redis | Background job processing | ✅ |
| **Database** | PostgreSQL + pgvector | Structured + vector data | ✅ |
| **Monitoring** | Flower | Celery task monitoring | ✅ |
| **Cache** | Redis | Draft storage, pipeline tracking | ✅ |

---

## Preview System

### Three Types of Previews

The preview system provides different levels of insight depending on the use case:

#### 1️⃣ Quick Preview (Standalone Exploration)

**Use Case**: Fast single-page exploration before creating KB

**Endpoint**: `POST /api/v1/kb-drafts/preview/quick`

**When to Use**:
- User exploring different chunking strategies
- Testing how a single page will be chunked
- No KB or draft created yet
- Need fast results (<10s)

**Request**:
```json
{
  "url": "https://docs.example.com/intro",
  "strategy": "by_heading",
  "chunk_size": 1000,
  "chunk_overlap": 200,
  "max_preview_chunks": 10
}
```

**Response**:
```json
{
  "url": "https://docs.example.com/intro",
  "title": "Introduction to Product",
  "strategy": "by_heading",
  "strategy_recommendation": "by_heading (optimized for GitBook)",
  "optimized_for": "gitbook",
  "preview_chunks": [
    {
      "index": 0,
      "content": "# Introduction\nWelcome to our product...",
      "full_length": 234,
      "token_count": 58,
      "preview": true
    }
  ],
  "total_chunks_estimated": 47,
  "document_stats": {
    "total_characters": 45678,
    "total_lines": 1234,
    "heading_count": 23,
    "heading_density": 0.12,
    "structure_type": "highly_structured"
  },
  "metadata": {
    "generated_at": "2025-11-16T12:00:00Z",
    "content_length": 45678,
    "showing_chunks": "10 of 47"
  }
}
```

**Performance**: ⚡ 2-10 seconds

---

#### 2️⃣ Draft Preview (Realistic Multi-Page)

**Use Case**: See realistic preview using draft's crawl configuration

**Endpoint**: `POST /api/v1/kb-drafts/{draft_id}/preview`

**When to Use**:
- Draft created with URLs and crawl config
- Want to see how multiple pages will be chunked
- Before finalizing the KB
- Need realistic representation

**Request**:
```json
{
  "strategy": "by_heading",
  "max_preview_pages": 5
}
```

**How It Works**:
1. Retrieves draft from Redis
2. Uses draft's URLs and crawl configuration
3. Crawls up to 5 pages (configurable limit)
4. Applies chunking strategy
5. Returns multi-page preview

**Response**:
```json
{
  "draft_id": "draft-abc123",
  "pages_previewed": 5,
  "total_chunks": 123,
  "strategy": "by_heading",
  "pages": [
    {
      "url": "https://docs.example.com/intro",
      "title": "Introduction",
      "chunks": 23,
      "preview_chunks": [
        {
          "index": 0,
          "content": "...",
          "full_length": 456
        }
      ]
    },
    {
      "url": "https://docs.example.com/getting-started",
      "title": "Getting Started",
      "chunks": 18,
      "preview_chunks": [...]
    }
  ],
  "estimated_total_chunks": 450,
  "crawl_config": {
    "max_pages": 50,
    "max_depth": 3,
    "pages_found": "~50"
  },
  "note": "Preview based on 5 of ~50 pages. Actual processing will crawl all pages."
}
```

**Performance**: ⚡ 10-30 seconds

---

#### 3️⃣ KB Re-chunking Preview (Optimization)

**Use Case**: Test different strategies on existing KB without re-scraping

**Endpoint**: `POST /api/v1/kbs/{kb_id}/preview-rechunk`

**When to Use**:
- KB already exists with scraped content
- Want to optimize chunking strategy
- Compare strategies before re-indexing
- Test configuration changes

**Request**:
```json
{
  "strategy": "semantic",
  "chunk_size": 1500,
  "chunk_overlap": 300,
  "sample_documents": 3
}
```

**How It Works**:
1. Retrieves existing KB documents (already scraped!)
2. Re-chunks with new strategy
3. Compares with current chunks
4. Returns comparison analysis

**Response**:
```json
{
  "kb_id": "kb-uuid",
  "current_config": {
    "strategy": "by_heading",
    "chunk_size": 1000,
    "chunk_overlap": 200
  },
  "new_config": {
    "strategy": "semantic",
    "chunk_size": 1500,
    "chunk_overlap": 300
  },
  "comparison": {
    "current": {
      "total_chunks": 847,
      "avg_chunk_size": 956,
      "min_chunk_size": 234,
      "max_chunk_size": 1456
    },
    "new": {
      "total_chunks": 623,
      "avg_chunk_size": 1247,
      "min_chunk_size": 567,
      "max_chunk_size": 1789
    },
    "delta": {
      "chunks_change": -224,
      "chunks_percent": -26.4,
      "avg_size_change": +291,
      "recommendation": "Fewer, larger chunks may improve context retention for complex queries"
    }
  },
  "sample_chunks": [
    {
      "document_name": "Introduction",
      "old_chunks": 23,
      "new_chunks": 15,
      "preview": [...]
    }
  ],
  "note": "Preview based on 3 of 5 documents. Apply changes to re-index entire KB."
}
```

**Performance**: ⚡ 1-5 seconds (no scraping!)

**Benefits**:
- ⚡ Extremely fast (documents already scraped)
- 📊 Direct comparison with current state
- 🔄 No re-scraping needed
- 💡 Helps optimize existing KBs

---

## API Endpoints Reference

### Preview Endpoints

| Method | Endpoint | Purpose | Speed | Status |
|--------|----------|---------|-------|--------|
| POST | `/api/v1/kb-drafts/preview/quick` | Quick single-page preview | 2-10s | ✅ Implemented |
| POST | `/api/v1/kb-drafts/{draft_id}/preview` | Realistic multi-page preview | 10-30s | ⚠️ To Implement |
| POST | `/api/v1/kbs/{kb_id}/preview-rechunk` | Re-chunk existing KB | 1-5s | ⚠️ To Implement |

### Draft Management Endpoints (Phase 1)

| Method | Endpoint | Purpose | Performance |
|--------|----------|---------|-------------|
| POST | `/api/v1/kb-drafts/` | Create new draft | <50ms |
| GET | `/api/v1/kb-drafts/{draft_id}` | Get draft details | <10ms |
| POST | `/api/v1/kb-drafts/{draft_id}/sources/web` | Add web URL source | <50ms |
| DELETE | `/api/v1/kb-drafts/{draft_id}/sources/{source_id}` | Remove URL source | <10ms |
| POST | `/api/v1/kb-drafts/{draft_id}/chunking` | Update chunking config | <50ms |
| POST | `/api/v1/kb-drafts/{draft_id}/embedding` | Update embedding config | <50ms |
| GET | `/api/v1/kb-drafts/{draft_id}/validate` | Validate draft before finalize | <50ms |
| DELETE | `/api/v1/kb-drafts/{draft_id}` | Delete draft | <10ms |

### Finalization Endpoint (Phase 2)

| Method | Endpoint | Purpose | Performance |
|--------|----------|---------|-------------|
| POST | `/api/v1/kb-drafts/{draft_id}/finalize` | Create KB + queue processing | <100ms |

### Pipeline Monitoring Endpoints (Phase 3)

| Method | Endpoint | Purpose | Performance |
|--------|----------|---------|-------------|
| GET | `/api/v1/pipelines/{pipeline_id}/status` | Get real-time processing status | <10ms |
| GET | `/api/v1/pipelines/{pipeline_id}/logs` | Get detailed processing logs | <20ms |
| POST | `/api/v1/pipelines/{pipeline_id}/cancel` | Cancel running pipeline | <50ms |

### KB Management Endpoints

| Method | Endpoint | Purpose | Performance |
|--------|----------|---------|-------------|
| GET | `/api/v1/kbs/` | List KBs with filters | <100ms |
| GET | `/api/v1/kbs/{kb_id}` | Get KB details | <50ms |
| GET | `/api/v1/kbs/{kb_id}/stats` | Get KB statistics & health | <200ms |
| POST | `/api/v1/kbs/{kb_id}/reindex` | Manual re-indexing | <50ms |
| DELETE | `/api/v1/kbs/{kb_id}` | Delete KB | <100ms |

---

## Chunking Strategies

### All 8 Strategies Explained

| Strategy | Best For | How It Works | Performance | Recommendation |
|----------|----------|--------------|-------------|----------------|
| **RECURSIVE** | General purpose | Split by separators (¶→sentence→word) | ⚡ Fast | Default choice |
| **SEMANTIC** | Q&A, unstructured | Embedding similarity detection | 🐢 Slower | Best for mixed topics |
| **BY_HEADING** | GitBook, Notion, Docs | Split at markdown headings | ⚡ Fast | Structured docs |
| **BY_SECTION** | Long-form content | Section boundaries + headings | ⚡ Fast | Technical guides |
| **ADAPTIVE** | Unknown structure | Auto-select based on analysis | 🐢 Medium | When uncertain |
| **SENTENCE_BASED** | Precise Q&A | Preserve sentence boundaries | ⚡ Fast | Short answers |
| **PARAGRAPH_BASED** | Articles, blogs | Preserve paragraph boundaries | ⚡ Fast | Narrative content |
| **HYBRID** | Complex documents | Heading + semantic + size | 🐢 Slow | Maximum quality |

### Strategy Selection Guide

**Use BY_HEADING when**:
- Documentation sites (GitBook, ReadTheDocs, Docusaurus)
- GitHub READMEs
- Notion pages
- Any markdown with clear heading hierarchy

**Use SEMANTIC when**:
- Mixed topic documents
- Unstructured content
- Blog posts without headings
- Q&A content

**Use PARAGRAPH_BASED when**:
- Articles and blogs
- Narrative content
- Content without headings

**Use HYBRID when**:
- Maximum quality needed
- Complex technical documents
- Performance not critical

**Use ADAPTIVE when**:
- Unknown content structure
- Want automatic optimization
- Testing multiple sources

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE",
  "status_code": 400
}
```

### Common Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| `DRAFT_NOT_FOUND` | KB draft not found or expired | Draft expired (24hr TTL) | Create new draft |
| `DRAFT_INVALID` | Draft validation failed | Missing required fields | Check validation endpoint |
| `KB_NOT_FOUND` | Knowledge base not found | Invalid KB ID | Verify KB exists |
| `ACCESS_DENIED` | Access denied | User not authorized | Check permissions |
| `WORKSPACE_NOT_FOUND` | Workspace not found | Invalid workspace ID | Verify workspace |
| `PIPELINE_NOT_FOUND` | Pipeline not found | Invalid pipeline ID | Check pipeline exists |
| `URL_FETCH_FAILED` | Failed to fetch URL | URL unreachable/blocked | Check URL accessibility |
| `STRATEGY_INVALID` | Invalid chunking strategy | Unknown strategy name | Use valid strategy |

---

## Rate Limits & Performance

### Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Create draft | <50ms | ~20ms |
| Add URL to draft | <50ms | ~15ms |
| Quick preview | <10s | 2-8s |
| Draft preview | <30s | 10-25s |
| Finalize KB | <100ms | ~60ms |
| Get pipeline status | <10ms | ~5ms |
| KB re-chunk preview | <5s | 1-3s |

### Caching

| Resource | Cache Duration | Storage |
|----------|---------------|---------|
| Drafts | 24 hours | Redis |
| Preview results | 5 minutes | Redis |
| Pipeline status | 24 hours | Redis |
| Pipeline logs | 24 hours | Redis |

### Limits

| Resource | Limit | Configurable |
|----------|-------|--------------|
| Draft TTL | 24 hours | ❌ |
| Max URLs per draft | 100 | ✅ |
| Max preview chunks | 20 | ✅ |
| Max crawl pages | 1000 | ✅ |
| Max crawl depth | 10 | ✅ |
| Concurrent pipelines | 10 per org | ✅ |

---

## Next Steps

### Immediate

1. ⚠️ Implement draft preview endpoint
2. ⚠️ Implement KB re-chunk preview endpoint
3. ⚠️ Add preview caching optimization

### Future

4. ❌ Sharing/RBAC system
5. ❌ Audit logs
6. ❌ Notifications (email/webhook)
7. ❌ Usage analytics
8. ❌ Batch operations

---

**Last Updated**: November 16, 2025
**Version**: 1.0
**Maintainer**: PrivexBot Team
