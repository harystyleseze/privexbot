# Module 3: Configuration & Annotation System

## Overview

Build a comprehensive configuration system that allows users to customize chunking, indexing, and retrieval settings per source while providing intelligent annotations that help the AI understand documents better. This system builds on the existing `Document.annotations` and `KnowledgeBase.config` fields.

## Enhanced Configuration Architecture

### Hierarchical Configuration System
Configuration cascades from global defaults → organization → workspace → knowledge base → document:

```python
# backend/src/app/services/configuration_service.py
"""
Hierarchical configuration management for KB pipeline.

WHY: Different users need different default settings
HOW: Configuration inheritance with override capabilities
BUILDS ON: Existing KnowledgeBase.config and Document.chunking_config
"""

from typing import Dict, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

class ConfigurationLevel(Enum):
    """Configuration hierarchy levels"""
    GLOBAL = "global"
    ORGANIZATION = "organization"
    WORKSPACE = "workspace"
    KNOWLEDGE_BASE = "knowledge_base"
    DOCUMENT = "document"
    SOURCE = "source"  # Per-source overrides

@dataclass
class ChunkingConfiguration:
    """Complete chunking configuration with intelligent defaults"""

    # Strategy Configuration
    strategy: str = "adaptive"  # adaptive, heading_based, semantic, recursive, etc.
    max_chunk_size: int = 1000  # Characters
    chunk_overlap: int = 200    # Character overlap between chunks
    min_chunk_size: int = 100   # Minimum viable chunk size

    # Structure Preservation
    preserve_structure: bool = True  # Maintain document hierarchy
    respect_boundaries: bool = True  # Don't split across logical boundaries
    merge_short_paragraphs: bool = False  # Combine very short paragraphs

    # Content-Specific Settings
    code_chunk_size: int = 2000     # Larger chunks for code
    table_handling: str = "preserve"  # preserve, split, extract
    list_handling: str = "preserve"   # preserve, split, flatten

    # Language and Parsing
    language: str = "auto"  # auto-detect or specific language code
    handle_equations: bool = True    # Special handling for mathematical content
    preserve_formatting: bool = True # Maintain markdown/HTML formatting

    # Advanced Options
    adaptive_sizing: bool = True     # Adjust chunk size based on content type
    context_window: int = 2          # Surrounding chunks for context
    semantic_threshold: float = 0.7  # Similarity threshold for semantic chunking

@dataclass
class EmbeddingConfiguration:
    """Embedding generation configuration"""

    # Model Selection
    provider: str = "openai"  # openai, huggingface, sentence_transformers, local
    model: str = "text-embedding-ada-002"  # Specific model name
    dimensions: int = 1536    # Embedding dimensions

    # Processing Options
    batch_size: int = 100     # Embeddings per batch
    rate_limit: float = 100.0 # Requests per second
    max_retries: int = 3      # Retry failed embeddings

    # Content Preprocessing
    normalize_text: bool = True      # Normalize Unicode, whitespace
    remove_special_chars: bool = False # Clean special characters
    truncate_long_text: bool = True   # Truncate if exceeds model limits

@dataclass
class VectorStoreConfiguration:
    """Vector store and indexing configuration"""

    # Vector Store Settings
    provider: str = "qdrant"  # faiss, qdrant, weaviate, pinecone, etc.
    index_type: str = "auto" # auto-select or specific index type
    similarity_metric: str = "cosine"  # cosine, euclidean, dot_product

    # Performance Settings
    cache_enabled: bool = True
    batch_upsert: bool = True
    parallel_processing: bool = True

    # Metadata Indexing
    metadata_fields: list = None  # Fields to index for filtering
    full_text_search: bool = True # Enable keyword search alongside semantic

@dataclass
class RetrievalConfiguration:
    """Search and retrieval configuration"""

    # Search Strategy
    search_method: str = "hybrid"  # semantic, keyword, hybrid
    top_k: int = 5               # Number of chunks to retrieve
    similarity_threshold: float = 0.7  # Minimum similarity score

    # Hybrid Search Weights
    semantic_weight: float = 0.7   # Weight for semantic search
    keyword_weight: float = 0.3    # Weight for keyword search

    # Re-ranking and Filtering
    enable_reranking: bool = True  # Re-rank results for relevance
    diversity_threshold: float = 0.8  # Avoid very similar results
    include_metadata: bool = True     # Return chunk metadata

    # Context Enhancement
    expand_context: bool = True    # Include surrounding chunks
    max_context_chunks: int = 3    # Maximum context chunks per result

@dataclass
class KnowledgeBaseConfiguration:
    """Complete KB configuration"""
    chunking: ChunkingConfiguration
    embedding: EmbeddingConfiguration
    vector_store: VectorStoreConfiguration
    retrieval: RetrievalConfiguration

    # Processing Options
    async_processing: bool = True     # Process documents asynchronously
    error_handling: str = "continue"  # continue, stop, retry
    quality_checks: bool = True       # Validate chunks before indexing

    # Monitoring and Debugging
    enable_monitoring: bool = True    # Track processing pipeline
    log_level: str = "info"          # debug, info, warning, error
    retain_debug_info: bool = False   # Keep detailed processing logs

class ConfigurationService:
    """
    Manage hierarchical configuration with intelligent defaults.

    FEATURES:
    - Configuration inheritance with override capabilities
    - Per-source configuration management
    - Template-based configuration for common scenarios
    - Validation and optimization of configuration settings
    """

    def __init__(self, db: Session, redis_client):
        self.db = db
        self.redis = redis_client

        # Default configurations for different document types
        self.document_type_templates = {
            "documentation": self._get_documentation_template(),
            "research_papers": self._get_research_template(),
            "code_repositories": self._get_code_template(),
            "customer_support": self._get_support_template(),
            "legal_documents": self._get_legal_template(),
            "marketing_content": self._get_marketing_template()
        }

    def get_effective_configuration(
        self,
        organization_id: Optional[UUID] = None,
        workspace_id: Optional[UUID] = None,
        knowledge_base_id: Optional[UUID] = None,
        document_id: Optional[UUID] = None,
        source_config: Optional[Dict] = None
    ) -> KnowledgeBaseConfiguration:
        """
        Resolve effective configuration by merging hierarchy levels.

        HIERARCHY (lowest to highest priority):
        1. Global defaults
        2. Organization settings
        3. Workspace settings
        4. Knowledge Base settings
        5. Document settings
        6. Source-specific overrides
        """

        # Start with global defaults
        config = self._get_global_defaults()

        # Apply organization-level overrides
        if organization_id:
            org_config = self._get_organization_config(organization_id)
            config = self._merge_configurations(config, org_config)

        # Apply workspace-level overrides
        if workspace_id:
            workspace_config = self._get_workspace_config(workspace_id)
            config = self._merge_configurations(config, workspace_config)

        # Apply knowledge base-level overrides
        if knowledge_base_id:
            kb_config = self._get_knowledge_base_config(knowledge_base_id)
            config = self._merge_configurations(config, kb_config)

        # Apply document-level overrides
        if document_id:
            doc_config = self._get_document_config(document_id)
            config = self._merge_configurations(config, doc_config)

        # Apply source-specific overrides
        if source_config and source_config.get("processing_overrides"):
            source_overrides = source_config["processing_overrides"]
            config = self._merge_configurations(config, source_overrides)

        # Validate and optimize final configuration
        config = self._validate_configuration(config)

        return config

    def get_source_configuration_template(
        self,
        source_type: str,
        document_type: Optional[str] = None
    ) -> Dict:
        """
        Get configuration template optimized for specific source and document types.

        TEMPLATES:
        - Web scraping: Larger chunks, preserve structure, handle dynamic content
        - File uploads: Format-specific optimization, metadata extraction
        - Cloud integrations: Real-time sync settings, incremental updates
        - Code repositories: Code-aware chunking, syntax preservation
        """

        # Base template for source type
        if source_type == "web_scraping":
            template = {
                "chunking": {
                    "strategy": "heading_based",
                    "max_chunk_size": 1500,  # Web content often longer
                    "preserve_structure": True,
                    "respect_boundaries": True,
                    "adaptive_sizing": True
                },
                "processing": {
                    "clean_html": True,
                    "extract_metadata": True,
                    "handle_dynamic_content": True
                }
            }

        elif source_type == "file_upload":
            template = {
                "chunking": {
                    "strategy": "adaptive",
                    "preserve_structure": True,
                    "adaptive_sizing": True
                },
                "processing": {
                    "extract_metadata": True,
                    "handle_tables": "preserve",
                    "ocr_enabled": True  # For images and scanned PDFs
                }
            }

        elif source_type == "cloud_integration":
            template = {
                "chunking": {
                    "strategy": "heading_based",
                    "preserve_structure": True
                },
                "processing": {
                    "sync_enabled": True,
                    "incremental_updates": True,
                    "preserve_cloud_metadata": True
                }
            }

        else:
            template = self._get_global_defaults()

        # Apply document type optimizations
        if document_type and document_type in self.document_type_templates:
            doc_template = self.document_type_templates[document_type]
            template = self._merge_configurations(template, doc_template)

        return template

    def _get_documentation_template(self) -> Dict:
        """Configuration optimized for technical documentation"""
        return {
            "chunking": {
                "strategy": "heading_based",
                "max_chunk_size": 1200,
                "preserve_structure": True,
                "respect_boundaries": True,
                "code_chunk_size": 2000,
                "table_handling": "preserve"
            },
            "retrieval": {
                "search_method": "hybrid",
                "semantic_weight": 0.6,
                "keyword_weight": 0.4,  # Higher keyword weight for technical terms
                "top_k": 5
            }
        }

    def _get_code_template(self) -> Dict:
        """Configuration optimized for code repositories"""
        return {
            "chunking": {
                "strategy": "adaptive",
                "max_chunk_size": 2000,  # Larger chunks for code
                "code_chunk_size": 3000,
                "preserve_structure": True,
                "handle_equations": False,  # Not relevant for code
                "preserve_formatting": True  # Critical for code
            },
            "embedding": {
                "model": "code-search-ada-code-001",  # Code-specific model if available
                "normalize_text": False  # Preserve exact code formatting
            },
            "retrieval": {
                "search_method": "hybrid",
                "semantic_weight": 0.5,
                "keyword_weight": 0.5  # Equal weight for code search
            }
        }

    def _get_research_template(self) -> Dict:
        """Configuration optimized for research papers and academic content"""
        return {
            "chunking": {
                "strategy": "semantic",
                "max_chunk_size": 1500,  # Academic content benefits from larger chunks
                "preserve_structure": True,
                "handle_equations": True,
                "table_handling": "preserve",
                "semantic_threshold": 0.75  # Higher threshold for academic coherence
            },
            "retrieval": {
                "search_method": "semantic",  # Focus on semantic understanding
                "semantic_weight": 0.8,
                "keyword_weight": 0.2,
                "enable_reranking": True
            }
        }
```

