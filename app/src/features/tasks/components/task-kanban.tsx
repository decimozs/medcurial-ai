import { useMemo } from "react"
import { useDocuments } from "@/features/documents/hooks/use-documents"
import { authClient } from "@/lib/auth-client"
import { KanbanColumn } from "./kanban-column"
import { Loader2, AlertCircle } from "lucide-react"

export function TaskKanban() {
  const { documents, isLoading } = useDocuments()
  const session = authClient.useSession()
  const userRole = session.data?.user?.role

  const isApprover = userRole === "claims-approval-user"
  const isInvestigator = userRole === "fraud-investigation-user"

  const columns = useMemo(() => {
    if (!documents) return []

    if (isApprover) {
      return [
        {
          title: "Pending Approval",
          documents: documents.filter(
            (d) =>
              d.approvalStatus === "pending" &&
              d.status === "completed" &&
              d.fiuStatus !== "pending"
          ),
        },
        {
          title: "Approved",
          documents: documents.filter((d) => d.approvalStatus === "approved"),
        },
        {
          title: "Rejected",
          documents: documents.filter((d) => d.approvalStatus === "rejected"),
        },
      ]
    }

    if (isInvestigator) {
      return [
        {
          title: "Pending Investigation",
          documents: documents.filter(
            (d) =>
              d.fiuStatus === "pending" &&
              d.fraudAnalysis?.auditor_response?.is_flagged_for_review === true
          ),
        },
        {
          title: "Flagged as Fraud",
          documents: documents.filter((d) => d.fiuStatus === "fraud"),
        },
        {
          title: "Clear",
          documents: documents.filter((d) => d.fiuStatus === "not_fraud"),
        },
      ]
    }

    return []
  }, [documents, isApprover, isInvestigator])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
        <p className="animate-pulse text-sm font-medium text-muted-foreground/60">
          Loading your task board...
        </p>
      </div>
    )
  }

  if (!userRole || (!isApprover && !isInvestigator)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            You do not have the required permissions to view the Task Board.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full animate-in flex-col overflow-hidden duration-500 fade-in">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-1 gap-8 p-8 md:grid-cols-3">
          {columns.map((col) => (
            <KanbanColumn
              key={col.title}
              title={col.title}
              documents={col.documents}
              role={userRole ?? "user"}
              count={col.documents.length}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
