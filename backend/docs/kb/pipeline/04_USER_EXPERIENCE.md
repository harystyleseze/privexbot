# Module 4: User Experience & Frontend Integration

## Overview

Design a progressive disclosure user interface that makes knowledge base creation intuitive for beginners while providing advanced capabilities for power users. The UX scales seamlessly from "upload and go" to sophisticated multi-source, multi-configuration workflows.

## UX Philosophy: Progressive Disclosure

### Core Principle
**Start simple, reveal complexity gradually based on user needs and expertise.**

```
Level 1 (Beginner):     [Upload Files] → [Create KB]
Level 2 (Intermediate): Source Selection + Basic Config → Preview → Create
Level 3 (Advanced):     Multi-source + Advanced Config + Monitoring → Create
Level 4 (Expert):       Full Pipeline Control + Debugging + Optimization
```

## Frontend Architecture Patterns

### State Management Structure
Building on existing React patterns and contexts:

```typescript
// frontend/src/contexts/KBCreationContext.tsx
"""
KB creation state management with progressive disclosure.

BUILDS ON: Existing AuthContext and TenantContext patterns
ADDS: Multi-step workflow, source management, configuration state
"""

interface KBSource {
  id: string;
  type: 'file_upload' | 'web_scraping' | 'cloud_integration' | 'text_input' | 'combined';
  config: SourceConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  preview?: ContentPreview;
  annotations?: DocumentAnnotation;
}

interface KBCreationState {
  // Workflow State
  currentStep: 'source_selection' | 'configuration' | 'preview' | 'processing' | 'completed';
  complexity_level: 'simple' | 'intermediate' | 'advanced' | 'expert';

  // KB Configuration
  kb_metadata: {
    name: string;
    description: string;
    workspace_id: string;
    template_type?: string;
  };

  // Sources Management
  sources: KBSource[];
  combined_sources: string[]; // IDs of sources to combine

  // Processing Configuration
  processing_config: {
    chunking: ChunkingConfiguration;
    embedding: EmbeddingConfiguration;
    vector_store: VectorStoreConfiguration;
    retrieval: RetrievalConfiguration;
  };

  // UI State
  show_advanced_options: boolean;
  show_debug_panel: boolean;
  preview_visible: boolean;

  // Pipeline Monitoring
  pipeline_id?: string;
  processing_status?: PipelineStatus;
}

const KBCreationContext = createContext<{
  state: KBCreationState;
  actions: {
    // Workflow Navigation
    nextStep: () => void;
    previousStep: () => void;
    goToStep: (step: string) => void;
    setComplexityLevel: (level: string) => void;

    // Source Management
    addSource: (sourceConfig: SourceConfig) => Promise<string>;
    removeSource: (sourceId: string) => void;
    updateSource: (sourceId: string, updates: Partial<SourceConfig>) => void;
    combineSource: (sourceIds: string[]) => Promise<string>;
    previewSource: (sourceId: string) => Promise<ContentPreview>;

    // Configuration Management
    updateProcessingConfig: (updates: Partial<ProcessingConfig>) => void;
    applyConfigTemplate: (templateName: string) => void;
    validateConfiguration: () => ValidationResult;

    // KB Operations
    createKB: () => Promise<string>;
    saveAsDraft: () => Promise<string>;
    loadDraft: (draftId: string) => Promise<void>;

    // Monitoring
    startMonitoring: (pipelineId: string) => void;
    stopMonitoring: () => void;
  };
}>({} as any);
```

### Progressive Disclosure UI Components

