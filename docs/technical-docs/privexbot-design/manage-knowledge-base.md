# 🧠 Managing Knowledge in Privexbot

Privexbot's knowledge base helps your **chatbots or chatflows** make smart decisions by giving it access to high-quality, structured information. Here's how to manage, maintain, and automate your knowledge base using both the web interface and API.

---

## 🔐 Who Can Manage a Knowledge Base?

Only the following roles can access and manage knowledge:

* Team Owner
* Team Administrators
* Users with **Editor** permissions

---

## ⚙️ Manage Knowledge Settings

1. Click **Knowledge** in the top navigation bar.
2. Select the knowledge base you want to manage.
3. Go to **Settings** on the left sidebar.

Here’s what you can configure:

* **Name**: Distinguishes this knowledge base from others.
* **Description**: Describes what this base contains.
* **Permissions**:

  * **Only Me**: Private to the creator.
  * **All Team Members**: Shared with the whole team.
  * **Partial Team Members**: Give access to specific teammates via email address.
* **Indexing Method**: Choose how documents are processed (see docs).
* **Embedding Model**: Pick the model for converting text into vectors (changes will re-embed all documents).
* **Retrieval Settings**: Configure how your **secret ai** pulls relevant information.

---

## 🔗 View Linked Applications

On the left sidebar, you’ll find a section showing all **linked applications**.

* Hover over the circle icon to see connected apps.
* Click the arrow to jump directly to the app.

---

## 📁 Maintain Knowledge Documents (Web & API)

You can manage your documents:

* Directly in the web interface
* Or programmatically using the **Privexbot Knowledge Base API**

### 🗂️ Maintain Documents in the Knowledge Base

#### 📄 Add Documents

To upload new documents to an existing knowledge base:

1. Go to **Knowledge Base > Documents**.
2. Click **Add File**.
3. Upload from local files or sync from other sources (e.g., Google Docs, Notion, webpages).

Each document corresponds to a file in its data source.

---

### 🛠️ Document Management Options

| Action      | Description                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| **Enable**  | Make the document editable and retrievable. Disabled or archived documents can be re-enabled. |
| **Disable** | Prevents indexing but allows editing. Toggle off the switch next to the document.             |
| **Archive** | Keeps old docs for reference. Archived docs can’t be edited unless unarchived.                |
| **Delete**  | ⚠️ Permanently removes a document. This action **cannot** be undone.                          |

> ✅ All of the above support **batch operations** when multiple documents are selected.

**Note on Auto-Disabling:**
Docs disabled after 20 days.
* Use **“Enable”** to reactivate.

---

### 📚 Manage Text Chunks

#### 🔍 View Chunks

* Click a document title to view its chunks.
* Preview shows the **first 2 lines** of each chunk.
* Click **Expand Chunk** for full content.
* Chunks displayed **10 per page** (adjustable at bottom).

Use filters to view:

* Enabled / Disabled documents
* Specific chunking modes (see below)

#### 🔧 Chunking Strategies

##### Types of Chunking Strategies

###### 1. Simple Size-Based Chunking

*Break text into chunks by size.*

* Combine text until max character limit is reached.
* Start a new chunk at that limit.
* Split large text at spaces or new lines to avoid cutting words.
* Tables stay separate or split by rows.
* No content understanding—just chunk size.

###### 2. Chunk by Headings or Sections

*Break chunks at document headings or titles.*

* Each chunk starts with a heading and includes its section’s content.
* Honors max size limit.
* Keeps chunks organized by topic or section.

###### 3. Chunk by Page

*Split content by pages.*

* Each chunk contains only one page’s content.
* Starts a new chunk at each page break.
* Maintains page boundaries clearly.

###### 4. Chunk by Topic (Similarity)

*Group text based on content similarity using AI.*

* AI groups related ideas, regardless of position or size.
* Helps keep semantically related content together in one chunk.

---

## Important Settings You Can Adjust

