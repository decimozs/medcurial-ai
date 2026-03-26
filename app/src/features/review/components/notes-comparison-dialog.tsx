import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NotesComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalNotes: string
  enhancedNotes: string
  onAccept: (notes: string) => void
}

export function NotesComparisonDialog({
  open,
  onOpenChange,
  originalNotes,
  enhancedNotes,
  onAccept,
}: NotesComparisonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Review AI Enhancements</DialogTitle>
          <DialogDescription>
            The Medcurial AI has rewritten your notes for professional clarity.
            Compare the original versus the enhanced version carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 grid min-h-0 flex-1 grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <h3 className="ml-1 text-xs font-bold tracking-widest text-muted-foreground/60 uppercase">
              Original Notes
            </h3>
            <ScrollArea className="flex-1 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive/80">
              {originalNotes || "No notes provided"}
            </ScrollArea>
          </div>

          <div className="flex flex-col space-y-2">
            <h3 className="ml-1 text-xs font-bold tracking-widest text-primary/80 uppercase">
              Enhanced Version
            </h3>
            <ScrollArea className="flex-1 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
              {enhancedNotes}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Discard Changes
          </Button>
          <Button
            onClick={() => onAccept(enhancedNotes)}
            className="bg-primary text-primary-foreground"
          >
            <Check className="mr-2 h-4 w-4" />
            Replace Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
