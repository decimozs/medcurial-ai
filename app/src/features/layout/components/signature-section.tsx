import { Link } from "@tanstack/react-router"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
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
  ChevronDown,
  Trash2,
} from "lucide-react"
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ImageWithSkeleton } from "@/components/image-with-skeleton"
import { useSignatureSection } from "../hooks/use-signature-section"
import type { SignatureThumbnail } from "../types"

export function SignatureSection() {
  const {
    activeId,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    expandedGroups,
    setExpandedGroups,
    signatures,
    isLoading,
    deleteTarget,
    setDeleteTarget,
    deleteOne,
    sectionOpen,
    setSectionOpen,
    filteredGroups,
  } = useSignatureSection()

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("signatureId", id)
    e.dataTransfer.effectAllowed = "move"
  }

  const renderSigLink = (sig: SignatureThumbnail) => (
    <div key={sig.id} className="group/item relative">
      <Link
        to="/signatures/$id"
        params={{ id: sig.id }}
        draggable
        onDragStart={(e) => handleDragStart(e, sig.id)}
        className={cn(
          "flex h-10 w-full cursor-grab items-center gap-3 rounded-xl p-2 pr-9 no-underline transition-all active:cursor-grabbing",
          activeId === sig.id
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground/60 hover:bg-primary/5 hover:text-foreground"
        )}
      >
        <div className="flex h-6 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/40 bg-background/50">
          {sig.status === "processing" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : sig.status === "failed" ? (
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          ) : sig.imageUrls.image_preview?.[0] ? (
            <ImageWithSkeleton
              src={sig.imageUrls.image_preview[0]}
              alt={sig.name}
              className="h-full w-full object-contain p-1 opacity-40 invert transition-opacity group-hover/item:opacity-100 dark:invert-0"
            />
          ) : (
            <Fingerprint className="h-3.5 w-3.5 text-muted-foreground/10" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between">
          <span className="truncate text-[11px] font-medium tracking-tight opacity-70">
            SIGNATURE-{sig.no}
          </span>
          {sig.status === "processing" && (
            <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary uppercase">
              Enrolling
            </span>
          )}
          {sig.status === "failed" && (
            <span className="rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-destructive uppercase">
              Error
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault()
          setDeleteTarget({ id: sig.id, label: `SIGNATURE-${sig.no}` })
        }}
        className="absolute top-1/2 right-1 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/30 opacity-0 transition-all group-hover/item:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        title="Delete signature"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )

  return (
    <>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        itemName={deleteTarget?.label ?? ""}
        itemType="signature"
        isPending={deleteOne.isPending}
        onConfirm={() => deleteTarget && deleteOne.mutate(deleteTarget.id)}
      />

      <SidebarGroup className="p-0">
        <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
          <div className="flex items-center justify-between px-4 py-3">
            <CollapsibleTrigger asChild>
              <button className="group/trigger flex flex-1 items-center gap-2 text-left">
                <Fingerprint className="h-3.5 w-3.5 text-primary/60 transition-colors group-hover/trigger:text-primary" />
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground/40 uppercase transition-colors group-hover/trigger:text-muted-foreground/70">
                  Signature Registry
                </span>
                <ChevronDown
                  className={cn(
                    "mr-1 ml-auto h-3 w-3 text-muted-foreground/30 transition-transform duration-200",
                    sectionOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <Link
              to="/enrollment"
              className="flex-shrink-0 rounded-xl bg-primary/10 p-1.5 text-primary transition-all hover:bg-primary/20"
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>

          <CollapsibleContent>
            <div className="flex items-center gap-2 px-3 pb-3">
              <div className="group relative flex-1">
                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search signatures..."
                  className="h-9 w-full rounded-xl border border-transparent bg-accent/30 pr-3 pl-9 text-xs font-medium transition-all outline-none placeholder:text-muted-foreground/30 hover:bg-accent/50 focus:border-primary/20 focus:bg-background"
                />
              </div>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/30 text-muted-foreground transition-colors hover:bg-accent/50"
                title={sortOrder === "asc" ? "Sort Z to A" : "Sort A to Z"}
              >
                {sortOrder === "asc" ? (
                  <ArrowDownAZ className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUpZA className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <SidebarGroupContent className="px-2 pb-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="mx-1 mb-1 h-10 animate-pulse rounded-xl bg-primary/5"
                  />
                ))
              ) : !signatures || signatures.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-6 opacity-50">
                  <UserPlus className="h-7 w-7 text-primary/40" />
                  <p className="text-center text-[9px] font-black tracking-widest text-primary uppercase">
                    No signatures yet
                  </p>
                </div>
              ) : Object.keys(filteredGroups).length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-6 opacity-40">
                  <Search className="h-7 w-7 text-primary/40" />
                  <p className="text-center text-[9px] font-black tracking-widest text-primary uppercase">
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
                      className="border-none py-0 before:hidden after:hidden"
                    >
                      <AccordionTrigger className="group/trigger rounded-xl border-none px-3 py-2 no-underline transition-all hover:bg-accent/50 hover:no-underline [&[data-state=open]>svg]:rotate-90">
                        <div className="flex w-full items-center gap-2.5 text-left">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/5 transition-colors group-hover/trigger:bg-primary/10">
                            <FolderOpen className="h-3.5 w-3.5 text-primary/60 transition-colors group-hover/trigger:text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-semibold tracking-tight text-foreground/90">
                              {name}
                            </p>
                            <p className="text-[9px] font-medium tracking-[0.05em] text-muted-foreground/40 uppercase">
                              {entries.length} samples
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-0.5 pt-0.5 pb-1 pl-2">
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
  )
}
