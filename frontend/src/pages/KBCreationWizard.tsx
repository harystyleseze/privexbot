/**
 * KB Creation Wizard - Multi-step KB creation with draft mode
 *
 * WHY:
 * - Guided KB creation
 * - Multiple document sources
 * - Configuration before processing
 * - Auto-save drafts
 *
 * HOW:
 * - Multi-step wizard
 * - Draft API (/kb-drafts)
 * - File upload, URL crawling, cloud sync
 * - Background processing on finalize
 *
 * DEPENDENCIES:
 * - react-hook-form
 * - zod
 * - @tanstack/react-query
 * - @dnd-kit/core (for file drag-and-drop)
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Database,
  Upload,
  Globe,
  Cloud,
  Settings,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useWorkspaceStore } from '@/store/workspace-store';
import apiClient, { handleApiError } from '@/lib/api-client';

const kbSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  chunking_strategy: z.enum(['recursive', 'sentence', 'token']),
  chunk_size: z.number().min(100).max(10000),
  chunk_overlap: z.number().min(0).max(1000),
  embedding_model: z.string(),
});

type KBFormData = z.infer<typeof kbSchema>;

const STEPS = ['Basic Info', 'Add Documents', 'Configure', 'Review'];

export default function KBCreationWizard() {
  const { draftId } = useParams<{ draftId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspaceStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  // Form
  const { register, handleSubmit, watch, formState: { errors } } = useForm<KBFormData>({
    resolver: zodResolver(kbSchema),
    defaultValues: {
      chunking_strategy: 'recursive',
      chunk_size: 1000,
      chunk_overlap: 200,
      embedding_model: 'text-embedding-ada-002',
    },
  });

  // Load or create draft
  const { data: draft } = useQuery({
    queryKey: ['kb-draft', draftId],
    queryFn: async () => {
      if (draftId) {
        const response = await apiClient.get(`/kb-drafts/${draftId}`);
        return response.data;
      } else {
        const response = await apiClient.post('/kb-drafts/', {
          workspace_id: currentWorkspace?.id,
          initial_data: { name: 'Untitled Knowledge Base' },
        });
        navigate(`/knowledge-bases/create/${response.data.draft_id}`, { replace: true });
        return response.data;
      }
    },
    enabled: !!currentWorkspace,
  });

  // Upload files mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`/kb-drafts/${draftId}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'File uploaded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Upload failed', description: handleApiError(error), variant: 'destructive' });
    },
  });

  // Add URL mutation
  const addUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiClient.post(`/kb-drafts/${draftId}/documents/url`, { url });
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'URL added successfully' });
      setUrls((prev) => [...prev, urlInput]);
      setUrlInput('');
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: KBFormData) => {
      const response = await apiClient.patch(`/kb-drafts/${draftId}`, { updates: data });
      return response.data;
    },
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/kb-drafts/${draftId}/finalize`);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Knowledge base created!',
        description: `Processing ${data.documents_queued} documents...`,
      });
      navigate(`/knowledge-bases/${data.kb_id}`);
    },
    onError: (error) => {
      toast({ title: 'Failed to create KB', description: handleApiError(error), variant: 'destructive' });
    },
  });

  // File drop zone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
    acceptedFiles.forEach((file) => uploadMutation.mutate(file));
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
  });

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: KBFormData) => {
    updateConfigMutation.mutate(data, {
      onSuccess: () => {
        if (currentStep === STEPS.length - 1) {
          finalizeMutation.mutate();
        } else {
          nextStep();
        }
      },
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="w-8 h-8" />
          Create Knowledge Base
        </h1>
        <p className="text-muted-foreground mt-2">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
        </p>
      </div>

      {/* Progress */}
      <Progress value={((currentStep + 1) / STEPS.length) * 100} className="mb-8" />

      {/* Steps */}
      <div className="bg-card p-6 rounded-lg border min-h-[400px]">
        {/* Step 1: Basic Info */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Basic Information</h2>

            <div>
              <Label htmlFor="name">Knowledge Base Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Product Documentation"
                className="mt-2"
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what this knowledge base contains..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 2: Add Documents */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Add Documents</h2>

            {/* File Upload */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Files
              </h3>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                }`}
              >
                <input {...getInputProps()} />
                {uploadMutation.isPending ? (
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports: PDF, DOCX, TXT, MD
                    </p>
                  </>
                )}
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* URL Input */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Add Website URLs
              </h3>
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/docs"
                />
                <Button
                  onClick={() => addUrlMutation.mutate(urlInput)}
                  disabled={!urlInput || addUrlMutation.isPending}
                >
                  Add URL
                </Button>
              </div>
              {urls.length > 0 && (
                <div className="mt-4 space-y-2">
                  {urls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {url}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cloud Sources */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Connect Cloud Sources
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => navigate('/credentials?type=notion')}>
                  Connect Notion
                </Button>
                <Button variant="outline" onClick={() => navigate('/credentials?type=google')}>
                  Connect Google Drive
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration
            </h2>

            <div>
              <Label>Chunking Strategy</Label>
              <Select
                value={watch('chunking_strategy')}
                onValueChange={(value) => register('chunking_strategy').onChange({ target: { value } })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recursive">Recursive (Recommended)</SelectItem>
                  <SelectItem value="sentence">Sentence-based</SelectItem>
                  <SelectItem value="token">Token-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chunk_size">Chunk Size</Label>
                <Input
                  id="chunk_size"
                  type="number"
                  {...register('chunk_size', { valueAsNumber: true })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="chunk_overlap">Chunk Overlap</Label>
                <Input
                  id="chunk_overlap"
                  type="number"
                  {...register('chunk_overlap', { valueAsNumber: true })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Embedding Model</Label>
              <Select
                value={watch('embedding_model')}
                onValueChange={(value) => register('embedding_model').onChange({ target: { value } })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-embedding-ada-002">OpenAI Ada 002</SelectItem>
                  <SelectItem value="text-embedding-3-small">OpenAI Embedding 3 Small</SelectItem>
                  <SelectItem value="text-embedding-3-large">OpenAI Embedding 3 Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Review & Create</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{watch('name')}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="font-medium">{uploadedFiles.length} files, {urls.length} URLs</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Configuration</p>
                <p className="font-medium">
                  {watch('chunking_strategy')} | Size: {watch('chunk_size')} | Overlap:{' '}
                  {watch('chunk_overlap')}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm">
                  🚀 Your knowledge base will be created and documents will be processed in the
                  background. You'll be notified when it's ready.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleSubmit(onSubmit)}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={finalizeMutation.isPending}
            size="lg"
          >
            {finalizeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Knowledge Base
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
