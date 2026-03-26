import {
  ShieldCheck,
  Calendar,
  Hash,
  Trash2,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react"

interface SignatureSidePanelProps {
  signature: {
    id: string
    name: string
    status: string
    createdAt: string
    updatedAt: string
    imageUrls: {
      original: string[]
      roi: string[]
      normalized: string[]
      image_preview: string[]
    }
  }
}

export function SignatureSidePanel({ signature }: SignatureSidePanelProps) {
  const assetCount = Object.values(signature.imageUrls).flat().length

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Registry Metadata
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/50 p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  Assets
                </span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {assetCount} Files
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/50 p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  Enrolled
                </span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {new Date(signature.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/50 p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  Lifecycle
                </span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {signature.status === "completed" ? "Active" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/20" />

        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 gap-2">
            <button className="group flex w-full items-center justify-between rounded-md border border-border/40 bg-background/50 p-3 text-left transition-all hover:border-primary/20 hover:bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted group-hover:bg-primary/10">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">
                    Download Bundle
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    ZIP with all stages
                  </p>
                </div>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary/50" />
            </button>
          </div>
        </div>

        <div className="mt-auto rounded-md border border-primary/10 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h4 className="text-[11px] font-bold text-primary uppercase">
              Identity Secure
            </h4>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground/70">
            This signature is verified and enrolled in the global registry. All
            neural matrix assets are cryptographically protected.
          </p>
        </div>
      </div>
    </div>
  )
}
