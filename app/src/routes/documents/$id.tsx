import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, AlertCircle, FileDigit, ScanFace, Trash2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn, stripExtension } from '@/lib/utils';
import { FraudAnalysisPanel } from '@/components/fraud-analysis-panel';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { DocumentChatPanel } from '@/components/document-chat-panel';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { MessageSquare, BarChart2, ChevronsUpDown } from 'lucide-react';

export const Route = createFileRoute('/documents/$id')({
  component: DocumentDetailsPage,
});

interface DocumentResponse {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  imageUrls: {
    original?: string;
    text_extraction?: string;
    signature_extraction?: string;
  };
  extractedText?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fraudAnalysis?: any;
}

type ViewMode = 'original' | 'text' | 'signature';

function DocumentDetailsPage() {
  const { id } = Route.useParams();
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fraudPanelCollapsed, setFraudPanelCollapsed] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'analysis' | 'chat'>('analysis');
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Panning state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const { data: document, isLoading, error, isFetching } = useQuery<DocumentResponse>({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/api/v1/documents/${id}`);
      if (!response.ok) throw new Error('Failed to fetch document details');
      return response.json();
    },
    refetchInterval: (query) => {
      return query.state.data?.status === 'processing' ? 2000 : false;
    },
  });

  const deleteDoc = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3000/api/v1/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigate({ to: '/documents' });
      setDeleteOpen(false);
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  useEffect(() => {
    if (document?.status === 'processing') {
      setViewMode('original');
    }
  }, [document?.status]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - scrollRef.current.offsetLeft,
      y: e.pageY - scrollRef.current.offsetTop,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const y = e.pageY - scrollRef.current.offsetTop;
    const walkX = x - dragStart.x;
    const walkY = y - dragStart.y;
    scrollRef.current.scrollLeft = dragStart.scrollLeft - walkX;
    scrollRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-sidebar/30 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Loading Document...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-sidebar/30 animate-in fade-in duration-500">
        <AlertCircle className="w-10 h-10 text-destructive mb-4" />
        <p className="text-sm font-medium text-destructive">Document Not Found</p>
      </div>
    );
  }

  const isProcessing = document.status === 'processing';
  const isFailed = document.status === 'failed';

  const getActiveImageUrl = () => {
    switch (viewMode) {
      case 'text': return document.imageUrls.text_extraction || document.imageUrls.original;
      case 'signature': return document.imageUrls.signature_extraction || document.imageUrls.original;
      default: return document.imageUrls.original;
    }
  };

  const activeImageUrl = getActiveImageUrl();
  const showAnalysis = !!document.fraudAnalysis &&
    (!!document.fraudAnalysis.auditor_response || !!document.fraudAnalysis.ranking_response);

  return (
    <>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={document?.name ?? ''}
        itemType="document"
        isPending={deleteDoc.isPending}
        onConfirm={() => deleteDoc.mutate()}
      />
      <div className="h-full bg-sidebar/30 flex flex-col items-center overflow-hidden w-full">
        {/* Premium Navigation Header (Sticky) */}
        <div className="w-full bg-background/80 dark:bg-sidebar/80 border-b border-border/40 backdrop-blur-md sticky top-0 z-20 shadow-sm flex items-center justify-between px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center border-primary/20 transition-transform hover:scale-105">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-lg font-medium tracking-tight text-foreground/90 max-w-[500px] truncate" title={document.name}>
                {stripExtension(document.name)}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-muted-foreground/50">
                  Document ID: {document.id}
                </span>
                {isProcessing && (
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary px-2 py-0.5 rounded-sm bg-primary/5 border border-primary/10">
                    <Loader2 className="w-3 h-3 animate-spin" /> Processing
                  </span>
                )}
                {isFailed && (
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-destructive px-2 py-0.5 rounded-sm bg-destructive/5 border border-destructive/10">
                    <AlertCircle className="w-3 h-3" /> Error
                  </span>
                )}
                {document.status === 'completed' && (
                  <span className="text-[10px] font-semibold text-green-600 dark:text-green-500 px-2 py-0.5 rounded-sm bg-green-500/10 border border-green-500/20">
                    Verified
                  </span>
                )}
                {isFetching && !isProcessing && (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1 duration-300">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    <span className="text-[9px] font-semibold text-primary/60">Updating</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-2 rounded-xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Delete document"
            >
              {deleteDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 w-full flex overflow-hidden">
          {/* Left Side Tab Navigation (Google Docs Style - Sticky) */}
          <div className="w-16 border-r border-border/40 bg-background/40 flex flex-col items-center py-6 gap-3 shrink-0">
            <button
              onClick={() => setViewMode('original')}
              title="Original View"
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300",
                viewMode === 'original'
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  : "text-muted-foreground/50 border-transparent hover:text-foreground hover:bg-muted/60"
              )}
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              disabled={isProcessing || !document.imageUrls.text_extraction}
              onClick={() => setViewMode('text')}
              title="Text Nodes Analysis"
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300",
                viewMode === 'text'
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  : "text-muted-foreground/50 border-transparent hover:text-foreground hover:bg-muted/60",
                (isProcessing || !document.imageUrls.text_extraction) && "opacity-20 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/50"
              )}
            >
              <FileDigit className="w-5 h-5" />
            </button>

            <button
              disabled={isProcessing || !document.imageUrls.signature_extraction}
              onClick={() => setViewMode('signature')}
              title="Signature Extraction"
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300",
                viewMode === 'signature'
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  : "text-muted-foreground/50 border-transparent hover:text-foreground hover:bg-muted/60",
                (isProcessing || !document.imageUrls.signature_extraction) && "opacity-20 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/50"
              )}
            >
              <ScanFace className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className={cn(
              "flex-1 overflow-auto p-8 md:p-12 w-full relative group/zoom",
              !isProcessing && (isDragging ? "cursor-grabbing select-none" : "cursor-grab")
            )}
            onMouseDown={!isProcessing ? handleMouseDown : undefined}
            onMouseMove={!isProcessing ? handleMouseMove : undefined}
            onMouseUp={!isProcessing ? handleMouseUpOrLeave : undefined}
            onMouseLeave={!isProcessing ? handleMouseUpOrLeave : undefined}
          >

            {/* Zoom controls (floating) */}
            {!isProcessing && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/80 backdrop-blur-md border border-border/40 rounded-full p-1.5 shadow-lg z-30 opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-300">
                <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={handleResetView} className="px-2 h-8 flex items-center justify-center text-[11px] font-semibold text-foreground/70 hover:text-foreground hover:bg-muted rounded-full transition-colors w-16" title="Reset Zoom">
                  {Math.round(zoom * 100)}%
                </button>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"><ZoomIn className="w-4 h-4" /></button>

                <div className="w-px h-4 bg-border/40 mx-1" />

                <button onClick={handleResetView} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Reset View">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* A4 page scaled by zoom. Base width is 816px. */}
            <div style={{ width: `${816 * zoom}px` }} className="relative shrink-0 transition-all duration-200 mx-auto group">

              {/* Processing / Failed overlays */}
              {isProcessing && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-xs font-semibold text-primary animate-pulse">
                    Neural Analysis Running
                  </p>
                </div>
              )}
              {isFailed && (
                <div className="absolute inset-0 bg-destructive/5 backdrop-blur-md flex flex-col items-center justify-center z-10">
                  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-xs font-semibold text-destructive">
                    Analysis Failed
                  </p>
                </div>
              )}

              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt={`${viewMode} view of document`}
                  draggable={false}
                  className="w-full h-auto block dark:brightness-[0.9] dark:group-hover:brightness-100 transition-all duration-500 pointer-events-none"
                />
              ) : (
                <div className="w-full h-[1123px] flex items-center justify-center text-muted-foreground/10">
                  <FileText className="w-32 h-32" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Agent Analysis & Chat Panel */}
          <div className={cn(
            "shrink-0 border-l border-border/40 bg-background/40 overflow-hidden transition-all duration-300 flex flex-col",
            fraudPanelCollapsed ? "w-16" : "w-[480px]"
          )}>
            {/* Panel Header w/ Tabs */}
            <div className={cn(
              "flex items-center border-b border-border/40 shrink-0 bg-background/80 backdrop-blur-sm",
              fraudPanelCollapsed ? "justify-center px-0 py-3" : "px-4 py-2"
            )}>
              {fraudPanelCollapsed ? (
                <button
                  onClick={() => setFraudPanelCollapsed(false)}
                  className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all"
                >
                  {activeRightTab === 'analysis' ? <BarChart2 className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                </button>
              ) : (
                <>
                  <div className="flex bg-muted/30 p-1 rounded-xl gap-1">
                    <button
                      onClick={() => setActiveRightTab('analysis')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                        activeRightTab === 'analysis' 
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border/20" 
                          : "text-muted-foreground/50 hover:text-foreground"
                      )}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      Analysis
                    </button>
                    <button
                      onClick={() => setActiveRightTab('chat')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                        activeRightTab === 'chat' 
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border/20" 
                          : "text-muted-foreground/50 hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Assistant
                    </button>
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={() => setFraudPanelCollapsed(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:bg-muted/60 hover:text-foreground transition-all"
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 rotate-90" />
                  </button>
                </>
              )}
            </div>

            {/* Panel Content */}
            {!fraudPanelCollapsed && (
              <div className="flex-1 overflow-hidden">
                {activeRightTab === 'analysis' ? (
                  <FraudAnalysisPanel
                    data={document.fraudAnalysis}
                    isCollapsed={false}
                    // No toggle inside, we have the external one
                  />
                ) : (
                  <DocumentChatPanel 
                    documentId={document.id}
                    documentName={document.name}
                    extractedText={document.extractedText}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