| Setting                        | Description                                                                                                                                                                | Applies To                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Max characters**             | Absolute maximum size allowed for each chunk. Ensures chunks stay within embedding model limits and processing constraints.                                                | All chunking strategies        |
| **Combine text under n chars** | For heading-based chunking, merges smaller sections under this size into a single chunk to avoid many tiny fragments.                                                      | Chunk by Headings / Sections   |
| **Include original elements**  | Retains metadata about the original document elements (like paragraph IDs or page numbers) within each chunk for traceability and reference.                               | All chunking strategies        |
| **Multipage sections**         | Controls whether chunks created from headings or sections can span across multiple pages, or if chunks should break at page boundaries.                                    | Chunk by Headings / Sections   |
| **New after n characters**     | A soft limit prompting the system to start a new chunk after this many characters, helping to avoid overly large chunks while respecting natural breaks.                   | Chunk by Size, Headings, Pages |
| **Overlap**                    | Number of characters duplicated from the end of one chunk to the start of the next, preserving context between chunks and aiding AI understanding.                         | Chunk by Size, Headings, Pages |
| **Overlap all**                | If enabled, applies overlap to every chunk transition, not just between large splits, ensuring consistent context overlap throughout.                                      | Chunk by Size, Headings, Pages |
| **Similarity threshold**       | For similarity-based chunking, sets the minimum semantic similarity required to group elements together into the same chunk, controlling how related content is clustered. | Chunk by Topic (Similarity)    |

---

## Bonus: Contextual Chunking with Metadata Support

* Adds a short explanation or summary at the start of each chunk to describe its content.
* Helps the AI better understand each chunk and improves search relevance.
* Because PrivexBot supports embedding platforms with **metadata**, you can store this extra context separately from the chunk text itself, making your embeddings richer and more precise.
* Example chunk with context:

```

Prefix: This chunk covers the introduction to the U.S. Constitution;
Original: THE CONSTITUTION ...

```
* You can use metadata fields to store the prefix, original source, or other helpful info.

---

### ✅ Check Chunk Quality (Recommended)

Chunk quality directly impacts search and Q&A performance.

🔎 Watch for:

* **Too short** chunks → Loss of semantic context
* **Too long** chunks → Irrelevant noise in results
* **Truncation** → Cut-off content due to segment limits

💡 Manual review helps correct machine-generated chunking errors.

---

### ➕ Add Chunks

**Available only to paid users**

* Click **Add Chunks** on the chunk list page.
* Add content and optional keywords.
* Use “**Add Another**” to input multiple chunks.
* For bulk uploads:

1. Download the **CSV template**.
2. Fill it in Excel.
3. Save as CSV and upload.

---

### ✏️ Edit Chunks

* Directly modify chunk text or keywords.
* Edited chunks are marked with an **"Edited"** tag to avoid confusion.

---

### ⚙️ Reconfigure Chunk Settings

You can change how documents are split into chunks:

| Chunk Size  | Benefits                                        |
| ----------- | ----------------------------------------------- |
| **Larger**  | More context per chunk; faster processing       |
| **Smaller** | Better precision; avoids token limits in models |

Steps:

1. Go to **Chunk Settings**.
2. Adjust values.
3. Click **Save & Process**.
4. The system reprocesses and updates the chunk list (no refresh needed).

---

# 🔌 Maintain Knowledge via API

The Privexbot API lets developers automate tasks like uploading, updating, and retrieving documents or chunks of content.

> 🔒 **Note**: API tokens for the knowledge base allow full access to all knowledge visible to your account. Be mindful of security.

---

## ✅ Benefits of Using the API

* **Automated Sync**: Sync your content without manual uploading.
* **Full Control**: Create, edit, delete documents and chunks.
* **Flexible Input**: Add plain text or upload files.
* **Boosted Productivity**: Minimize manual work and focus on scaling.

---

## 📘 API Usage Examples

> Replace `{dataset_id}`, `{document_id}`, `{api_key}`, etc., with your actual values.

