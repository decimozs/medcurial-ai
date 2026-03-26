import { FileText, ChevronRight, Clock } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { DocumentThumbnail } from "@/features/documents/hooks/use-documents"

interface KanbanCardProps {
  doc: DocumentThumbnail
  role: "claims-approval-user" | "fraud-investigation-user"
}

export function KanbanCard({ doc, role }: KanbanCardProps) {
  const isInvestigator = role === "fraud-investigation-user"
  const isPending = isInvestigator
    ? doc.fiuStatus === "pending"
    : doc.approvalStatus === "pending"

  const targetPath = isPending
    ? isInvestigator
      ? "/fiu/$id"
      : "/cap/$id"
    : "/documents/$id"

  return (
    <Link to={targetPath} params={{ id: doc.id }} className="group block">
      <Card className="border-border/40 bg-card/50 transition-all duration-200 hover:border-primary/30 hover:bg-accent/50 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge
                variant={
                  doc.approvalStatus === "approved"
                    ? "success"
                    : doc.approvalStatus === "rejected"
                      ? "destructive"
                      : "warning"
                }
                className="text-[9px] font-black tracking-tighter uppercase"
              >
                {doc.approvalStatus}
              </Badge>
              {doc.fiuStatus !== "pending" && (
                <Badge
                  variant={doc.fiuStatus === "fraud" ? "destructive" : "info"}
                  className="text-[9px] font-black tracking-tighter uppercase"
                >
                  FIU: {doc.fiuStatus}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
              {doc.name}
            </h3>
            <p className="text-[10px] font-medium text-muted-foreground/50">
              ID: {doc.id}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60">
              <Clock className="h-3 w-3" />
              {format(new Date(doc.createdAt), "MMM d, yyyy")}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary/70" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
