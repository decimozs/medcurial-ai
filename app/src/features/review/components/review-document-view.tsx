import { ZoomIn, ZoomOut, RotateCcw, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import React from "react"

interface ReviewDocumentViewProps {
  activeImageUrl?: string
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  handleResetView: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  isDragging: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUpOrLeave: () => void
}

export function ReviewDocumentView({
  activeImageUrl,
  zoom,
  setZoom,
  handleResetView,
  scrollRef,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUpOrLeave,
}: ReviewDocumentViewProps) {
  return (
    <div className="group/zoom relative flex flex-1 flex-col overflow-hidden">
      {/* Zoom controls (floating) */}
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

      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-auto bg-accent/5 p-12",
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <div className="flex min-h-full min-w-full items-center justify-center p-12">
          <div
            style={{ width: `${850 * zoom}px` }}
            className="m-auto transform overflow-hidden border border-border/40 bg-background shadow-2xl duration-200"
          >
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                className="pointer-events-none h-auto w-full"
                draggable={false}
                alt="Document for Review"
              />
            ) : (
              <div className="flex h-[1100px] flex-col items-center justify-center text-muted-foreground/10">
                <FileText className="h-32 w-32" />
                <p className="text-lg font-medium">
                  Original image unavailable
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
