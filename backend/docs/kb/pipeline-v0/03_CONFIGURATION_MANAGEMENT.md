# Configuration Management Module

**Purpose**: Per-source settings, AI annotations, and dynamic configuration management
**Scope**: Chunking configs, annotations, preview settings, inheritance patterns
**Integration**: Configures [Processing Pipeline](02_PROCESSING_PIPELINE.md) behavior per [Source Management](01_SOURCE_MANAGEMENT.md) source

---

## 🎯 Module Overview

The Configuration Management Module provides **flexible, hierarchical configuration** that allows users to customize processing behavior at multiple levels - from global KB defaults to individual source-specific settings. It includes AI annotations that guide retrieval and rich preview capabilities.

## 🏗️ Configuration Architecture

### **Hierarchical Configuration System**

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURATION HIERARCHY                   │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Global    │    │ Knowledge   │    │   Source    │    │
│  │  Defaults   │───▶│ Base Config │───▶│ Specific    │    │
│  │             │    │             │    │ Overrides   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                   │                   │         │
│    System Level         KB Level           Source Level    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │             EFFECTIVE CONFIGURATION                 │  │
│  │  Merged from all levels with source taking priority │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONFIGURATION ENGINE                      │
│  • Configuration Resolution & Inheritance                   │
│  • Validation & Error Checking                             │
│  • Preview Generation                                       │
│  • Dynamic Updates                                         │
└─────────────────────────────────────────────────────────────┘
```

## ⚙️ Configuration Types

### 1. **Chunking Configuration** - Per-Source Processing Control

#### **Chunking Strategy Options**

```python
# File: services/config/chunking_config.py
class ChunkingConfiguration:
    """Per-source chunking configuration with intelligent defaults."""

    def __init__(self):
        self.strategies = {
            'recursive': RecursiveChunkingConfig(),
            'semantic': SemanticChunkingConfig(),
            'by_heading': HeadingBasedChunkingConfig(),
            'by_page': PageBasedChunkingConfig(),
            'smart_adaptive': SmartAdaptiveChunkingConfig(),
            'table_aware': TableAwareChunkingConfig()
        }

    def get_source_chunking_config(self, source_type: str, source_config: dict, kb_defaults: dict) -> ChunkingConfig:
        """Generate effective chunking config for specific source."""

        # Start with system defaults
        base_config = self._get_system_defaults(source_type)

        # Apply KB-level overrides
        kb_config = self._apply_kb_overrides(base_config, kb_defaults)

        # Apply source-specific overrides
        effective_config = self._apply_source_overrides(kb_config, source_config)

        # Validate and optimize
        validated_config = self._validate_chunking_config(effective_config, source_type)

        return validated_config

    def _get_system_defaults(self, source_type: str) -> dict:
        """Get intelligent defaults based on source type."""

        defaults = {
            # Web sources - often have clean structure
            'web_scrape': {
                'strategy': 'by_heading',
                'chunk_size': 1200,
                'chunk_overlap': 200,
                'preserve_code_blocks': True,
                'respect_list_structure': True
            },

            # PDFs - may have complex layouts
            'file_upload_pdf': {
                'strategy': 'smart_adaptive',
                'chunk_size': 1000,
                'chunk_overlap': 150,
                'preserve_tables': True,
                'preserve_images': True,
                'respect_page_boundaries': True
            },

            # Structured documents
            'file_upload_docx': {
                'strategy': 'by_heading',
                'chunk_size': 1500,
                'chunk_overlap': 200,
                'preserve_formatting': True,
                'extract_metadata': True
            },

            # Cloud services - usually well-structured
            'google_docs': {
                'strategy': 'by_heading',
                'chunk_size': 1200,
                'chunk_overlap': 180,
                'preserve_comments': False,
                'include_suggestions': False
            },

            'notion': {
                'strategy': 'by_heading',
                'chunk_size': 1000,
                'chunk_overlap': 150,
                'preserve_blocks': True,
                'include_metadata': True
            },

            # Text input - user control
            'text_input': {
                'strategy': 'recursive',
                'chunk_size': 800,
                'chunk_overlap': 100,
                'auto_detect_structure': True
            }
        }

        return defaults.get(source_type, defaults['text_input'])

