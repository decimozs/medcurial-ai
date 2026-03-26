import { FileText, FileDigit, ScanFace, Binary, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

export type SignatureViewMode =
  | "original"
  | "roi"
  | "normalized"
  | "preview"
  | "grid"

interface SignatureNavigationProps {
  viewMode: SignatureViewMode
  setViewMode: (mode: SignatureViewMode) => void
  hasRoi: boolean
  hasNormalized: boolean
  hasPreview: boolean
}

export function SignatureNavigation({
  viewMode,
  setViewMode,
  hasRoi,
  hasNormalized,
  hasPreview,
}: SignatureNavigationProps) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-3 border-r border-border/40 bg-background/40 py-6">
      <button
        onClick={() => setViewMode("original")}
        title="Original View"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
          viewMode === "original"
            ? "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
            : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <FileText className="h-5 w-5" />
      </button>

      <button
        disabled={!hasRoi}
        onClick={() => setViewMode("roi")}
        title="Region of Interest (ROI)"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
          viewMode === "roi"
            ? "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
            : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground",
          !hasRoi && "cursor-not-allowed opacity-20"
        )}
      >
        <FileDigit className="h-5 w-5" />
      </button>

      <button
        disabled={!hasNormalized}
        onClick={() => setViewMode("normalized")}
        title="Normalized Signature"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
          viewMode === "normalized"
            ? "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
            : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground",
          !hasNormalized && "cursor-not-allowed opacity-20"
        )}
      >
        <ScanFace className="h-5 w-5" />
      </button>

      <button
        disabled={!hasPreview}
        onClick={() => setViewMode("preview")}
        title="Neural Matrix Preview"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
          viewMode === "preview"
            ? "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
            : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground",
          !hasPreview && "cursor-not-allowed opacity-20"
        )}
      >
        <Binary className="h-5 w-5" />
      </button>

      <div className="my-2 h-px w-full bg-border/20" />

      <button
        onClick={() => setViewMode("grid")}
        title="2x2 Grid View"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
          viewMode === "grid"
            ? "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
            : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
    </div>
  )
}
