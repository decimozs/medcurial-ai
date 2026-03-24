import { Link, useNavigate } from "@tanstack/react-router"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn, stripExtension } from "@/lib/utils"
import {
  Search,
  Plus,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  ArrowDownAZ,
  ArrowUpZA,
  FilePlus,
  Trash2,
  MoreHorizontal,
  Clock,
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react"
import { useDocuments } from "../hooks/use-documents"
import type { DocumentThumbnail } from "../hooks/use-documents"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DocumentSidebar() {
  const navigate = useNavigate()
  const {
    activeId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    expandedGroups,
    setExpandedGroups,
    documents,
    isLoading,
    deleteTarget,
    setDeleteTarget,
    deleteOne,
    flatFilteredDocuments,
    groupedDocuments,
  } = useDocuments()

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("documentId", id)
    e.dataTransfer.effectAllowed = "move"
  }

  const renderDocLink = (doc: DocumentThumbnail) => (
    <div
      key={doc.id}
      className="group/item relative mb-0.5 grid grid-cols-[1fr_auto] items-center overflow-hidden rounded-xl transition-all group-hover:bg-accent/30"
    >
      <Link
        to="/documents/$id"
        params={{ id: doc.id }}
        draggable
        onDragStart={(e) => handleDragStart(e, doc.id)}
        className={cn(
          "flex min-w-0 cursor-grab flex-col gap-0.5 rounded-xl p-3 no-underline transition-all active:cursor-grabbing",
          activeId === doc.id
            ? "bg-primary/5 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-background/50 transition-all group-hover/item:border-primary/20">
            {doc.status === "processing" ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : doc.status === "failed" ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover/item:text-primary" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="block truncate text-xs font-semibold">
              {stripExtension(doc.name)}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] opacity-40">
              {doc.status === "processing" ? (
                <span className="font-bold tracking-widest text-primary uppercase">
                  {!doc.extractedText ? "Initializing..." : "Analyzing..."}
                </span>
              ) : (
                <>
                  <Clock className="h-2.5 w-2.5" />
                  <span className="truncate">
                    {new Date(doc.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div
        className={cn(
          "shrink-0 px-2 transition-opacity",
          activeId === doc.id
            ? "opacity-100"
            : "opacity-0 group-hover/item:opacity-100"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-primary/10">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl">
            <DropdownMenuItem
              className="mx-1 cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs font-medium">Delete</span>
            </DropdownMenuItem>
            {doc.status === "completed" && doc.approvalStatus === "pending" && (
              <DropdownMenuItem
                className="mx-1 cursor-pointer rounded-lg focus:bg-primary/10"
                onClick={() => {
                  const isFlagged =
                    doc.fraudAnalysis?.auditor_response
                      ?.is_flagged_for_review === true
                  navigate({
                    to: isFlagged ? "/fiu/$id" : "/cap/$id",
                    params: { id: doc.id },
                  })
                }}
              >
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                <span className="text-xs font-medium">Review Claim</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeId === doc.id && (
        <div className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
    </div>
  )

  return (
    <>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ""}
        itemType="document"
        isPending={deleteOne.isPending}
        onConfirm={() => deleteTarget && deleteOne.mutate(deleteTarget.id)}
      />

      <div className="flex h-full w-80 flex-col border-r border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground/80">
                Documents
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/40 transition-all hover:bg-primary/5 hover:text-primary"
                title={sortOrder === "asc" ? "Newest First" : "Oldest First"}
              >
                {sortOrder === "asc" ? (
                  <ArrowDownAZ className="h-4 w-4" />
                ) : (
                  <ArrowUpZA className="h-4 w-4" />
                )}
              </button>
              <Link
                to="/enroll-documents"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary/20"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="group/search relative flex-1">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30 transition-colors group-focus-within/search:text-primary" />
              <input
                value={search || ""}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents or status..."
                className="h-9 w-full rounded-full border-none bg-accent/30 pr-3 pl-8 text-xs font-medium transition-all outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full border border-border/5 transition-all",
                    statusFilter !== "all"
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "text-muted-foreground/40 hover:bg-accent/50"
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl border-border/40 p-1 shadow-xl backdrop-blur-md"
              >
                <DropdownMenuItem
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg text-[11px] font-semibold",
                    statusFilter === "all" && "bg-primary/10 text-primary"
                  )}
                >
                  All Documents
                </DropdownMenuItem>
                <Separator className="my-1 opacity-50" />
                <DropdownMenuItem
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg text-[11px] font-semibold",
                    statusFilter === "pending" && "bg-primary/10 text-primary"
                  )}
                >
                  <HelpCircle className="h-3 w-3" /> Pending Review
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("approved")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg text-[11px] font-semibold",
                    statusFilter === "approved" && "bg-primary/10 text-primary"
                  )}
                >
                  <CheckCircle2 className="h-3 w-3" /> Approved
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("rejected")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg text-[11px] font-semibold",
                    statusFilter === "rejected" && "bg-primary/10 text-primary"
                  )}
                >
                  <XCircle className="h-3 w-3" /> Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator className="opacity-40" />

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-3 pt-4">
            <div className="mb-3 flex items-center px-2">
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                {search ? "Search Results" : "History"}
              </span>
            </div>

            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="mx-1 mb-2 h-12 animate-pulse rounded-xl bg-primary/5 opacity-50"
                />
              ))
            ) : !documents || documents.length === 0 ? (
              <div className="flex animate-in flex-col items-center justify-center space-y-3 px-4 py-16 opacity-30 duration-700 fade-in">
                <FilePlus className="h-10 w-10 text-primary/40" />
                <div className="space-y-1 text-center font-medium">
                  <p className="text-xs">No documents found</p>
                  <p className="text-[10px]">
                    Upload a document to begin analysis
                  </p>
                </div>
              </div>
            ) : search ? (
              <div className="space-y-1">
                {flatFilteredDocuments.length === 0 ? (
                  <div className="py-10 text-center opacity-30">
                    <p className="text-[10px] font-medium">
                      No results match "{search}"
                    </p>
                  </div>
                ) : (
                  flatFilteredDocuments.map(renderDocLink)
                )}
              </div>
            ) : (
              <Accordion
                type="multiple"
                value={expandedGroups}
                onValueChange={setExpandedGroups}
                className="w-full space-y-1 border-none"
              >
                {Object.entries(groupedDocuments).map(([dateStr, entries]) => (
                  <AccordionItem
                    value={dateStr}
                    key={dateStr}
                    className="border-none"
                  >
                    <AccordionTrigger className="group/trigger px-1 py-1.5 no-underline transition-all hover:no-underline [&[data-state=open]>svg]:rotate-90">
                      <div className="flex w-full items-center gap-3 text-left">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors group-hover/trigger:bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary/40 transition-colors group-hover/trigger:text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold tracking-tight text-foreground/70 transition-colors group-hover/trigger:text-primary">
                            {dateStr}
                          </p>
                          <p className="text-[9px] font-bold tracking-widest text-muted-foreground/20 uppercase">
                            {entries.length} items
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1 border-none pt-1.5 pb-2 pl-0">
                      {entries.map(renderDocLink)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>

        <div className="bg-accent/10 p-4">
          <Link
            to="/enroll-documents"
            className="flex h-10 w-full items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-4 text-xs font-semibold transition-all hover:bg-primary/5 hover:text-primary"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
              <Plus className="h-3 w-3" />
            </div>
            Process Document
          </Link>
        </div>
      </div>
    </>
  )
}
