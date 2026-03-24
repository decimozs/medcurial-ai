import { Link } from "@tanstack/react-router"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Search,
  Plus,
  FolderOpen,
  Fingerprint,
  ArrowDownAZ,
  ArrowUpZA,
  UserPlus,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useSignatures } from "../hooks/use-signatures"
import { SignatureItem } from "./signature-item"
import type { SignatureThumbnail } from "../types"

export function SignatureSidebar() {
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
    filteredGroups,
    deleteTarget,
    setDeleteTarget,
    deleteOne,
  } = useSignatures()

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

      <div className="flex h-full w-80 flex-col border-r border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Fingerprint className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground/80">
                Registry
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/40 transition-all hover:bg-primary/5 hover:text-primary"
                title={sortOrder === "asc" ? "Sort Z to A" : "Sort A to Z"}
              >
                {sortOrder === "asc" ? (
                  <ArrowDownAZ className="h-4 w-4" />
                ) : (
                  <ArrowUpZA className="h-4 w-4" />
                )}
              </button>
              <Link
                to="/enrollment"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary/20"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search signatories..."
              className="h-9 w-full rounded-full border-none bg-accent/30 pr-3 pl-8 text-xs font-medium transition-all outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        <Separator className="opacity-40" />

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-3 pt-4">
            <div className="mb-3 flex items-center px-2">
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                Collections
              </span>
            </div>

            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="mx-1 mb-2 h-12 animate-pulse rounded-xl bg-primary/5 opacity-50"
                />
              ))
            ) : !signatures || signatures.length === 0 ? (
              <div className="flex animate-in flex-col items-center justify-center space-y-3 px-4 py-16 opacity-30 duration-700 fade-in">
                <UserPlus className="h-10 w-10 text-primary/40" />
                <div className="space-y-1 text-center font-medium">
                  <p className="text-xs">No signatures found</p>
                  <p className="text-[10px]">
                    Enroll a signatory to begin analysis
                  </p>
                </div>
              </div>
            ) : Object.keys(filteredGroups).length === 0 ? (
              <div className="flex animate-in flex-col items-center justify-center space-y-3 px-4 py-16 opacity-30 duration-500 fade-in">
                <Search className="h-10 w-10 text-primary/40" />
                <p className="text-[10px] font-medium">
                  No results match "{search}"
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="text-[10px] text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <Accordion
                type="multiple"
                value={expandedGroups}
                onValueChange={setExpandedGroups}
                className="w-full space-y-1 border-none"
              >
                {(
                  Object.entries(filteredGroups) as [
                    string,
                    SignatureThumbnail[],
                  ][]
                ).map(([name, entries]) => (
                  <AccordionItem
                    value={name}
                    key={name}
                    className="border-none"
                  >
                    <AccordionTrigger className="group/trigger px-1 py-1.5 no-underline transition-all hover:no-underline [&[data-state=open]>svg]:rotate-90">
                      <div className="flex w-full items-center gap-3 text-left">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors group-hover/trigger:bg-primary/10">
                          <FolderOpen className="h-4 w-4 text-primary/40 transition-colors group-hover/trigger:text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold tracking-tight text-foreground/70 transition-colors group-hover/trigger:text-primary">
                            {name}
                          </p>
                          <p className="text-[9px] font-bold tracking-widest text-muted-foreground/20 uppercase">
                            {entries.length} samples
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1 border-none pt-1.5 pb-2 pl-0">
                      {entries.map((sig) => (
                        <SignatureItem
                          key={sig.id}
                          sig={sig}
                          activeId={activeId}
                          setDeleteTarget={setDeleteTarget}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>

        <div className="bg-accent/10 p-4">
          <Link
            to="/enrollment"
            className="flex h-10 w-full items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-4 text-xs font-semibold transition-all hover:bg-primary/5 hover:text-primary"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
              <Plus className="h-3 w-3" />
            </div>
            Enroll Signatory
          </Link>
        </div>
      </div>
    </>
  )
}
