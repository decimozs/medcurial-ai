import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { useDocumentDetails } from "@/features/documents/hooks/use-document-details"
import { DocumentHeader } from "@/features/documents/components/document-header"
import { DocumentNavigation } from "@/features/documents/components/document-navigation"
import { DocumentViewer } from "@/features/documents/components/document-viewer"
import { DocumentSidePanel } from "@/features/documents/components/document-side-panel"
import { MetadataDialog } from "@/features/documents/components/metadata-dialog"

export const Route = createFileRoute("/documents/$id")({
  component: DocumentDetailsPage,
})

function DocumentDetailsPage() {
  const { id } = Route.useParams()
  const [metadataOpen, setMetadataOpen] = useState(false)

  const {
    doc,
    isLoading,
    error,
    isFetching,
    viewMode,
    setViewMode,
    zoom,
    setZoom,
    scrollRef,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    handleResetView,
    handleDownload,
    isRetrying,
    handleRetryAnalysis,
    activeImageUrl,
  } = useDocumentDetails(id)

  if (isLoading) {
    return (
      <div className="flex flex-1 animate-in flex-col items-center justify-center space-y-4 p-12 duration-500 fade-in">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="animate-pulse text-sm font-medium text-muted-foreground">
          Loading document details...
        </p>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-12 text-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Document Not Found</h2>
        <p className="max-w-sm text-muted-foreground">
          The document you are looking for might have been deleted or moved.
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <DocumentHeader doc={doc} isFetching={isFetching} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <DocumentNavigation
          viewMode={viewMode}
          setViewMode={setViewMode}
          doc={doc}
          handleDownload={handleDownload}
          setMetadataOpen={setMetadataOpen}
        />

        <DocumentViewer
          doc={doc}
          activeImageUrl={activeImageUrl}
          zoom={zoom}
          setZoom={setZoom}
          handleResetView={handleResetView}
          scrollRef={scrollRef}
          isDragging={isDragging}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUpOrLeave={handleMouseUpOrLeave}
          viewMode={viewMode}
        />

        <DocumentSidePanel
          doc={doc}
          handleRetryAnalysis={handleRetryAnalysis}
          isRetrying={isRetrying}
        />
      </div>

      <MetadataDialog
        open={metadataOpen}
        onOpenChange={setMetadataOpen}
        document={doc}
      />
    </div>
  )
}
