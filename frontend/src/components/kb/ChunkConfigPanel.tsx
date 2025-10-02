/**
 * ChunkConfigPanel - Configure chunking settings
 *
 * WHY:
 * - Optimize chunk size
 * - Control overlap
 * - Strategy selection
 *
 * HOW:
 * - Strategy dropdown
 * - Size/overlap sliders
 * - Preview impact
 */

import { Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChunkConfig {
  strategy: 'recursive' | 'sentence' | 'token' | 'semantic';
  chunk_size: number;
  chunk_overlap: number;
  separator?: string;
}

interface ChunkConfigPanelProps {
  config: ChunkConfig;
  onChange: (config: ChunkConfig) => void;
}

const STRATEGIES = [
  {
    value: 'recursive',
    label: 'Recursive (Recommended)',
    description: 'Splits text recursively by paragraphs, sentences, then words',
  },
  {
    value: 'sentence',
    label: 'Sentence-based',
    description: 'Splits at sentence boundaries for natural breaks',
  },
  {
    value: 'token',
    label: 'Token-based',
    description: 'Splits by token count, good for exact control',
  },
  {
    value: 'semantic',
    label: 'Semantic (Advanced)',
    description: 'AI-powered semantic chunking for optimal context',
  },
];

export default function ChunkConfigPanel({ config, onChange }: ChunkConfigPanelProps) {
  const updateConfig = (updates: Partial<ChunkConfig>) => {
    onChange({ ...config, ...updates });
  };

  const selectedStrategy = STRATEGIES.find((s) => s.value === config.strategy);

  // Calculate estimated chunks (rough estimate)
  const estimateChunks = (totalChars: number) => {
    const effectiveSize = config.chunk_size - config.chunk_overlap;
    return Math.ceil(totalChars / effectiveSize);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Chunking Configuration
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure how documents are split into chunks for indexing
        </p>
      </div>

      {/* Strategy */}
      <div>
        <Label htmlFor="strategy">Chunking Strategy</Label>
        <Select
          value={config.strategy}
          onValueChange={(value: any) => updateConfig({ strategy: value })}
        >
          <SelectTrigger id="strategy" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STRATEGIES.map((strategy) => (
              <SelectItem key={strategy.value} value={strategy.value}>
                {strategy.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedStrategy && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedStrategy.description}
          </p>
        )}
      </div>

      {/* Chunk Size */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="chunk-size">Chunk Size (characters)</Label>
          <span className="text-sm font-medium">{config.chunk_size}</span>
        </div>
        <input
          id="chunk-size"
          type="range"
          min="100"
          max="4000"
          step="100"
          value={config.chunk_size}
          onChange={(e) => updateConfig({ chunk_size: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Small (100)</span>
          <span>Large (4000)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {config.chunk_size < 500 && '⚠️ Very small chunks may lose context'}
          {config.chunk_size >= 500 && config.chunk_size <= 2000 && '✓ Recommended size'}
          {config.chunk_size > 2000 && '⚠️ Large chunks may reduce search accuracy'}
        </p>
      </div>

      {/* Chunk Overlap */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="chunk-overlap">Chunk Overlap (characters)</Label>
          <span className="text-sm font-medium">{config.chunk_overlap}</span>
        </div>
        <input
          id="chunk-overlap"
          type="range"
          min="0"
          max="500"
          step="50"
          value={config.chunk_overlap}
          onChange={(e) => updateConfig({ chunk_overlap: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>No overlap (0)</span>
          <span>Max (500)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Overlap prevents context loss at chunk boundaries
        </p>
      </div>

      {/* Custom Separator (conditional) */}
      {config.strategy === 'recursive' && (
        <div>
          <Label htmlFor="separator">Custom Separator (Optional)</Label>
          <Input
            id="separator"
            value={config.separator || ''}
            onChange={(e) => updateConfig({ separator: e.target.value })}
            placeholder="e.g., \n\n (double newline)"
            className="mt-2 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty for default separators
          </p>
        </div>
      )}

      {/* Stats Card */}
      <div className="p-4 border rounded-lg bg-card">
        <h4 className="text-sm font-medium mb-3">Impact Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Effective Size</p>
            <p className="font-medium">
              {config.chunk_size - config.chunk_overlap} chars
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Overlap Ratio</p>
            <p className="font-medium">
              {((config.chunk_overlap / config.chunk_size) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Estimated chunks (10K doc)</p>
            <p className="font-medium">{estimateChunks(10000)} chunks</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm">
          💡 <strong>Best Practices:</strong>
        </p>
        <ul className="text-sm space-y-1 mt-2 list-disc list-inside">
          <li>Use 1000-2000 chars for most documentation</li>
          <li>Add 10-20% overlap to preserve context</li>
          <li>Smaller chunks = more precise search</li>
          <li>Larger chunks = better context retention</li>
        </ul>
      </div>
    </div>
  );
}