class SmartAdaptiveChunkingConfig:
    """Configuration for smart adaptive chunking."""

    def generate_config(self, document_analysis: dict) -> dict:
        """Generate optimal config based on document characteristics."""

        config = {
            'strategy': 'smart_adaptive',
            'base_chunk_size': 1000,
            'chunk_overlap': 200,
            'adaptations': []
        }

        # Adapt based on document structure
        if document_analysis.get('has_clear_headings'):
            config['adaptations'].append({
                'condition': 'heading_detected',
                'action': 'chunk_at_heading',
                'min_section_size': 300
            })

        if document_analysis.get('has_tables'):
            config['adaptations'].append({
                'condition': 'table_detected',
                'action': 'isolate_table',
                'include_context': True,
                'context_size': 200
            })

        if document_analysis.get('has_code_blocks'):
            config['adaptations'].append({
                'condition': 'code_block_detected',
                'action': 'preserve_code_block',
                'maintain_formatting': True
            })

        if document_analysis.get('semantic_coherence') > 0.8:
            config['adaptations'].append({
                'condition': 'high_coherence',
                'action': 'use_semantic_boundaries',
                'similarity_threshold': 0.75
            })

        return config
```

#### **Real-Time Configuration Preview**

```python
# File: services/config/preview_service.py
class ConfigurationPreviewService:
    """Real-time preview of configuration effects."""

    async def preview_chunking_config(self, source_content: str, config: ChunkingConfig) -> PreviewResult:
        """Generate real-time preview of chunking results."""

        # Apply chunking with config
        chunks = await self.chunking_service.chunk_document(
            content=source_content,
            config=config,
            preview_mode=True  # Don't save, just preview
        )

        # Generate preview statistics
        stats = self._calculate_chunk_statistics(chunks)

        # Generate visual preview data
        visual_preview = self._generate_visual_preview(chunks, config)

        # Assess configuration quality
        quality_assessment = self._assess_configuration_quality(chunks, config)

        return PreviewResult(
            chunks=chunks[:10],  # First 10 for preview
            statistics=stats,
            visual_preview=visual_preview,
            quality_assessment=quality_assessment,
            recommendations=self._generate_recommendations(stats, quality_assessment)
        )

    def _generate_visual_preview(self, chunks: List[Chunk], config: ChunkingConfig) -> dict:
        """Generate visual preview data for frontend."""

        return {
            'chunk_sizes': [len(chunk.content) for chunk in chunks],
            'overlap_regions': self._identify_overlap_regions(chunks),
            'structure_preservation': self._analyze_structure_preservation(chunks),
            'content_distribution': {
                'text_chunks': len([c for c in chunks if c.type == 'text']),
                'table_chunks': len([c for c in chunks if c.type == 'table']),
                'code_chunks': len([c for c in chunks if c.type == 'code']),
                'heading_chunks': len([c for c in chunks if c.type == 'heading'])
            },
            'quality_indicators': {
                'optimal_size_ratio': self._calculate_optimal_size_ratio(chunks, config),
                'structure_score': self._calculate_structure_preservation_score(chunks),
                'coherence_score': self._calculate_coherence_score(chunks)
            }
        }
