import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldQuestion,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { stripExtension } from "@/lib/utils"
import type { DocumentResponse } from "../types"
import { useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { Info } from "lucide-react"

interface DocumentHeaderProps {
  doc: DocumentResponse
  isFetching: boolean
}

export function DocumentHeader({ doc, isFetching }: DocumentHeaderProps) {
  const navigate = useNavigate()
  const session = authClient.useSession()
  const userRole = session.data?.user?.role

  const isFlagged =
    doc.fraudAnalysis?.auditor_response?.is_flagged_for_review === true
  const isInvestigationPending = isFlagged && doc.fiuStatus === "pending"

  // Role Helpers
  const isApprover = userRole === "claims-approval-user"
  const isInvestigator = userRole === "fraud-investigation-user"

  // UI Helpers
  const canApproverReview = isApprover && !isInvestigationPending
  const canInvestigatorReview = isInvestigator && isInvestigationPending
  const isProcessing = doc.status === "processing"
  const isFailed = doc.status === "failed"

  return (
    <div className="sticky top-0 z-20 flex w-full shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-6 py-3 shadow-sm backdrop-blur-md dark:bg-sidebar/80">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border-primary/20 bg-primary/10 transition-transform hover:scale-105">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-0.5">
          <h1
            className="max-w-[500px] truncate text-lg font-medium tracking-tight text-foreground/90"
            title={doc.name}
          >
            {stripExtension(doc.name)}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-muted-foreground/50">
              Document ID: {doc.id}
            </span>
            {isProcessing && (
              <span className="flex items-center gap-1.5 rounded-sm border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> Processing
              </span>
            )}
            {isFailed && (
              <span className="flex items-center gap-1.5 rounded-sm border border-destructive/10 bg-destructive/5 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                <AlertCircle className="h-3 w-3" /> Error
              </span>
            )}
            {doc.status === "completed" && (
              <span className="rounded-sm border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-500">
                Verified
              </span>
            )}
            {doc.approvalStatus === "approved" && (
              <span className="flex items-center gap-1 rounded-sm border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 shadow-sm dark:text-green-500">
                <CheckCircle2 className="h-2.5 w-2.5" /> Approved
              </span>
            )}
            {doc.approvalStatus === "rejected" && (
              <span className="flex items-center gap-1 rounded-sm border border-destructive/10 bg-destructive/5 px-2 py-0.5 text-[10px] font-semibold text-destructive shadow-sm">
                <XCircle className="h-2.5 w-2.5" /> Rejected
              </span>
            )}
            {doc.approvalStatus === "pending" && doc.status === "completed" && (
              <span className="flex items-center gap-1 rounded-sm border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-600 shadow-sm dark:text-yellow-500">
                <ShieldQuestion className="h-2.5 w-2.5" /> Pending Review
              </span>
            )}
            {isFetching && !isProcessing && (
              <div className="flex animate-in items-center gap-1.5 duration-300 fade-in slide-in-from-left-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[9px] font-semibold text-primary/60">
                  Updating
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Investigation Banner for Approvers */}
        {isApprover && isInvestigationPending && (
          <div className="flex animate-in items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-2 text-[10px] font-bold text-orange-600 shadow-sm fade-in slide-in-from-right-2">
            <Info className="h-3.5 w-3.5" />
            Claims is still on investigation
          </div>
        )}

        {/* Review Button Logic */}
        {doc.approvalStatus === "pending" &&
          doc.status === "completed" &&
          doc.fraudAnalysis &&
          (canApproverReview || canInvestigatorReview) && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-primary/20 bg-primary/5 px-4 text-[10px] font-bold text-primary shadow-sm transition-all hover:bg-primary/10"
              onClick={() => {
                navigate({
                  to: isInvestigator ? "/fiu/$id" : "/cap/$id",
                  params: { id: doc.id },
                })
              }}
            >
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Review Claim
            </Button>
          )}
      </div>
    </div>
  )
}
