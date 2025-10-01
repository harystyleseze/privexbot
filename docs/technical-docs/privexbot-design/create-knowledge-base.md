## 📚 How to Create a Knowledge Base in Privexbot

You can easily build a custom knowledge base in **Privexbot** by uploading your files and letting the system process them automatically. This allows **secret ai** apps to give more accurate answers by using your own data.

---

### ✅ Step-by-Step: Creating Your Knowledge Base

1. **Create a New Knowledge Base**

   * Start by creating a new knowledge base in Privexbot.
   * You can **import local files** (like PDFs or DOCX) or **connect to online data sources** (like websites, Google Docs, or Notion).

2. **Upload and Import Your Documents**

   * Drag and drop your files or paste in a URL.
   * Supported formats include TXT, DOCX, PDF, HTML, CSV, Excel, and more.

3. **Choose Chunking Mode/Strategy**

   * Privexbot automatically **splits large documents into smaller pieces** (called “chunks”).
   * You can preview how the content is divided and adjust settings if needed.
   * This helps secret ai find and use the right parts of your documents during a conversation.

4. **Set Up Search and Indexing**

   * Choose how your knowledge base will **index content** and how secret ai will **retrieve relevant chunks** when a question is asked.
   * This setup improves how fast and accurately secret ai finds the right information.

5. **Wait for Processing**

   * Privexbot will embed the chunks (turn them into data that secret ai can understand).
   * Once it’s done, you can link your knowledge base to your secret ai powered chatbots or chatflows!

6. **Start Using It**

   * Your app is now ready to answer questions based on your documents.
   * You can always return later to update, manage, or expand the knowledge base.

---

## ⚙️ Advanced: ETL (Extract, Transform, Load)

To handle data better, Privexbot supports ETL — this means it can **clean, format, and prepare your data** before it’s used.

---

## 🔍 What Is Embedding?

**Embedding** turns your documents into numbers (vectors) that **secret ai** can understand.

* It keeps the meaning of your text while making it easier to search.
* This process improves **speed and accuracy** when finding answers.

---

## 🏷️ Metadata: Organize Your Data Smarter

**Metadata** is extra information about your documents, like:

* Who uploaded it
* When it was added
* What language it’s in

It helps you:

* Search and filter documents faster
* Group documents by tags
* Automate actions based on metadata

---

### 🛠 Managing Metadata in Privexbot

You can manage metadata for all documents in your knowledge base:

| Type        | Built-in Metadata        | Custom Metadata         |
| ----------- | ------------------------ | ----------------------- |
| Location    | Bottom of Metadata panel | Top of panel            |
| Activation  | Manual (off by default)  | Add as needed           |
| Who sets it | Automatically by system  | Manually by user        |
| Can edit?   | ❌                        | ✅                       |
| Applies to  | All documents            | Only assigned documents |

**Examples of metadata fields:**

* `document_name` (string)
* `upload_date` (time)
* `source` (string)

---

### ➕ Add Metadata

1. Click **+Add Metadata**
2. Choose a **value type**:

   * **String** – text like “customer\_type”
   * **Number** – numbers like “version\_number”
   * **Time** – dates or timestamps
3. Give it a name (use lowercase and underscores only)
4. Click **Save**

---

### ✏️ Edit Metadata

* Use the **Metadata Editor** to apply metadata to multiple documents at once.
* Or edit individual documents by opening the **Document Details** page.

You can:

* Add values
* Edit or reset them
* Remove fields (from one doc or from all docs)

Use the **"Apply to all documents"** checkbox to decide how widely changes apply.

---

### 🗑️ Deleting Metadata

| Delete From           | Affects                 | What Happens                          |
| --------------------- | ----------------------- | ------------------------------------- |
| Metadata Panel        | All documents           | Field is removed everywhere           |
| Metadata Editor       | Selected documents only | Field is removed only from those docs |
| Document Details Page | Single document         | Field removed just from that document |

---

### 📁 Filtering with Metadata

Use metadata to **filter documents** when integrating your knowledge base into an app. It makes it easier to use only specific parts of your data.

---

### 📡 API Access

You can also manage your metadata and knowledge base using the **Privexbot API** — see the API documentation for technical setup.

---