### Annotation System Enhancement

```python
# backend/src/app/services/annotation_service.py
"""
Enhanced annotation system for helping AI understand documents better.

BUILDS ON: Existing Document.annotations field
ADDS: AI-powered annotation suggestions, annotation templates, validation
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class AnnotationCategory(Enum):
    """Document annotation categories"""
    DOCUMENT_TYPE = "document_type"      # FAQ, manual, policy, etc.
    CONTENT_DOMAIN = "content_domain"    # Technical, legal, medical, etc.
    USAGE_CONTEXT = "usage_context"     # Customer support, internal docs, etc.
    IMPORTANCE_LEVEL = "importance"     # Critical, high, medium, low
    AUDIENCE = "audience"               # Public, internal, expert, beginner
    UPDATE_FREQUENCY = "update_freq"    # Static, weekly, monthly, dynamic

@dataclass
class DocumentAnnotation:
    """Enhanced document annotation structure"""

    # Core Annotation Fields
    enabled: bool = True
    category: str = "document"
    importance: str = "medium"

    # Content Classification
    document_type: Optional[str] = None  # manual, faq, policy, guide, reference
    content_domain: Optional[str] = None # technical, legal, medical, business
    audience_level: Optional[str] = None # beginner, intermediate, expert, mixed

    # Context and Purpose
    purpose: str = ""           # Why this document exists
    context: str = ""           # Additional context about the document
    usage_instructions: str = "" # How AI should use this document
    constraints: str = ""       # Limitations or warnings

    # Searchability Enhancement
    keywords: List[str] = None          # Key search terms
    synonyms: Dict[str, List[str]] = None # Term synonyms for better matching
    topics: List[str] = None            # Main topics covered

    # Quality and Metadata
    confidence: float = 1.0      # Annotation confidence (0-1)
    last_reviewed: Optional[str] = None # When annotations were last reviewed
    review_notes: str = ""       # Notes from last review

    # AI-Specific Instructions
    response_style: Optional[str] = None    # formal, casual, technical, simple
    cite_priority: Optional[str] = None     # always, preferred, optional, never
    context_requirements: List[str] = None  # Required context for responses

    def __post_init__(self):
        if self.keywords is None:
            self.keywords = []
        if self.synonyms is None:
            self.synonyms = {}
        if self.topics is None:
            self.topics = []
        if self.context_requirements is None:
            self.context_requirements = []

class AnnotationService:
    """
    Intelligent annotation management for knowledge base documents.

    FEATURES:
    - AI-powered annotation suggestions
    - Template-based annotation for common document types
    - Annotation validation and optimization
    - Bulk annotation operations
    """

    def __init__(self, ai_service):
        self.ai_service = ai_service

        # Predefined annotation templates
        self.annotation_templates = {
            "api_documentation": self._get_api_doc_template(),
            "user_manual": self._get_user_manual_template(),
            "policy_document": self._get_policy_template(),
            "faq_document": self._get_faq_template(),
            "troubleshooting_guide": self._get_troubleshooting_template(),
            "code_documentation": self._get_code_doc_template()
        }

    async def suggest_annotations(
        self,
        document_content: str,
        source_metadata: Dict,
        existing_annotations: Optional[Dict] = None
    ) -> DocumentAnnotation:
        """
        Generate AI-powered annotation suggestions for a document.

        PROCESS:
        1. Analyze document content and structure
        2. Extract key topics and keywords
        3. Classify document type and domain
        4. Generate usage instructions
        5. Suggest optimization settings
        """

        try:
            # Analyze document content
            content_analysis = await self._analyze_document_content(document_content)

            # Classify document type
            document_type = await self._classify_document_type(document_content, source_metadata)

            # Extract key information
            keywords = await self._extract_keywords(document_content)
            topics = await self._extract_topics(document_content)

            # Generate usage instructions
            usage_instructions = await self._generate_usage_instructions(
                document_content, document_type, content_analysis
            )

            # Build annotation suggestion
            suggested_annotation = DocumentAnnotation(
                enabled=True,
                category="document",
                document_type=document_type,
                content_domain=content_analysis.get("domain"),
                audience_level=content_analysis.get("audience_level"),
                purpose=f"AI-detected: {document_type} content",
                context=f"Source: {source_metadata.get('source_type', 'unknown')}",
                usage_instructions=usage_instructions,
                keywords=keywords,
                topics=topics,
                confidence=content_analysis.get("confidence", 0.8),
                response_style=content_analysis.get("response_style", "professional")
            )

            # Merge with existing annotations if provided
            if existing_annotations:
                suggested_annotation = self._merge_annotations(
                    existing_annotations, suggested_annotation
                )

            return suggested_annotation

        except Exception as e:
            # Fallback to basic annotation
            return self._get_basic_annotation(source_metadata)

    def get_annotation_template(self, template_name: str) -> DocumentAnnotation:
        """Get predefined annotation template for common document types"""

        if template_name in self.annotation_templates:
            return self.annotation_templates[template_name]
        else:
            return self._get_basic_annotation({})

    def validate_annotations(self, annotations: Dict) -> Dict:
        """
        Validate and optimize annotation settings.

        CHECKS:
        - Required fields are present
        - Values are within valid ranges
        - Consistency between related fields
        - Optimization suggestions
        """

        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "suggestions": []
        }

        # Check required fields
        required_fields = ["enabled", "category", "purpose"]
        for field in required_fields:
            if field not in annotations or not annotations[field]:
                validation_result["errors"].append(f"Missing required field: {field}")
                validation_result["valid"] = False

        # Validate importance level
        valid_importance = ["low", "medium", "high", "critical"]
        if annotations.get("importance") not in valid_importance:
            validation_result["warnings"].append(
                f"Invalid importance level. Valid options: {valid_importance}"
            )

        # Validate document type
        valid_doc_types = ["manual", "faq", "policy", "guide", "reference", "api_docs", "troubleshooting"]
        if annotations.get("document_type") and annotations["document_type"] not in valid_doc_types:
            validation_result["suggestions"].append(
                f"Consider using standard document type: {valid_doc_types}"
            )

        # Check keyword optimization
        keywords = annotations.get("keywords", [])
        if len(keywords) == 0:
            validation_result["suggestions"].append(
                "Adding keywords will improve document searchability"
            )
        elif len(keywords) > 20:
            validation_result["warnings"].append(
                "Too many keywords may dilute search effectiveness. Consider reducing to top 10-15."
            )

        # Check usage instructions
        usage_instructions = annotations.get("usage_instructions", "")
        if not usage_instructions:
            validation_result["suggestions"].append(
                "Adding usage instructions helps AI provide more accurate responses"
            )

        return validation_result

    async def bulk_annotate_documents(
        self,
        document_ids: List[UUID],
        annotation_template: str,
        custom_overrides: Optional[Dict] = None
    ) -> Dict:
        """
        Apply annotations to multiple documents efficiently.

        PROCESS:
        1. Get annotation template
        2. Apply to each document with customizations
        3. Validate and save annotations
        4. Return summary of operations
        """

        results = {
            "processed": 0,
            "successful": 0,
            "failed": 0,
            "errors": []
        }

        # Get base template
        base_annotation = self.get_annotation_template(annotation_template)

        # Apply custom overrides
        if custom_overrides:
            base_annotation = self._merge_annotations(base_annotation, custom_overrides)

        for doc_id in document_ids:
            try:
                results["processed"] += 1

                # Get document
                document = self.db.query(Document).filter(Document.id == doc_id).first()
                if not document:
                    results["errors"].append(f"Document {doc_id} not found")
                    results["failed"] += 1
                    continue

                # Customize annotation for this specific document
                customized_annotation = await self._customize_annotation_for_document(
                    base_annotation, document
                )

                # Update document annotations
                document.annotations = asdict(customized_annotation)
                self.db.commit()

                results["successful"] += 1

            except Exception as e:
                results["errors"].append(f"Failed to annotate document {doc_id}: {str(e)}")
                results["failed"] += 1

        return results

    # Helper methods for AI-powered analysis
    async def _analyze_document_content(self, content: str) -> Dict:
        """Analyze document content using AI to extract characteristics"""

        analysis_prompt = f"""
        Analyze this document content and provide:
        1. Content domain (technical, legal, medical, business, etc.)
        2. Audience level (beginner, intermediate, expert, mixed)
        3. Response style recommendation (formal, casual, technical, simple)
        4. Confidence score (0-1)

        Content preview: {content[:1000]}...

        Respond in JSON format.
        """

        try:
            # This would use the AI service to analyze content
            # Placeholder implementation
            analysis = {
                "domain": "technical",
                "audience_level": "intermediate",
                "response_style": "professional",
                "confidence": 0.8
            }
            return analysis
        except Exception:
            return {
                "domain": "general",
                "audience_level": "mixed",
                "response_style": "professional",
                "confidence": 0.5
            }

    async def _classify_document_type(self, content: str, metadata: Dict) -> str:
        """Classify document type based on content and metadata"""

        # Simple classification based on common patterns
        content_lower = content.lower()

        if "frequently asked" in content_lower or "faq" in content_lower:
            return "faq"
        elif "api" in content_lower and ("endpoint" in content_lower or "request" in content_lower):
            return "api_documentation"
        elif "policy" in content_lower or "terms" in content_lower:
            return "policy_document"
        elif "troubleshoot" in content_lower or "error" in content_lower:
            return "troubleshooting_guide"
        elif "manual" in content_lower or "guide" in content_lower:
            return "user_manual"
        else:
            return "reference"

    async def _extract_keywords(self, content: str) -> List[str]:
        """Extract key terms and phrases from document content"""

        # Simple keyword extraction (production would use NLP libraries)
        import re
        from collections import Counter

        # Remove common words and extract meaningful terms
        words = re.findall(r'\b[a-zA-Z]{3,}\b', content.lower())
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'but', 'have', 'what', 'were', 'they', 'this', 'that', 'with', 'from'}

        filtered_words = [word for word in words if word not in stop_words]
        word_counts = Counter(filtered_words)

        # Return top 10 most common words as keywords
        return [word for word, count in word_counts.most_common(10)]

    async def _extract_topics(self, content: str) -> List[str]:
        """Extract main topics from document content"""

        # Simple topic extraction based on headings and key phrases
        import re

        topics = []

        # Extract from headings (markdown style)
        headings = re.findall(r'^#+\s+(.*)', content, re.MULTILINE)
        topics.extend([h.strip() for h in headings[:5]])  # Top 5 headings

        # Extract from bold text (markdown style)
        bold_text = re.findall(r'\*\*(.*?)\*\*', content)
        topics.extend([b.strip() for b in bold_text[:3]])  # Top 3 bold terms

        return topics[:10]  # Limit to 10 topics

    async def _generate_usage_instructions(
        self,
        content: str,
        document_type: str,
        analysis: Dict
    ) -> str:
        """Generate AI usage instructions based on document characteristics"""

        instructions_map = {
            "faq": "Use this document to answer frequently asked questions. Provide direct, concise answers.",
            "api_documentation": "Reference this for API-related queries. Include code examples when relevant.",
            "policy_document": "Cite this for policy and compliance questions. Quote exact text when possible.",
            "troubleshooting_guide": "Use for technical support and problem-solving queries. Follow step-by-step procedures.",
            "user_manual": "Reference for how-to questions and feature explanations. Provide clear instructions.",
            "reference": "Use as supporting information for general queries about the topic."
        }

        base_instruction = instructions_map.get(document_type, "Use as relevant supporting information.")

        # Add audience-specific guidance
        audience = analysis.get("audience_level", "mixed")
        if audience == "beginner":
            base_instruction += " Explain technical terms and provide additional context."
        elif audience == "expert":
            base_instruction += " Assume technical knowledge and focus on specific details."

        return base_instruction

    # Annotation templates for common document types
    def _get_api_doc_template(self) -> DocumentAnnotation:
        """Template for API documentation"""
        return DocumentAnnotation(
            enabled=True,
            category="api_documentation",
            document_type="api_documentation",
            content_domain="technical",
            audience_level="intermediate",
            purpose="API reference and integration guide",
            usage_instructions="Use for API-related queries. Include code examples and endpoint details.",
            keywords=["api", "endpoint", "request", "response", "authentication"],
            topics=["API", "endpoints", "authentication", "responses"],
            response_style="technical",
            cite_priority="always"
        )

    def _get_faq_template(self) -> DocumentAnnotation:
        """Template for FAQ documents"""
        return DocumentAnnotation(
            enabled=True,
            category="faq",
            document_type="faq",
            content_domain="general",
            audience_level="mixed",
            purpose="Frequently asked questions and answers",
            usage_instructions="Use for common questions. Provide direct, concise answers.",
            keywords=["question", "answer", "frequently", "asked"],
            topics=["FAQ", "common questions"],
            response_style="simple",
            cite_priority="preferred"
        )
```

