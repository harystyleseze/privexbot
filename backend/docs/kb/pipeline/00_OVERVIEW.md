# Knowledge Base Pipeline - System Overview

## Mission Statement

Build a **production-ready, multi-source Knowledge Base ETL pipeline** that leverages existing multi-tenancy, authentication, and draft-first architecture to provide users with a seamless, powerful, and compliant document ingestion system.

## Core Philosophy

**Build on what works, enhance what's needed, avoid over-engineering.**

The existing codebase already provides:
- ✅ **Multi-tenancy** via Organization → Workspace → Resources
- ✅ **Authentication & Authorization** with JWT and role-based access
- ✅ **Draft-first architecture** using Redis for safe experimentation
- ✅ **Document processing pipeline** with status tracking
- ✅ **Flexible vector store support** (FAISS, Qdrant, Weaviate, etc.)
- ✅ **Rich metadata and annotations** system

## What We're Adding

### 1. Enhanced Multi-Source Ingestion
**Current State**: Supports file uploads, URLs, and text input
**Enhancement**: Add advanced web scraping (crawl, map, search, extract) and cloud integrations

### 2. Source Combination & Management
**Current State**: Individual documents per source
**Enhancement**: Combine multiple sources into unified knowledge bases with source tracking

### 3. Advanced Configuration & Preview
**Current State**: Basic chunking configuration
**Enhancement**: Per-source configuration, content preview, and user-friendly debugging

### 4. Seamless User Experience
**Current State**: Technical configuration
**Enhancement**: Progressive disclosure UI that scales from simple to advanced use cases

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│ KB Creation Wizard │ Source Manager │ Pipeline Monitor │ Config │
└─────────────────────────────────────────────────────────────────┘
                                    │
                            API Calls with JWT
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Python)                  │
├─────────────────────────────────────────────────────────────────┤
│                    EXISTING ARCHITECTURE                        │
│  • Multi-tenancy (verify_workspace_permission)                  │
│  • Draft Service (Redis)                                        │
│  • Document Processing Service                                  │
│  • Vector Store Service (Multi-provider)                       │
│  • Embedding Service                                            │
├─────────────────────────────────────────────────────────────────┤
│                    NEW ENHANCEMENTS                             │
│  • Enhanced Source Adapters (Web, Cloud)                       │
│  • Source Combination Service                                   │
│  • Configuration Management Service                             │
│  • Pipeline Monitoring Service                                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                        Background Processing (Celery)
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                               │
├─────────────────────────────────────────────────────────────────┤
│ Web Scraping │ File Uploads │ Cloud APIs │ Direct Text │ Combined│
│ • Crawl4AI    │ • 15+ formats│ • Google   │ • Paste     │ Sources │
│ • Firecrawl   │ • Unstructure│ • Notion   │ • Raw text  │         │
│ • Custom      │ • PyPDF2     │ • Dropbox  │             │         │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. **Leverage Existing Patterns**
```python
# Use existing tenant verification
verify_workspace_permission(db, workspace_id, org_id, user_id, "editor")

# Use existing draft system
draft_service.create_draft(DraftType.KB, workspace_id, user_id, kb_data)

# Use existing document model and processing
document_processing_service.process_file(db, file_path, kb_id, name)
```

### 2. **Native Compliance (Not Bolt-On)**
- **Multi-tenancy**: All queries filtered by workspace_id from JWT
- **Access Control**: Existing RBAC with verify_workspace_permission()
- **Data Isolation**: Documents stored with tenant-specific paths
- **Audit Logging**: Track all operations with user_id and timestamps

### 3. **Progressive Disclosure UX**
```
Simple Mode:    [Upload Files] [Add Website] → [Create KB]
                              ↓
Advanced Mode:  Multiple sources + chunking config + annotations
                              ↓
Expert Mode:    Pipeline debugging + performance tuning
```

### 4. **Source-Agnostic Processing**
```python
class SourceAdapter:
    """Unified interface for all data sources"""
    def extract_content(self) -> DocumentContent
    def get_metadata(self) -> dict
    def can_update(self) -> bool  # For cloud sources
```

## Implementation Modules

### Module 1: Enhanced Source Management
- **File**: `/docs/kb/pipeline/01_SOURCE_MANAGEMENT.md`
- **Focus**: Web scraping, cloud integrations, source adapters
- **Builds on**: Existing document_processing_service.py

### Module 2: Processing & Chunking Pipeline
- **File**: `/docs/kb/pipeline/02_PROCESSING_PIPELINE.md`
- **Focus**: Smart parsing, configurable chunking, status tracking
- **Builds on**: Existing chunking_service.py, embedding_service.py

### Module 3: Configuration & Annotation System
- **File**: `/docs/kb/pipeline/03_CONFIGURATION_SYSTEM.md`
- **Focus**: Per-source config, annotations, preview system
- **Builds on**: Existing Document.annotations and KB.config

### Module 4: User Experience & Frontend Integration
- **File**: `/docs/kb/pipeline/04_USER_EXPERIENCE.md`
- **Focus**: UI patterns, source combination, progressive disclosure
- **Builds on**: Existing API patterns and multi-tenancy

## File Structure Impact

### New Files to Add
```
backend/src/app/
├── services/
│   ├── source_adapter_service.py      # Enhanced source handling
│   ├── source_combination_service.py  # Combine multiple sources
│   └── pipeline_monitoring_service.py # Pipeline status & debugging
├── adapters/                          # NEW: Source adapter implementations
│   ├── __init__.py
│   ├── web_scraping_adapter.py        # Advanced web scraping
│   ├── cloud_integration_adapter.py   # Google Docs, Notion, etc.
│   └── file_upload_adapter.py         # Enhanced file processing
└── schemas/
    ├── source_schemas.py              # Source-specific schemas
    └── pipeline_schemas.py            # Pipeline monitoring schemas
```

### Enhanced Existing Files
- `services/kb_draft_service.py` → Add source combination support
- `services/document_processing_service.py` → Add adapter integration
- `api/v1/routes/knowledge_bases.py` → Add source management endpoints

## Success Metrics

### Performance Requirements
- **Upload Processing**: < 30 seconds for 10MB documents
- **Web Scraping**: < 2 minutes for 10 pages
- **Cloud Sync**: < 5 minutes for 100 documents
- **Search Response**: < 500ms for semantic queries

### User Experience Goals
- **Time to First KB**: < 5 minutes (upload → ready to use)
- **Source Addition**: < 2 clicks to add new source type
- **Error Recovery**: Clear messaging and retry options
- **Mobile Support**: Full KB creation and management on mobile

### Compliance & Security
- **Data Isolation**: 100% tenant separation (zero data leakage)
- **Access Control**: All operations verified via existing RBAC
- **Audit Trail**: Complete operation logging for SOC 2 compliance
- **Encryption**: Data encrypted at rest and in transit

## Next Steps

1. **Start with Module 1**: Enhanced source management (builds on existing patterns)
2. **Validate with existing services**: Ensure integration points work correctly
3. **Implement incrementally**: Add one source type at a time
4. **Test thoroughly**: Multi-tenancy isolation and performance
5. **Document patterns**: Create reusable patterns for future sources

The goal is a **simple, powerful, compliant KB system** that feels natural to use while leveraging the robust foundation already built.