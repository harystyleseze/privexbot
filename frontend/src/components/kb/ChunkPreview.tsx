/**
 * ChunkPreview - Preview how documents will be chunked
 *
 * WHY:
 * - Validate chunking config
 * - See chunk boundaries
 * - Test before finalization
 *
 * HOW:
 * - Preview API call
 * - Chunk visualization
 * - Pagination
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import apiClient, { handleApiError } from '@/lib/api-client';

interface Chunk {
  index: number;
  content: string;
  char_count: number;
  word_count: number;
  overlap_start?: string;
  overlap_end?: string;
}

interface ChunkPreviewProps {
  draftId: string;
  documentId?: string;
  sampleText?: string;
}

export default function ChunkPreview({ draftId, documentId, sampleText }: ChunkPreviewProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  // Fetch chunk preview
  const { data, isLoading, error } = useQuery({
    queryKey: ['chunk-preview', draftId, documentId],
    queryFn: async () => {
      const response = await apiClient.post(`/kb-drafts/${draftId}/preview-chunks`, {
        document_id: documentId,
        sample_text: sampleText,
      });
      return response.data;
    },
    enabled: !!draftId && (!!documentId || !!sampleText),
  });

  const chunks: Chunk[] = data?.chunks || [];
  const currentChunk = chunks[currentChunkIndex];

  const nextChunk = () => {
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    }
  };

  const prevChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
    }
  };

  const goToChunk = (index: number) => {
    setCurrentChunkIndex(index);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Generating chunk preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
        <p className="text-sm text-destructive">{handleApiError(error)}</p>
      </div>
    );
  }

  if (!chunks || chunks.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Eye className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No chunks to preview</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add documents or provide sample text
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Chunk Preview
        </h3>
        <p className="text-sm text-muted-foreground">
          Preview how your documents will be split into chunks
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Total Chunks</p>
          <p className="text-2xl font-bold">{chunks.length}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Avg Size</p>
          <p className="text-2xl font-bold">
            {Math.round(chunks.reduce((sum, c) => sum + c.char_count, 0) / chunks.length)}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Min Size</p>
          <p className="text-2xl font-bold">
            {Math.min(...chunks.map((c) => c.char_count))}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Max Size</p>
          <p className="text-2xl font-bold">
            {Math.max(...chunks.map((c) => c.char_count))}
          </p>
        </div>
      </div>

      {/* Chunk Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevChunk}
            disabled={currentChunkIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-sm font-medium">
            Chunk {currentChunkIndex + 1} of {chunks.length}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={nextChunk}
            disabled={currentChunkIndex === chunks.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currentChunk?.char_count} chars</span>
          <span>•</span>
          <span>{currentChunk?.word_count} words</span>
        </div>
      </div>

      {/* Chunk Content */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-sm font-medium">Chunk Content</Label>
          <span className="text-xs text-muted-foreground">Index: {currentChunk?.index}</span>
        </div>

        <div className="space-y-3">
          {/* Overlap Start */}
          {currentChunk?.overlap_start && (
            <div className="text-sm bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded border-l-4 border-yellow-500">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                ⚠️ Overlap from previous chunk
              </p>
              <p className="text-yellow-900 dark:text-yellow-100 font-mono text-xs">
                {currentChunk.overlap_start}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="text-sm font-mono bg-background p-4 rounded border max-h-64 overflow-y-auto whitespace-pre-wrap">
            {currentChunk?.content}
          </div>

          {/* Overlap End */}
          {currentChunk?.overlap_end && (
            <div className="text-sm bg-blue-100 dark:bg-blue-900/30 p-3 rounded border-l-4 border-blue-500">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
                ℹ️ Overlap to next chunk
              </p>
              <p className="text-blue-900 dark:text-blue-100 font-mono text-xs">
                {currentChunk.overlap_end}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chunk List */}
      <div>
        <Label className="text-sm font-medium mb-2 block">All Chunks</Label>
        <div className="grid grid-cols-10 gap-2">
          {chunks.map((chunk, index) => (
            <button
              key={index}
              onClick={() => goToChunk(index)}
              className={`p-2 text-xs font-medium border rounded transition ${
                index === currentChunkIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-accent'
              }`}
              title={`Chunk ${index + 1} (${chunk.char_count} chars)`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm">
          💡 <strong>What to look for:</strong>
        </p>
        <ul className="text-sm space-y-1 mt-2 list-disc list-inside">
          <li>Chunks should break at natural boundaries (paragraphs, sentences)</li>
          <li>Yellow highlights show overlapping content from previous chunk</li>
          <li>Blue highlights show content that overlaps into next chunk</li>
          <li>Adjust chunk size/overlap if breaks look unnatural</li>
        </ul>
      </div>
    </div>
  );
}