```

### 2. **AI Annotations** - Context Guidance System

#### **Annotation Framework**

```python
# File: services/config/annotation_service.py
class AIAnnotationService:
    """AI context annotations for better retrieval and understanding."""

    def __init__(self):
        self.annotation_templates = {
            'document_purpose': DocumentPurposeAnnotation(),
            'content_type': ContentTypeAnnotation(),
            'usage_context': UsageContextAnnotation(),
            'audience': AudienceAnnotation(),
            'domain_specific': DomainSpecificAnnotation()
        }

    async def create_annotation_config(self, source_config: dict, user_input: dict) -> AnnotationConfig:
        """Create comprehensive annotation configuration."""

        # Auto-detect annotations from content
        auto_annotations = await self._auto_detect_annotations(source_config)

        # Merge with user-provided annotations
        user_annotations = self._process_user_annotations(user_input)

        # Generate effective annotation config
        annotation_config = AnnotationConfig(
            purpose=self._resolve_purpose(auto_annotations, user_annotations),
            context=self._resolve_context(auto_annotations, user_annotations),
            importance=user_annotations.get('importance', 'medium'),
            tags=self._merge_tags(auto_annotations.get('tags', []), user_annotations.get('tags', [])),
            usage_instructions=user_annotations.get('usage_instructions'),
            constraints=user_annotations.get('constraints'),
            domain_metadata=self._extract_domain_metadata(source_config, user_annotations)
        )

        return annotation_config

    async def _auto_detect_annotations(self, source_config: dict) -> dict:
        """Automatically detect content annotations."""

        content_sample = source_config.get('content_preview', '')
        source_type = source_config.get('source_type')

        auto_annotations = {}

        # Detect document purpose
        if source_type == 'web_scrape':
            url = source_config.get('url', '')
            if 'docs.' in url or '/documentation/' in url:
                auto_annotations['purpose'] = 'documentation'
            elif 'api.' in url or '/api/' in url:
                auto_annotations['purpose'] = 'api_reference'
            elif 'blog.' in url or '/blog/' in url:
                auto_annotations['purpose'] = 'blog_content'

        # Detect content type from content analysis
        content_type = await self._analyze_content_type(content_sample)
        auto_annotations['content_type'] = content_type

        # Detect domain/topic
        domain = await self._detect_domain(content_sample)
        auto_annotations['domain'] = domain

        # Extract key concepts
        key_concepts = await self._extract_key_concepts(content_sample)
        auto_annotations['tags'] = key_concepts

        return auto_annotations

class DocumentPurposeAnnotation:
    """Annotation for document purpose and intent."""

    def __init__(self):
        self.purpose_templates = {
            'documentation': {
                'description': 'Technical documentation or user guides',
                'retrieval_strategy': 'detailed_context',
                'ai_instructions': 'Provide comprehensive explanations with step-by-step guidance',
                'example_queries': ['how to', 'setup', 'configure', 'install']
            },
            'api_reference': {
                'description': 'API documentation and reference material',
                'retrieval_strategy': 'precise_lookup',
                'ai_instructions': 'Provide exact technical specifications and code examples',
                'example_queries': ['endpoint', 'parameters', 'response format']
            },
            'faq': {
                'description': 'Frequently asked questions and answers',
                'retrieval_strategy': 'question_matching',
                'ai_instructions': 'Match user questions to existing Q&A pairs',
                'example_queries': ['what is', 'how do I', 'why does']
            },
            'policy': {
                'description': 'Policies, procedures, and compliance documents',
                'retrieval_strategy': 'authoritative_source',
                'ai_instructions': 'Provide authoritative, policy-compliant responses',
                'example_queries': ['policy on', 'required to', 'compliance']
            },
            'tutorial': {
                'description': 'Step-by-step tutorials and guides',
                'retrieval_strategy': 'sequential_context',
                'ai_instructions': 'Provide step-by-step guidance in logical order',
                'example_queries': ['tutorial', 'step by step', 'guide']
            }
        }

    def generate_purpose_annotation(self, detected_purpose: str, user_input: dict) -> dict:
        """Generate purpose-specific annotation."""

        template = self.purpose_templates.get(detected_purpose, self.purpose_templates['documentation'])

        return {
            'purpose': detected_purpose,
            'description': user_input.get('description', template['description']),
            'retrieval_strategy': template['retrieval_strategy'],
            'ai_instructions': user_input.get('ai_instructions', template['ai_instructions']),
            'priority_keywords': user_input.get('priority_keywords', template['example_queries']),
            'context_requirements': {
                'include_surrounding_context': template['retrieval_strategy'] in ['detailed_context', 'sequential_context'],
                'prefer_exact_matches': template['retrieval_strategy'] == 'precise_lookup',
                'enable_question_analysis': template['retrieval_strategy'] == 'question_matching'
            }
        }
