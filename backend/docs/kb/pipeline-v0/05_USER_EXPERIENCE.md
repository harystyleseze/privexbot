# User Experience Module

**Purpose**: Intuitive frontend patterns and workflows for the KB pipeline
**Scope**: UI/UX design, real-time feedback, progressive disclosure, error handling
**Integration**: Frontend interface for [Source Management](01_SOURCE_MANAGEMENT.md), [Processing Pipeline](02_PROCESSING_PIPELINE.md), and [Configuration Management](03_CONFIGURATION_MANAGEMENT.md)

---

## 🎯 Module Overview

The User Experience Module transforms the powerful KB pipeline backend into an **intuitive, natural, and smooth** user interface that guides users through complex operations while hiding unnecessary complexity. The goal is to make enterprise-grade functionality accessible to users of all technical levels.

## 🏗️ UX Architecture

### **Progressive Disclosure Design Pattern**

```
┌─────────────────────────────────────────────────────────────┐
│                      USER EXPERIENCE LAYERS                 │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Simple    │ │ Guided      │ │  Expert     │          │
│  │ Interface   │ │ Interface   │ │ Interface   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│       │               │               │                    │
│    New Users     Intermediate      Advanced Users          │
│                     Users                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │             ADAPTIVE INTERFACE ENGINE               │  │
│  │  • User skill level detection                       │  │
│  │  • Context-aware assistance                        │  │
│  │  • Progressive feature revelation                   │  │
│  │  • Smart defaults and suggestions                   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    REAL-TIME FEEDBACK SYSTEM                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Live Status │ │ Interactive │ │ Smart Error │          │
│  │ Updates     │ │ Previews    │ │ Recovery    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 User Journey Design

### **KB Creation Workflow** - Natural and Intuitive

#### **Step 1: Intent Discovery**

```typescript
// Frontend: Intent-based KB creation start
interface KBCreationIntent {
  purpose: 'customer_support' | 'internal_docs' | 'product_info' | 'training' | 'custom';
  audience: 'customers' | 'employees' | 'developers' | 'partners' | 'mixed';
  complexity: 'simple' | 'standard' | 'advanced';
  sources: 'single' | 'multiple' | 'mixed';
}

