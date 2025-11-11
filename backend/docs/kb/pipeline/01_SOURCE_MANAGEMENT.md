# Module 1: Enhanced Source Management

## Overview

Build on the existing `document_processing_service.py` to support advanced multi-source data ingestion while maintaining the current draft-first architecture and multi-tenancy patterns.

## Current Foundation (What We Have)

### Existing Document Processing Service
```python
# backend/src/app/services/document_processing_service.py
class DocumentProcessingService:
    def process_file(self, db, file_path, kb_id, document_name, metadata)
    def process_url(self, db, url, kb_id, document_name, metadata)
    def process_text(self, db, text, kb_id, document_name, metadata)
```

### Existing Document Model
```python
# backend/src/app/models/document.py
source_type: str  # "file_upload", "text_input", "website", "google_docs", "notion"
source_url: str | None
source_metadata: JSONB  # Source-specific information
annotations: JSONB      # User annotations to help AI understand document
```

## Enhanced Source Architecture

### Source Adapter Pattern
Create unified adapters for each source type that extend existing functionality:

```python
# backend/src/app/adapters/__init__.py
"""
Source adapters for different data ingestion types.

WHY: Unified interface for all source types while maintaining flexibility
HOW: Each adapter implements SourceAdapter interface, integrates with existing services
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from pydantic import BaseModel

class DocumentContent(BaseModel):
    """Standardized document content format"""
    text: str
    metadata: Dict
    preview: str  # First 500 chars for UI
    word_count: int
    character_count: int
    page_count: Optional[int] = None

class SourceAdapter(ABC):
    """
    Unified interface for all data sources.

    WHY: Consistent handling regardless of source type
    HOW: Each source implements this interface
    """

    @abstractmethod
    async def extract_content(self, source_config: Dict) -> DocumentContent:
        """Extract content from source"""
        pass

    @abstractmethod
    def get_source_metadata(self, source_config: Dict) -> Dict:
        """Get source-specific metadata"""
        pass

    @abstractmethod
    def can_update(self) -> bool:
        """Whether this source supports updates/re-sync"""
        pass

    @abstractmethod
    def validate_config(self, source_config: Dict) -> bool:
        """Validate source configuration"""
        pass
```

### 1. Advanced Web Scraping Adapter

