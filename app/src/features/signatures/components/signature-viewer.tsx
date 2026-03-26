import { Loader2, ZoomIn, ZoomOut, RotateCcw, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface SignatureViewerProps {
  signature: {
    status: string
    imageUrls: {
      original: string[]
      roi: string[]
      normalized: string[]
      image_preview: string[]
    }
  }
  activeImageUrl?: string
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  handleResetView: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  isDragging: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUpOrLeave: () => void
  viewMode: string
}

export function SignatureViewer({
  signature,
  activeImageUrl,
  zoom,
  setZoom,
  handleResetView,
  scrollRef,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUpOrLeave,
  viewMode,
}: SignatureViewerProps) {
  const isProcessing = signature.status === "processing"

  return (
    <div className="group/zoom relative flex-1 overflow-hidden bg-accent/5">
      <div
        ref={scrollRef}
        className={cn(
          "h-full w-full overflow-auto p-8 md:p-12",
          !isProcessing &&
            (isDragging ? "cursor-grabbing select-none" : "cursor-grab")
        )}
        onMouseDown={!isProcessing ? handleMouseDown : undefined}
        onMouseMove={!isProcessing ? handleMouseMove : undefined}
        onMouseUp={!isProcessing ? handleMouseUpOrLeave : undefined}
        onMouseLeave={!isProcessing ? handleMouseUpOrLeave : undefined}
      >
        <div
          style={{
            width: viewMode === "grid" ? "100%" : `${100 * zoom}%`,
            maxWidth: zoom > 1 && viewMode !== "grid" ? "none" : "100%",
            minHeight: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="mx-auto shrink-0 transition-all duration-200"
        >
          {isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="animate-pulse text-sm font-medium text-muted-foreground">
                Neural Assets Enrolling...
              </p>
            </div>
          )}

          {viewMode === "grid" && signature && !isProcessing ? (
            <div className="grid w-full grid-cols-2 gap-4 p-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                  Original
                </span>
                <div className="aspect-video rounded-md border border-border/40 bg-white p-4 shadow-sm dark:bg-black/40">
                  <img
                    src={signature.imageUrls.original[0]}
                    className="h-full w-full object-contain"
                    alt="Original"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                  ROI
                </span>
                <div className="aspect-video rounded-md border border-border/40 bg-white p-4 shadow-sm dark:bg-black/40">
                  <img
                    src={
                      signature.imageUrls.roi[0] ||
                      signature.imageUrls.original[0]
                    }
                    className="h-full w-full object-contain"
                    alt="ROI"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                  Normalized
                </span>
                <div className="aspect-video rounded-md border border-border/40 bg-black p-4 shadow-sm">
                  <img
                    src={
                      signature.imageUrls.normalized[0] ||
                      signature.imageUrls.original[0]
                    }
                    className="h-full w-full object-contain"
                    alt="Normalized"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                  Neural Matrix
                </span>
                <div className="aspect-video rounded-md border border-border/40 bg-white p-4 shadow-sm dark:bg-black/40">
                  <img
                    src={
                      signature.imageUrls.image_preview[0] ||
                      signature.imageUrls.original[0]
                    }
                    className="h-full w-full object-contain"
                    alt="Neural Matrix"
                  />
                </div>
              </div>
            </div>
          ) : activeImageUrl ? (
            <div
              className={cn(
                "relative rounded-md border border-border/40 bg-white p-4 shadow-2xl transition-all duration-500 dark:bg-black/40",
                viewMode === "normalized" && "bg-black p-8",
                viewMode === "preview" && "bg-white p-2"
              )}
            >
              <img
                src={activeImageUrl}
                alt={`${viewMode} view of signature`}
                draggable={false}
                className="pointer-events-none block h-auto max-w-full transition-all duration-500"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground/10">
              <ShieldCheck className="h-32 w-32" />
              <p className="text-xl font-bold tracking-tighter uppercase opacity-20">
                No Stage Selected
              </p>
            </div>
          )}
        </div>
      </div>

      {!isProcessing && viewMode !== "grid" && (
        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/40 bg-background/80 p-1.5 opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-300 group-hover/zoom:opacity-100 hover:bg-background">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetView}
            className="flex h-8 w-16 items-center justify-center rounded-full px-2 text-[11px] font-semibold text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border/40" />

          <button
            onClick={handleResetView}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            title="Reset View"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
