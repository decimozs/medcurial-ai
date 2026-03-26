import { createFileRoute } from "@tanstack/react-router"
import { Loader2, AlertCircle } from "lucide-react"
import { useSignatureDetails } from "@/features/signatures/hooks/use-signature-details"
import { SignatureHeader } from "@/features/signatures/components/signature-header"
import { SignatureNavigation } from "@/features/signatures/components/signature-navigation"
import { SignatureViewer } from "@/features/signatures/components/signature-viewer"
import { SignatureSidePanel } from "@/features/signatures/components/signature-side-panel"

export const Route = createFileRoute("/signatures/$id")({
  component: SignatureDetail,
})

function SignatureDetail() {
  const { id } = Route.useParams()
  const {
    signature,
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
    activeImageUrl,
  } = useSignatureDetails(id)

  if (isLoading) {
    return (
      <div className="flex flex-1 animate-in flex-col items-center justify-center space-y-4 p-12 duration-500 fade-in">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="animate-pulse text-sm font-medium text-muted-foreground">
          Loading registry files...
        </p>
      </div>
    )
  }

  if (error || !signature) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-12 text-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Identity Not Found</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          The signature identification you are looking for might have been
          purged or relocated.
        </p>
      </div>
    )
  }

  const hasRoi = signature.imageUrls.roi.length > 0
  const hasNormalized = signature.imageUrls.normalized.length > 0
  const hasPreview = signature.imageUrls.image_preview.length > 0

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <SignatureHeader signature={signature} isFetching={isFetching} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <SignatureNavigation
          viewMode={viewMode}
          setViewMode={setViewMode}
          hasRoi={hasRoi}
          hasNormalized={hasNormalized}
          hasPreview={hasPreview}
        />

        <SignatureViewer
          signature={signature}
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

        <SignatureSidePanel signature={signature} />
      </div>
    </div>
  )
}

export { SignatureDetail }
