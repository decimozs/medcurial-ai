import { KanbanCard } from "./kanban-card"
import type { DocumentThumbnail } from "@/features/documents/hooks/use-documents"

interface KanbanColumnProps {
  title: string
  documents: DocumentThumbnail[]
  role: "claims-approval-user" | "fraud-investigation-user"
  count: number
}

export function KanbanColumn({
  title,
  documents,
  role,
  count,
}: KanbanColumnProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-baseline justify-between px-2">
        <h2 className="text-xs font-medium text-muted-foreground/60">
          {title}
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          {count}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-2 pr-2">
        {documents.map((doc) => (
          <KanbanCard key={doc.id} doc={doc} role={role} />
        ))}
        {documents.length === 0 && (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <p className="text-[10px] font-medium text-muted-foreground/40 italic">
              No tasks found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
