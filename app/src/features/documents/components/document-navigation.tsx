import { FileText, FileDigit, ScanFace, Download, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import type { DocumentResponse, ViewMode } from "../types"

interface DocumentNavigationProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  doc: DocumentResponse
  handleDownload: () => void
  setMetadataOpen: (open: boolean) => void
}

export function DocumentNavigation({
  viewMode,
  setViewMode,
  doc,
  handleDownload,
  setMetadataOpen,
}: DocumentNavigationProps) {
  const isProcessing = doc.status === "processing"

  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-3 border-r border-border/40 bg-background/40 py-6">
      <button
        onClick={() => setViewMode("original")}
        title="Original View"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
          viewMode === "original"
            ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <FileText className="h-5 w-5" />
      </button>

      <button
        disabled={isProcessing || !doc.imageUrls.text_extraction}
        onClick={() => setViewMode("text")}
        title="Text Nodes Analysis"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
          viewMode === "text"
            ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground",
          (isProcessing || !doc.imageUrls.text_extraction) &&
            "cursor-not-allowed opacity-20 hover:bg-transparent hover:text-muted-foreground/50"
        )}
      >
        <FileDigit className="h-5 w-5" />
      </button>

      <button
        disabled={
          isProcessing ||
          !(doc.imageUrls.signature_crop || doc.imageUrls.signature_extraction)
        }
        onClick={() => setViewMode("signature")}
        title="Signature Extraction"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
          viewMode === "signature"
            ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground",
          (isProcessing ||
            !(
              doc.imageUrls.signature_crop || doc.imageUrls.signature_extraction
            )) &&
            "cursor-not-allowed opacity-20 hover:bg-transparent hover:text-muted-foreground/50"
        )}
      >
        <ScanFace className="h-5 w-5" />
      </button>

      <button
        onClick={handleDownload}
        title="Download Image"
        className="flex h-10 w-10 items-center justify-center rounded-md border-transparent text-muted-foreground/50 transition-all duration-300 hover:bg-muted/60 hover:text-foreground"
      >
        <Download className="h-5 w-5" />
      </button>

      <Separator className="w-8 bg-border/40" />

      <button
        onClick={() => setMetadataOpen(true)}
        title="Document Metadata"
        className="flex h-10 w-10 items-center justify-center rounded-md border-transparent text-muted-foreground/50 transition-all duration-300 hover:bg-muted/60 hover:text-foreground"
      >
        <Info className="h-5 w-5" />
      </button>
    </div>
  )
}