```python
# backend/src/app/adapters/web_scraping_adapter.py
"""
Advanced web scraping adapter supporting multiple web extraction methods.

FEATURES:
- Scrape: Single URL content extraction
- Crawl: Multi-page crawling with depth control
- Map: Site mapping and URL discovery
- Search: Web search with content extraction
- Extract: Structured data extraction with AI

INTEGRATIONS:
- Crawl4AI: Fast, AI-powered web scraping
- Firecrawl: Managed web scraping service
- Custom: BeautifulSoup + requests fallback
"""

from typing import Dict, List, Optional
import asyncio
import aiohttp
from bs4 import BeautifulSoup

class WebScrapingAdapter(SourceAdapter):
    """Enhanced web scraping with multiple extraction methods"""

    def __init__(self):
        self.crawl4ai_available = self._check_crawl4ai()
        self.firecrawl_available = self._check_firecrawl()

    async def extract_content(self, source_config: Dict) -> DocumentContent:
        """
        Extract content based on scraping method.

        source_config = {
            "method": "scrape" | "crawl" | "map" | "search" | "extract",
            "url": "https://example.com",
            "options": {
                # Method-specific options
            }
        }
        """
        method = source_config.get("method", "scrape")

        if method == "scrape":
            return await self._scrape_single_url(source_config)
        elif method == "crawl":
            return await self._crawl_website(source_config)
        elif method == "map":
            return await self._map_website(source_config)
        elif method == "search":
            return await self._search_and_extract(source_config)
        elif method == "extract":
            return await self._extract_structured_data(source_config)
        else:
            raise ValueError(f"Unsupported web scraping method: {method}")

    async def _scrape_single_url(self, config: Dict) -> DocumentContent:
        """
        Scrape single URL and return clean content.

        config["options"] = {
            "format": "markdown" | "text" | "html",
            "include_images": false,
            "include_links": true,
            "clean_html": true
        }
        """
        url = config["url"]
        options = config.get("options", {})

        # Try Crawl4AI first (fastest, best quality)
        if self.crawl4ai_available:
            return await self._crawl4ai_scrape(url, options)

        # Fallback to Firecrawl
        elif self.firecrawl_available:
            return await self._firecrawl_scrape(url, options)

        # Fallback to custom scraping
        else:
            return await self._custom_scrape(url, options)

    async def _crawl_website(self, config: Dict) -> DocumentContent:
        """
        Crawl multiple pages from a website.

        config["options"] = {
            "max_pages": 10,
            "max_depth": 2,
            "include_patterns": ["*/docs/*", "*/guide/*"],
            "exclude_patterns": ["*/api/*", "*/admin/*"],
            "delay": 1.0,  # Seconds between requests
            "combine_pages": true  # Combine into single document or create multiple
        }
        """
        base_url = config["url"]
        options = config.get("options", {})
        max_pages = options.get("max_pages", 10)
        max_depth = options.get("max_depth", 2)
        combine_pages = options.get("combine_pages", True)

        # Discover URLs to crawl
        urls_to_crawl = await self._discover_urls(base_url, max_depth, options)
        urls_to_crawl = urls_to_crawl[:max_pages]  # Limit to max_pages

        # Scrape each URL
        scraped_pages = []
        for url in urls_to_crawl:
            try:
                page_content = await self._scrape_single_url({
                    "url": url,
                    "options": options
                })
                scraped_pages.append({
                    "url": url,
                    "content": page_content
                })

                # Respect delay
                if options.get("delay", 0) > 0:
                    await asyncio.sleep(options["delay"])

            except Exception as e:
                # Log error but continue crawling
                print(f"Failed to scrape {url}: {e}")
                continue

        if combine_pages:
            # Combine all pages into single document
            combined_text = ""
            combined_metadata = {"scraped_urls": [], "total_pages": len(scraped_pages)}

            for page in scraped_pages:
                combined_text += f"\n\n# Content from {page['url']}\n\n"
                combined_text += page["content"].text
                combined_metadata["scraped_urls"].append(page["url"])

            return DocumentContent(
                text=combined_text.strip(),
                metadata=combined_metadata,
                preview=combined_text[:500],
                word_count=len(combined_text.split()),
                character_count=len(combined_text)
            )
        else:
            # Return first page as primary, rest as metadata
            if scraped_pages:
                primary_page = scraped_pages[0]
                return DocumentContent(
                    text=primary_page["content"].text,
                    metadata={
                        "primary_url": primary_page["url"],
                        "additional_pages": [p["url"] for p in scraped_pages[1:]],
                        "total_pages": len(scraped_pages)
                    },
                    preview=primary_page["content"].text[:500],
                    word_count=primary_page["content"].word_count,
                    character_count=primary_page["content"].character_count
                )
            else:
                raise ValueError("No pages successfully scraped")

    async def _map_website(self, config: Dict) -> DocumentContent:
        """
        Map website structure and return URL list.

        config["options"] = {
            "max_depth": 3,
            "include_patterns": ["*/docs/*"],
            "exclude_patterns": ["*/api/*"],
            "return_metadata": true  # Include page titles, descriptions
        }
        """
        base_url = config["url"]
        options = config.get("options", {})
        max_depth = options.get("max_depth", 3)

        # Discover all URLs
        discovered_urls = await self._discover_urls(base_url, max_depth, options)

        # Optionally get metadata for each URL
        url_metadata = {}
        if options.get("return_metadata", False):
            for url in discovered_urls[:50]:  # Limit to prevent overload
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url, timeout=10) as response:
                            if response.status == 200:
                                html = await response.text()
                                soup = BeautifulSoup(html, 'html.parser')

                                title = soup.find('title')
                                title_text = title.text.strip() if title else ""

                                description = soup.find('meta', attrs={'name': 'description'})
                                description_text = description.get('content', '') if description else ""

                                url_metadata[url] = {
                                    "title": title_text,
                                    "description": description_text
                                }
                except Exception:
                    # Skip failed URLs
                    continue

        # Create sitemap document
        sitemap_text = f"# Website Sitemap for {base_url}\n\n"
        sitemap_text += f"Discovered {len(discovered_urls)} URLs:\n\n"

        for url in discovered_urls:
            sitemap_text += f"- {url}\n"
            if url in url_metadata:
                meta = url_metadata[url]
                if meta["title"]:
                    sitemap_text += f"  Title: {meta['title']}\n"
                if meta["description"]:
                    sitemap_text += f"  Description: {meta['description']}\n"
            sitemap_text += "\n"

        return DocumentContent(
            text=sitemap_text,
            metadata={
                "base_url": base_url,
                "discovered_urls": discovered_urls,
                "url_metadata": url_metadata,
                "total_urls": len(discovered_urls)
            },
            preview=sitemap_text[:500],
            word_count=len(sitemap_text.split()),
            character_count=len(sitemap_text)
        )

    async def _search_and_extract(self, config: Dict) -> DocumentContent:
        """
        Search web and extract content from results.

        config["options"] = {
            "query": "Python FastAPI documentation",
            "max_results": 5,
            "search_engine": "google" | "bing" | "duckduckgo",
            "extract_content": true  # Extract full content from each result
        }
        """
        # This would integrate with search APIs
        # For now, placeholder implementation
        query = config["options"]["query"]
        max_results = config["options"].get("max_results", 5)

        # Placeholder - would implement actual search
        search_results = [
            {"url": "https://fastapi.tiangolo.com/", "title": "FastAPI Documentation"},
            {"url": "https://fastapi.tiangolo.com/tutorial/", "title": "FastAPI Tutorial"}
        ]

        # Extract content from each result
        extracted_content = ""
        for result in search_results[:max_results]:
            try:
                page_content = await self._scrape_single_url({
                    "url": result["url"],
                    "options": {"format": "markdown"}
                })
                extracted_content += f"\n\n# {result['title']}\nSource: {result['url']}\n\n"
                extracted_content += page_content.text
            except Exception as e:
                continue

        return DocumentContent(
            text=extracted_content,
            metadata={
                "search_query": query,
                "search_results": search_results,
                "extracted_urls": [r["url"] for r in search_results]
            },
            preview=extracted_content[:500],
            word_count=len(extracted_content.split()),
            character_count=len(extracted_content)
        )

    async def _extract_structured_data(self, config: Dict) -> DocumentContent:
        """
        Extract structured data using AI.

        config["options"] = {
            "schema": {
                "type": "product_data",
                "fields": ["name", "price", "description", "features"]
            },
            "format": "json" | "markdown" | "csv"
        }
        """
        # This would use AI to extract structured data
        # Placeholder implementation
        url = config["url"]
        schema = config["options"].get("schema", {})

        # Scrape page first
        page_content = await self._scrape_single_url({
            "url": url,
            "options": {"format": "text"}
        })

        # Use AI to extract structured data (placeholder)
        # extracted_data = await ai_extraction_service.extract(page_content.text, schema)

        extracted_text = f"Structured data extracted from {url}\n\n"
        extracted_text += f"Schema: {schema}\n\n"
        extracted_text += f"Raw content:\n{page_content.text}"

        return DocumentContent(
            text=extracted_text,
            metadata={
                "extraction_schema": schema,
                "source_url": url,
                "extraction_method": "ai_powered"
            },
            preview=extracted_text[:500],
            word_count=len(extracted_text.split()),
            character_count=len(extracted_text)
        )

    # Helper methods
    async def _discover_urls(self, base_url: str, max_depth: int, options: Dict) -> List[str]:
        """Discover URLs on website up to max_depth"""
        discovered = set()
        to_crawl = [(base_url, 0)]  # (url, depth)

        include_patterns = options.get("include_patterns", [])
        exclude_patterns = options.get("exclude_patterns", [])

        while to_crawl and len(discovered) < 1000:  # Safety limit
            url, depth = to_crawl.pop(0)

            if depth >= max_depth or url in discovered:
                continue

            # Check patterns
            if include_patterns and not any(pattern in url for pattern in include_patterns):
                continue
            if exclude_patterns and any(pattern in url for pattern in exclude_patterns):
                continue

            discovered.add(url)

            # Find links on this page
            if depth < max_depth - 1:
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url, timeout=10) as response:
                            if response.status == 200:
                                html = await response.text()
                                soup = BeautifulSoup(html, 'html.parser')

                                for link in soup.find_all('a', href=True):
                                    href = link['href']
                                    if href.startswith('/'):
                                        href = f"{base_url.rstrip('/')}{href}"
                                    elif href.startswith('http'):
                                        # Only include same domain
                                        if base_url.split('/')[2] in href:
                                            to_crawl.append((href, depth + 1))
                except Exception:
                    continue

        return list(discovered)

    def get_source_metadata(self, source_config: Dict) -> Dict:
        """Get web scraping source metadata"""
        return {
            "source_type": "web_scraping",
            "method": source_config.get("method", "scrape"),
            "url": source_config.get("url"),
            "scraping_engine": self._get_preferred_engine(),
            "capabilities": {
                "can_crawl": True,
                "can_map": True,
                "can_search": True,
                "can_extract_structured": True
            }
        }

    def can_update(self) -> bool:
        """Web sources can be re-scraped"""
        return True

    def validate_config(self, source_config: Dict) -> bool:
        """Validate web scraping configuration"""
        if "url" not in source_config:
            return False

        method = source_config.get("method", "scrape")
        if method not in ["scrape", "crawl", "map", "search", "extract"]:
            return False

        return True

    def _check_crawl4ai(self) -> bool:
        """Check if Crawl4AI is available"""
        try:
            import crawl4ai
            return True
        except ImportError:
            return False

    def _check_firecrawl(self) -> bool:
        """Check if Firecrawl is available"""
        # Check environment variables for Firecrawl API key
        import os
        return bool(os.getenv("FIRECRAWL_API_KEY"))

    def _get_preferred_engine(self) -> str:
        """Get preferred scraping engine"""
        if self.crawl4ai_available:
            return "crawl4ai"
        elif self.firecrawl_available:
            return "firecrawl"
        else:
            return "custom"
```

