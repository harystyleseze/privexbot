# Guide to Chunking in Privexbot Document Processing Pipeline

When working with large documents, AI models cannot efficiently process the entire text at once due to input size limits. To enable effective understanding and retrieval, the document is **chunked**—broken down into smaller, manageable segments called *chunks*. These chunks serve as the fundamental units for embedding and later querying with Secret AI models.

---

## The Basic Pipeline: Ingestion → Chunking → Embedding → LLM

1. **Ingestion**
   The system loads and parses the document, converting raw files into structured elements like paragraphs, titles, tables, and images that the pipeline can work with.

2. **Chunking**
   These elements are then grouped or split into *chunks*—coherent segments of text sized to fit within embedding model limits. Chunking ensures that each piece is relevant, manageable, and improves the precision of retrieval during question answering.

3. **Embedding**
   Each chunk is converted into a dense numeric vector (embedding) representing its semantic meaning. This vectorization allows AI to compare and search across chunks efficiently based on meaning rather than keyword matching.

4. **LLM (Large Language Model)**
   When responding to queries, Secret AI LLM uses embeddings to quickly find the most relevant chunks and then generates context-aware answers based on that focused content.

---

## Understanding Chunking and Context Limits for Privexbot Secret AI

When using AI to read and answer questions from large documents, there are two things you really need to keep in mind:

1. **How much text your AI model can understand at once (called the context window)**
2. **How you break up your document into smaller pieces (called chunks)**

Let’s walk through both in simple terms.

---

## 1. The Context Window: How Much Is "Too Much"?

Large Language Models (LLMs), like the ones used in AI assistants, can only “see” a certain amount of text at a time. This limit is called the **context window**.

* Think of the context window like the AI’s short-term memory.
* If the context window is full, the AI won’t “remember” anything beyond it.
* So, when your AI is answering a question, all of the chunks you give it as background must **fit inside this limit**.

### Why You Shouldn’t Fill It Completely

Even if your AI model supports a large window (like 8,000 tokens), stuffing it full can be risky:

* It’s like giving someone 50 pages to find one sentence—they might miss it.
* Leaving some space can be helpful for:

  * Clear instructions
  * A description of the AI's role or behavior (a “persona”)
  * Examples of how to answer (few-shot prompts)

---

## 2. Embedding Models Have Limits Too

Before AI can even understand your document, each chunk gets converted into something called an **embedding**—a special format that captures the meaning of the text.

But embedding models also have context limits:

* They can only embed text up to a certain size.
* This limit depends on the specific model (usually around **8,000 tokens**, or **\~6,200 words**).
* You can find the exact limit in the model’s documentation (like on Hugging Face).

**Example**:
The entire *Lord of the Rings* series is about 576,000 words. If each chunk can only hold 6,200 words, you'd need **at least 93 chunks** just to represent it.

---

## 3. Why Smaller Chunks Are Often Better

Even though models allow large chunks, **bigger isn’t always better**. Here’s why:

### a. One Vector to Represent It All

When you turn a chunk into an embedding:

* The model summarizes the whole chunk into a **single vector** (like a compressed idea).
* Whether the chunk is 10 words or 1,000, the result is always one vector—often 768 numbers long.
* To get that vector, the model averages or summarizes all the words inside.

This means:

* If the chunk is small and focused, the vector is precise.
* If it’s long and covers many topics, the meaning becomes blurry or vague.

### b. Too Many Topics = Confusing Search

Big chunks may contain **several unrelated ideas**:

* Only part of it might match your question.
* But the rest could confuse the search and reduce accuracy.

Smaller, well-targeted chunks:

* Stay on one topic
* Are easier to match to user questions
* Improve precision when retrieving relevant answers

> **A good starting point?** Try chunks around **250 tokens** (or about **1,000 characters**). Then adjust based on your results.

---

## 4. How to Split Documents into Chunks

There are a few popular ways to break up documents. Let’s look at the simplest and most common ones.

### A. Character-Based Chunking (Simple but Crude)

This method splits text every *N* characters (like every 1,000 characters).

* You can add **overlap** (some repeated text between chunks) to avoid cutting off mid-sentence.
* But it's still rough:

  * Sentences may be split in half.
  * Topics can get mixed up.
  * It ignores structure (headings, paragraphs, lists, etc.)

### B. Recursive or Sentence-Based Chunking (Smarter)

This approach tries to preserve natural breaks by using **separators** like:

* `\n\n` → Paragraph break
* `\n` → New line
* `.` → Period
* Space

It splits using these rules **in order**:

1. First, try to split at paragraph breaks.
2. If the chunk is still too big, try line breaks.
3. Still too big? Split by sentence, then word.

This helps avoid cutting words or sentences in awkward places.

**But there are still challenges**:

* It doesn’t understand more complex structures like:

  * Headings
  * Lists
  * Tables
* It doesn’t work well across formats (e.g., plain text vs HTML vs PDF)
* You’d need **different separators for each file type**

For complex documents or multiple formats, it can get tricky fast. That is why Privexbot adopts these chunking strategies.

---

## Note

