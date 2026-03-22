import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQueryState, parseAsString } from 'nuqs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn, stripExtension } from '@/lib/utils';
import {
  Search,
  Plus,
  Calendar,
  FileText,
  Fingerprint,
  FolderOpen,
  Loader2,
  AlertCircle,
  ArrowDownAZ,
  ArrowUpZA,
  FilePlus,
  UserPlus,
  Trash2,
  Home,
  ChevronDown,
} from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentThumbnail {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  imageUrls: {
    original?: string;
    text_extraction?: string;
    signature_extraction?: string;
  };
}

interface SignatureThumbnail {
  id: string;
  name: string;
  status: string;
  imageUrls: { image_preview: string[] };
  no: string;
}

// ─── Document Section ─────────────────────────────────────────────────────────

function DocumentSection() {
  const { id: activeId } = useParams({ strict: false }) as { id?: string };
  const [search, setSearch] = useQueryState(
    'dq',
    parseAsString.withDefault('').withOptions({ shallow: false }),
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [sectionOpen, setSectionOpen] = useState(true);

  const {
    documentSortOrder: sortOrder,
    setDocumentSortOrder: setSortOrder,
    documentExpandedGroups: expandedGroups,
    setDocumentExpandedGroups: setExpandedGroups,
    addDocumentExpandedGroup: addExpandedGroup,
  } = useAppStore();

  const { data: documents, isLoading } = useQuery<DocumentThumbnail[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/v1/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as DocumentThumbnail[] | undefined;
      return data?.some((doc) => doc.status === 'processing') ? 2000 : false;
    },
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `http://localhost:3000/api/v1/documents/${id}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (activeId === id) navigate({ to: '/documents' });
      setDeleteTarget(null);
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('documentId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const groupedDocuments = useMemo(() => {
    if (!documents) return {};
    return documents.reduce(
      (acc, doc) => {
        const dateStr = new Date(doc.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(doc);
        return acc;
      },
      {} as Record<string, DocumentThumbnail[]>,
    );
  }, [documents]);

  const flatFilteredDocuments = useMemo(() => {
    if (!documents) return [];
    const sorted = [...documents].sort((a, b) => {
      const da = new Date(a.createdAt).getTime(),
        db = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? da - db : db - da;
    });
    return !search
      ? sorted
      : sorted.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [documents, search, sortOrder]);

  const filteredGroups = useMemo(() => {
    if (!documents) return {};
    const sortedKeys = Object.keys(groupedDocuments).sort(
      (a, b) =>
        sortOrder === 'asc'
          ? new Date(a).getTime() - new Date(b).getTime()
          : new Date(b).getTime() - new Date(a).getTime(),
    );
    const sorted: Record<string, DocumentThumbnail[]> = {};
    for (const key of sortedKeys) sorted[key] = groupedDocuments[key];
    return sorted;
  }, [groupedDocuments, sortOrder, documents]);

  useEffect(() => {
    if (activeId && documents) {
      const activeDoc = documents.find((d) => d.id === activeId);
      if (activeDoc) {
        const dateStr = new Date(activeDoc.createdAt).toLocaleDateString(
          undefined,
          { year: 'numeric', month: 'short', day: 'numeric' },
        );
        addExpandedGroup(dateStr);
      }
    }
  }, [activeId, documents, addExpandedGroup]);

  const renderDocLink = (doc: DocumentThumbnail) => (
    <div key={doc.id} className="relative group/item">
      <Link
        to="/documents/$id"
        params={{ id: doc.id }}
        draggable
        onDragStart={(e) => handleDragStart(e, doc.id)}
        className={cn(
          'h-10 flex items-center gap-3 p-2 pr-9 rounded-xl transition-all cursor-grab active:cursor-grabbing no-underline w-full',
          activeId === doc.id
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-primary/5 text-muted-foreground/60 hover:text-foreground',
        )}
      >
        <div className="w-8 h-6 rounded-md bg-background/50 border border-border/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {doc.status === 'processing' ? (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          ) : doc.status === 'failed' ? (
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-muted-foreground/50 group-hover/item:text-foreground transition-colors" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <span
            className="text-[11px] font-medium tracking-tight truncate opacity-70"
            title={doc.name}
          >
            {stripExtension(doc.name)}
          </span>
          {doc.status === 'processing' && (
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-primary/10">
              Parsing
            </span>
          )}
          {doc.status === 'failed' && (
            <span className="text-[9px] font-bold text-destructive uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-destructive/10">
              Error
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          setDeleteTarget({ id: doc.id, name: doc.name });
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover/item:opacity-100 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all"
        title="Delete document"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ''}
        itemType="document"
        isPending={deleteOne.isPending}
        onConfirm={() => deleteTarget && deleteOne.mutate(deleteTarget.id)}
      />

      <SidebarGroup className="p-0">
        <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
          {/* Section Header */}
          <div className="flex items-center justify-between px-4 py-3 group/section">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 flex-1 text-left group/trigger">
                <FileText className="w-3.5 h-3.5 text-primary/60 group-hover/trigger:text-primary transition-colors" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40 group-hover/trigger:text-muted-foreground/70 transition-colors">
                  Document Registry
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ml-auto mr-1',
                    sectionOpen && 'rotate-180',
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <Link
              to="/enroll-documents"
              className="p-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <CollapsibleContent>
            {/* Search + Sort */}
            <div className="flex items-center gap-2 px-3 pb-3">
              <div className="relative group flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full h-9 pl-9 pr-3 bg-accent/30 hover:bg-accent/50 focus:bg-background border border-transparent focus:border-primary/20 rounded-xl text-xs font-medium placeholder:text-muted-foreground/30 transition-all outline-none"
                />
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-9 h-9 rounded-xl bg-accent/30 hover:bg-accent/50 text-muted-foreground flex items-center justify-center transition-colors flex-shrink-0"
                title={sortOrder === 'asc' ? 'Newest First' : 'Oldest First'}
              >
                {sortOrder === 'asc' ? (
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpZA className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* List */}
            <SidebarGroupContent className="px-2 pb-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-xl bg-primary/5 animate-pulse mb-1 mx-1"
                  />
                ))
              ) : !documents || documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-50">
                  <FilePlus className="w-7 h-7 text-primary/40" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary text-center">
                    No documents yet
                  </p>
                </div>
              ) : search ? (
                flatFilteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-40">
                    <Search className="w-7 h-7 text-primary/40" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary text-center">
                      No results
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5 px-1">
                    {flatFilteredDocuments.map(renderDocLink)}
                  </div>
                )
              ) : (
                <Accordion
                  type="multiple"
                  value={expandedGroups}
                  onValueChange={setExpandedGroups}
                  className="w-full space-y-0.5 border-none"
                >
                  {Object.entries(filteredGroups).map(([dateStr, entries]) => (
                    <AccordionItem
                      value={dateStr}
                      key={dateStr}
                      className="border-none py-0 after:hidden before:hidden"
                    >
                      <AccordionTrigger className="no-underline hover:no-underline group/trigger py-2 px-3 rounded-xl hover:bg-accent/50 transition-all [&[data-state=open]>svg]:rotate-90 border-none">
                        <div className="flex items-center gap-2.5 w-full text-left">
                          <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover/trigger:bg-primary/10 transition-colors">
                            <Calendar className="w-3.5 h-3.5 text-primary/60 group-hover/trigger:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold tracking-tight text-foreground/90 truncate">
                              {dateStr}
                            </p>
                            <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-[0.05em]">
                              {entries.length} pages
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-1 pt-0.5 pl-2 space-y-0.5">
                        {entries.map(renderDocLink)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    </>
  );
}

// ─── Signature Section ────────────────────────────────────────────────────────

function SignatureSection() {
  const { id: activeId } = useParams({ strict: false }) as { id?: string };
  const [search, setSearch] = useQueryState(
    'sq',
    parseAsString.withDefault('').withOptions({ shallow: false }),
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [sectionOpen, setSectionOpen] = useState(true);

  const {
    signatureSortOrder: sortOrder,
    setSignatureSortOrder: setSortOrder,
    signatureExpandedGroups: expandedGroups,
    setSignatureExpandedGroups: setExpandedGroups,
    addSignatureExpandedGroup: addExpandedGroup,
  } = useAppStore();

  const { data: signatures, isLoading } = useQuery<SignatureThumbnail[]>({
    queryKey: ['signatures'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/v1/signatures');
      if (!response.ok) throw new Error('Failed to fetch signatures');
      return response.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as SignatureThumbnail[] | undefined;
      return data?.some((sig) => sig.status === 'processing') ? 2000 : false;
    },
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `http://localhost:3000/api/v1/signatures/${id}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['signatures'] });
      if (activeId === id) navigate({ to: '/signatures' });
      setDeleteTarget(null);
      toast.success('Signature deleted');
    },
    onError: () => toast.error('Failed to delete signature'),
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('signatureId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const groupedSignatures = useMemo(() => {
    if (!signatures) return {};
    return signatures.reduce(
      (acc, sig) => {
        if (!acc[sig.name]) acc[sig.name] = [];
        acc[sig.name].push(sig);
        return acc;
      },
      {} as Record<string, SignatureThumbnail[]>,
    );
  }, [signatures]);

  const filteredGroups = useMemo(() => {
    if (!signatures) return {};
    const sortedKeys = Object.keys(groupedSignatures).sort((a, b) => {
      const cmp = a.localeCompare(b);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    const sorted: Record<string, SignatureThumbnail[]> = {};
    for (const key of sortedKeys) {
      if (!search || key.toLowerCase().includes(search.toLowerCase())) {
        sorted[key] = groupedSignatures[key];
      }
    }
    return sorted;
  }, [groupedSignatures, search, sortOrder, signatures]);

  useEffect(() => {
    if (activeId && signatures) {
      const active = signatures.find((s) => s.id === activeId);
      if (active) addExpandedGroup(active.name);
    }
  }, [activeId, signatures, addExpandedGroup]);

  const renderSigLink = (sig: SignatureThumbnail) => (
    <div key={sig.id} className="relative group/item">
      <Link
        to="/signatures/$id"
        params={{ id: sig.id }}
        draggable
        onDragStart={(e) => handleDragStart(e, sig.id)}
        className={cn(
          'h-10 flex items-center gap-3 p-2 pr-9 rounded-xl transition-all cursor-grab active:cursor-grabbing no-underline w-full',
          activeId === sig.id
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-primary/5 text-muted-foreground/60 hover:text-foreground',
        )}
      >
        <div className="w-8 h-6 rounded-md bg-background/50 border border-border/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {sig.status === 'processing' ? (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          ) : sig.status === 'failed' ? (
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          ) : sig.imageUrls.image_preview?.[0] ? (
            <ImageWithSkeleton
              src={sig.imageUrls.image_preview[0]}
              alt={sig.name}
              className="w-full h-full object-contain p-1 invert dark:invert-0 opacity-40 group-hover/item:opacity-100 transition-opacity"
            />
          ) : (
            <Fingerprint className="w-3.5 h-3.5 text-muted-foreground/10" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-tight truncate opacity-70">
            SIGNATURE-{sig.no}
          </span>
          {sig.status === 'processing' && (
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-primary/10">
              Enrolling
            </span>
          )}
          {sig.status === 'failed' && (
            <span className="text-[9px] font-bold text-destructive uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-destructive/10">
              Error
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          setDeleteTarget({ id: sig.id, label: `SIGNATURE-${sig.no}` });
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover/item:opacity-100 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all"
        title="Delete signature"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        itemName={deleteTarget?.label ?? ''}
        itemType="signature"
        isPending={deleteOne.isPending}
        onConfirm={() => deleteTarget && deleteOne.mutate(deleteTarget.id)}
      />

      <SidebarGroup className="p-0">
        <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
          {/* Section Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 flex-1 text-left group/trigger">
                <Fingerprint className="w-3.5 h-3.5 text-primary/60 group-hover/trigger:text-primary transition-colors" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40 group-hover/trigger:text-muted-foreground/70 transition-colors">
                  Signature Registry
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ml-auto mr-1',
                    sectionOpen && 'rotate-180',
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <Link
              to="/enrollment"
              className="p-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <CollapsibleContent>
            {/* Search + Sort */}
            <div className="flex items-center gap-2 px-3 pb-3">
              <div className="relative group flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search signatures..."
                  className="w-full h-9 pl-9 pr-3 bg-accent/30 hover:bg-accent/50 focus:bg-background border border-transparent focus:border-primary/20 rounded-xl text-xs font-medium placeholder:text-muted-foreground/30 transition-all outline-none"
                />
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-9 h-9 rounded-xl bg-accent/30 hover:bg-accent/50 text-muted-foreground flex items-center justify-center transition-colors flex-shrink-0"
                title={sortOrder === 'asc' ? 'Sort Z to A' : 'Sort A to Z'}
              >
                {sortOrder === 'asc' ? (
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpZA className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* List */}
            <SidebarGroupContent className="px-2 pb-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-xl bg-primary/5 animate-pulse mb-1 mx-1"
                  />
                ))
              ) : !signatures || signatures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-50">
                  <UserPlus className="w-7 h-7 text-primary/40" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary text-center">
                    No signatures yet
                  </p>
                </div>
              ) : Object.keys(filteredGroups).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-40">
                  <Search className="w-7 h-7 text-primary/40" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary text-center">
                    No results
                  </p>
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  value={expandedGroups}
                  onValueChange={setExpandedGroups}
                  className="w-full space-y-0.5 border-none"
                >
                  {Object.entries(filteredGroups).map(([name, entries]) => (
                    <AccordionItem
                      value={name}
                      key={name}
                      className="border-none py-0 after:hidden before:hidden"
                    >
                      <AccordionTrigger className="no-underline hover:no-underline group/trigger py-2 px-3 rounded-xl hover:bg-accent/50 transition-all [&[data-state=open]>svg]:rotate-90 border-none">
                        <div className="flex items-center gap-2.5 w-full text-left">
                          <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover/trigger:bg-primary/10 transition-colors">
                            <FolderOpen className="w-3.5 h-3.5 text-primary/60 group-hover/trigger:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold tracking-tight text-foreground/90 truncate">
                              {name}
                            </p>
                            <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-[0.05em]">
                              {entries.length} samples
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-1 pt-0.5 pl-2 space-y-0.5">
                        {entries.map(renderSigLink)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    </>
  );
}

// ─── App Sidebar (Root) ───────────────────────────────────────────────────────

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border/40">
      {/* Brand Header */}
      <SidebarHeader className="px-5 py-4 border-b border-border/20">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group no-underline">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <img src='/logo.png' className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground/80 group-hover:text-primary transition-colors">
              Medcurial
            </span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Home Nav Item */}
        <Link
          to="/"
          className="mt-3 flex items-center gap-2.5 px-3 py-2 rounded-xl text-muted-foreground/60 hover:bg-primary/5 hover:text-primary transition-all no-underline group"
        >
          <Home className="w-4 h-4 group-hover:text-primary transition-colors" />
          <span className="text-xs font-semibold tracking-tight">Home</span>
        </Link>
      </SidebarHeader>

      {/* Registry Sections */}
      <SidebarContent className="py-2 gap-0">
        {/* Divider */}
        <div className="mx-4 my-1 h-px bg-border/30" />
        <DocumentSection />
        <div className="mx-4 my-1 h-px bg-border/30" />
        <SignatureSection />
      </SidebarContent>
    </Sidebar>
  );
}