### 2. Enhanced File Upload Adapter

```python
# backend/src/app/adapters/file_upload_adapter.py
"""
Enhanced file upload adapter supporting 15+ file formats with smart parsing.

SUPPORTED FORMATS:
- Documents: PDF, DOCX, DOC, TXT, RTF, ODT
- Presentations: PPTX, PPT
- Spreadsheets: XLSX, XLS, CSV, TSV
- Web: HTML, XML
- Images: PNG, JPEG, BMP, TIFF, HEIC (with OCR)
- Email: EML, MSG
- E-books: EPUB
- Markup: MD, RST, ORG

FEATURES:
- Smart content extraction preserving structure
- Metadata extraction (author, creation date, etc.)
- OCR for images and scanned PDFs
- Table extraction and formatting
- Multi-language support
"""

from typing import Dict, Optional
import os
import magic
from PIL import Image
import pytesseract

class FileUploadAdapter(SourceAdapter):
    """Enhanced file processing with smart parsing"""

    def __init__(self):
        self.supported_formats = {
            # Documents
            '.pdf': self._process_pdf,
            '.docx': self._process_docx,
            '.doc': self._process_doc,
            '.txt': self._process_txt,
            '.rtf': self._process_rtf,
            '.odt': self._process_odt,

            # Presentations
            '.pptx': self._process_pptx,
            '.ppt': self._process_ppt,

            # Spreadsheets
            '.xlsx': self._process_xlsx,
            '.xls': self._process_xls,
            '.csv': self._process_csv,
            '.tsv': self._process_tsv,

            # Web formats
            '.html': self._process_html,
            '.htm': self._process_html,
            '.xml': self._process_xml,

            # Images (with OCR)
            '.png': self._process_image_ocr,
            '.jpg': self._process_image_ocr,
            '.jpeg': self._process_image_ocr,
            '.bmp': self._process_image_ocr,
            '.tiff': self._process_image_ocr,
            '.heic': self._process_image_ocr,

            # Email
            '.eml': self._process_eml,
            '.msg': self._process_msg,

            # E-books
            '.epub': self._process_epub,

            # Markup
            '.md': self._process_markdown,
            '.rst': self._process_rst,
            '.org': self._process_org
        }

    async def extract_content(self, source_config: Dict) -> DocumentContent:
        """
        Extract content from uploaded file.

        source_config = {
            "file_path": "/path/to/file.pdf",
            "original_filename": "document.pdf",
            "options": {
                "preserve_structure": true,
                "extract_tables": true,
                "ocr_language": "eng",
                "include_metadata": true
            }
        }
        """
        file_path = source_config["file_path"]
        options = source_config.get("options", {})

        # Detect file type
        file_ext = os.path.splitext(file_path)[1].lower()

        if file_ext not in self.supported_formats:
            # Try to detect by MIME type
            file_type = magic.from_file(file_path, mime=True)
            file_ext = self._mime_to_extension(file_type)

        if file_ext not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_ext}")

        # Process file with format-specific handler
        processor = self.supported_formats[file_ext]
        content = await processor(file_path, options)

        # Add file metadata
        file_stats = os.stat(file_path)
        content.metadata.update({
            "file_size": file_stats.st_size,
            "file_extension": file_ext,
            "original_filename": source_config.get("original_filename"),
            "processing_engine": f"enhanced_{file_ext[1:]}_processor"
        })

        return content

    async def _process_pdf(self, file_path: str, options: Dict) -> DocumentContent:
        """
        Enhanced PDF processing with table extraction and OCR.

        FEATURES:
        - Text extraction preserving structure
        - Table detection and extraction
        - OCR for scanned PDFs
        - Metadata extraction
        """
        try:
            import pymupdf as fitz  # PyMuPDF for better PDF handling

            doc = fitz.open(file_path)
            text_content = ""
            tables = []
            images = []
            metadata = {}

            # Extract metadata
            pdf_metadata = doc.metadata
            if pdf_metadata:
                metadata.update({
                    "title": pdf_metadata.get("title", ""),
                    "author": pdf_metadata.get("author", ""),
                    "subject": pdf_metadata.get("subject", ""),
                    "creator": pdf_metadata.get("creator", ""),
                    "creation_date": pdf_metadata.get("creationDate", ""),
                    "modification_date": pdf_metadata.get("modDate", "")
                })

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)

                # Extract text
                page_text = page.get_text()

                # If preserve_structure is enabled, maintain formatting
                if options.get("preserve_structure", True):
                    # Get text with formatting info
                    blocks = page.get_text("dict")
                    formatted_text = self._format_pdf_blocks(blocks)
                    text_content += f"\n\n--- Page {page_num + 1} ---\n\n{formatted_text}"
                else:
                    text_content += f"\n\n--- Page {page_num + 1} ---\n\n{page_text}"

                # Extract tables if requested
                if options.get("extract_tables", True):
                    page_tables = self._extract_pdf_tables(page)
                    tables.extend(page_tables)

                # OCR for images/scanned content if text is sparse
                if len(page_text.strip()) < 50 and options.get("ocr_enabled", True):
                    # Convert page to image and OCR
                    pix = page.get_pixmap()
                    ocr_text = self._ocr_image_data(pix.tobytes(), options)
                    if ocr_text:
                        text_content += f"\n\n[OCR Content from Page {page_num + 1}]\n{ocr_text}"

            doc.close()

            # Add tables to content if found
            if tables and options.get("include_tables", True):
                text_content += "\n\n--- Extracted Tables ---\n\n"
                for i, table in enumerate(tables):
                    text_content += f"Table {i + 1}:\n{table}\n\n"

            return DocumentContent(
                text=text_content.strip(),
                metadata={
                    **metadata,
                    "page_count": len(doc),
                    "tables_found": len(tables),
                    "processing_method": "pymupdf_enhanced"
                },
                preview=text_content[:500],
                word_count=len(text_content.split()),
                character_count=len(text_content),
                page_count=len(doc)
            )

        except Exception as e:
            # Fallback to existing PyPDF2 method
            return await self._fallback_pdf_processing(file_path, options)

    async def _process_xlsx(self, file_path: str, options: Dict) -> DocumentContent:
        """
        Process Excel files with multiple sheet support.

        FEATURES:
        - All sheets or specific sheets
        - Header detection
        - Data type preservation
        - Formula extraction
        """
        import pandas as pd

        try:
            # Read all sheets
            excel_file = pd.ExcelFile(file_path)
            sheet_names = excel_file.sheet_names

            content_text = f"Excel file with {len(sheet_names)} sheets:\n\n"
            metadata = {
                "sheet_names": sheet_names,
                "total_sheets": len(sheet_names)
            }

            # Process each sheet
            for sheet_name in sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name)

                content_text += f"## Sheet: {sheet_name}\n"
                content_text += f"Dimensions: {df.shape[0]} rows x {df.shape[1]} columns\n\n"

                # Convert to text format
                if options.get("include_data", True):
                    # Include actual data (limit rows for large sheets)
                    max_rows = options.get("max_rows_per_sheet", 1000)
                    df_limited = df.head(max_rows)
                    content_text += df_limited.to_string(index=False)
                    content_text += "\n\n"

                # Add column info
                content_text += f"Columns: {', '.join(df.columns.tolist())}\n\n"

            return DocumentContent(
                text=content_text,
                metadata=metadata,
                preview=content_text[:500],
                word_count=len(content_text.split()),
                character_count=len(content_text)
            )

        except Exception as e:
            raise ValueError(f"Failed to process Excel file: {e}")

    async def _process_image_ocr(self, file_path: str, options: Dict) -> DocumentContent:
        """
        Process images with OCR.

        FEATURES:
        - Multiple language support
        - Text region detection
        - Confidence scoring
        - Layout preservation
        """
        try:
            # Open image
            image = Image.open(file_path)

            # OCR configuration
            ocr_lang = options.get("ocr_language", "eng")
            ocr_config = f"--oem 3 --psm 6 -l {ocr_lang}"

            # Extract text
            extracted_text = pytesseract.image_to_string(image, config=ocr_config)

            # Get confidence data
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            # Image metadata
            image_metadata = {
                "image_size": image.size,
                "image_mode": image.mode,
                "ocr_language": ocr_lang,
                "ocr_confidence": avg_confidence,
                "text_regions": len([conf for conf in confidences if conf > 50])
            }

            if extracted_text.strip():
                content = f"[OCR Extracted Text from Image]\n\n{extracted_text}"
            else:
                content = "[No text detected in image]"

            return DocumentContent(
                text=content,
                metadata=image_metadata,
                preview=content[:500],
                word_count=len(content.split()),
                character_count=len(content)
            )

        except Exception as e:
            raise ValueError(f"Failed to process image with OCR: {e}")

    # Additional format processors...
    # (Truncated for brevity - would include all 15+ formats)

    def get_source_metadata(self, source_config: Dict) -> Dict:
        """Get file upload metadata"""
        file_path = source_config.get("file_path", "")
        file_ext = os.path.splitext(file_path)[1].lower()

        return {
            "source_type": "file_upload",
            "file_extension": file_ext,
            "supported": file_ext in self.supported_formats,
            "capabilities": {
                "preserves_structure": file_ext in ['.pdf', '.docx', '.html'],
                "extracts_tables": file_ext in ['.pdf', '.xlsx', '.csv'],
                "supports_ocr": file_ext in ['.png', '.jpg', '.pdf'],
                "extracts_metadata": True
            }
        }

    def can_update(self) -> bool:
        """File uploads cannot be auto-updated"""
        return False

    def validate_config(self, source_config: Dict) -> bool:
        """Validate file upload configuration"""
        if "file_path" not in source_config:
            return False

        file_path = source_config["file_path"]
        if not os.path.exists(file_path):
            return False

        file_ext = os.path.splitext(file_path)[1].lower()
        return file_ext in self.supported_formats
```

