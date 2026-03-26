import { ShieldCheck, Loader2, AlertCircle } from "lucide-react"
import { stripExtension } from "@/lib/utils"

interface SignatureHeaderProps {
  signature: {
    id: string
    name: string
    status: string
    createdAt: string
  }
  isFetching: boolean
}

export function SignatureHeader({
  signature,
  isFetching,
}: SignatureHeaderProps) {
  const isProcessing = signature.status === "processing"
  const isFailed = signature.status === "failed"

  return (
    <div className="sticky top-0 z-20 flex w-full shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-6 py-3 shadow-sm backdrop-blur-md dark:bg-sidebar/80">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border-primary/20 bg-primary/10 transition-transform hover:scale-105">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-0.5">
          <h1
            className="max-w-[500px] truncate text-lg font-medium tracking-tight text-foreground/90"
            title={signature.name}
          >
            {stripExtension(signature.name)}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-muted-foreground/50">
              Registry ID: {signature.id}
            </span>
            {isProcessing && (
              <span className="flex items-center gap-1.5 rounded-sm border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> Enrolling
              </span>
            )}
            {isFailed && (
              <span className="flex items-center gap-1.5 rounded-sm border border-destructive/10 bg-destructive/5 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                <AlertCircle className="h-3 w-3" /> Failed
              </span>
            )}
            {signature.status === "completed" && (
              <span className="rounded-sm border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-500">
                Active Registry
              </span>
            )}
            {isFetching && !isProcessing && (
              <div className="flex animate-in items-center gap-1.5 duration-300 fade-in slide-in-from-left-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary/60" />
                <span className="text-[9px] font-semibold text-primary/40">
                  Syncing
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
