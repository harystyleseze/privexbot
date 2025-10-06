/**
 * IndexingConfigPanel - Configure indexing and embedding settings
 *
 * WHY:
 * - Embedding model selection
 * - Vector DB configuration
 * - Index optimization
 *
 * HOW:
 * - Model dropdown
 * - Dimension settings
 * - Distance metrics
 */

import { Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IndexingConfig {
  embedding_model: string;
  distance_metric: 'cosine' | 'euclidean' | 'dot_product';
  enable_hybrid_search: boolean;
  enable_reranking: boolean;
}

interface IndexingConfigPanelProps {
  config: IndexingConfig;
  onChange: (config: IndexingConfig) => void;
}

const EMBEDDING_MODELS = [
  {
    value: 'text-embedding-ada-002',
    label: 'OpenAI Ada 002',
    dimensions: 1536,
    cost: '$',
    speed: 'Fast',
    quality: 'Good',
  },
  {
    value: 'text-embedding-3-small',
    label: 'OpenAI Embedding 3 Small',
    dimensions: 1536,
    cost: '$',
    speed: 'Very Fast',
    quality: 'Good',
  },
  {
    value: 'text-embedding-3-large',
    label: 'OpenAI Embedding 3 Large',
    dimensions: 3072,
    cost: '$$',
    speed: 'Fast',
    quality: 'Excellent',
  },
  {
    value: 'cohere-embed-english-v3.0',
    label: 'Cohere English v3',
    dimensions: 1024,
    cost: '$',
    speed: 'Fast',
    quality: 'Excellent',
  },
  {
    value: 'voyage-02',
    label: 'Voyage AI v2',
    dimensions: 1024,
    cost: '$',
    speed: 'Very Fast',
    quality: 'Excellent',
  },
];

const DISTANCE_METRICS = [
  {
    value: 'cosine',
    label: 'Cosine Similarity',
    description: 'Best for most use cases (default)',
  },
  {
    value: 'euclidean',
    label: 'Euclidean Distance',
    description: 'Good for magnitude-sensitive data',
  },
  {
    value: 'dot_product',
    label: 'Dot Product',
    description: 'Fast, but vectors must be normalized',
  },
];

export default function IndexingConfigPanel({ config, onChange }: IndexingConfigPanelProps) {
  const updateConfig = (updates: Partial<IndexingConfig>) => {
    onChange({ ...config, ...updates });
  };

  const selectedModel = EMBEDDING_MODELS.find((m) => m.value === config.embedding_model);
  const selectedMetric = DISTANCE_METRICS.find((m) => m.value === config.distance_metric);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Indexing Configuration
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure embedding model and search optimization
        </p>
      </div>

      {/* Embedding Model */}
      <div>
        <Label htmlFor="embedding-model">Embedding Model</Label>
        <Select
          value={config.embedding_model}
          onValueChange={(value) => updateConfig({ embedding_model: value })}
        >
          <SelectTrigger id="embedding-model" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMBEDDING_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{model.label}</span>
                  <span className="text-xs text-muted-foreground ml-4">
                    {model.cost} • {model.speed}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedModel && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Dimensions</p>
                <p className="font-medium">{selectedModel.dimensions}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Cost</p>
                <p className="font-medium">{selectedModel.cost}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Quality</p>
                <p className="font-medium">{selectedModel.quality}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Distance Metric */}
      <div>
        <Label htmlFor="distance-metric">Distance Metric</Label>
        <Select
          value={config.distance_metric}
          onValueChange={(value: any) => updateConfig({ distance_metric: value })}
        >
          <SelectTrigger id="distance-metric" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISTANCE_METRICS.map((metric) => (
              <SelectItem key={metric.value} value={metric.value}>
                {metric.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedMetric && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedMetric.description}
          </p>
        )}
      </div>

      {/* Hybrid Search */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex-1">
          <Label htmlFor="hybrid-search">Enable Hybrid Search</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Combine vector search with keyword search for better results
          </p>
        </div>
        <Switch
          id="hybrid-search"
          checked={config.enable_hybrid_search}
          onCheckedChange={(checked) => updateConfig({ enable_hybrid_search: checked })}
        />
      </div>

      {/* Reranking */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex-1">
          <Label htmlFor="reranking">Enable AI Reranking</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Use AI to rerank search results for improved relevance (slower but more accurate)
          </p>
        </div>
        <Switch
          id="reranking"
          checked={config.enable_reranking}
          onCheckedChange={(checked) => updateConfig({ enable_reranking: checked })}
        />
      </div>

      {/* Performance Impact */}
      <div className="p-4 border rounded-lg bg-card">
        <h4 className="text-sm font-medium mb-3">Performance Impact</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Indexing Speed</span>
            <span className="font-medium">
              {selectedModel?.speed || 'Fast'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Search Latency</span>
            <span className="font-medium">
              {config.enable_reranking ? '+100-200ms' : '~50ms'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Search Quality</span>
            <span className="font-medium">
              {config.enable_hybrid_search && config.enable_reranking
                ? 'Excellent'
                : config.enable_hybrid_search
                ? 'Very Good'
                : 'Good'}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm">
          💡 <strong>Recommendations:</strong>
        </p>
        <ul className="text-sm space-y-1 mt-2 list-disc list-inside">
          <li>Use OpenAI Embedding 3 Large for best quality</li>
          <li>Cosine similarity works well for most cases</li>
          <li>Enable hybrid search for complex queries</li>
          <li>Reranking improves accuracy but adds latency</li>
        </ul>
      </div>
    </div>
  );
}