#### Level 1: Simple Mode (Beginner)
```typescript
// frontend/src/components/kb/SimpleKBCreator.tsx
"""
Simple, one-step KB creation for beginners.

FEATURES:
- Single upload/input interface
- Automatic configuration
- Minimal options
- Clear progress feedback
"""

const SimpleKBCreator: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [kbName, setKbName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Knowledge Base
        </h1>
        <p className="text-gray-600">
          Upload files, add websites, or paste text to create your knowledge base
        </p>
      </div>

      {/* KB Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Knowledge Base Name
        </label>
        <input
          type="text"
          value={kbName}
          onChange={(e) => setKbName(e.target.value)}
          placeholder="e.g., Product Documentation"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Multi-Source Input */}
      <div className="space-y-6 mb-8">
        {/* File Upload */}
        <SourceInputCard
          icon={<DocumentIcon className="w-6 h-6" />}
          title="Upload Files"
          description="PDF, Word, Excel, PowerPoint, and more"
        >
          <FileUploadZone
            files={files}
            onFilesChange={setFiles}
            acceptedTypes={['.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.md']}
            maxFiles={10}
          />
        </SourceInputCard>

        {/* Website URLs */}
        <SourceInputCard
          icon={<GlobeIcon className="w-6 h-6" />}
          title="Add Websites"
          description="Scrape content from web pages"
        >
          <URLInputList
            urls={urls}
            onUrlsChange={setUrls}
            placeholder="https://example.com/docs"
          />
        </SourceInputCard>

        {/* Text Input */}
        <SourceInputCard
          icon={<PencilIcon className="w-6 h-6" />}
          title="Paste Text"
          description="Add text content directly"
        >
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your text content here..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </SourceInputCard>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setComplexityLevel('intermediate')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Advanced Options →
        </button>

        <div className="space-x-3">
          <button
            onClick={handleSaveAsDraft}
            disabled={!hasContent() || isProcessing}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={handleCreateKB}
            disabled={!kbName || !hasContent() || isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isProcessing ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              'Create Knowledge Base'
            )}
          </button>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <ProcessingStatus
          pipelineId={pipelineId}
          onComplete={handleProcessingComplete}
        />
      )}
    </div>
  );
};

const SourceInputCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
    <div className="flex items-center mb-3">
      <div className="text-blue-600 mr-3">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {children}
  </div>
);
```