### Content Preview System

```python
# backend/src/app/services/content_preview_service.py
"""
Content preview service for document analysis before processing.

WHY: Users need to see how their content will be processed
HOW: Generate previews of chunks, metadata, and processing results
"""

from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class ContentPreview:
    """Preview of document processing results"""

    # Content Analysis
    total_length: int
    word_count: int
    estimated_chunks: int
    detected_language: str
    detected_format: str

    # Structure Analysis
    has_headings: bool
    has_tables: bool
    has_lists: bool
    has_code: bool
    structure_score: float  # How well-structured the document is (0-1)

    # Preview Chunks
    sample_chunks: List[Dict]  # First few chunks with metadata
    chunk_size_distribution: Dict[str, int]  # Small, medium, large chunk counts

    # Processing Recommendations
    recommended_strategy: str
    optimization_suggestions: List[str]
    potential_issues: List[str]

    # Metadata Preview
    extracted_metadata: Dict
    suggested_annotations: Dict

class ContentPreviewService:
    """Generate content previews for user review before processing"""

    def __init__(self, chunking_service, annotation_service):
        self.chunking_service = chunking_service
        self.annotation_service = annotation_service

    async def generate_preview(
        self,
        content: str,
        source_config: Dict,
        processing_config: Dict
    ) -> ContentPreview:
        """
        Generate comprehensive preview of document processing.

        FEATURES:
        - Content analysis and statistics
        - Sample chunk generation
        - Processing recommendations
        - Issue identification
        """

        # Basic content analysis
        content_stats = self._analyze_content_statistics(content)

        # Structure analysis
        structure_analysis = self._analyze_document_structure(content)

        # Generate sample chunks
        sample_chunks = await self._generate_sample_chunks(content, processing_config)

        # Get processing recommendations
        recommendations = self._get_processing_recommendations(
            content_stats, structure_analysis, source_config
        )

        # Extract metadata
        extracted_metadata = await self._extract_preview_metadata(content, source_config)

        # Generate annotation suggestions
        suggested_annotations = await self.annotation_service.suggest_annotations(
            content, source_config
        )

        return ContentPreview(
            total_length=content_stats["total_length"],
            word_count=content_stats["word_count"],
            estimated_chunks=content_stats["estimated_chunks"],
            detected_language=content_stats["detected_language"],
            detected_format=content_stats["detected_format"],
            has_headings=structure_analysis["has_headings"],
            has_tables=structure_analysis["has_tables"],
            has_lists=structure_analysis["has_lists"],
            has_code=structure_analysis["has_code"],
            structure_score=structure_analysis["structure_score"],
            sample_chunks=sample_chunks,
            chunk_size_distribution=self._calculate_chunk_distribution(sample_chunks),
            recommended_strategy=recommendations["strategy"],
            optimization_suggestions=recommendations["optimizations"],
            potential_issues=recommendations["issues"],
            extracted_metadata=extracted_metadata,
            suggested_annotations=asdict(suggested_annotations)
        )

    def _analyze_content_statistics(self, content: str) -> Dict:
        """Analyze basic content statistics"""

        import re

        # Basic stats
        total_length = len(content)
        word_count = len(content.split())

        # Estimate chunks based on default chunk size
        estimated_chunks = max(1, total_length // 1000)

        # Simple language detection
        detected_language = "en"  # Placeholder - would use language detection library

        # Format detection
        if content.startswith('<!DOCTYPE') or '<html' in content[:100]:
            detected_format = "html"
        elif content.count('#') > 3 and content.count('```') >= 2:
            detected_format = "markdown"
        elif content.count('{') > 5 and content.count('"') > 10:
            detected_format = "json"
        else:
            detected_format = "text"

        return {
            "total_length": total_length,
            "word_count": word_count,
            "estimated_chunks": estimated_chunks,
            "detected_language": detected_language,
            "detected_format": detected_format
        }

    def _analyze_document_structure(self, content: str) -> Dict:
        """Analyze document structure and organization"""

        import re

        # Check for various structural elements
        has_headings = bool(re.search(r'^#+\s', content, re.MULTILINE)) or \
                      bool(re.search(r'^.+\n[=-]+\s*$', content, re.MULTILINE))

        has_tables = '|' in content and content.count('|') > 5

        has_lists = bool(re.search(r'^\s*[-*+]\s', content, re.MULTILINE)) or \
                   bool(re.search(r'^\s*\d+\.\s', content, re.MULTILINE))

        has_code = '```' in content or content.count('`') > 10

        # Calculate structure score
        structure_indicators = [has_headings, has_tables, has_lists, has_code]
        structure_score = sum(structure_indicators) / len(structure_indicators)

        # Boost score for well-organized content
        if has_headings and (has_tables or has_lists):
            structure_score = min(1.0, structure_score + 0.2)

        return {
            "has_headings": has_headings,
            "has_tables": has_tables,
            "has_lists": has_lists,
            "has_code": has_code,
            "structure_score": structure_score
        }

    async def _generate_sample_chunks(
        self,
        content: str,
        processing_config: Dict
    ) -> List[Dict]:
        """Generate sample chunks for preview"""

        # Use the chunking service to generate actual chunks
        try:
            chunk_config = ChunkConfig(**processing_config.get("chunk_config", {}))
            chunks = await self.chunking_service.chunk_document(
                content[:5000],  # Preview first 5000 chars
                "text",  # Assume text format for preview
                chunk_config
            )

            # Return first 3 chunks with metadata
            sample_chunks = []
            for i, chunk in enumerate(chunks[:3]):
                sample_chunks.append({
                    "index": i,
                    "content": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                    "length": len(chunk.content),
                    "word_count": len(chunk.content.split()),
                    "metadata": chunk.metadata
                })

            return sample_chunks

        except Exception as e:
            # Fallback to simple chunking
            simple_chunks = [content[i:i+1000] for i in range(0, min(3000, len(content)), 1000)]
            return [
                {
                    "index": i,
                    "content": chunk[:200] + "..." if len(chunk) > 200 else chunk,
                    "length": len(chunk),
                    "word_count": len(chunk.split()),
                    "metadata": {"type": "simple_chunk"}
                }
                for i, chunk in enumerate(simple_chunks)
            ]

    def _get_processing_recommendations(
        self,
        content_stats: Dict,
        structure_analysis: Dict,
        source_config: Dict
    ) -> Dict:
        """Generate processing recommendations based on content analysis"""

        recommendations = {
            "strategy": "adaptive",
            "optimizations": [],
            "issues": []
        }

        # Strategy recommendations
        if structure_analysis["has_headings"] and structure_analysis["structure_score"] > 0.6:
            recommendations["strategy"] = "heading_based"
            recommendations["optimizations"].append("Use heading-based chunking for better structure preservation")

        elif content_stats["word_count"] > 5000 and structure_analysis["structure_score"] < 0.3:
            recommendations["strategy"] = "semantic"
            recommendations["optimizations"].append("Use semantic chunking for better content coherence")

        # Optimization suggestions
        if content_stats["total_length"] > 50000:
            recommendations["optimizations"].append("Consider increasing chunk size for better context")

        if structure_analysis["has_code"]:
            recommendations["optimizations"].append("Enable code-aware chunking to preserve syntax")

        if structure_analysis["has_tables"]:
            recommendations["optimizations"].append("Set table handling to 'preserve' to maintain structure")

        # Issue identification
        if content_stats["word_count"] < 100:
            recommendations["issues"].append("Document is very short - may not generate meaningful chunks")

        if not any([structure_analysis["has_headings"], structure_analysis["has_tables"], structure_analysis["has_lists"]]):
            recommendations["issues"].append("Document lacks clear structure - semantic chunking recommended")

        return recommendations
```

## Summary

This configuration and annotation system provides:

1. **Hierarchical Configuration** - Settings cascade from global to source-specific with intelligent defaults
2. **Smart Annotations** - AI-powered suggestions help users optimize document understanding
3. **Content Previews** - Users can see exactly how their content will be processed before committing
4. **Template-Based Setup** - Common document types get optimized configurations automatically
5. **Validation and Optimization** - System validates settings and suggests improvements

The system builds on existing models and patterns while adding the sophisticated configuration capabilities users need for optimal KB performance.