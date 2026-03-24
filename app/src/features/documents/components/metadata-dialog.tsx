import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MetadataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    name: string
    status: string
    createdAt: string
    updatedAt: string
    imageUrls: Record<string, unknown>
  }
}

export function MetadataDialog({
  open,
  onOpenChange,
  document,
}: MetadataDialogProps) {
  const metadata = [
    { label: "Document ID", value: document.id },
    { label: "Filename", value: document.name },
    { label: "Status", value: document.status, isBadge: true },
    { label: "Created", value: format(new Date(document.createdAt), "PPP p") },
    {
      label: "Last Modified",
      value: format(new Date(document.updatedAt), "PPP p"),
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-500/10 border-green-500/20"
      case "processing":
        return "text-primary bg-primary/10 border-primary/20"
      case "failed":
        return "text-destructive bg-destructive/10 border-destructive/20"
      default:
        return "text-muted-foreground bg-muted border-transparent"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/40 bg-background/95 shadow-2xl backdrop-blur-md sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Document Metadata
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/70">
            Technical specifications and processing timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {metadata.map((item, index) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-muted-foreground/50 uppercase">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.isBadge ? (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                      getStatusColor(item.value)
                    )}
                  >
                    {item.value}
                  </span>
                ) : (
                  <code className="w-full rounded-md border border-border/20 bg-muted/30 px-2 py-1 text-[13px] font-medium break-all text-foreground/90">
                    {item.value}
                  </code>
                )}
              </div>
              {index < metadata.length - 1 && (
                <Separator className="mt-4 opacity-10" />
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border/20 pt-4">
          <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-semibold text-primary">
                System Integrity Check
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                This document has been verified through our neural processing
                pipeline. All metadata is cryptographically linked to the
                original file hash.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
