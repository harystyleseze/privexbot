✅ 1. Crawl Step (/sources/web) — Raw HTML/markdown

❌ Not what you want.

This step should only downloads the raw HTML and discovers links.
It does not extract clean text.

You will still have:

Menus

Headers

Navigation bars

Footer text

Buttons

Sidebar content

Repeated sections

❌ 2. Preview Step (/preview) — Small Sample Only

❌ Also not what you want.

Preview = just a few chunks, quickly extracted, no cleanup.
Good for preview cases by users as implemented
Not full content and not cleaned. That’s why the content it generated had navigation, emojis, menus.

⭐ 3. Process Step (/process) — FULL CLEANED CONTENT (we need a clean web page content )

✔️ THIS is the step that produces the full, cleaned page content.

This is where the system:

🧹 Cleans the HTML

removes nav bars

removes footers

removes menus

removes duplicate content

removes javascript UI elements

📄 Extracts true page text

headings

paragraphs

code blocks

documentation text

lists

tables

images 

use OCR too

✂️ Splits into meaningful chunks

Following your config:

{
  "chunk_size": 1000,
  "chunk_overlap": 200
}

📑 Stores chunks page-by-page

This should be the only step that produces the actual “usable” knowledge base content.

✔️ 4. After processing, you can fetch:
All cleaned pages
GET /api/v1/kb-drafts/{draft_id}/pages

One cleaned page
GET /api/v1/kb-drafts/{draft_id}/pages/{page_index}

All chunks
GET /api/v1/kb-drafts/{draft_id}/chunks

Chunks for specific page
GET /api/v1/kb-drafts/{draft_id}/chunks?page=<number>


These contain the final, cleaned, ready-to-use content.

📌 I think that the step that gives you full, cleaned content is missing:
POST /api/v1/kb-drafts/{draft_id}/process


This is the step that removes:
unwanted materials
links
menus
headers
UI elements
sidebar navigation
emojies
And gives you true documentation text, split into clean chunks.