```

#### **Dynamic Annotation Updates**

```python
# File: services/config/annotation_manager.py
class AnnotationManager:
    """Manage and update annotations dynamically."""

    async def update_annotation_based_on_usage(self, source_id: str, usage_patterns: dict):
        """Update annotations based on actual usage patterns."""

        current_annotations = await self._get_current_annotations(source_id)

        # Analyze usage patterns
        query_analysis = self._analyze_query_patterns(usage_patterns)
        retrieval_success = self._analyze_retrieval_success(usage_patterns)

        # Update annotations based on findings
        updated_annotations = current_annotations.copy()

        # Adjust importance based on usage frequency
        if usage_patterns['query_frequency'] > 100:  # High usage
            updated_annotations['importance'] = 'high'
        elif usage_patterns['query_frequency'] < 10:  # Low usage
            updated_annotations['importance'] = 'low'

        # Update tags based on successful queries
        successful_queries = [q for q in usage_patterns['queries'] if q['success_rate'] > 0.8]
        new_tags = self._extract_tags_from_queries(successful_queries)
        updated_annotations['tags'] = list(set(updated_annotations['tags'] + new_tags))

        # Update AI instructions based on query types
        if query_analysis['primary_query_type'] == 'how_to':
            updated_annotations['ai_instructions'] = 'Focus on providing step-by-step instructions'
        elif query_analysis['primary_query_type'] == 'definition':
            updated_annotations['ai_instructions'] = 'Provide clear definitions and explanations'

        # Save updated annotations
        await self._save_annotations(source_id, updated_annotations)

        return updated_annotations
```

### 3. **Preview Configuration** - Real-Time Content Inspection

#### **Multi-Level Preview System**

```python
# File: services/config/preview_manager.py
class PreviewManager:
    """Comprehensive preview system for configuration effects."""

    async def generate_comprehensive_preview(self, source_id: str, config_changes: dict) -> ComprehensivePreview:
        """Generate multi-level preview of configuration effects."""

        # Get source content
        source_content = await self._get_source_content(source_id)

        # Apply configurations and generate previews
        previews = {}

        # 1. Parsing Preview
        if 'parsing_config' in config_changes:
            previews['parsing'] = await self._preview_parsing_effects(source_content, config_changes['parsing_config'])

        # 2. Chunking Preview
        if 'chunking_config' in config_changes:
            previews['chunking'] = await self._preview_chunking_effects(source_content, config_changes['chunking_config'])

        # 3. Annotation Preview
        if 'annotation_config' in config_changes:
            previews['annotations'] = await self._preview_annotation_effects(source_content, config_changes['annotation_config'])

        # 4. Search Preview
        previews['search'] = await self._preview_search_effects(source_content, config_changes)

        # 5. Generate recommendations
        recommendations = await self._generate_configuration_recommendations(previews)

        return ComprehensivePreview(
            previews=previews,
            recommendations=recommendations,
            estimated_impact=self._calculate_estimated_impact(previews),
            validation_results=self._validate_configuration_combination(config_changes)
        )

    async def _preview_chunking_effects(self, source_content: str, chunking_config: dict) -> ChunkingPreview:
        """Preview chunking configuration effects."""

        # Apply chunking configuration
        chunks = await self.chunking_service.chunk_document(
            content=source_content,
            config=chunking_config,
            preview_mode=True
        )

        # Analyze chunk quality
        quality_metrics = {
            'size_distribution': self._analyze_size_distribution(chunks),
            'overlap_effectiveness': self._analyze_overlap_effectiveness(chunks),
            'structure_preservation': self._analyze_structure_preservation(chunks),
            'semantic_coherence': await self._analyze_semantic_coherence(chunks)
        }

        # Generate visual data
        visual_data = {
            'chunk_boundaries': self._identify_chunk_boundaries(source_content, chunks),
            'size_histogram': self._generate_size_histogram(chunks),
            'overlap_map': self._generate_overlap_map(chunks),
            'structure_map': self._generate_structure_map(chunks)
        }

        # Create interactive preview
        interactive_preview = {
            'chunks': [
                {
                    'id': i,
                    'content': chunk.content[:200] + '...' if len(chunk.content) > 200 else chunk.content,
                    'full_content': chunk.content,
                    'size': len(chunk.content),
                    'type': chunk.type,
                    'metadata': chunk.metadata,
                    'quality_score': self._calculate_chunk_quality_score(chunk)
                }
                for i, chunk in enumerate(chunks[:20])  # First 20 for performance
            ],
            'navigation': {
                'total_chunks': len(chunks),
                'preview_count': min(20, len(chunks)),
                'has_more': len(chunks) > 20
            }
        }

        return ChunkingPreview(
            chunk_count=len(chunks),
            quality_metrics=quality_metrics,
            visual_data=visual_data,
            interactive_preview=interactive_preview,
            recommendations=self._generate_chunking_recommendations(quality_metrics)
        )

    async def _preview_search_effects(self, source_content: str, all_configs: dict) -> SearchPreview:
        """Preview how configuration affects search and retrieval."""

        # Generate sample queries based on content
        sample_queries = await self._generate_sample_queries(source_content, all_configs.get('annotation_config', {}))

        search_results = []

        for query in sample_queries:
            # Simulate search with new configuration
            results = await self.retrieval_service.search_preview(
                content=source_content,
                query=query,
                chunking_config=all_configs.get('chunking_config', {}),
                annotation_config=all_configs.get('annotation_config', {})
            )

            search_results.append({
                'query': query,
                'results': results,
                'relevance_scores': [r.score for r in results],
                'avg_relevance': sum(r.score for r in results) / len(results) if results else 0
            })

        return SearchPreview(
            sample_queries=sample_queries,
            search_results=search_results,
            overall_search_quality=self._calculate_overall_search_quality(search_results),
            retrieval_recommendations=self._generate_retrieval_recommendations(search_results)
        )