#### Level 2: Intermediate Mode
```typescript
// frontend/src/components/kb/IntermediateKBCreator.tsx
"""
Multi-step workflow with basic configuration options.

FEATURES:
- Step-by-step wizard
- Source previews
- Basic configuration
- Progress tracking
"""

const IntermediateKBCreator: React.FC = () => {
  const { state, actions } = useKBCreation();

  const steps = [
    { id: 'sources', title: 'Add Sources', component: SourceManagementStep },
    { id: 'config', title: 'Configure', component: ConfigurationStep },
    { id: 'preview', title: 'Preview', component: PreviewStep },
    { id: 'create', title: 'Create', component: CreationStep }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <StepIndicator
          steps={steps}
          currentStep={state.currentStep}
          onStepClick={actions.goToStep}
        />
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <StepRouter currentStep={state.currentStep} steps={steps} />
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={actions.previousStep}
          disabled={state.currentStep === 'sources'}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          ← Previous
        </button>

        <div className="space-x-3">
          <button
            onClick={() => setComplexityLevel('simple')}
            className="text-gray-600 hover:text-gray-800"
          >
            Simple Mode
          </button>
          <button
            onClick={() => setComplexityLevel('advanced')}
            className="text-blue-600 hover:text-blue-800"
          >
            Advanced Mode
          </button>
        </div>

        <button
          onClick={actions.nextStep}
          disabled={!canProceedToNextStep()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

const SourceManagementStep: React.FC = () => {
  const { state, actions } = useKBCreation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Add Content Sources</h2>
        <p className="text-gray-600">Choose your content sources and configure how they should be processed.</p>
      </div>

      {/* Source Type Selector */}
      <SourceTypeSelector onSourceAdd={actions.addSource} />

      {/* Source List */}
      <div className="space-y-4">
        {state.sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onUpdate={(updates) => actions.updateSource(source.id, updates)}
            onRemove={() => actions.removeSource(source.id)}
            onPreview={() => actions.previewSource(source.id)}
          />
        ))}
      </div>

      {/* Source Combination */}
      {state.sources.length > 1 && (
        <SourceCombinationPanel
          sources={state.sources}
          combinedSources={state.combined_sources}
          onCombine={actions.combineSource}
        />
      )}
    </div>
  );
};

const ConfigurationStep: React.FC = () => {
  const { state, actions } = useKBCreation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Configure Processing</h2>
        <p className="text-gray-600">Customize how your content will be processed and indexed.</p>
      </div>

      {/* Configuration Template Selector */}
      <ConfigTemplateSelector
        onTemplateApply={actions.applyConfigTemplate}
        currentConfig={state.processing_config}
      />

      {/* Basic Configuration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chunking Strategy */}
        <ConfigSection title="Chunking Strategy" description="How to split documents into chunks">
          <ChunkingStrategySelector
            strategy={state.processing_config.chunking.strategy}
            onChange={(strategy) => actions.updateProcessingConfig({
              chunking: { ...state.processing_config.chunking, strategy }
            })}
          />
        </ConfigSection>

        {/* Chunk Size */}
        <ConfigSection title="Chunk Size" description="Size of each content chunk">
          <ChunkSizeSlider
            value={state.processing_config.chunking.max_chunk_size}
            onChange={(size) => actions.updateProcessingConfig({
              chunking: { ...state.processing_config.chunking, max_chunk_size: size }
            })}
          />
        </ConfigSection>
      </div>

      {/* Show Advanced Options Toggle */}
      <div className="border-t pt-4">
        <button
          onClick={() => setState({ ...state, show_advanced_options: !state.show_advanced_options })}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronDownIcon className={`w-4 h-4 mr-1 transition-transform ${
            state.show_advanced_options ? 'rotate-180' : ''
          }`} />
          Advanced Options
        </button>

        {state.show_advanced_options && (
          <AdvancedConfigurationPanel
            config={state.processing_config}
            onChange={actions.updateProcessingConfig}
          />
        )}
      </div>
    </div>
  );
};

const PreviewStep: React.FC = () => {
  const { state } = useKBCreation();
  const [previewData, setPreviewData] = useState<ContentPreview[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Preview & Review</h2>
        <p className="text-gray-600">Review how your content will be processed before creating the knowledge base.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Sources"
          value={state.sources.length}
          subtitle={`${state.sources.filter(s => s.type === 'file_upload').length} files, ${state.sources.filter(s => s.type === 'web_scraping').length} websites`}
        />
        <SummaryCard
          title="Total Content"
          value={`${Math.round(getTotalContentSize() / 1000)}K`}
          subtitle="characters"
        />
        <SummaryCard
          title="Estimated Chunks"
          value={getEstimatedChunkCount()}
          subtitle="chunks"
        />
      </div>

      {/* Content Previews */}
      <div className="space-y-4">
        {state.sources.map((source) => (
          <ContentPreviewCard
            key={source.id}
            source={source}
            preview={source.preview}
          />
        ))}
      </div>

      {/* Configuration Summary */}
      <ConfigurationSummary config={state.processing_config} />
    </div>
  );
};
```

#### Level 3: Advanced Mode
```typescript
// frontend/src/components/kb/AdvancedKBCreator.tsx
"""
Full-featured KB creation with monitoring and debugging.

FEATURES:
- Multi-source management
- Advanced configuration
- Real-time pipeline monitoring
- Debug information
- Performance optimization
"""

const AdvancedKBCreator: React.FC = () => {
  const { state, actions } = useKBCreation();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <AdvancedSourceManager />
          <AdvancedConfigurationPanel />
          <AdvancedPreviewPanel />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ConfigurationValidation />
          <PipelineMonitor />
          <DebugPanel />
        </div>
      </div>
    </div>
  );
};

const AdvancedSourceManager: React.FC = () => {
  const { state, actions } = useKBCreation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Source Management</h2>
        <SourceTypeDropdown onSourceAdd={actions.addSource} />
      </div>

      {/* Source List with Advanced Options */}
      <div className="space-y-4">
        {state.sources.map((source) => (
          <AdvancedSourceCard
            key={source.id}
            source={source}
            onUpdate={actions.updateSource}
            onRemove={actions.removeSource}
            onDuplicate={(sourceId) => actions.duplicateSource(sourceId)}
            onConfigure={(sourceId) => actions.openSourceConfig(sourceId)}
          />
        ))}
      </div>

      {/* Batch Operations */}
      <BatchOperationsPanel
        sources={state.sources}
        onBatchUpdate={actions.batchUpdateSources}
        onBatchAnnotate={actions.batchAnnotateSources}
      />
    </div>
  );
};

const PipelineMonitor: React.FC = () => {
  const { state } = useKBCreation();
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Pipeline Monitor</h3>

      {state.pipeline_id ? (
        <div className="space-y-3">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>{pipelineStatus?.progress_percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pipelineStatus?.progress_percentage || 0}%` }}
              />
            </div>
          </div>

          {/* Stage Progress */}
          <div className="space-y-2">
            {pipelineStatus?.stages.map((stage) => (
              <StageProgress
                key={stage.name}
                stage={stage}
              />
            ))}
          </div>

          {/* Current Activity */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Current:</span> {pipelineStatus?.current_stage}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-4">
          No active pipeline
        </div>
      )}
    </div>
  );
};