const KBIntentDiscovery: React.FC = () => {
  const [intent, setIntent] = useState<KBCreationIntent>();

  return (
    <div className="kb-intent-discovery">
      <h2>What kind of knowledge base do you want to create?</h2>

      {/* Purpose Selection with Visual Cards */}
      <PurposeSelector
        onSelect={(purpose) => {
          setIntent(prev => ({ ...prev, purpose }));
          // Auto-suggest optimal settings based on purpose
          suggestOptimalSettings(purpose);
        }}
        options={[
          {
            id: 'customer_support',
            title: 'Customer Support',
            description: 'Help customers find answers quickly',
            icon: 'support',
            examples: ['FAQs', 'Troubleshooting', 'How-to guides']
          },
          {
            id: 'internal_docs',
            title: 'Internal Documentation',
            description: 'Company policies, procedures, and guides',
            icon: 'documents',
            examples: ['HR policies', 'Procedures', 'Training materials']
          },
          {
            id: 'product_info',
            title: 'Product Information',
            description: 'Product specs, features, and documentation',
            icon: 'product',
            examples: ['API docs', 'User manuals', 'Feature guides']
          }
        ]}
      />

      {/* Smart Workflow Adaptation */}
      {intent?.purpose && (
        <WorkflowAdaptation
          intent={intent}
          onNext={() => navigateToSourceSelection(intent)}
        />
      )}
    </div>
  );
};
```

#### **Step 2: Source Selection with Progressive Disclosure**

```typescript
// Frontend: Adaptive source selection
const SourceSelectionStep: React.FC<{ intent: KBCreationIntent }> = ({ intent }) => {
  const [selectedSources, setSelectedSources] = useState<SourceType[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Recommend sources based on intent
  const recommendedSources = useMemo(() => {
    return getRecommendedSources(intent);
  }, [intent]);

  return (
    <div className="source-selection">
      <ProgressIndicator currentStep={2} totalSteps={5} />

      <h2>Where is your content?</h2>

      {/* Recommended Sources First */}
      <RecommendedSourcesSection
        sources={recommendedSources}
        onSourceSelect={handleSourceSelect}
        intent={intent}
      />

      {/* All Sources (Progressive Disclosure) */}
      <Collapsible
        trigger="Show all source options"
        open={showAdvanced}
        onOpenChange={setShowAdvanced}
      >
        <AllSourcesGrid
          onSourceSelect={handleSourceSelect}
          selectedSources={selectedSources}
        />
      </Collapsible>

      {/* Real-time validation and guidance */}
      <SourceValidationFeedback
        selectedSources={selectedSources}
        intent={intent}
      />

      <NavigationButtons
        onNext={() => proceedToSourceConfiguration(selectedSources)}
        onBack={() => navigateToPreviousStep()}
        nextDisabled={selectedSources.length === 0}
      />
    </div>
  );
};

const RecommendedSourcesSection: React.FC = ({ sources, onSourceSelect, intent }) => {
  return (
    <div className="recommended-sources">
      <div className="recommendation-banner">
        <Icon name="lightbulb" />
        <span>Based on your needs, we recommend these sources:</span>
      </div>

      <div className="source-cards-grid">
        {sources.map(source => (
          <SourceCard
            key={source.type}
            source={source}
            recommended={true}
            onSelect={onSourceSelect}
            benefits={getSourceBenefits(source, intent)}
          />
        ))}
      </div>
    </div>
  );
};
```

#### **Step 3: Source Configuration with Real-Time Preview**

```typescript
// Frontend: Source configuration with live preview
const SourceConfigurationStep: React.FC = ({ selectedSources }) => {
  const [configurations, setConfigurations] = useState<SourceConfig[]>([]);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [currentSource, setCurrentSource] = useState(0);

  // Real-time preview updates
  const { data: livePreview, isLoading: previewLoading } = useQuery({
    queryKey: ['source-preview', configurations[currentSource]],
    queryFn: () => generateSourcePreview(configurations[currentSource]),
    enabled: !!configurations[currentSource],
    refetchInterval: false,
    staleTime: 30000 // Cache for 30 seconds
  });

  return (
    <div className="source-configuration">
      <div className="configuration-layout">
        {/* Left: Configuration Panel */}
        <div className="configuration-panel">
          <SourceTabs
            sources={selectedSources}
            currentSource={currentSource}
            onSourceChange={setCurrentSource}
            configurations={configurations}
          />

          <SourceConfigForm
            source={selectedSources[currentSource]}
            configuration={configurations[currentSource]}
            onConfigChange={(config) => updateConfiguration(currentSource, config)}
            smartDefaults={getSmartDefaults(selectedSources[currentSource])}
          />

          <ConfigurationValidation
            configuration={configurations[currentSource]}
            source={selectedSources[currentSource]}
          />
        </div>

        {/* Right: Live Preview */}
        <div className="preview-panel">
          <PreviewHeader
            source={selectedSources[currentSource]}
            isLoading={previewLoading}
          />

          {previewLoading ? (
            <PreviewSkeleton />
          ) : (
            <SourcePreview
              data={livePreview}
              configuration={configurations[currentSource]}
              onConfigSuggestion={handleConfigSuggestion}
            />
          )}

          <PreviewActions
            onRefresh={() => refreshPreview(currentSource)}
            onDownload={() => downloadPreview(livePreview)}
          />
        </div>
      </div>

      <NavigationButtons
        onNext={() => proceedToProcessingConfiguration()}
        onBack={() => navigateToSourceSelection()}
        nextDisabled={!allSourcesConfigured(configurations)}
      />
    </div>
  );
};

// Smart configuration form that adapts based on source type
const SourceConfigForm: React.FC = ({ source, configuration, onConfigChange, smartDefaults }) => {
  const formConfig = useSourceFormConfig(source.type);

  return (
    <div className="source-config-form">
      <SmartFormSection
        title="Basic Settings"
        fields={formConfig.basicFields}
        values={configuration}
        onChange={onConfigChange}
        smartDefaults={smartDefaults}
      />

      <AdvancedSettingsCollapsible
        fields={formConfig.advancedFields}
        values={configuration}
        onChange={onConfigChange}
        showIf={configuration => needsAdvancedSettings(configuration)}
      />

      <ChunkingPreferences
        configuration={configuration.chunking}
        onChange={(chunking) => onConfigChange({ ...configuration, chunking })}
        recommendations={getChunkingRecommendations(source)}
      />

      <AIAnnotationsSection
        annotations={configuration.annotations}
        onChange={(annotations) => onConfigChange({ ...configuration, annotations })}
        autoSuggestions={generateAnnotationSuggestions(source)}
      />
    </div>
  );
};
```

#### **Step 4: Processing Pipeline Visualization**

```typescript
// Frontend: Visual pipeline monitoring
const ProcessingPipelineStep: React.FC = ({ draftId }) => {
  const [pipelineState, setPipelineState] = useState<PipelineState>();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // WebSocket connection for real-time updates
  const { data: realTimeUpdates } = useWebSocket(`/ws/pipeline/${draftId}`, {
    onMessage: (event) => {
      const update = JSON.parse(event.data);
      updatePipelineState(update);
    }
  });

  return (
    <div className="processing-pipeline">
      <div className="pipeline-header">
        <h2>Processing Your Knowledge Base</h2>
        <OverallProgress
          totalSteps={pipelineState?.totalSteps}
          completedSteps={pipelineState?.completedSteps}
          currentStep={pipelineState?.currentStep}
        />
      </div>

      <div className="pipeline-visualization">
        <PipelineFlowDiagram
          steps={pipelineState?.steps || []}
          onStepClick={setSelectedStep}
          currentStep={pipelineState?.currentStep}
        />

        <PipelineStepDetails
          step={selectedStep ? pipelineState?.steps.find(s => s.id === selectedStep) : null}
          onClose={() => setSelectedStep(null)}
        />
      </div>

      <div className="pipeline-insights">
        <ProcessingStats
          stats={pipelineState?.statistics}
          estimatedTimeRemaining={pipelineState?.estimatedTimeRemaining}
        />

        <QualityMetrics
          metrics={pipelineState?.qualityMetrics}
          recommendations={pipelineState?.recommendations}
        />
      </div>

      {/* Error Recovery Interface */}
      {pipelineState?.hasErrors && (
        <ErrorRecoveryPanel
          errors={pipelineState.errors}
          onRetry={handleRetry}
          onSkip={handleSkip}
          onModifyConfig={handleModifyConfig}
        />
      )}
    </div>
  );
};

const PipelineFlowDiagram: React.FC = ({ steps, onStepClick, currentStep }) => {
  return (
    <div className="pipeline-flow">
      {steps.map((step, index) => (
        <div key={step.id} className="pipeline-step-container">
          <PipelineStep
            step={step}
            isActive={step.id === currentStep}
            isCurrent={step.id === currentStep}
            onClick={() => onStepClick(step.id)}
            className={`step-${step.status}`}
          />

          {index < steps.length - 1 && (
            <PipelineConnection
              fromStep={step}
              toStep={steps[index + 1]}
              animated={step.status === 'completed'}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const PipelineStep: React.FC = ({ step, isActive, onClick, className }) => {
  return (
    <div
      className={`pipeline-step ${className} ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="step-icon">
        <StepIcon type={step.type} status={step.status} />
      </div>

      <div className="step-content">
        <h4>{step.name}</h4>
        <p>{step.description}</p>

        {step.status === 'running' && (
          <ProgressBar
            value={step.progress}
            showLabel={true}
            animated={true}
          />
        )}

        {step.status === 'completed' && (
          <div className="step-results">
            <Icon name="check" color="green" />
            <span>{step.resultSummary}</span>
          </div>
        )}

        {step.status === 'failed' && (
          <div className="step-error">
            <Icon name="alert" color="red" />
            <span>{step.errorMessage}</span>
          </div>
        )}
      </div>

      <div className="step-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            showStepDetails(step);
          }}
        >
          Details
        </Button>

        {step.status === 'failed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              retryStep(step);
            }}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};
```

## 🔄 Real-Time Feedback Systems

### **Live Status Updates and Progress Tracking**

```typescript
// Frontend: Real-time status management
class RealTimeStatusManager {
  private wsConnection: WebSocket;
  private statusCallbacks: Map<string, (status: any) => void> = new Map();

  constructor(baseUrl: string) {
    this.wsConnection = new WebSocket(`${baseUrl}/ws/status`);
    this.setupWebSocketHandlers();
  }

  subscribeToStatus(resourceId: string, callback: (status: any) => void) {
    this.statusCallbacks.set(resourceId, callback);

    // Send subscription message
    this.wsConnection.send(JSON.stringify({
      type: 'subscribe',
      resourceId
    }));
  }

  private setupWebSocketHandlers() {
    this.wsConnection.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'status_update':
          this.handleStatusUpdate(message);
          break;
        case 'progress_update':
          this.handleProgressUpdate(message);
          break;
        case 'error_update':
          this.handleErrorUpdate(message);
          break;
        case 'completion_update':
          this.handleCompletionUpdate(message);
          break;
      }
    };
  }

  private handleStatusUpdate(message: any) {
    const callback = this.statusCallbacks.get(message.resourceId);
    if (callback) {
      callback({
        type: 'status',
        status: message.status,
        details: message.details,
        timestamp: message.timestamp
      });
    }
  }

  private handleProgressUpdate(message: any) {
    const callback = this.statusCallbacks.get(message.resourceId);
    if (callback) {
      callback({
        type: 'progress',
        progress: message.progress,
        stage: message.stage,
        estimatedTimeRemaining: message.estimatedTimeRemaining,
        processedItems: message.processedItems,
        totalItems: message.totalItems
      });
    }
  }
}

// React hook for real-time status
const useRealTimeStatus = (resourceId: string) => {
  const [status, setStatus] = useState<any>(null);
  const statusManager = useStatusManager();

  useEffect(() => {
    if (!resourceId) return;

    const unsubscribe = statusManager.subscribeToStatus(resourceId, (statusUpdate) => {
      setStatus(prevStatus => ({
        ...prevStatus,
        ...statusUpdate,
        history: [...(prevStatus?.history || []), statusUpdate]
      }));
    });

    return unsubscribe;
  }, [resourceId, statusManager]);

  return status;
};

// Status display components
const StatusIndicator: React.FC<{ status: any }> = ({ status }) => {
  if (!status) return <LoadingSpinner />;

  return (
    <div className="status-indicator">
      <StatusIcon status={status.status} />

      <div className="status-content">
        <div className="status-text">
          {getStatusDisplayText(status)}
        </div>

        {status.type === 'progress' && (
          <div className="progress-details">
            <ProgressBar value={status.progress} />
            <div className="progress-info">
              <span>{status.processedItems} of {status.totalItems} processed</span>
              {status.estimatedTimeRemaining && (
                <span className="time-remaining">
                  ~{formatDuration(status.estimatedTimeRemaining)} remaining
                </span>
              )}
            </div>
          </div>
        )}

        {status.details && (
          <div className="status-details">
            {status.details}
          </div>
        )}
      </div>

      <StatusActions status={status} />
    </div>
  );
};
```

### **Interactive Error Recovery**

```typescript
// Frontend: Smart error recovery interface
const ErrorRecoveryInterface: React.FC<{ error: ProcessingError }> = ({ error }) => {
  const [recoveryStrategy, setRecoveryStrategy] = useState<RecoveryStrategy | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Get smart recovery suggestions
  const recoverySuggestions = useRecoverySuggestions(error);

  const handleRecovery = async (strategy: RecoveryStrategy) => {
    setIsRecovering(true);
    setRecoveryStrategy(strategy);

    try {
      await executeRecoveryStrategy(error.resourceId, strategy);
      // Success handled by real-time updates
    } catch (recoveryError) {
      // Show recovery failure options
      showRecoveryFailureDialog(recoveryError);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="error-recovery-interface">
      <div className="error-summary">
        <Icon name="alert-circle" className="error-icon" />
        <div>
          <h3>{error.title}</h3>
          <p>{error.description}</p>
        </div>
      </div>

      <div className="error-details">
        <Collapsible trigger="Show technical details">
          <CodeBlock language="json">
            {JSON.stringify(error.technicalDetails, null, 2)}
          </CodeBlock>
        </Collapsible>
      </div>

      <div className="recovery-options">
        <h4>How would you like to proceed?</h4>

        <div className="recovery-strategies">
          {recoverySuggestions.map(suggestion => (
            <RecoveryOption
              key={suggestion.id}
              strategy={suggestion}
              onSelect={() => handleRecovery(suggestion)}
              isExecuting={isRecovering && recoveryStrategy?.id === suggestion.id}
            />
          ))}
        </div>

        <div className="advanced-options">
          <Button
            variant="outline"
            onClick={() => showAdvancedRecoveryOptions(error)}
          >
            Advanced Recovery Options
          </Button>

          <Button
            variant="ghost"
            onClick={() => reportError(error)}
          >
            Report This Issue
          </Button>
        </div>
      </div>
    </div>
  );
};

const RecoveryOption: React.FC = ({ strategy, onSelect, isExecuting }) => {
  return (
    <div className="recovery-option">
      <div className="option-header">
        <Icon name={strategy.icon} />
        <h5>{strategy.title}</h5>
        <Badge variant={strategy.confidence > 0.8 ? 'success' : 'default'}>
          {Math.round(strategy.confidence * 100)}% confidence
        </Badge>
      </div>

      <p className="option-description">
        {strategy.description}
      </p>

      {strategy.requiredActions && (
        <div className="required-actions">
          <h6>This will:</h6>
          <ul>
            {strategy.requiredActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="option-footer">
        <div className="estimated-time">
          <Icon name="clock" size="sm" />
          <span>~{strategy.estimatedTime}</span>
        </div>

        <Button
          onClick={onSelect}
          disabled={isExecuting}
          className="recovery-button"
        >
          {isExecuting ? (
            <>
              <Spinner size="sm" />
              Executing...
            </>
          ) : (
            strategy.actionLabel
          )}
        </Button>
      </div>
    </div>
  );
};
```

## 🎛️ Progressive Configuration Interface

### **Adaptive Complexity Management**

```typescript
// Frontend: Progressive complexity disclosure
const ConfigurationInterface: React.FC = ({ userLevel, context }) => {
  const [complexityLevel, setComplexityLevel] = useState<'simple' | 'guided' | 'expert'>(
    detectUserComplexityLevel(userLevel, context)
  );

  return (
    <div className="configuration-interface">
      <ComplexityToggle
        currentLevel={complexityLevel}
        onLevelChange={setComplexityLevel}
        context={context}
      />

      <ConfigurationContent
        complexityLevel={complexityLevel}
        context={context}
      />
    </div>
  );
};

const ConfigurationContent: React.FC = ({ complexityLevel, context }) => {
  switch (complexityLevel) {
    case 'simple':
      return <SimpleConfigurationInterface context={context} />;
    case 'guided':
      return <GuidedConfigurationInterface context={context} />;
    case 'expert':
      return <ExpertConfigurationInterface context={context} />;
  }
};

const SimpleConfigurationInterface: React.FC = ({ context }) => {
  return (
    <div className="simple-config">
      <h3>Quick Setup</h3>
      <p>We'll use smart defaults optimized for your use case.</p>

      <QuickConfigOptions
        options={getQuickConfigOptions(context)}
        onSelect={handleQuickConfigSelect}
      />

      <SmartDefaultsPreview
        defaults={getSmartDefaults(context)}
        onCustomize={() => setComplexityLevel('guided')}
      />
    </div>
  );
};

const GuidedConfigurationInterface: React.FC = ({ context }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const sections = getGuidedConfigSections(context);

  return (
    <div className="guided-config">
      <ConfigurationWizard
        sections={sections}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />

      <GuidedConfigSection
        section={sections[currentSection]}
        onComplete={() => moveToNextSection(currentSection, sections)}
      />

      <ConfigurationPreview
        configuration={getCurrentConfiguration()}
        onAdvancedEdit={() => setComplexityLevel('expert')}
      />
    </div>
  );
};

const ExpertConfigurationInterface: React.FC = ({ context }) => {
  return (
    <div className="expert-config">
      <ConfigurationEditor
        schema={getConfigurationSchema(context)}
        value={getCurrentConfiguration()}
        onChange={handleConfigurationChange}
        validation={useConfigurationValidation()}
      />

      <ConfigurationValidation
        configuration={getCurrentConfiguration()}
        realTime={true}
      />

      <AdvancedPreview
        configuration={getCurrentConfiguration()}
        showTechnicalDetails={true}
      />
    </div>
  );
};
```

## 📱 Responsive and Accessible Design

### **Mobile-First KB Creation**

```typescript
// Frontend: Mobile-optimized KB creation
const MobileKBCreation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTablet] = useMediaQuery('(min-width: 768px)');
  const [isMobile] = useMediaQuery('(max-width: 767px)');

  const steps = [
    { id: 'intent', component: MobileIntentStep },
    { id: 'sources', component: MobileSourceStep },
    { id: 'config', component: MobileConfigStep },
    { id: 'review', component: MobileReviewStep }
  ];

  return (
    <div className="mobile-kb-creation">
      <MobileHeader
        currentStep={currentStep}
        totalSteps={steps.length}
        onBack={() => navigateBack(currentStep)}
      />

      <div className="mobile-content">
        <StepComponent
          {...steps[currentStep]}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      </div>

      <MobileNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={() => navigateNext(currentStep)}
        onPrev={() => navigatePrev(currentStep)}
        canNext={canProceedToNext(currentStep)}
      />
    </div>
  );
};

const MobileSourceStep: React.FC = ({ isMobile }) => {
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null);

  return (
    <div className="mobile-source-step">
      {!selectedSource ? (
        <MobileSourceSelector
          onSourceSelect={setSelectedSource}
          isMobile={isMobile}
        />
      ) : (
        <MobileSourceConfig
          source={selectedSource}
          onBack={() => setSelectedSource(null)}
          onComplete={handleSourceConfigComplete}
        />
      )}
    </div>
  );
};

const MobileSourceSelector: React.FC = ({ onSourceSelect, isMobile }) => {
  const sources = getMobileOptimizedSources();

  return (
    <div className="mobile-source-selector">
      <h2>Choose your content source</h2>

      <div className="source-cards">
        {sources.map(source => (
          <MobileSourceCard
            key={source.type}
            source={source}
            onSelect={() => onSourceSelect(source)}
            optimizedForMobile={isMobile}
          />
        ))}
      </div>

      <div className="mobile-help">
        <Button variant="ghost" onClick={() => showMobileHelp()}>
          <Icon name="help-circle" />
          Need help choosing?
        </Button>
      </div>
    </div>
  );
};
```

### **Accessibility Implementation**

```typescript
// Frontend: Comprehensive accessibility features
const AccessibleKBInterface: React.FC = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const { preferences } = useAccessibilityPreferences();

  // Screen reader announcements
  const announce = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
  }, []);

  return (
    <div
      className="accessible-kb-interface"
      data-theme={preferences.theme}
      style={{
        fontSize: `${preferences.fontSize}rem`,
        animationDuration: preferences.reducedMotion ? '0s' : undefined
      }}
    >
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements[announcements.length - 1]}
      </div>

      {/* Skip navigation */}
      <SkipNavigation />

      {/* Main content with proper headings */}
      <main>
        <h1>Knowledge Base Creation</h1>

        <AccessibleStepper
          currentStep={currentStep}
          steps={steps}
          onStepChange={handleStepChange}
          announce={announce}
        />

        <StepContent
          step={currentStep}
          preferences={preferences}
          announce={announce}
        />
      </main>

      {/* Accessibility toolbar */}
      <AccessibilityToolbar
        preferences={preferences}
        onPreferenceChange={handlePreferenceChange}
      />
    </div>
  );
};

const AccessibleStepper: React.FC = ({ currentStep, steps, onStepChange, announce }) => {
  return (
    <nav
      aria-label="Knowledge base creation progress"
      className="accessible-stepper"
    >
      <ol className="step-list">
        {steps.map((step, index) => (
          <li key={step.id} className={`step ${index === currentStep ? 'current' : ''}`}>
            <button
              onClick={() => {
                onStepChange(index);
                announce(`Navigated to step ${index + 1}: ${step.title}`);
              }}
              aria-current={index === currentStep ? 'step' : undefined}
              disabled={!step.accessible}
              className="step-button"
            >
              <span className="step-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="step-title">{step.title}</span>
              {step.completed && (
                <Icon
                  name="check"
                  aria-label="completed"
                  className="step-completed-icon"
                />
              )}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};

const AccessibilityToolbar: React.FC = ({ preferences, onPreferenceChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accessibility-toolbar">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="accessibility-options"
        className="accessibility-toggle"
      >
        <Icon name="accessibility" />
        <span>Accessibility Options</span>
      </button>

      {isOpen && (
        <div id="accessibility-options" className="accessibility-options">
          <h3>Accessibility Preferences</h3>

          <div className="preference-group">
            <label htmlFor="font-size">Font Size</label>
            <input
              id="font-size"
              type="range"
              min="0.8"
              max="2"
              step="0.1"
              value={preferences.fontSize}
              onChange={(e) => onPreferenceChange('fontSize', parseFloat(e.target.value))}
              aria-describedby="font-size-desc"
            />
            <div id="font-size-desc" className="preference-description">
              Current size: {preferences.fontSize}rem
            </div>
          </div>

          <div className="preference-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) => onPreferenceChange('reducedMotion', e.target.checked)}
              />
              Reduce motion and animations
            </label>
          </div>

          <div className="preference-group">
            <label htmlFor="theme">Color Theme</label>
            <select
              id="theme"
              value={preferences.theme}
              onChange={(e) => onPreferenceChange('theme', e.target.value)}
            >
              <option value="default">Default</option>
              <option value="high-contrast">High Contrast</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🚀 Performance Optimization for UX

### **Optimistic UI Updates**

```typescript
// Frontend: Optimistic updates for better perceived performance
const useOptimisticKBOperations = () => {
  const queryClient = useQueryClient();

  const addSourceOptimistically = useMutation({
    mutationFn: addSourceToKB,
    onMutate: async (newSource) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['kb-sources'] });

      // Snapshot previous value
      const previousSources = queryClient.getQueryData(['kb-sources']);

      // Optimistically update
      queryClient.setQueryData(['kb-sources'], (old: Source[]) => [
        ...old,
        { ...newSource, id: `temp-${Date.now()}`, status: 'processing' }
      ]);

      return { previousSources };
    },
    onError: (err, newSource, context) => {
      // Rollback on error
      queryClient.setQueryData(['kb-sources'], context?.previousSources);

      // Show error notification
      showNotification({
        type: 'error',
        title: 'Failed to add source',
        description: 'The source could not be added. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => addSourceOptimistically.mutate(newSource)
        }
      });
    },
    onSettled: () => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: ['kb-sources'] });
    }
  });

  return { addSourceOptimistically };
};

// Smart loading states
const SmartLoadingStates: React.FC = ({ operationType, progress }) => {
  const loadingMessages = {
    parsing: [
      'Reading your document...',
      'Extracting text and structure...',
      'Preserving tables and formatting...',
      'Almost done with parsing!'
    ],
    chunking: [
      'Breaking content into smart chunks...',
      'Optimizing chunk boundaries...',
      'Ensuring context preservation...',
      'Finalizing chunk structure!'
    ],
    embedding: [
      'Generating AI embeddings...',
      'Processing semantic meaning...',
      'Creating vector representations...',
      'Optimizing for search!'
    ]
  };

  const getCurrentMessage = () => {
    const messages = loadingMessages[operationType] || ['Processing...'];
    const messageIndex = Math.floor((progress / 100) * messages.length);
    return messages[Math.min(messageIndex, messages.length - 1)];
  };

  return (
    <div className="smart-loading">
      <div className="loading-animation">
        <ProgressRing progress={progress} />
      </div>

      <div className="loading-message">
        <AnimatedText text={getCurrentMessage()} />
      </div>

      <div className="loading-details">
        <span>{Math.round(progress)}% complete</span>
      </div>
    </div>
  );
};
```

---

**Next**: Continue with [Architecture & Scalability Module](06_ARCHITECTURE_SCALABILITY.md) to understand system design and scaling patterns.