```

## 🎛️ Configuration User Interface Patterns

### **Progressive Configuration Discovery**

```typescript
// Frontend: Progressive configuration interface
interface ConfigurationWizard {
  // Step 1: Basic configuration with smart defaults
  BasicConfig: {
    strategy: 'auto' | 'custom';
    quickSettings: {
      documentType: 'technical' | 'conversational' | 'reference' | 'mixed';
      targetChunkSize: 'small' | 'medium' | 'large';
      preserveStructure: boolean;
    };
  };

  // Step 2: Advanced configuration (optional)
  AdvancedConfig: {
    chunkingStrategy: string;
    chunkSize: number;
    chunkOverlap: number;
    customSeparators: string[];
    structurePreservation: {
      preserveTables: boolean;
      preserveCodeBlocks: boolean;
      preserveImages: boolean;
    };
  };

  // Step 3: AI annotations
  AIAnnotations: {
    purpose: string;
    context: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    usageInstructions: string;
    constraints: string;
  };

  // Step 4: Preview and validation
  PreviewValidation: {
    enableRealTimePreview: boolean;
    showAdvancedMetrics: boolean;
    validationLevel: 'basic' | 'comprehensive';
  };
}
```

### **Real-Time Configuration Feedback**

```typescript
// Real-time configuration updates
class ConfigurationManager {
  async updateConfigurationRealTime(configChange: ConfigChange): Promise<ConfigurationFeedback> {
    // Debounce rapid changes
    clearTimeout(this.configUpdateTimer);

    this.configUpdateTimer = setTimeout(async () => {
      // Generate preview
      const preview = await this.previewService.generatePreview(configChange);

      // Validate configuration
      const validation = await this.validationService.validateConfig(configChange);

      // Generate recommendations
      const recommendations = await this.recommendationService.getRecommendations(configChange);

      // Update UI
      this.updateConfigurationUI({
        preview,
        validation,
        recommendations,
        estimatedImpact: this.calculateEstimatedImpact(preview)
      });
    }, 300); // 300ms debounce
  }

