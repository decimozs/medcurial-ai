import { Loader2, ZoomIn, ZoomOut, RotateCcw, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DocumentResponse, ViewMode } from "../types"

interface DocumentViewerProps {
  doc: DocumentResponse
  activeImageUrl?: string
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  handleResetView: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  isDragging: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUpOrLeave: () => void
  viewMode: ViewMode
}

export function DocumentViewer({
  doc,
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
}: DocumentViewerProps) {
  const isProcessing = doc.status === "processing"

  return (
    <div className="group/zoom relative flex-1 overflow-hidden">
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
        {/* A4 page scaled by zoom. Base width is 816px. */}
        <div
          style={{ width: `${816 * zoom}px` }}
          className="group relative mx-auto shrink-0 transition-all duration-200"
        >
          {/* Processing / Failed overlays */}
          {isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            </div>
          )}

          {activeImageUrl ? (
            <img
              src={activeImageUrl}
              alt={`${viewMode} view of document`}
              draggable={false}
              className="pointer-events-none block h-auto w-full transition-all duration-500 dark:brightness-[0.9] dark:group-hover:brightness-100"
            />
          ) : (
            <div className="flex h-[1123px] w-full items-center justify-center text-muted-foreground/10">
              <FileText className="h-32 w-32" />
            </div>
          )}
        </div>
      </div>

      {/* Zoom controls (floating) - NOW OUTSIDE SCROLLABLE AREA */}
      {!isProcessing && (
        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/40 bg-background/80 p-1.5 opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-300 group-hover/zoom:opacity-100">
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