### 3. Cloud Integration Adapter

```python
# backend/src/app/adapters/cloud_integration_adapter.py
"""
Cloud integration adapter for Google Docs, Notion, Dropbox, etc.

SUPPORTED SERVICES:
- Google Workspace: Docs, Sheets, Drive folders
- Notion: Pages, databases, workspaces
- Microsoft 365: SharePoint, OneDrive, Word Online
- Dropbox: Files and Paper documents
- Confluence: Spaces and pages
- Slack: Channel exports

FEATURES:
- OAuth2 authentication
- Real-time sync capabilities
- Incremental updates
- Metadata preservation
- Access control integration
"""

from typing import Dict, List, Optional
import json
from datetime import datetime

class CloudIntegrationAdapter(SourceAdapter):
    """Cloud service integration with OAuth and sync capabilities"""

    def __init__(self):
        self.supported_services = {
            "google_docs": self._process_google_docs,
            "google_sheets": self._process_google_sheets,
            "google_drive": self._process_google_drive,
            "notion": self._process_notion,
            "microsoft_365": self._process_microsoft_365,
            "dropbox": self._process_dropbox,
            "confluence": self._process_confluence,
            "slack": self._process_slack
        }

    async def extract_content(self, source_config: Dict) -> DocumentContent:
        """
        Extract content from cloud service.

        source_config = {
            "service": "google_docs" | "notion" | "microsoft_365" | ...,
            "resource_id": "document_id_or_url",
            "credentials": {
                "access_token": "oauth_token",
                "refresh_token": "refresh_token"
            },
            "options": {
                "include_comments": false,
                "export_format": "markdown",
                "sync_enabled": true
            }
        }
        """
        service = source_config.get("service")
        if service not in self.supported_services:
            raise ValueError(f"Unsupported cloud service: {service}")

        processor = self.supported_services[service]
        return await processor(source_config)

    async def _process_google_docs(self, config: Dict) -> DocumentContent:
        """
        Process Google Docs document.

        FEATURES:
        - Export as Markdown, HTML, or plain text
        - Preserve formatting and structure
        - Include comments and suggestions (optional)
        - Track revision history
        """
        from googleapiclient.discovery import build
        from google.oauth2.credentials import Credentials

        # Setup credentials
        creds_data = config["credentials"]
        credentials = Credentials(
            token=creds_data["access_token"],
            refresh_token=creds_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET")
        )

        # Initialize services
        docs_service = build('docs', 'v1', credentials=credentials)
        drive_service = build('drive', 'v3', credentials=credentials)

        document_id = config["resource_id"]
        options = config.get("options", {})

        try:
            # Get document content
            document = docs_service.documents().get(documentId=document_id).execute()

            # Get document metadata from Drive
            file_metadata = drive_service.files().get(
                fileId=document_id,
                fields="name,createdTime,modifiedTime,owners,description,mimeType"
            ).execute()

            # Extract text content
            content = self._extract_google_docs_text(document)

            # Get comments if requested
            comments = []
            if options.get("include_comments", False):
                comments_response = drive_service.comments().list(fileId=document_id).execute()
                comments = comments_response.get('comments', [])

            # Format content based on export format
            export_format = options.get("export_format", "markdown")
            if export_format == "markdown":
                formatted_content = self._format_as_markdown(document)
            else:
                formatted_content = content

            # Add comments if included
            if comments:
                formatted_content += "\n\n--- Comments ---\n\n"
                for comment in comments:
                    formatted_content += f"**{comment['author']['displayName']}**: {comment['content']}\n\n"

            return DocumentContent(
                text=formatted_content,
                metadata={
                    "document_title": file_metadata.get("name"),
                    "created_time": file_metadata.get("createdTime"),
                    "modified_time": file_metadata.get("modifiedTime"),
                    "owners": [owner.get("displayName") for owner in file_metadata.get("owners", [])],
                    "description": file_metadata.get("description", ""),
                    "google_doc_id": document_id,
                    "comments_count": len(comments),
                    "service": "google_docs"
                },
                preview=formatted_content[:500],
                word_count=len(formatted_content.split()),
                character_count=len(formatted_content)
            )

        except Exception as e:
            raise ValueError(f"Failed to process Google Doc: {e}")

    async def _process_notion(self, config: Dict) -> DocumentContent:
        """
        Process Notion page or database.

        FEATURES:
        - Page content with blocks
        - Database entries
        - Nested pages
        - Rich content preservation
        """
        import requests

        notion_token = config["credentials"]["access_token"]
        resource_id = config["resource_id"]
        options = config.get("options", {})

        headers = {
            "Authorization": f"Bearer {notion_token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }

        try:
            # Get page/database info
            response = requests.get(
                f"https://api.notion.com/v1/pages/{resource_id}",
                headers=headers
            )

            if response.status_code != 200:
                # Try as database
                response = requests.get(
                    f"https://api.notion.com/v1/databases/{resource_id}",
                    headers=headers
                )

            if response.status_code != 200:
                raise ValueError(f"Could not access Notion resource: {response.text}")

            resource_data = response.json()

            # Get blocks (content)
            blocks_response = requests.get(
                f"https://api.notion.com/v1/blocks/{resource_id}/children",
                headers=headers
            )

            if blocks_response.status_code == 200:
                blocks = blocks_response.json().get("results", [])
                content = self._notion_blocks_to_text(blocks)
            else:
                content = f"Notion {resource_data.get('object', 'resource')}: {resource_data.get('title', {}).get('title', [{}])[0].get('plain_text', 'Untitled')}"

            return DocumentContent(
                text=content,
                metadata={
                    "notion_id": resource_id,
                    "notion_type": resource_data.get("object"),
                    "title": self._extract_notion_title(resource_data),
                    "created_time": resource_data.get("created_time"),
                    "last_edited_time": resource_data.get("last_edited_time"),
                    "created_by": resource_data.get("created_by", {}).get("id"),
                    "service": "notion"
                },
                preview=content[:500],
                word_count=len(content.split()),
                character_count=len(content)
            )

        except Exception as e:
            raise ValueError(f"Failed to process Notion resource: {e}")

    # Additional cloud service processors...
    # (Truncated for brevity)

    def get_source_metadata(self, source_config: Dict) -> Dict:
        """Get cloud integration metadata"""
        service = source_config.get("service")

        return {
            "source_type": "cloud_integration",
            "service": service,
            "requires_oauth": True,
            "supports_sync": True,
            "capabilities": {
                "real_time_updates": service in ["notion", "google_docs"],
                "export_formats": ["markdown", "html", "text"],
                "includes_metadata": True,
                "preserves_formatting": True
            }
        }

    def can_update(self) -> bool:
        """Cloud sources support real-time updates"""
        return True

    def validate_config(self, source_config: Dict) -> bool:
        """Validate cloud integration configuration"""
        required_fields = ["service", "resource_id", "credentials"]

        for field in required_fields:
            if field not in source_config:
                return False

        service = source_config["service"]
        if service not in self.supported_services:
            return False

        credentials = source_config["credentials"]
        if "access_token" not in credentials:
            return False

        return True
```