const DebugPanel: React.FC = () => {
  const { state } = useKBCreation();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Debug Information</h3>
        <button
          onClick={() => setState({ ...state, show_debug_panel: !state.show_debug_panel })}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {state.show_debug_panel ? 'Hide' : 'Show'}
        </button>
      </div>

      {state.show_debug_panel && (
        <div className="space-y-3">
          {/* Configuration Validation */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Status</h4>
            <ConfigValidationIndicator config={state.processing_config} />
          </div>

          {/* Performance Metrics */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Performance</h4>
            <PerformanceMetrics sources={state.sources} />
          </div>

          {/* Error Log */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Errors & Warnings</h4>
            <ErrorLog errors={debugInfo?.errors || []} />
          </div>
        </div>
      )}
    </div>
  );
};
```

### Mobile-First Responsive Design

```typescript
// frontend/src/components/kb/MobileKBCreator.tsx
"""
Mobile-optimized KB creation experience.

FEATURES:
- Touch-friendly interface
- Simplified workflows
- Progressive enhancement
- Offline capability preparation
"""

const MobileKBCreator: React.FC = () => {
  const [currentView, setCurrentView] = useState<'upload' | 'config' | 'status'>('upload');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button className="p-2 -ml-2">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900">New Knowledge Base</h1>
          <button className="text-blue-600 font-medium">Save</button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 py-6">
        {currentView === 'upload' && <MobileUploadView />}
        {currentView === 'config' && <MobileConfigView />}
        {currentView === 'status' && <MobileStatusView />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <MobileBottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>
    </div>
  );
};

const MobileUploadView: React.FC = () => (
  <div className="space-y-6">
    {/* KB Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Knowledge Base Name
      </label>
      <input
        type="text"
        placeholder="Enter name..."
        className="w-full p-3 border border-gray-300 rounded-lg text-base"
      />
    </div>

    {/* Upload Options */}
    <div className="space-y-4">
      <TouchFriendlyUploadCard
        icon={<DocumentIcon />}
        title="Upload Files"
        description="Tap to select files"
        onTap={() => triggerFileUpload()}
      />

      <TouchFriendlyUploadCard
        icon={<GlobeIcon />}
        title="Add Website"
        description="Enter website URL"
        onTap={() => openUrlInput()}
      />

      <TouchFriendlyUploadCard
        icon={<PencilIcon />}
        title="Paste Text"
        description="Add text directly"
        onTap={() => openTextInput()}
      />
    </div>

    {/* Quick Actions */}
    <div className="pt-4">
      <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
        Create Knowledge Base
      </button>
    </div>
  </div>
);
```

### Real-Time Processing Feedback

```typescript
// frontend/src/components/kb/ProcessingStatus.tsx
"""
Real-time processing status with detailed feedback.

FEATURES:
- Live pipeline monitoring
- Detailed stage information
- Error handling and retry options
- Performance metrics
"""

const ProcessingStatus: React.FC<{
  pipelineId: string;
  onComplete: (kbId: string) => void;
  onError: (error: string) => void;
}> = ({ pipelineId, onComplete, onError }) => {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Real-time status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/pipeline/${pipelineId}/status`);
        const statusData = await response.json();
        setStatus(statusData);

        if (statusData.status === 'completed') {
          onComplete(statusData.kb_id);
        } else if (statusData.status === 'failed') {
          onError(statusData.error_message);
        }
      } catch (error) {
        console.error('Failed to fetch pipeline status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pipelineId]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Processing Knowledge Base</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {status && (
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(status.progress_percentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${status.progress_percentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Current Stage */}
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <Spinner className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {status.current_stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <div className="text-sm text-gray-600">
                {getStageDescription(status.current_stage)}
              </div>
            </div>
          </div>

          {/* Detailed Stage Progress */}
          {showDetails && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {status.stages.map((stage, index) => (
                <StageProgressDetail
                  key={stage.name}
                  stage={stage}
                  isActive={stage.name === status.current_stage}
                  isCompleted={stage.status === 'completed'}
                  isFailed={stage.status === 'failed'}
                />
              ))}
            </div>
          )}

          {/* Performance Metrics */}
          {showDetails && status.performance_metrics && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="ml-2 font-medium">{formatDuration(status.total_duration)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Documents:</span>
                  <span className="ml-2 font-medium">{status.document_count}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StageProgressDetail: React.FC<{
  stage: PipelineStage;
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
}> = ({ stage, isActive, isCompleted, isFailed }) => (
  <div className="flex items-center space-x-3">
    {/* Status Icon */}
    <div className="flex-shrink-0">
      {isCompleted && (
        <CheckCircleIcon className="w-5 h-5 text-green-600" />
      )}
      {isFailed && (
        <XCircleIcon className="w-5 h-5 text-red-600" />
      )}
      {isActive && !isCompleted && !isFailed && (
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      )}
      {!isActive && !isCompleted && !isFailed && (
        <div className="w-5 h-5 bg-gray-300 rounded-full" />
      )}
    </div>

    {/* Stage Info */}
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <span className={`font-medium ${
          isCompleted ? 'text-green-700' :
          isFailed ? 'text-red-700' :
          isActive ? 'text-blue-700' :
          'text-gray-500'
        }`}>
          {stage.display_name}
        </span>
        {stage.duration && (
          <span className="text-xs text-gray-500">
            {formatDuration(stage.duration)}
          </span>
        )}
      </div>
      {stage.error_message && (
        <div className="text-sm text-red-600 mt-1">
          {stage.error_message}
        </div>
      )}
      {stage.metadata && Object.keys(stage.metadata).length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {Object.entries(stage.metadata).map(([key, value]) => (
            <span key={key} className="mr-3">
              {key}: {value}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);
```

### Error Handling and Recovery

```typescript
// frontend/src/components/kb/ErrorHandling.tsx
"""
Comprehensive error handling with recovery options.

FEATURES:
- Clear error messages
- Suggested solutions
- Retry mechanisms
- Partial recovery options
"""

const KBCreationErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  const handleRetry = () => {
    setError(null);
    setErrorInfo(null);
    // Reset state and retry operation
  };

  if (error) {
    return (
      <ErrorRecoveryPanel
        error={error}
        errorInfo={errorInfo}
        onRetry={handleRetry}
        onReport={() => reportError(error, errorInfo)}
      />
    );
  }

  return <>{children}</>;
};

const ErrorRecoveryPanel: React.FC<{
  error: Error;
  errorInfo: any;
  onRetry: () => void;
  onReport: () => void;
}> = ({ error, errorInfo, onRetry, onReport }) => {
  const errorType = identifyErrorType(error);
  const suggestions = getErrorSuggestions(errorType);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
          <h2 className="text-lg font-semibold text-red-800">
            Processing Error
          </h2>
        </div>

        <div className="mb-4">
          <p className="text-red-700 mb-2">{error.message}</p>
          <details className="text-sm text-red-600">
            <summary className="cursor-pointer hover:text-red-800">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
              {error.stack}
            </pre>
          </details>
        </div>

        {/* Suggested Solutions */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-red-800 mb-2">Suggested Solutions:</h3>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recovery Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
          <button
            onClick={onReport}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
          >
            Report Issue
          </button>
          <button
            onClick={() => window.location.href = '/knowledge-bases'}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

const identifyErrorType = (error: Error): string => {
  if (error.message.includes('network')) return 'network';
  if (error.message.includes('unauthorized')) return 'auth';
  if (error.message.includes('file size')) return 'file_size';
  if (error.message.includes('format')) return 'format';
  return 'general';
};

const getErrorSuggestions = (errorType: string): string[] => {
  const suggestions = {
    network: [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the issue persists'
    ],
    auth: [
      'Try refreshing the page',
      'Log out and log back in',
      'Check if your session has expired'
    ],
    file_size: [
      'Try uploading smaller files',
      'Split large documents into sections',
      'Use web scraping for large online documents'
    ],
    format: [
      'Check that your file format is supported',
      'Try converting to PDF or text format',
      'Ensure files are not corrupted'
    ],
    general: [
      'Try refreshing the page',
      'Clear your browser cache',
      'Contact support with the error details'
    ]
  };

  return suggestions[errorType] || suggestions.general;
};
```

## API Integration Patterns

### Efficient State Synchronization
```typescript
// frontend/src/hooks/useKBCreation.ts
"""
Custom hook for KB creation state management with optimistic updates.

FEATURES:
- Optimistic UI updates
- Error handling and rollback
- Real-time synchronization
- Offline support preparation
"""

export const useKBCreation = () => {
  const [state, setState] = useState<KBCreationState>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const addSource = async (sourceConfig: SourceConfig): Promise<string> => {
    const tempId = generateTempId();

    // Optimistic update
    const tempSource: KBSource = {
      id: tempId,
      type: sourceConfig.type,
      config: sourceConfig,
      status: 'processing'
    };

    setState(prev => ({
      ...prev,
      sources: [...prev.sources, tempSource]
    }));

    try {
      const response = await api.post('/api/v1/kb/drafts/sources', {
        draft_id: state.draft_id,
        source_config: sourceConfig
      });

      // Replace temp source with real source
      setState(prev => ({
        ...prev,
        sources: prev.sources.map(s =>
          s.id === tempId ? { ...s, id: response.data.source_id, status: 'completed' } : s
        )
      }));

      return response.data.source_id;
    } catch (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        sources: prev.sources.filter(s => s.id !== tempId)
      }));
      throw error;
    }
  };

  const previewSource = async (sourceId: string): Promise<ContentPreview> => {
    try {
      const response = await api.post(`/api/v1/kb/sources/${sourceId}/preview`);

      // Update source with preview data
      setState(prev => ({
        ...prev,
        sources: prev.sources.map(s =>
          s.id === sourceId ? { ...s, preview: response.data } : s
        )
      }));

      return response.data;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      throw error;
    }
  };

  const createKB = async (): Promise<string> => {
    setIsLoading(true);

    try {
      const response = await api.post('/api/v1/knowledge-bases', {
        draft_id: state.draft_id,
        metadata: state.kb_metadata,
        processing_config: state.processing_config
      });

      // Start monitoring pipeline
      const pipelineId = response.data.pipeline_id;
      setState(prev => ({
        ...prev,
        pipeline_id: pipelineId,
        currentStep: 'processing'
      }));

      return response.data.kb_id;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return {
    state,
    actions: {
      addSource,
      removeSource,
      updateSource,
      combineSource,
      previewSource,
      createKB,
      // ... other actions
    },
    isLoading
  };
};
```

## Summary

This user experience system provides:

1. **Progressive Disclosure** - Interface complexity scales with user needs and expertise
2. **Mobile-First Design** - Touch-friendly interface that works on all devices
3. **Real-Time Feedback** - Live pipeline monitoring with detailed status information
4. **Error Recovery** - Comprehensive error handling with suggested solutions
5. **Optimistic Updates** - Responsive interface with smart state management
6. **Accessibility** - WCAG-compliant design patterns throughout

The system ensures that creating knowledge bases feels natural and intuitive while providing the power and flexibility that advanced users need for sophisticated workflows.