* **LLMs and embedding models have context limits**—you can't just send them your whole document.
* **Chunking breaks up your document** into pieces that are small enough to embed and search.
* **Smaller chunks** (like 250 tokens) usually give **better search accuracy**.
* **Basic chunking methods** (like splitting by characters or sentences) are easy but may miss structure.
* **More advanced chunking** strategies use document structure or headings, which work better for accuracy.

---

## Why Smart Chunk Strategy: What is Chunking?

Chunking is the process of segmenting a document into smaller parts to make it digestible for AI. Key points include:

* **Size-aware:** Each chunk respects the maximum token or character limits of the embedding model, ensuring it can be processed without truncation.
* **Relevant:** Helps the AI retrieve only the parts of the document that are useful to the user’s query.
* **Flexible:** Chunk creation can be customized by size, document structure, page boundaries, or semantic similarity.
* **Special Handling:** Tables are treated differently from text, and images are typically removed during chunking because they can’t be embedded as text.

---

## How Does Chunking Work?

* **Combining Elements:** The system merges sequential text elements to fill chunks up to a maximum size (e.g., character count).
* **Splitting Oversized Elements:** If an element (like a long paragraph) is too large, it’s split at natural breakpoints (spaces, new lines) to avoid cutting words.
* **Tables and Images:**
  * Tables become standalone chunks; large tables can be split into *TableChunks* by row to respect size limits.
  * Images are excluded from chunk outputs as they can’t be embedded as text.
* **Metadata:** Chunks carry metadata including original file info, page numbers, and references to original elements to maintain traceability.

---

## Types of Chunking Strategies

### 1. Simple Size-Based Chunking

**Description:** Splits the document into chunks purely based on size limits.

* Sequential elements are added to a chunk until the max character limit is reached.
* If adding another element exceeds the limit, a new chunk is started.
* Oversized elements are split into fragments at spaces or new lines.
* Tables always remain separate chunks or get split by rows if too large.
* No semantic or structural consideration; it’s a straightforward size-based approach.
* This method combines sequential elements to fill each chunk as fully as possible, without exceeding the maximum chunk size. If a single element is too large to fit within the limit, it will be split into multiple chunks.

*Use case:* When you want predictable chunk sizes without worrying about document structure.

---

### 2. Chunk by Headings or Sections

**Description:** Uses document structure—especially titles or headings—to guide chunk boundaries.

* Each chunk starts with a heading and contains all content within that section.
* Respects max character limits but will close a chunk when a new section starts, even if space remains.
* To avoid too many small chunks from very short sections, small sections can be combined up to a certain character threshold.
* Allows multipage sections if configured, enabling a section to span multiple pages.
* This strategy uses the document element types identified during ingestion to grasp the document’s structure and maintain section boundaries. As a result, each chunk contains text from only one section, keeping topics self-contained and improving retrieval accuracy.

*Use case:* Preserves logical document organization, useful for documents with clear hierarchical structure like reports or manuals.

---

### 3. Chunk by Page

**Description:** Divides chunks based on the document’s page breaks.

* Each chunk contains content from exactly one page.
* New chunk starts whenever a page boundary is reached.
* Maintains physical page boundaries, which is useful if page context matters.
* Designed for documents where each page contains distinct information, this strategy prevents mixing content from different pages in the same chunk. Whenever a new page begins, the current chunk is closed, and a new chunk is started—even if the next element could logically belong to the previous chunk.

*Use case:* When page layout or physical document structure is important (e.g., scanned PDFs or legal documents).

---

### 4. Chunk by Topic (Similarity)

**Description:** Uses AI-powered semantic similarity to group related content, regardless of physical layout.

* Employs pretrained embedding models (e.g., sentence-transformers) to assess topical relatedness between sequential elements.
* Combines only elements that meet a similarity threshold to ensure semantic coherence.
* Respects max size limits; even similar elements may be split if too large.
* Allows you to control the strictness of similarity for grouping via a similarity threshold setting.
* If the document structure doesn’t clearly define topic boundaries, you can use the “by topic” strategy. This approach uses the sentence-transformers/multi-qa-mpnet-base-dot-v1 embedding model to find sequential elements that are topically similar and group them into chunks.

*Use case:* Ideal when semantic relevance is more important than document structure or size uniformity, such as knowledge bases or diverse content.

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

Contextual chunking prepends a brief explanatory prefix to each chunk, describing its content or position in the document. This improves retrieval and downstream task performance by providing additional semantic cues.

* The prefix is stored alongside the original chunk text and metadata, often formatted as:

  ```
  Prefix: This chunk covers the introduction to the U.S. Constitution;  
  Original: THE CONSTITUTION ...  
  ```
* Useful for providing human-readable context or summaries that help disambiguate chunks.
* Embedding platforms supporting metadata (like PrivexBot) can store this extra context cleanly, enhancing semantic search without bloating chunk size.
* Can be toggled on or off depending on your pipeline needs.

---

## NOTE

* **Chunking** breaks down large documents into smaller, AI-friendly pieces suitable for embedding.
* Different strategies organize chunks by size, document structure (titles), page breaks, or semantic similarity.
* Fine-tune chunking using settings like max size, overlap, and similarity thresholds for your specific documents and AI tasks.
* Contextual chunking adds metadata-based explanations to chunks, improving AI understanding and retrieval precision.
* Chunking is a foundational step that significantly impacts the effectiveness of downstream embedding and language model operations.

---
