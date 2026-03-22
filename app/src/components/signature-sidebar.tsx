import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQueryState, parseAsString } from 'nuqs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  FolderOpen,
  Fingerprint,
  Loader2,
  AlertCircle,
  ArrowDownAZ,
  ArrowUpZA,
  UserPlus,
  Trash2,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SignatureThumbnail {
  id: string;
  name: string;
  status: string;
  imageUrls: { image_preview: string[] };
  no: string;
  updatedAt?: string;
}

export function SignatureSidebar() {
  const { id: activeId } = useParams({ strict: false }) as { id?: string };
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: false }));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const {
    signatureSortOrder: sortOrder,
    setSignatureSortOrder: setSortOrder,
    signatureExpandedGroups: expandedGroups,
    setSignatureExpandedGroups: setExpandedGroups,
    addSignatureExpandedGroup: addExpandedGroup
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
      return data?.some(sig => sig.status === 'processing') ? 2000 : false;
    },
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`http://localhost:3000/api/v1/signatures/${id}`, { method: 'DELETE' });
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
    return signatures.reduce((acc, sig) => {
      if (!acc[sig.name]) acc[sig.name] = [];
      acc[sig.name].push(sig);
      return acc;
    }, {} as Record<string, SignatureThumbnail[]>);
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
      const active = signatures.find(s => s.id === activeId);
      if (active) addExpandedGroup(active.name);
    }
  }, [activeId, signatures, addExpandedGroup]);

  const renderSigLink = (sig: SignatureThumbnail) => (
    <div key={sig.id} className="relative group/item grid grid-cols-[1fr_auto] items-center mb-0.5 overflow-hidden group-hover:bg-accent/30 rounded-xl transition-all">
      <Link
        to="/signatures/$id"
        params={{ id: sig.id }}
        draggable
        onDragStart={(e) => handleDragStart(e, sig.id)}
        className={cn(
          "flex flex-col gap-0.5 p-3 min-w-0 no-underline rounded-xl transition-all cursor-grab active:cursor-grabbing",
          activeId === sig.id
            ? "bg-primary/5 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-6 rounded-md bg-background/50 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center">
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
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-xs font-semibold truncate block">
              SIGNATURE-{sig.no}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] opacity-40">
              {sig.status === 'processing' ? (
                <span className="font-bold uppercase tracking-widest text-primary">Enrolling...</span>
              ) : (
                <>
                  <Clock className="w-2.5 h-2.5" />
                  <span className="truncate">ID: {sig.id.slice(0, 8)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className={cn(
        "px-2 transition-opacity shrink-0",
        activeId === sig.id ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl">
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg mx-1"
              onClick={() => setDeleteTarget({ id: sig.id, label: `SIGNATURE-${sig.no}` })}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs font-medium">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeId === sig.id && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
      )}
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

      <div className="flex flex-col h-full border-r border-border/40 bg-card/30 backdrop-blur-sm w-80">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground/80">Registry</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-8 w-8 rounded-full hover:bg-primary/5 text-muted-foreground/40 hover:text-primary flex items-center justify-center transition-all"
                title={sortOrder === 'asc' ? "Sort Z to A" : "Sort A to Z"}
              >
                {sortOrder === 'asc' ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpZA className="w-4 h-4" />}
              </button>
              <Link
                to="/enrollment"
                className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search signatories..."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-full bg-accent/30 border-none outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/30 transition-all font-medium"
            />
          </div>
        </div>

        <Separator className="opacity-40" />

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 pt-4">
            <div className="flex items-center px-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Collections</span>
            </div>

            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-primary/5 animate-pulse mb-2 mx-1 opacity-50" />
              ))
            ) : !signatures || signatures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 space-y-3 opacity-30 animate-in fade-in duration-700">
                <UserPlus className="w-10 h-10 text-primary/40" />
                <div className="space-y-1 text-center font-medium">
                  <p className="text-xs">No signatures found</p>
                  <p className="text-[10px]">Enroll a signatory to begin analysis</p>
                </div>
              </div>
            ) : Object.keys(filteredGroups).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 space-y-3 opacity-30 animate-in fade-in duration-500">
                <Search className="w-10 h-10 text-primary/40" />
                <p className="text-[10px] font-medium">No results match "{search}"</p>
                <button onClick={() => setSearch('')} className="text-[10px] text-primary hover:underline">Clear search</button>
              </div>
            ) : (
              <Accordion
                type="multiple"
                value={expandedGroups}
                onValueChange={setExpandedGroups}
                className="w-full space-y-1 border-none"
              >
                {Object.entries(filteredGroups).map(([name, entries]) => (
                  <AccordionItem value={name} key={name} className="border-none">
                    <AccordionTrigger className="no-underline hover:no-underline group/trigger py-1.5 px-1 transition-all [&[data-state=open]>svg]:rotate-90">
                      <div className="flex items-center gap-3 w-full text-left">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover/trigger:bg-primary/10 transition-colors">
                          <FolderOpen className="w-4 h-4 text-primary/40 group-hover/trigger:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold tracking-tight text-foreground/70 truncate group-hover/trigger:text-primary transition-colors">{name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">{entries.length} samples</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 pt-1.5 pl-0 space-y-1 border-none">
                      {entries.map(renderSigLink)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-accent/10">
          <Link
            to="/enrollment"
            className="flex items-center gap-2 h-10 w-full px-4 rounded-xl border border-border/40 bg-background/50 hover:bg-primary/5 hover:text-primary transition-all text-xs font-semibold"
          >
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </div>
            Enroll Signatory
          </Link>
        </div>
      </div>
    </>
  );
}
