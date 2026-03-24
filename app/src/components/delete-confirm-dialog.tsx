import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn, stripExtension } from "@/lib/utils"
import { Loader2, ShieldAlert } from "lucide-react"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Name displayed in the prompt and that the user must type */
  itemName: string
  /** Count of items when doing a batch delete. Omit for single. */
  itemCount?: number
  isPending?: boolean
  onConfirm: () => void
  /** Describes the type of item, e.g. "signature", "document" */
  itemType?: string
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName: rawItemName,
  itemCount,
  isPending,
  onConfirm,
  itemType = "item",
}: DeleteConfirmDialogProps) {
  const itemName = stripExtension(rawItemName)
  const [value, setValue] = useState("")

  const isBatch = typeof itemCount === "number" && itemCount > 1
  const confirmPhrase = isBatch ? `delete ${itemCount} ${itemType}s` : itemName
  const isMatch = value.trim() === confirmPhrase

  function handleOpenChange(next: boolean) {
    if (!next) setValue("")
    onOpenChange(next)
  }

  function handleConfirm() {
    if (!isMatch || isPending) return
    onConfirm()
    setValue("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-border/40 bg-background/95 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {isBatch
                  ? `Delete ${itemCount} ${itemType}s?`
                  : `Delete ${itemType}?`}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground/70">
                This action is{" "}
                <span className="font-bold text-destructive">permanent</span>{" "}
                and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isBatch && (
            <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
              <p className="mb-0.5 text-[11px] font-medium text-muted-foreground/60">
                Item
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {itemName}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              Type{" "}
              <span className="font-mono text-destructive/80 select-all">
                {confirmPhrase}
              </span>{" "}
              to confirm
            </label>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder={confirmPhrase}
              className={cn(
                "h-10 w-full rounded-xl border bg-background px-4 text-sm font-medium transition-all outline-none",
                isMatch
                  ? "border-destructive/50 text-destructive focus:ring-1 focus:ring-destructive/30"
                  : "border-border/40 focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
              )}
            />
            {value.length > 0 && !isMatch && (
              <p className="text-[10px] font-medium text-destructive/60">
                Phrase doesn't match — keep typing
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => handleOpenChange(false)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-accent/50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMatch || isPending}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all",
              isMatch && !isPending
                ? "bg-destructive text-white shadow-sm shadow-destructive/20 hover:bg-destructive/90"
                : "cursor-not-allowed bg-destructive/20 text-destructive/40"
            )}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isBatch
              ? `Delete ${itemCount} ${itemType}s`
              : `Delete ${itemType}`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