### 🆕 Create a Knowledge Base

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets' \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data '{"name": "name", "permission": "only_me"}'
```

---

### 📄 Add a Document (Text)

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/document/create_by_text' \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data '{"name": "text", "text": "text", "indexing_technique": "high_quality", "process_rule": {"mode": "automatic"}}'
```

---

### 📁 Add a Document (File)

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/document/create-by-file' \
--header 'Authorization: Bearer {api_key}' \
--form 'data="{\"indexing_technique\":\"high_quality\"}";type=text/plain' \
--form 'file=@"/path/to/file"'
```

---

### 🔄 Update a Document (Text or File)

**Text:**

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents/{document_id}/update_by_text' \
--header 'Authorization: Bearer {api_key}' \
--data '{"name": "name", "text": "text"}'
```

**File:**

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents/{document_id}/update-by-file' \
--header 'Authorization: Bearer {api_key}' \
--form 'data="{\"name\":\"Privexbot\"}";type=text/plain' \
--form 'file=@"/path/to/file"'
```

---

### 🔍 Retrieve Document Status

```bash
curl --request GET 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents/{batch}/indexing-status' \
--header 'Authorization: Bearer {api_key}'
```

---

### 🗑️ Delete Document or Knowledge Base

**Delete a document:**

```bash
curl --request DELETE 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents/{document_id}' \
--header 'Authorization: Bearer {api_key}'
```

**Delete a knowledge base:**

```bash
curl --request DELETE 'https://api.privexbot.ai/v1/datasets/{dataset_id}' \
--header 'Authorization: Bearer {api_key}'
```

---

### 📚 Document & Chunk Management

**Get document list:**

```bash
curl --request GET 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents' \
--header 'Authorization: Bearer {api_key}'
```

**Add chunk:**

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents/{document_id}/segments' \
--data '{"segments": [{"content": "text", "answer": "answer"}]}'
```

**Update chunk:**

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}' \
--data '{"segment": {"content": "text", "answer": "answer", "enabled": true}}'
```

**Delete chunk:**

```bash
curl --request DELETE 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}' \
--header 'Authorization: Bearer {api_key}'
```

---

### 🔎 Search Content in Knowledge Base

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/retrieve' \
--header 'Authorization: Bearer {api_key}' \
--data '{"query": "your search query", "retrieval_model": {"search_method": "keyword_search", "top_k": 1}}'
```

---

### 🏷️ Metadata Management

**Add a metadata field:**

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/metadata' \
--data '{"type": "string", "name": "topic"}'
```

**Update metadata field:**

```bash
curl --request PATCH 'https://api.privexbot.ai/v1/datasets/{dataset_id}/metadata/{metadata_id}' \
--data '{"name": "new_name"}'
```

**Delete metadata field:**

```bash
curl --request DELETE 'https://api.privexbot.ai/v1/datasets/{dataset_id}/metadata/{metadata_id}'
```

**Assign metadata to a document:**

```bash
curl --request POST 'https://api.privexbot.ai/v1/datasets/{dataset_id}/documents/metadata' \
--data '{"operation_data": [{"document_id": "doc_id", "metadata_list": [{"id": "metadata_id", "value": "Privexbot"}]}]}'
```

---

## 🚨 Common API Errors

| Code                        | Status | Message                                    |
| --------------------------- | ------ | ------------------------------------------ |
| `no_file_uploaded`          | 400    | Please upload your file                    |
| `too_many_files`            | 400    | Only one file is allowed                   |
| `file_too_large`            | 413    | File size exceeded                         |
| `unsupported_file_type`     | 415    | File type not allowed                      |
| `dataset_not_initialized`   | 400    | Dataset is initializing. Try again shortly |
| `document_already_finished` | 400    | Document is already processed              |
| `invalid_metadata`          | 400    | Metadata format is incorrect               |
| `dataset_name_duplicate`    | 409    | Dataset name already exists                |
