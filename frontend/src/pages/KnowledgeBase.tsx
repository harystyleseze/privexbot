/**
 * KnowledgeBase - List and manage all knowledge bases
 *
 * WHY:
 * - Central KB management
 * - Quick access to KBs
 * - Search and filtering
 * - Analytics overview
 *
 * HOW:
 * - React Query for data fetching
 * - Grid/list view toggle
 * - Search with debounce
 * - Delete with confirmation
 *
 * DEPENDENCIES:
 * - @tanstack/react-query
 * - lucide-react
 * - react-router-dom
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Plus,
  Search,
  Grid3x3,
  List,
  Trash2,
  FileText,
  TrendingUp,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useWorkspaceStore } from '@/store/workspace-store';
import apiClient, { handleApiError } from '@/lib/api-client';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  total_documents: number;
  total_chunks: number;
  embedding_model: string;
  created_at: string;
  updated_at: string;
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kbToDelete, setKbToDelete] = useState<string | null>(null);

  // Fetch knowledge bases
  const { data: kbs, isLoading } = useQuery({
    queryKey: ['knowledge-bases', currentWorkspace?.id],
    queryFn: async () => {
      const response = await apiClient.get('/knowledge-bases/', {
        params: { workspace_id: currentWorkspace?.id },
      });
      return response.data.items as KnowledgeBase[];
    },
    enabled: !!currentWorkspace,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (kbId: string) => {
      await apiClient.delete(`/knowledge-bases/${kbId}`);
    },
    onSuccess: () => {
      toast({ title: 'Knowledge base deleted' });
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      setDeleteDialogOpen(false);
      setKbToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },
  });

  // Filter KBs by search
  const filteredKbs = useMemo(() => {
    if (!kbs) return [];
    if (!searchQuery) return kbs;

    const query = searchQuery.toLowerCase();
    return kbs.filter(
      (kb) =>
        kb.name.toLowerCase().includes(query) ||
        kb.description?.toLowerCase().includes(query)
    );
  }, [kbs, searchQuery]);

  const handleDelete = (kbId: string) => {
    setKbToDelete(kbId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (kbToDelete) {
      deleteMutation.mutate(kbToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading knowledge bases...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Knowledge Bases</h1>
            <p className="text-muted-foreground">
              {filteredKbs.length} {filteredKbs.length === 1 ? 'knowledge base' : 'knowledge bases'}
            </p>
          </div>
        </div>

        <Button size="lg" onClick={() => navigate('/knowledge-bases/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Knowledge Base
        </Button>
      </div>

      {/* Search and View Controls */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge bases..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Knowledge Bases */}
      {filteredKbs.length === 0 ? (
        <div className="text-center py-16">
          <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? 'No knowledge bases found' : 'No knowledge bases yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first knowledge base to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate('/knowledge-bases/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Knowledge Base
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKbs.map((kb) => (
            <div
              key={kb.id}
              className="bg-card border rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{kb.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(kb.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/knowledge-bases/${kb.id}`);
                    }}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/knowledge-bases/${kb.id}/analytics`);
                    }}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(kb.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {kb.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {kb.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {kb.total_documents} docs
                </div>
                <div className="text-muted-foreground">
                  {kb.total_chunks.toLocaleString()} chunks
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Model: {kb.embedding_model}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKbs.map((kb) => (
            <div
              key={kb.id}
              className="bg-card border rounded-lg p-4 hover:shadow-md transition cursor-pointer flex items-center justify-between"
              onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold">{kb.name}</h3>
                  {kb.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {kb.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {kb.total_documents}
                  </div>
                  <div>{kb.total_chunks.toLocaleString()} chunks</div>
                  <div className="text-xs">{new Date(kb.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/knowledge-bases/${kb.id}`);
                  }}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/knowledge-bases/${kb.id}/analytics`);
                  }}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(kb.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Knowledge Base?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this knowledge base and all its documents. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
