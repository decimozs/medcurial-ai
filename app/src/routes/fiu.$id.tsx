import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router"
import { useEffect, useMemo } from "react"
import {
  Loader2,
  AlertCircle,
  FileText,
  FileDigit,
  ScanFace,
  Download,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MetadataDialog } from "@/features/documents/components/metadata-dialog"
import { useClaimReview } from "@/features/review/hooks/use-claim-review"
import { ReviewHeader } from "@/features/review/components/review-header"
import { ReviewDocumentView } from "@/features/review/components/review-document-view"
import { ReviewConsole } from "@/features/review/components/review-console"
import { ReviewConfirmDialog } from "@/features/review/components/review-confirm-dialog"
import { useReviewPresence } from "@/features/review/hooks/use-review-presence"
import { useReviewFindings } from "@/features/review/hooks/use-review-findings"
import { stripExtension } from "@/lib/utils"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/fiu/$id")({
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (
      !session.data ||
      session.data.user.role !== "fraud-investigation-user"
    ) {
      throw redirect({
        to: "/tasks",
      })
    }
  },
  component: ClaimReviewPage,
})

function ClaimReviewPage() {
  const navigate = useNavigate()
  const { id } = Route.useParams()
  const review = useClaimReview(id)
  const session = authClient.useSession()

  // Realtime Presence & Findings
  const currentUser = useMemo(
    () =>
      session.data?.user
        ? {
            userId: session.data.user.id,
            name: session.data.user.name,
            image: session.data.user.image,
            role: session.data.user.role,
          }
        : null,
    [session.data]
  )

  const { onlineUsers } = useReviewPresence(id, currentUser)
  useReviewFindings(id)

  const {
    doc,
    isLoading,
    error,
    notes,
    setNotes,
    activeRightTab,
    setActiveRightTab,
    viewMode,
    setViewMode,
    zoom,
    setZoom,
    scrollRef,
    fraudPanelCollapsed,
    setFraudPanelCollapsed,
    isSendDialogOpen,
    setIsSendDialogOpen,
    metadataOpen,
    setMetadataOpen,
    confirmDialog,
    setConfirmDialog,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    handleResetView,
    activeImageUrl,
    approveMutation,
    rejectMutation,
    fiuDeterminationMutation,
    notifyMutation,
    addFindingMutation,
    users,
    handleConfirmAction,
  } = review

  useEffect(() => {
    if (doc && doc.approvalStatus !== "pending") {
      navigate({ to: "/documents/$id", params: { id: doc.id } })
    }
  }, [doc, navigate])

  const handleDownload = async () => {
    if (!activeImageUrl || !doc) return
    try {
      const response = await fetch(activeImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = `${stripExtension(doc.name)}-${viewMode}.png`
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed:", err)
      toast.error("Failed to download image")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading Claim for Review...
        </p>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-xl font-semibold">Claim Not Found</h2>
        <Button onClick={() => window.history.back()}>Return</Button>
      </div>
    )
  }

  const isCompleted = doc.status === "completed"

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <ReviewHeader
        doc={doc}
        isSendDialogOpen={isSendDialogOpen}
        setIsSendDialogOpen={setIsSendDialogOpen}
        users={users}
        notifyMutation={notifyMutation}
        onlineUsers={onlineUsers}
        subtitle="Fraud Investigation Unit"
      />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Side Tab Navigation */}
        {isCompleted && (
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
              disabled={!doc.imageUrls.text_extraction}
              onClick={() => setViewMode("text")}
              title="Text Nodes Analysis"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
                viewMode === "text"
                  ? "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
                  : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground",
                !doc.imageUrls.text_extraction &&
                  "cursor-not-allowed opacity-20 hover:bg-transparent hover:text-muted-foreground/50"
              )}
            >
              <FileDigit className="h-5 w-5" />
            </button>

            <button
              disabled={!doc.imageUrls.signature_extraction}
              onClick={() => setViewMode("signature")}
              title="Signature Extraction"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300",
                viewMode === "signature"
                  ? "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
                  : "border-transparent text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground",
                !doc.imageUrls.signature_extraction &&
                  "cursor-not-allowed opacity-20 hover:bg-transparent hover:text-muted-foreground/50"
              )}
            >
              <ScanFace className="h-5 w-5" />
            </button>

            <button
              onClick={handleDownload}
              title="Download Current View"
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
        )}

        <ReviewDocumentView
          activeImageUrl={activeImageUrl}
          zoom={zoom}
          setZoom={setZoom}
          handleResetView={handleResetView}
          scrollRef={scrollRef}
          isDragging={isDragging}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUpOrLeave={handleMouseUpOrLeave}
        />

        <ReviewConsole
          doc={doc}
          activeRightTab={activeRightTab}
          setActiveRightTab={setActiveRightTab}
          fraudPanelCollapsed={fraudPanelCollapsed}
          setFraudPanelCollapsed={setFraudPanelCollapsed}
          notes={notes}
          setNotes={setNotes}
          setConfirmDialog={setConfirmDialog}
          approveMutationPending={approveMutation.isPending}
          rejectMutationPending={rejectMutation.isPending}
          fiuMutationPending={fiuDeterminationMutation.isPending}
          addFindingMutation={addFindingMutation}
          showChatTab={true}
          unit="fiu"
        />
      </main>

      <MetadataDialog
        open={metadataOpen}
        onOpenChange={setMetadataOpen}
        document={doc}
      />

      <ReviewConfirmDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        handleConfirmAction={handleConfirmAction}
        isLoading={
          approveMutation.isPending ||
          rejectMutation.isPending ||
          fiuDeterminationMutation.isPending
        }
      />
    </div>
  )
}