  updateConfigurationUI(feedback: ConfigurationFeedback) {
    // Update chunk preview
    this.chunkPreviewComponent.update(feedback.preview.chunking);

    // Update quality indicators
    this.qualityIndicators.update(feedback.validation.qualityMetrics);

    // Show recommendations
    this.recommendationsPanel.update(feedback.recommendations);

    // Update estimated impact
    this.impactEstimator.update(feedback.estimatedImpact);
  }
}
```

## 🔧 Configuration Inheritance & Resolution

### **Configuration Resolution Engine**

```python
# File: services/config/config_resolver.py
class ConfigurationResolver:
    """Resolve configuration inheritance and conflicts."""

    def resolve_effective_configuration(self,
                                      system_defaults: dict,
                                      kb_config: dict,
                                      source_config: dict,
                                      user_overrides: dict = None) -> EffectiveConfiguration:
        """Resolve final configuration from inheritance hierarchy."""

        # Start with system defaults
        effective_config = deepcopy(system_defaults)

        # Apply KB-level configuration
        effective_config = self._merge_configurations(effective_config, kb_config, priority='kb')

        # Apply source-specific configuration
        effective_config = self._merge_configurations(effective_config, source_config, priority='source')

        # Apply user runtime overrides
        if user_overrides:
            effective_config = self._merge_configurations(effective_config, user_overrides, priority='user')

        # Validate final configuration
        validated_config = self._validate_final_configuration(effective_config)

        # Generate configuration metadata
        config_metadata = self._generate_configuration_metadata(
            system_defaults, kb_config, source_config, user_overrides, validated_config
        )

        return EffectiveConfiguration(
            config=validated_config,
            metadata=config_metadata,
            inheritance_trace=self._generate_inheritance_trace(system_defaults, kb_config, source_config, user_overrides),
            validation_results=self._get_validation_results()
        )

    def _merge_configurations(self, base_config: dict, override_config: dict, priority: str) -> dict:
        """Merge configurations with conflict resolution."""

        merged_config = deepcopy(base_config)

        for key, value in override_config.items():
            if key not in merged_config:
                # New key, add directly
                merged_config[key] = value
            elif isinstance(value, dict) and isinstance(merged_config[key], dict):
                # Nested dict, merge recursively
                merged_config[key] = self._merge_configurations(merged_config[key], value, priority)
            elif isinstance(value, list) and isinstance(merged_config[key], list):
                # Lists, merge based on merge strategy
                merge_strategy = override_config.get(f'{key}_merge_strategy', 'replace')
                if merge_strategy == 'append':
                    merged_config[key] = merged_config[key] + value
                elif merge_strategy == 'extend':
                    merged_config[key] = list(set(merged_config[key] + value))
                else:  # replace
                    merged_config[key] = value
            else:
                # Scalar value, override takes priority
                merged_config[key] = value

        return merged_config
```

## 📊 Configuration Analytics

### **Configuration Performance Tracking**

```python
# File: services/config/config_analytics.py
class ConfigurationAnalytics:
    """Track and analyze configuration performance."""

    async def track_configuration_performance(self, config_id: str, performance_data: dict):
        """Track how configuration performs in production."""

        performance_record = {
            'config_id': config_id,
            'timestamp': datetime.utcnow().isoformat(),
            'performance_metrics': {
                'processing_time': performance_data['processing_time'],
                'chunk_quality_score': performance_data['chunk_quality_score'],
                'retrieval_accuracy': performance_data['retrieval_accuracy'],
                'user_satisfaction': performance_data.get('user_satisfaction'),
                'error_rate': performance_data['error_rate']
            },
            'usage_context': {
                'query_types': performance_data['query_types'],
                'user_feedback': performance_data.get('user_feedback', []),
                'common_issues': performance_data.get('common_issues', [])
            }
        }

        await self._store_performance_record(performance_record)

        # Analyze patterns and suggest improvements
        if performance_record['performance_metrics']['chunk_quality_score'] < 0.7:
            await self._suggest_configuration_improvements(config_id, performance_record)

    async def generate_configuration_insights(self, kb_id: str) -> ConfigurationInsights:
        """Generate insights for configuration optimization."""

        # Get all configurations for KB
        configurations = await self._get_kb_configurations(kb_id)

        # Analyze performance data
        performance_analysis = await self._analyze_configuration_performance(configurations)

        # Generate recommendations
        recommendations = await self._generate_optimization_recommendations(performance_analysis)

        return ConfigurationInsights(
            total_configurations=len(configurations),
            performance_summary=performance_analysis['summary'],
            top_performing_configs=performance_analysis['top_performers'],
            optimization_opportunities=recommendations,
            usage_patterns=performance_analysis['usage_patterns']
        )
```

---

**Next**: Continue with [Compliance & Security Module](04_COMPLIANCE_SECURITY.md) to understand native HIPAA/SOC2 implementation.