## Integration with Existing Services

### Enhanced KB Draft Service
```python
# backend/src/app/services/kb_draft_service.py (Enhanced)
"""
Enhanced KB Draft Service with multi-source support.

BUILDS ON: Existing kb_draft_service.py
ADDS: Source adapter integration, source combination, preview capabilities
"""

class KBDraftService:
    def __init__(self):
        self.source_adapters = {
            "web_scraping": WebScrapingAdapter(),
            "file_upload": FileUploadAdapter(),
            "cloud_integration": CloudIntegrationAdapter(),
            "text_input": TextInputAdapter()  # Simple wrapper for direct text
        }

    async def add_source_to_draft(
        self,
        draft_id: str,
        source_config: Dict,
        user_id: UUID,
        db: Session
    ) -> Dict:
        """
        Add any source type to KB draft.

        ENHANCEMENT: Uses source adapters for unified processing
        MAINTAINS: Existing draft structure and Redis storage
        """
        # Validate source configuration
        source_type = source_config.get("source_type")
        if source_type not in self.source_adapters:
            raise ValueError(f"Unsupported source type: {source_type}")

        adapter = self.source_adapters[source_type]
        if not adapter.validate_config(source_config):
            raise ValueError("Invalid source configuration")

        # Extract content using appropriate adapter
        try:
            document_content = await adapter.extract_content(source_config)
            source_metadata = adapter.get_source_metadata(source_config)

            # Get existing draft
            draft = draft_service.get_draft(DraftType.KB, draft_id)
            if not draft:
                raise ValueError("KB draft not found")

            # Add source to draft
            sources = draft["data"].get("sources", [])
            source_entry = {
                "id": str(uuid4()),
                "source_type": source_type,
                "source_config": source_config,
                "content": {
                    "text": document_content.text,
                    "preview": document_content.preview,
                    "word_count": document_content.word_count,
                    "character_count": document_content.character_count,
                    "page_count": document_content.page_count
                },
                "metadata": {
                    **document_content.metadata,
                    **source_metadata
                },
                "annotations": source_config.get("annotations", {}),
                "added_at": datetime.utcnow().isoformat(),
                "added_by": str(user_id),
                "can_update": adapter.can_update()
            }

            sources.append(source_entry)

            # Update draft
            draft_service.update_draft(
                draft_type=DraftType.KB,
                draft_id=draft_id,
                updates={"data": {"sources": sources}}
            )

            return {
                "source_id": source_entry["id"],
                "content_preview": document_content.preview,
                "word_count": document_content.word_count,
                "status": "added"
            }

        except Exception as e:
            # Log error and return failure
            return {
                "error": str(e),
                "status": "failed"
            }

    async def combine_sources(
        self,
        draft_id: str,
        combination_config: Dict
    ) -> Dict:
        """
        Combine multiple sources into a unified document.

        combination_config = {
            "method": "concatenate" | "section_based" | "topic_based",
            "source_ids": ["source1", "source2", "source3"],
            "separator": "\n\n---\n\n",
            "add_source_headers": true,
            "preserve_metadata": true
        }
        """
        draft = draft_service.get_draft(DraftType.KB, draft_id)
        if not draft:
            raise ValueError("KB draft not found")

        sources = draft["data"].get("sources", [])
        source_ids = combination_config.get("source_ids", [])
        method = combination_config.get("method", "concatenate")

        # Filter selected sources
        selected_sources = [s for s in sources if s["id"] in source_ids]
        if not selected_sources:
            raise ValueError("No valid sources selected for combination")

        if method == "concatenate":
            combined_content = self._concatenate_sources(selected_sources, combination_config)
        elif method == "section_based":
            combined_content = self._combine_by_sections(selected_sources, combination_config)
        elif method == "topic_based":
            combined_content = self._combine_by_topics(selected_sources, combination_config)
        else:
            raise ValueError(f"Unsupported combination method: {method}")

        # Add combined source to draft
        combined_source = {
            "id": str(uuid4()),
            "source_type": "combined",
            "content": combined_content,
            "metadata": {
                "combination_method": method,
                "source_count": len(selected_sources),
                "combined_from": source_ids,
                "combined_at": datetime.utcnow().isoformat()
            },
            "annotations": {
                "enabled": True,
                "category": "combined",
                "purpose": f"Combined from {len(selected_sources)} sources",
                "context": f"Combined using {method} method"
            }
        }

        sources.append(combined_source)

        # Update draft
        draft_service.update_draft(
            draft_type=DraftType.KB,
            draft_id=draft_id,
            updates={"data": {"sources": sources}}
        )

        return {
            "combined_source_id": combined_source["id"],
            "content_preview": combined_content["preview"],
            "total_words": combined_content["word_count"],
            "status": "combined"
        }
```

## Summary

This enhanced source management system:

1. **Builds on existing architecture** - Uses current models, services, and patterns
2. **Adds powerful capabilities** - Advanced web scraping, cloud integrations, file processing
3. **Maintains simplicity** - Unified adapter interface, progressive complexity
4. **Preserves compliance** - Multi-tenancy, access control, audit logging
5. **Enables source combination** - Multiple sources into unified knowledge bases

The implementation leverages the existing draft-first system, document processing pipeline, and multi-tenancy while adding the advanced source capabilities users need.