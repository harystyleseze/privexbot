# Knowledge Base Management - Frontend User Journey & Implementation Guide

**Version**: 2.0
**Last Updated**: January 16, 2025
**Status**: ✅ Production Ready (with Inspection & CRUD)
**Audience**: Frontend Developers

---

## Table of Contents

1. [Overview](#overview)
2. [Complete User Journeys](#complete-user-journeys)
3. [Page Layouts & Components](#page-layouts--components)
4. [API Endpoints by Feature](#api-endpoints-by-feature)
5. [Frontend Implementation Patterns](#frontend-implementation-patterns)
6. [State Management](#state-management)
7. [Error Handling & Edge Cases](#error-handling--edge-cases)
8. [UI/UX Best Practices](#uiux-best-practices)

---

## Overview

### What's New in v2.0

**NEW FEATURES:**
- ✅ Draft Inspection (preview pages & chunks before finalization)
- ✅ KB Document Management (list, filter, search documents)
- ✅ Document CRUD Operations (create, update, delete manually)
- ✅ Chunk Browser (inspect and verify chunked content)
- ✅ Content Quality Verification (confidence in clean markdown)

### System Architecture

The KB Management system follows a **3-phase flow**:

**Phase 1: Draft Mode** (Redis, <50ms response)
- Create draft
- Add sources
- Configure chunking
- **NEW: Preview pages & chunks** ← Before finalization!

**Phase 2: Finalization** (<100ms response)
- Create DB records
- Queue background processing
- Return pipeline tracking ID

**Phase 3: Background Processing** (2-30 minutes)
- Scrape pages
- Chunk content
- Generate embeddings
- Index in Qdrant
- **NEW: Inspect & manage documents** ← After completion!

---

## Complete User Journeys

### Journey 1: Create KB with Draft Preview (NEW Enhanced Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│          USER JOURNEY: CREATE KB WITH PREVIEW INSPECTION        │
└─────────────────────────────────────────────────────────────────┘

Step 1: EXPLORE CHUNKING (Optional but Recommended)
┌──────────────────────────────────────────────────────────────┐
│ User Action: Paste URL to preview                            │
│ Frontend: Call POST /api/v1/kb-drafts/preview/quick          │
│ Response Time: 2-10 seconds                                  │
│ Display: Preview chunks + strategy recommendation            │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 2: CREATE DRAFT
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "Create Knowledge Base"                   │
│ Frontend: Call POST /api/v1/kb-drafts/                       │
│ Response Time: <50ms                                         │
│ Store: draft_id in state                                     │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 3: CONFIGURE KB SETTINGS
┌──────────────────────────────────────────────────────────────┐
│ User Input: Name, description, workspace, context            │
│ Frontend: Local state (no API call yet)                      │
│ UI: Form with fields:                                        │
│   - Name* (required)                                         │
│   - Description                                              │
│   - Workspace dropdown*                                      │
│   - Context: chatbot | chatflow | both*                      │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 4: ADD WEB SOURCES
┌──────────────────────────────────────────────────────────────┐
│ User Action: Add URLs one by one                             │
│ For each URL:                                                │
│   Frontend: Call POST /api/v1/kb-drafts/{id}/sources/web    │
│   Payload: {                                                 │
│     "url": "https://docs.example.com",                       │
│     "config": {                                              │
│       "method": "crawl",                                     │
│       "max_pages": 50,                                       │
│       "max_depth": 3,                                        │
│       "include_patterns": ["/docs/**"],                      │
│       "exclude_patterns": ["/admin/**"]                      │
│     }                                                        │
│   }                                                          │
│ Response Time: <50ms per URL                                 │
│ UI: Show list of added URLs with remove button               │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 5: CONFIGURE CHUNKING STRATEGY
┌──────────────────────────────────────────────────────────────┐
│ User Action: Select strategy and parameters                  │
│ Frontend: Call POST /api/v1/kb-drafts/{id}/chunking         │
│ Payload: {                                                   │
│   "strategy": "by_heading",                                  │
│   "chunk_size": 1000,                                        │
│   "chunk_overlap": 200                                       │
│ }                                                            │
│ Response Time: <50ms                                         │
│ UI: Dropdown with 8 strategies + size/overlap sliders        │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 6: PREVIEW REALISTIC CHUNKS (Optional but Recommended)
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "Preview Chunking"                        │
│ Frontend: Call POST /api/v1/kb-drafts/{id}/preview          │
│ Payload: {                                                   │
│   "strategy": "by_heading",  // optional override            │
│   "max_preview_pages": 5                                     │
│ }                                                            │
│ Response Time: 10-30 seconds                                 │
│ UI: Loading spinner → Show preview results                   │
│ Display:                                                     │
│   - Pages previewed: 5                                       │
│   - Total chunks: 123                                        │
│   - Estimated total: ~450 chunks                             │
│   - Per-page breakdown with sample chunks                    │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 7: INSPECT PREVIEW PAGES ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "View Preview Pages"                      │
│ Frontend: GET /api/v1/kb-drafts/{id}/pages                  │
│ Response Time: <100ms (cached from preview)                  │
│ Display: List of scraped pages with stats                    │
│                                                              │
│ UI Shows:                                                    │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Page 1: Getting Started                               │  │
│ │ URL: docs.example.com/intro                           │  │
│ │ Word count: 450 | Chunks: 3                           │  │
│ │ [View Content] [View Chunks]                          │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ Page 2: API Reference                                 │  │
│ │ URL: docs.example.com/api                             │  │
│ │ Word count: 1,200 | Chunks: 8                         │  │
│ │ [View Content] [View Chunks]                          │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 8: VIEW SPECIFIC PAGE CONTENT ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "View Content" on a page                  │
│ Frontend: GET /api/v1/kb-drafts/{id}/pages/0                │
│ Response Time: <100ms                                        │
│                                                              │
│ UI Shows (Modal/Drawer):                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Getting Started                                        │  │
│ │ docs.example.com/intro                                │  │
│ │                                                        │  │
│ │ # Getting Started                                      │  │
│ │                                                        │  │
│ │ Welcome to our API documentation...                   │  │
│ │ [Full markdown content displayed]                     │  │
│ │                                                        │  │
│ │ ✅ Content is clean (no HTML tags)                    │  │
│ │ ✅ No navigation/footer elements                      │  │
│ │                                                        │  │
│ │ Stats: 450 words | 3 chunks                           │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 9: BROWSE PREVIEW CHUNKS ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "View All Chunks"                         │
│ Frontend: GET /api/v1/kb-drafts/{id}/chunks?page=1&limit=20 │
│ Response Time: <100ms                                        │
│                                                              │
│ UI Shows (Chunk Browser):                                    │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Showing 20 of 123 chunks                               │  │
│ │                                                        │  │
│ │ Filter: [All Pages ▼] [Search chunks...]              │  │
│ │                                                        │  │
│ │ ┌────────────────────────────────────────────────┐    │  │
│ │ │ Chunk #1 | From: Page 1 (Getting Started)     │    │  │
│ │ │ # Getting Started                              │    │  │
│ │ │ Welcome to our API...                          │    │  │
│ │ │ 150 words | 950 chars                          │    │  │
│ │ └────────────────────────────────────────────────┘    │  │
│ │                                                        │  │
│ │ [Pagination: 1 2 3 4 5 ... 7]                          │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ User Confidence: ✅ Content looks clean and well-chunked!   │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 10: PROCEED WITH CONFIDENCE
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "Create Knowledge Base"                   │
│ Frontend: POST /api/v1/kb-drafts/{id}/finalize              │
│ (User is confident because they previewed the content)       │
└──────────────────────────────────────────────────────────────┘
```

---

### Journey 2: Manage Documents in Existing KB (NEW)

```
┌─────────────────────────────────────────────────────────────────┐
│           USER JOURNEY: DOCUMENT MANAGEMENT IN KB                │
└─────────────────────────────────────────────────────────────────┘

Step 1: NAVIGATE TO KB DETAILS
┌──────────────────────────────────────────────────────────────┐
│ Frontend: GET /api/v1/kbs/{kb_id}                           │
│ Display: KB overview with tabs:                              │
│   - Overview                                                 │
│   - Documents ✨ NEW                                         │
│   - Chunks ✨ NEW                                            │
│   - Settings                                                 │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 2: BROWSE DOCUMENTS ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "Documents" tab                           │
│ Frontend: GET /api/v1/kbs/{kb_id}/documents?page=1&limit=20 │
│                                                              │
│ UI Layout (Documents Tab):                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Documents (50)                              [+ Add]    │  │
│ │                                                        │  │
│ │ Filter: [Status: All ▼] [Source: All ▼]               │  │
│ │ Search: [Search by name or URL...]                    │  │
│ │                                                        │  │
│ │ ┌──────────────────────────────────────────────────┐  │  │
│ │ │ ✅ API Documentation                             │  │  │
│ │ │ Source: docs.example.com/api                     │  │  │
│ │ │ Chunks: 15 | Status: Completed                   │  │  │
│ │ │ [View] [Edit] [Delete]                           │  │  │
│ │ ├──────────────────────────────────────────────────┤  │  │
│ │ │ ⏳ Installation Guide                            │  │  │
│ │ │ Source: Web Scraping                             │  │  │
│ │ │ Chunks: 8 | Status: Processing (45%)             │  │  │
│ │ │ [View Progress]                                  │  │  │
│ │ └──────────────────────────────────────────────────┘  │  │
│ │                                                        │  │
│ │ [Pagination: 1 2 3]                                    │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 3: VIEW DOCUMENT DETAILS ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "View" on a document                      │
│ Frontend: GET /api/v1/kbs/{kb_id}/documents/{doc_id}        │
│                                                              │
│ UI Shows (Modal or Detail Page):                             │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ API Documentation                                      │  │
│ │ docs.example.com/api                                  │  │
│ │                                                        │  │
│ │ Status: ✅ Completed                                   │  │
│ │ Source Type: Web Scraping                             │  │
│ │ Created: Jan 15, 2025                                 │  │
│ │                                                        │  │
│ │ Stats:                                                 │  │
│ │ - 1,500 words | 9,500 characters                      │  │
│ │ - 15 chunks generated                                 │  │
│ │ - All chunks indexed                                  │  │
│ │                                                        │  │
│ │ Content Preview:                                       │  │
│ │ ┌──────────────────────────────────────────────┐      │  │
│ │ │ # API Documentation                          │      │  │
│ │ │                                              │      │  │
│ │ │ Welcome to our API...                        │      │  │
│ │ │ [First 500 characters]                       │      │  │
│ │ └──────────────────────────────────────────────┘      │  │
│ │                                                        │  │
│ │ [Edit Document] [View Chunks] [Delete]                │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 4: ADD NEW DOCUMENT MANUALLY ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "+ Add" button                            │
│                                                              │
│ UI Shows (Add Document Modal):                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Add Document to Knowledge Base                         │  │
│ │                                                        │  │
│ │ Name: [____________]                                   │  │
│ │ Source Type: [Manual ▼]                                │  │
│ │ Source URL: [____________] (optional)                  │  │
│ │                                                        │  │
│ │ Content: (Markdown supported)                          │  │
│ │ ┌──────────────────────────────────────────────┐      │  │
│ │ │ # How to Use Our API                         │      │  │
│ │ │                                              │      │  │
│ │ │ This guide explains...                       │      │  │
│ │ │ [Markdown editor with preview]               │      │  │
│ │ └──────────────────────────────────────────────┘      │  │
│ │                                                        │  │
│ │ Custom Metadata (optional):                            │  │
│ │ ┌──────────────────────────────────────────────┐      │  │
│ │ │ { "author": "John", "version": "1.0" }       │      │  │
│ │ └──────────────────────────────────────────────┘      │  │
│ │                                                        │  │
│ │ [Cancel] [Add Document]                                │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Frontend: POST /api/v1/kbs/{kb_id}/documents                │
│ Response: { id, status: "processing", processing_job_id }   │
│                                                              │
│ UI: Show toast → "Document added. Processing in background"  │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 5: EDIT DOCUMENT ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "Edit" on a document                      │
│                                                              │
│ UI Shows (Edit Modal - Similar to Add):                      │
│ - Pre-populated with existing content                        │
│ - Shows warning if content will be reprocessed               │
│                                                              │
│ User Changes:                                                 │
│ Option 1: Edit content → Triggers reprocessing               │
│ Option 2: Edit metadata only → Instant update                │
│                                                              │
│ Frontend: PUT /api/v1/kbs/{kb_id}/documents/{doc_id}        │
│                                                              │
│ Response (Content Changed):                                  │
│ {                                                            │
│   "status": "processing",                                    │
│   "message": "Re-chunking and re-indexing...",              │
│   "processing_job_id": "task-67890"                         │
│ }                                                            │
│                                                              │
│ Response (Metadata Only):                                    │
│ {                                                            │
│   "message": "Document updated successfully",                │
│   "changes_applied": ["name", "custom_metadata"]            │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
         ↓
Step 6: DELETE DOCUMENT ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ User Action: Click "Delete" on a document                    │
│                                                              │
│ UI Shows (Confirmation Dialog):                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ⚠️  Delete Document?                                    │  │
│ │                                                        │  │
│ │ Are you sure you want to delete "API Documentation"?  │  │
│ │                                                        │  │
│ │ This will:                                             │  │
│ │ - Delete the document                                 │  │
│ │ - Remove all 15 chunks                                │  │
│ │ - Remove vectors from search index                    │  │
│ │                                                        │  │
│ │ This action cannot be undone.                         │  │
│ │                                                        │  │
│ │ [Cancel] [Delete Document]                            │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Frontend: DELETE /api/v1/kbs/{kb_id}/documents/{doc_id}     │
│                                                              │
│ Response:                                                    │
│ {                                                            │
│   "message": "Document deleted successfully",                │
│   "deleted": {                                               │
│     "document_id": "...",                                    │
│     "chunks_deleted": 15,                                    │
│     "qdrant_points_deleted": 15                             │
│   }                                                          │
│ }                                                            │
│                                                              │
│ UI: Show success toast, refresh document list                │
└──────────────────────────────────────────────────────────────┘
```

---

### Journey 3: Chunk Browser & Quality Verification (NEW)

```
┌─────────────────────────────────────────────────────────────────┐
│         USER JOURNEY: VERIFY CONTENT QUALITY VIA CHUNKS          │
└─────────────────────────────────────────────────────────────────┘

Step 1: NAVIGATE TO CHUNKS TAB ✨ NEW
┌──────────────────────────────────────────────────────────────┐
│ Frontend: GET /api/v1/kbs/{kb_id}/chunks?page=1&limit=50    │
│                                                              │
│ UI Layout (Chunks Tab):                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Chunks (847)                                           │  │
│ │                                                        │  │
│ │ [Search in chunks...] [Items per page: 50 ▼]          │  │
│ │                                                        │  │
│ │ ┌──────────────────────────────────────────────────┐  │  │
│ │ │ Chunk #1                                         │  │  │
│ │ │ From: API Documentation (docs.example.com/api)   │  │  │
│ │ │                                                  │  │  │
│ │ │ # API Authentication                             │  │  │
│ │ │                                                  │  │  │
│ │ │ Use Bearer tokens for authentication...         │  │  │
│ │ │ [150 words shown, click to expand]               │  │  │
│ │ │                                                  │  │  │
│ │ │ ✅ Clean markdown | ✅ No HTML tags              │  │  │
│ │ │ 150 words | 950 chars | Position: 0             │  │  │
│ │ │ [Expand] [Copy] [View Document]                  │  │  │
│ │ ├──────────────────────────────────────────────────┤  │  │
│ │ │ Chunk #2                                         │  │  │
│ │ │ From: Installation Guide                        │  │  │
│ │ │ ...                                              │  │  │
│ │ └──────────────────────────────────────────────────┘  │  │
│ │                                                        │  │
│ │ [Pagination: 1 2 3 ... 17]                             │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ User Can:                                                     │
│ - Verify content is clean (no nav/footer elements)          │
│ - Check chunking quality                                     │
│ - Jump to source document                                    │
│ - Copy chunks for testing                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Page Layouts & Components

### 1. KB Details Page (Enhanced with New Tabs)

```tsx
<KBDetailsPage>
  <Header>
    <Breadcrumbs>
      <Link to="/kbs">Knowledge Bases</Link> / Product Documentation
    </Breadcrumbs>
    <Title>Product Documentation</Title>
    <StatusBadge status="ready" />
    <Actions>
      <Button variant="secondary">Settings</Button>
      <Button variant="primary">Add Document</Button>
    </Actions>
  </Header>

  <StatsCards>
    <StatCard icon={FileText} label="Documents" value="50" />
    <StatCard icon={Grid} label="Chunks" value="847" />
    <StatCard icon={Database} label="Vectors" value="847" />
    <StatCard icon={CheckCircle} label="Health" value="Healthy" />
  </StatsCards>

  <Tabs>
    <Tab label="Overview" />
    <Tab label="Documents" badge="50" /> {/* NEW */}
    <Tab label="Chunks" badge="847" /> {/* NEW */}
    <Tab label="Settings" />
  </Tabs>

  <TabPanel id="documents">
    <DocumentsListView /> {/* NEW COMPONENT */}
  </TabPanel>

  <TabPanel id="chunks">
    <ChunkBrowserView /> {/* NEW COMPONENT */}
  </TabPanel>
</KBDetailsPage>
```

### 2. Documents List View Component (NEW)

```tsx
<DocumentsListView kbId={kb.id}>
  {/* Header with Actions */}
  <ViewHeader>
    <Title>Documents ({totalDocuments})</Title>
    <Button onClick={openAddDocumentModal}>
      <Plus /> Add Document
    </Button>
  </ViewHeader>

  {/* Filters */}
  <FilterBar>
    <Select
      label="Status"
      options={[
        { value: null, label: "All" },
        { value: "completed", label: "Completed" },
        { value: "processing", label: "Processing" },
        { value: "failed", label: "Failed" }
      ]}
      value={filters.status}
      onChange={(status) => setFilters({ ...filters, status })}
    />
    <Select
      label="Source Type"
      options={[
        { value: null, label: "All Sources" },
        { value: "web_scraping", label: "Web Scraping" },
        { value: "manual", label: "Manual" },
        { value: "file_upload", label: "File Upload" }
      ]}
      value={filters.source_type}
      onChange={(source_type) => setFilters({ ...filters, source_type })}
    />
    <SearchInput
      placeholder="Search by name or URL..."
      value={filters.search}
      onChange={(search) => setFilters({ ...filters, search })}
    />
  </FilterBar>

  {/* Documents Table/Grid */}
  {isLoading ? (
    <SkeletonLoader count={5} />
  ) : documents.length === 0 ? (
    <EmptyState
      icon={<FileText />}
      title="No Documents Found"
      message="Add your first document to get started"
      action={<Button onClick={openAddDocumentModal}>Add Document</Button>}
    />
  ) : (
    <>
      <DocumentsTable>
        {documents.map(doc => (
          <DocumentRow key={doc.id}>
            <Cell>
              <StatusIcon status={doc.status} />
              <DocumentName>{doc.name}</DocumentName>
              {doc.status === "processing" && (
                <ProgressBar value={doc.processing_progress} />
              )}
            </Cell>
            <Cell>
              <SourceBadge type={doc.source_type} />
              <SourceURL>{doc.source_url}</SourceURL>
            </Cell>
            <Cell>
              <Stat label="Chunks" value={doc.chunk_count} />
              <Stat label="Words" value={doc.word_count.toLocaleString()} />
            </Cell>
            <Cell>
              <Timestamp>{formatDate(doc.created_at)}</Timestamp>
            </Cell>
            <Cell>
              <ActionMenu>
                <MenuItem onClick={() => viewDocument(doc.id)}>View</MenuItem>
                <MenuItem onClick={() => editDocument(doc.id)}>Edit</MenuItem>
                <MenuItem onClick={() => deleteDocument(doc.id)} destructive>
                  Delete
                </MenuItem>
              </ActionMenu>
            </Cell>
          </DocumentRow>
        ))}
      </DocumentsTable>

      <Pagination
        current={page}
        total={totalPages}
        onPageChange={setPage}
      />
    </>
  )}
</DocumentsListView>
```

### 3. Add/Edit Document Modal (NEW)

```tsx
<DocumentFormModal
  kbId={kb.id}
  documentId={editingDocId} // null for add, UUID for edit
  onClose={closeModal}
  onSuccess={refreshDocuments}
>
  <ModalHeader>
    <Title>{isEditing ? "Edit Document" : "Add Document"}</Title>
    <CloseButton onClick={closeModal} />
  </ModalHeader>

  <Form onSubmit={handleSubmit}>
    <FormField label="Name" required>
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., API Reference Guide"
        maxLength={500}
      />
    </FormField>

    <FormField label="Source Type">
      <Select
        value={formData.source_type}
        onChange={(source_type) => setFormData({ ...formData, source_type })}
        options={[
          { value: "manual", label: "Manual Entry" },
          { value: "web_scraping", label: "Web Scraping" },
          { value: "file_upload", label: "File Upload" }
        ]}
      />
    </FormField>

    <FormField label="Source URL" hint="Optional">
      <Input
        value={formData.source_url}
        onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
        placeholder="https://example.com/doc"
      />
    </FormField>

    <FormField label="Content" required>
      <MarkdownEditor
        value={formData.content}
        onChange={(content) => setFormData({ ...formData, content })}
        placeholder="Enter your content here (Markdown supported)..."
        minHeight="300px"
        showPreview
      />
      <ValidationHint>
        {formData.content.length < 50 && (
          <Error>Content must be at least 50 characters</Error>
        )}
        {formData.content.length >= 50 && formData.content.length <= 10485760 && (
          <Success>Content length: {formData.content.length.toLocaleString()} chars</Success>
        )}
        {formData.content.length > 10485760 && (
          <Error>Content exceeds 10MB limit</Error>
        )}
      </ValidationHint>
    </FormField>

    <FormField label="Custom Metadata" hint="Optional JSON">
      <CodeEditor
        value={formData.custom_metadata}
        onChange={(custom_metadata) => setFormData({ ...formData, custom_metadata })}
        language="json"
        placeholder='{ "author": "John", "version": "1.0" }'
        height="100px"
      />
    </FormField>

    {isEditing && formData.content !== originalContent && (
      <WarningBanner>
        ⚠️ Changing content will trigger re-chunking and re-indexing. This may take a few minutes.
      </WarningBanner>
    )}
  </Form>

  <ModalFooter>
    <Button variant="secondary" onClick={closeModal}>
      Cancel
    </Button>
    <Button
      variant="primary"
      onClick={handleSubmit}
      loading={isSubmitting}
      disabled={!isValid}
    >
      {isSubmitting ? "Saving..." : (isEditing ? "Update Document" : "Add Document")}
    </Button>
  </ModalFooter>
</DocumentFormModal>
```

### 4. Chunk Browser Component (NEW)

```tsx
<ChunkBrowserView kbId={kb.id}>
  <ViewHeader>
    <Title>Chunks ({totalChunks})</Title>
    <ItemsPerPageSelect value={itemsPerPage} onChange={setItemsPerPage} />
  </ViewHeader>

  <SearchBar>
    <SearchInput
      placeholder="Search in chunks..."
      value={searchQuery}
      onChange={setSearchQuery}
      debounce={300}
    />
    <FilterButton onClick={openFilters}>Filters</FilterButton>
  </SearchBar>

  {isLoading ? (
    <ChunkListSkeleton count={itemsPerPage} />
  ) : (
    <ChunkList>
      {chunks.map(chunk => (
        <ChunkCard key={chunk.id}>
          <ChunkHeader>
            <ChunkIndex>Chunk #{chunk.position + 1}</ChunkIndex>
            <SourceInfo>
              From: <Link to={`/kbs/${kbId}/documents/${chunk.document_id}`}>
                {chunk.document_name}
              </Link>
            </SourceInfo>
          </ChunkHeader>

          <ChunkContent>
            <MarkdownPreview
              content={chunk.content}
              maxLines={expanded[chunk.id] ? undefined : 8}
            />
            {!expanded[chunk.id] && chunk.content.split('\n').length > 8 && (
              <ExpandButton onClick={() => toggleExpand(chunk.id)}>
                Show more...
              </ExpandButton>
            )}
          </ChunkContent>

          <QualityIndicators>
            <Indicator status="success">
              <CheckCircle /> Clean Markdown
            </Indicator>
            <Indicator status="success">
              <CheckCircle /> No HTML Tags
            </Indicator>
          </QualityIndicators>

          <ChunkStats>
            <Stat icon={FileText} label="Words" value={chunk.word_count} />
            <Stat icon={Hash} label="Characters" value={chunk.character_count} />
            <Stat icon={MapPin} label="Position" value={chunk.position} />
          </ChunkStats>

          <ChunkActions>
            <Button size="sm" variant="ghost" onClick={() => copyChunk(chunk)}>
              <Copy /> Copy
            </Button>
            <Button size="sm" variant="ghost" onClick={() => viewDocument(chunk.document_id)}>
              <ExternalLink /> View Document
            </Button>
            {expanded[chunk.id] && (
              <Button size="sm" variant="ghost" onClick={() => toggleExpand(chunk.id)}>
                <ChevronUp /> Collapse
              </Button>
            )}
          </ChunkActions>
        </ChunkCard>
      ))}
    </ChunkList>
  )}

  <Pagination
    current={page}
    total={totalPages}
    onPageChange={setPage}
    showJump
  />
</ChunkBrowserView>
```

### 5. Draft Preview Pages Component (NEW)

```tsx
<DraftPreviewPages draftId={draftId}>
  <ViewHeader>
    <Title>Preview Pages ({totalPages})</Title>
    <Badge variant="info">Preview Data</Badge>
  </ViewHeader>

  {!hasPreview ? (
    <EmptyState
      icon={<Eye />}
      title="No Preview Generated"
      message="Run preview first to see scraped pages"
      action={<Button onClick={runPreview}>Generate Preview</Button>}
    />
  ) : (
    <PagesList>
      {pages.map((page, index) => (
        <PageCard key={index}>
          <PageHeader>
            <PageNumber>Page {index + 1}</PageNumber>
            <PageTitle>{page.title}</PageTitle>
          </PageHeader>

          <PageURL>
            <Link2 size={14} />
            <ExternalLink href={page.url} target="_blank">
              {page.url}
            </ExternalLink>
          </PageURL>

          <PageStats>
            <Stat label="Words" value={page.word_count} />
            <Stat label="Characters" value={page.character_count} />
            <Stat label="Chunks" value={page.chunks} />
          </PageStats>

          <ContentPreview>
            <MarkdownPreview
              content={page.content_preview}
              maxLines={3}
            />
          </ContentPreview>

          <PageActions>
            <Button
              size="sm"
              variant="outline"
              onClick={() => viewFullContent(index)}
            >
              <Eye /> View Full Content
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => viewPageChunks(index)}
            >
              <Grid /> View Chunks ({page.chunks})
            </Button>
          </PageActions>
        </PageCard>
      ))}
    </PagesList>
  )}
</DraftPreviewPages>
```

---

## API Endpoints by Feature

### 🔍 Draft Inspection (NEW)

#### 1. List Draft Pages
```http
GET /api/v1/kb-drafts/{draft_id}/pages?page=1&limit=20
```

**Use Case**: View all pages scraped during preview

**Response**:
```json
{
  "draft_id": "draft-uuid",
  "total_pages": 5,
  "pages": [
    {
      "index": 0,
      "url": "https://docs.example.com/intro",
      "title": "Introduction",
      "content_preview": "# Introduction\n\nWelcome...",
      "word_count": 450,
      "character_count": 2800,
      "chunks": 3,
      "scraped_at": "2025-01-16T10:30:00Z"
    }
  ]
}
```

**Frontend Implementation**:
```tsx
function useDraftPages(draftId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['draft-pages', draftId, page, limit],
    queryFn: () => api.get(`/kb-drafts/${draftId}/pages`, { params: { page, limit } }),
    enabled: !!draftId
  });
}
```

#### 2. Get Specific Page Content
```http
GET /api/v1/kb-drafts/{draft_id}/pages/{page_index}
```

**Response**:
```json
{
  "draft_id": "draft-uuid",
  "page_index": 0,
  "url": "https://docs.example.com/intro",
  "title": "Introduction",
  "full_content": "# Introduction\n\nWelcome to our documentation...",
  "word_count": 450,
  "character_count": 2800,
  "chunks": 3
}
```

#### 3. List Draft Chunks
```http
GET /api/v1/kb-drafts/{draft_id}/chunks?page=1&limit=20&page_index=0
```

**Query Params**:
- `page` - Page number (pagination)
- `limit` - Items per page (1-100)
- `page_index` - Filter chunks from specific page (optional)

**Response**:
```json
{
  "draft_id": "draft-uuid",
  "total_chunks": 15,
  "page": 1,
  "limit": 20,
  "total_pages": 1,
  "chunks": [
    {
      "global_index": 0,
      "page_index": 0,
      "chunk_index": 0,
      "content": "# Introduction\n\nWelcome...",
      "word_count": 150,
      "character_count": 950,
      "source_page": {
        "index": 0,
        "url": "https://docs.example.com/intro",
        "title": "Introduction"
      }
    }
  ]
}
```

---

### 📄 KB Document Management (NEW)

#### 4. List KB Documents
```http
GET /api/v1/kbs/{kb_id}/documents?page=1&limit=20&status=completed&source_type=manual&search=API
```

**Query Params**:
- `page` - Page number
- `limit` - Items per page (1-100)
- `status` - Filter by status (completed, processing, failed)
- `source_type` - Filter by source (web_scraping, manual, file_upload)
- `search` - Search in name/URL
- `include_disabled` - Include disabled documents (admin only)
- `include_archived` - Include archived documents (admin only)

**Response**:
```json
{
  "kb_id": "kb-uuid",
  "total_documents": 25,
  "page": 1,
  "limit": 20,
  "total_pages": 2,
  "documents": [
    {
      "id": "doc-uuid",
      "kb_id": "kb-uuid",
      "name": "API Documentation",
      "source_type": "web_scraping",
      "source_url": "https://docs.example.com/api",
      "content_preview": "API Documentation\n\nWelcome...",
      "status": "completed",
      "word_count": 1500,
      "character_count": 9500,
      "chunk_count": 15,
      "is_enabled": true,
      "created_at": "2025-01-16T10:00:00Z",
      "updated_at": "2025-01-16T10:05:00Z"
    }
  ]
}
```

**Frontend Implementation**:
```tsx
function useKBDocuments(kbId: string, filters: DocumentFilters) {
  return useQuery({
    queryKey: ['kb-documents', kbId, filters],
    queryFn: () => api.get(`/kbs/${kbId}/documents`, { params: filters }),
    keepPreviousData: true // For pagination
  });
}
```

#### 5. Get Document Details
```http
GET /api/v1/kbs/{kb_id}/documents/{doc_id}
```

**Response**:
```json
{
  "id": "doc-uuid",
  "kb_id": "kb-uuid",
  "workspace_id": "workspace-uuid",
  "name": "API Documentation",
  "source_type": "web_scraping",
  "source_url": "https://docs.example.com/api",
  "source_metadata": {
    "scraped_at": "2025-01-16T10:00:00Z",
    "content_length": 9500
  },
  "content_preview": "API Documentation\n\nWelcome...",
  "status": "completed",
  "processing_progress": 100,
  "word_count": 1500,
  "character_count": 9500,
  "chunk_count": 15,
  "custom_metadata": {},
  "annotations": null,
  "is_enabled": true,
  "is_archived": false,
  "created_by": "user-uuid",
  "created_at": "2025-01-16T10:00:00Z",
  "updated_at": "2025-01-16T10:05:00Z"
}
```

#### 6. List KB Chunks
```http
GET /api/v1/kbs/{kb_id}/chunks?page=1&limit=50
```

**Response**:
```json
{
  "kb_id": "kb-uuid",
  "total_chunks": 150,
  "page": 1,
  "limit": 50,
  "total_pages": 3,
  "chunks": [
    {
      "id": "chunk-uuid",
      "document_id": "doc-uuid",
      "document_name": "API Documentation",
      "content": "# API Authentication\n\nUse Bearer tokens...",
      "position": 0,
      "chunk_index": 0,
      "word_count": 150,
      "character_count": 950,
      "source_url": "https://docs.example.com/api",
      "created_at": "2025-01-16T10:05:00Z"
    }
  ]
}
```

---

### ✏️ Document CRUD Operations (NEW)

#### 7. Create Document
```http
POST /api/v1/kbs/{kb_id}/documents
Content-Type: application/json

{
  "name": "Custom Documentation",
  "content": "This is the document content (min 50 chars)...",
  "source_type": "manual",
  "source_url": "https://example.com/custom",
  "custom_metadata": {
    "author": "John",
    "version": "1.0"
  },
  "annotations": "Important reference"
}
```

**Validation**:
- `name`: 1-500 characters (required)
- `content`: 50 chars - 10MB (required)
- `source_type`: manual, web_scraping, file_upload (required)
- `source_url`: Valid URL (optional)
- `custom_metadata`: Valid JSON (optional)

**Response (201)**:
```json
{
  "id": "doc-uuid",
  "status": "processing",
  "processing_job_id": "celery-task-123"
}
```

**Frontend Implementation**:
```tsx
const { mutate: createDocument, isLoading } = useMutation({
  mutationFn: (data: CreateDocumentRequest) =>
    api.post(`/kbs/${kbId}/documents`, data),
  onSuccess: (response) => {
    toast.success("Document added. Processing in background...");
    navigate(`/kbs/${kbId}/documents`);
    // Optionally start polling the document status
    startPollingDocument(response.id);
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

#### 8. Update Document
```http
PUT /api/v1/kbs/{kb_id}/documents/{doc_id}
Content-Type: application/json

{
  "name": "Updated Documentation",
  "content": "Updated content triggers reprocessing...",
  "custom_metadata": { "version": "2.0" },
  "is_enabled": true
}
```

**Response (Content Changed - Reprocessing)**:
```json
{
  "id": "doc-uuid",
  "status": "processing",
  "message": "Document updated. Re-chunking and re-indexing in progress.",
  "processing_job_id": "celery-task-456"
}
```

**Response (Metadata Only - No Reprocessing)**:
```json
{
  "id": "doc-uuid",
  "message": "Document updated successfully",
  "changes_applied": ["name", "custom_metadata"]
}
```

**Frontend Implementation**:
```tsx
const { mutate: updateDocument } = useMutation({
  mutationFn: ({ docId, data }: UpdateDocumentParams) =>
    api.put(`/kbs/${kbId}/documents/${docId}`, data),
  onSuccess: (response) => {
    if (response.status === "processing") {
      toast.info("Document updated. Re-processing in background...");
      startPollingDocument(response.id);
    } else {
      toast.success("Document updated successfully");
    }
    queryClient.invalidateQueries(['kb-documents', kbId]);
  }
});
```

#### 9. Delete Document
```http
DELETE /api/v1/kbs/{kb_id}/documents/{doc_id}
```

**Response (200)**:
```json
{
  "message": "Document 'API Documentation' deleted successfully",
  "deleted": {
    "document_id": "doc-uuid",
    "chunks_deleted": 15,
    "qdrant_points_deleted": 15
  }
}
```

**Error Response (Qdrant Failure)**:
```json
{
  "detail": "Failed to delete from vector store. Document marked for retry."
}
```

**Frontend Implementation**:
```tsx
const { mutate: deleteDocument } = useMutation({
  mutationFn: (docId: string) =>
    api.delete(`/kbs/${kbId}/documents/${docId}`),
  onSuccess: (response) => {
    toast.success(response.message);
    queryClient.invalidateQueries(['kb-documents', kbId]);
  },
  onError: (error) => {
    if (error.message.includes("marked for retry")) {
      toast.error("Delete failed. Will retry automatically.");
    } else {
      toast.error(error.message);
    }
  }
});

// With confirmation dialog
async function handleDelete(doc: Document) {
  const confirmed = await showConfirmDialog({
    title: "Delete Document?",
    message: `This will delete "${doc.name}" and all ${doc.chunk_count} chunks. This cannot be undone.`,
    confirmText: "Delete",
    confirmVariant: "destructive"
  });

  if (confirmed) {
    deleteDocument(doc.id);
  }
}
```

---

## Frontend Implementation Patterns

### Document Management Hook

```tsx
// useDocumentManagement.ts
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface DocumentFilters {
  page?: number;
  limit?: number;
  status?: string;
  source_type?: string;
  search?: string;
}

export function useDocumentManagement(kbId: string) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    limit: 20
  });

  // List documents
  const {
    data: documentsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['kb-documents', kbId, filters],
    queryFn: () => api.get(`/kbs/${kbId}/documents`, { params: filters }),
    keepPreviousData: true
  });

  // Create document
  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentRequest) =>
      api.post(`/kbs/${kbId}/documents`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['kb-documents', kbId]);
      toast.success("Document added successfully");
    }
  });

  // Update document
  const updateMutation = useMutation({
    mutationFn: ({ docId, data }: { docId: string; data: UpdateDocumentRequest }) =>
      api.put(`/kbs/${kbId}/documents/${docId}`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['kb-documents', kbId]);
      if (response.status === "processing") {
        toast.info("Document updated. Re-processing...");
      } else {
        toast.success("Document updated");
      }
    }
  });

  // Delete document
  const deleteMutation = useMutation({
    mutationFn: (docId: string) =>
      api.delete(`/kbs/${kbId}/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['kb-documents', kbId]);
      toast.success("Document deleted");
    }
  });

  return {
    // Data
    documents: documentsData?.documents || [],
    totalDocuments: documentsData?.total_documents || 0,
    totalPages: documentsData?.total_pages || 0,
    isLoading,
    error,

    // Filters
    filters,
    setFilters,

    // Mutations
    createDocument: createMutation.mutate,
    updateDocument: updateMutation.mutate,
    deleteDocument: deleteMutation.mutate,

    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading
  };
}
```

### Draft Inspection Hook

```tsx
// useDraftInspection.ts
export function useDraftInspection(draftId: string) {
  // Pages list
  const {
    data: pagesData,
    isLoading: isLoadingPages
  } = useQuery({
    queryKey: ['draft-pages', draftId],
    queryFn: () => api.get(`/kb-drafts/${draftId}/pages`),
    enabled: !!draftId
  });

  // Specific page content
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);

  const {
    data: pageContent,
    isLoading: isLoadingPage
  } = useQuery({
    queryKey: ['draft-page', draftId, selectedPageIndex],
    queryFn: () => api.get(`/kb-drafts/${draftId}/pages/${selectedPageIndex}`),
    enabled: selectedPageIndex !== null
  });

  // Chunks with pagination
  const [chunksPage, setChunksPage] = useState(1);
  const [chunksLimit, setChunksLimit] = useState(20);
  const [filterByPage, setFilterByPage] = useState<number | null>(null);

  const {
    data: chunksData,
    isLoading: isLoadingChunks
  } = useQuery({
    queryKey: ['draft-chunks', draftId, chunksPage, chunksLimit, filterByPage],
    queryFn: () => api.get(`/kb-drafts/${draftId}/chunks`, {
      params: {
        page: chunksPage,
        limit: chunksLimit,
        page_index: filterByPage
      }
    }),
    enabled: !!draftId,
    keepPreviousData: true
  });

  return {
    // Pages
    pages: pagesData?.pages || [],
    totalPages: pagesData?.total_pages || 0,
    isLoadingPages,

    // Selected page
    selectedPageIndex,
    setSelectedPageIndex,
    pageContent,
    isLoadingPage,

    // Chunks
    chunks: chunksData?.chunks || [],
    totalChunks: chunksData?.total_chunks || 0,
    chunksPage,
    setChunksPage,
    chunksLimit,
    setChunksLimit,
    filterByPage,
    setFilterByPage,
    isLoadingChunks
  };
}
```

---

## State Management

### Redux/Zustand Store Structure

```typescript
interface KBState {
  // Existing list view
  kbs: KB[];
  filters: KBFilters;

  // Current KB detail
  currentKB: KB | null;

  // NEW: Document management
  documents: {
    list: Document[];
    total: number;
    page: number;
    filters: DocumentFilters;
    selectedDocument: Document | null;
  };

  // NEW: Chunk browser
  chunks: {
    list: Chunk[];
    total: number;
    page: number;
    limit: number;
  };

  // NEW: Draft inspection
  draftInspection: {
    pages: DraftPage[];
    chunks: DraftChunk[];
    selectedPageIndex: number | null;
  };

  // Processing
  activePipelines: Map<string, PipelineStatus>;
}

interface KBActions {
  // Existing actions...

  // NEW: Document actions
  fetchDocuments: (kbId: string, filters: DocumentFilters) => Promise<void>;
  createDocument: (kbId: string, data: CreateDocumentRequest) => Promise<Document>;
  updateDocument: (kbId: string, docId: string, data: UpdateDocumentRequest) => Promise<void>;
  deleteDocument: (kbId: string, docId: string) => Promise<void>;
  setDocumentFilters: (filters: Partial<DocumentFilters>) => void;

  // NEW: Chunk actions
  fetchChunks: (kbId: string, page: number, limit: number) => Promise<void>;

  // NEW: Draft inspection actions
  fetchDraftPages: (draftId: string) => Promise<void>;
  fetchDraftPage: (draftId: string, pageIndex: number) => Promise<void>;
  fetchDraftChunks: (draftId: string, params: ChunkParams) => Promise<void>;
}
```

---

## Error Handling & Edge Cases

### Document CRUD Errors

```typescript
// Error handling for document operations
const DOCUMENT_ERRORS = {
  CONTENT_TOO_SHORT: {
    code: 400,
    message: "Content must be at least 50 characters",
    userMessage: "Please add more content (minimum 50 characters required)",
    action: "highlight_content_field"
  },
  CONTENT_TOO_LARGE: {
    code: 413,
    message: "Content exceeds 10MB limit",
    userMessage: "Content is too large. Maximum size is 10MB.",
    action: "show_size_warning"
  },
  DOCUMENT_LIMIT_REACHED: {
    code: 400,
    message: "KB document limit reached",
    userMessage: "You've reached the maximum of 10,000 documents per KB",
    action: "suggest_delete_unused"
  },
  QDRANT_SYNC_FAILED: {
    code: 500,
    message: "Failed to delete from vector store",
    userMessage: "Delete failed but will retry automatically",
    action: "mark_for_retry"
  }
};

function handleDocumentError(error: ApiError) {
  const errorConfig = DOCUMENT_ERRORS[error.code];

  if (errorConfig) {
    toast.error(errorConfig.userMessage);

    switch (errorConfig.action) {
      case "highlight_content_field":
        setFieldError("content", errorConfig.userMessage);
        break;
      case "mark_for_retry":
        showRetryNotification();
        break;
      case "suggest_delete_unused":
        showDocumentLimitModal();
        break;
    }
  } else {
    toast.error(error.message || "An error occurred");
  }
}
```

---

## UI/UX Best Practices

### Loading States for Documents

```tsx
// Document list loading
{isLoading ? (
  <DocumentListSkeleton count={5} />
) : documents.length === 0 ? (
  <EmptyState
    icon={<FileText />}
    title="No Documents Found"
    message={hasFilters
      ? "Try adjusting your filters"
      : "Add your first document to get started"
    }
    action={!hasFilters && (
      <Button onClick={openAddDocumentModal}>Add Document</Button>
    )}
  />
) : (
  <DocumentsList documents={documents} />
)}

// Document being processed
{doc.status === "processing" && (
  <ProcessingIndicator>
    <Spinner size="sm" />
    <ProgressBar value={doc.processing_progress} max={100} />
    <Status>{doc.processing_progress}% complete</Status>
  </ProcessingIndicator>
)}
```

### Confirmation Dialogs

```tsx
// Delete document confirmation
async function confirmDeleteDocument(doc: Document) {
  const result = await showConfirmDialog({
    title: "Delete Document?",
    message: `Are you sure you want to delete "${doc.name}"?`,
    details: [
      `This will delete the document`,
      `Remove all ${doc.chunk_count} chunks`,
      `Remove vectors from search index`,
      `This action cannot be undone`
    ],
    confirmText: "Delete Document",
    confirmVariant: "destructive",
    requiresTypeConfirmation: doc.chunk_count > 50, // For large documents
    confirmationText: doc.name
  });

  if (result.confirmed) {
    deleteDocument(doc.id);
  }
}

// Update document with content change
async function confirmContentUpdate(doc: Document, newContent: string) {
  if (newContent === doc.original_content) {
    // No confirmation needed for metadata-only updates
    updateDocument(doc.id, { ...formData });
    return;
  }

  const result = await showConfirmDialog({
    title: "Update Content?",
    message: "Changing content will trigger re-processing",
    details: [
      `All ${doc.chunk_count} chunks will be regenerated`,
      `Embeddings will be recalculated`,
      `This may take a few minutes`,
      `Search results may be temporarily affected`
    ],
    confirmText: "Update & Reprocess",
    confirmVariant: "primary"
  });

  if (result.confirmed) {
    updateDocument(doc.id, { ...formData, content: newContent });
  }
}
```

---

## Testing Checklist

### Draft Inspection Tests
- [ ] List draft pages with pagination
- [ ] View specific page content
- [ ] Browse chunks with filtering
- [ ] Handle drafts without preview data
- [ ] Show helpful empty states

### Document Management Tests
- [ ] List documents with all filters
- [ ] Search documents by name/URL
- [ ] View document details
- [ ] Create document with validation
- [ ] Update metadata only (no reprocessing)
- [ ] Update content (triggers reprocessing)
- [ ] Delete document successfully
- [ ] Handle Qdrant sync failures

### Chunk Browser Tests
- [ ] List chunks with pagination
- [ ] View chunk content
- [ ] Verify content quality indicators
- [ ] Navigate to source document
- [ ] Copy chunk content

### RBAC Tests
- [ ] Editors can create/edit own documents
- [ ] Editors can delete own documents
- [ ] Admins can edit/delete any document
- [ ] Viewers can only read
- [ ] Admin-only disabled/archived access

---

**Version**: 2.0
**Last Updated**: January 16, 2025
**Maintainer**: PrivexBot Team

**Changes in v2.0**:
- ✅ Added Draft Inspection endpoints and UX
- ✅ Added Document Management (list, filter, search)
- ✅ Added Document CRUD operations (create, update, delete)
- ✅ Added Chunk Browser for content verification
- ✅ Added comprehensive state management patterns
- ✅ Added error handling for all new features
- ✅ Added UI/UX best practices for new components