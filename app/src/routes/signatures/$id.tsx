import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  ShieldCheck,
  Calendar,
  Hash,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

import { ImageWithSkeleton } from "@/components/image-with-skeleton"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

interface Signature {
  id: string
  name: string
  status: string
  imageUrls: {
    original: string[]
    roi: string[]
    normalized: string[]
    siamese: string[]
    image_preview: string[]
  }
  createdAt: string
  updatedAt: string
}

export const Route = createFileRoute("/signatures/$id")({
  component: SignatureDetail,
})

function SignatureDetail() {
  const { id } = Route.useParams()

  const { data: signature, isLoading } = useQuery<Signature>({
    queryKey: ["signature", id],
    queryFn: async () => {
      const response = await apiClient.fetch(`/signatures/${id}`)
      if (!response.ok) throw new Error("Failed to fetch signature")
      return response.json()
    },
    refetchInterval: (query) => {
      const data = query.state.data as Signature | undefined
      return data?.status === "processing" ? 2000 : false
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    )
  }

  if (!signature) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
        <p className="text-xl font-bold">Signature not found</p>
      </div>
    )
  }

  const stages = [
    {
      id: "original",
      label: "Original",
      urls: signature.imageUrls.original,
      bg: "bg-white",
    },
    { id: "roi", label: "ROI", urls: signature.imageUrls.roi, bg: "bg-white" },
    {
      id: "normalized",
      label: "Normalized",
      urls: signature.imageUrls.normalized,
      bg: "bg-black",
      border: "border-white/5",
    },
    {
      id: "preview",
      label: "Neural Matrix",
      urls: signature.imageUrls.image_preview,
      bg: "bg-white",
      border: "border-black/5",
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px] animate-in space-y-12 p-4 duration-700 fade-in slide-in-from-bottom-4 md:p-8 lg:p-12">
      {/* Header Info */}
      <div className="flex flex-col justify-between gap-8 border-b border-border/40 pb-8 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-md border-primary/10 bg-primary/5 px-3 py-1 text-[10px] font-medium text-primary capitalize">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Registry
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground/90 md:text-5xl">
              {signature.name}
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground/40">
              <span>Signature</span>
              <span>/</span>
              <span className="text-muted-foreground/60">{signature.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-border/40 bg-accent/30 px-5 py-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-medium text-muted-foreground/40">
              <Calendar className="h-3.5 w-3.5" /> Date
            </div>
            <p className="text-sm font-medium text-foreground/80">
              {new Date(signature.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-accent/30 px-5 py-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-medium text-muted-foreground/40">
              <Hash className="h-3.5 w-3.5" /> Assets
            </div>
            <p className="text-sm font-medium text-foreground/80">
              {Object.values(signature.imageUrls).flat().length -
                Object.values(signature.imageUrls.original).length}{" "}
              References
            </p>
          </div>
        </div>
      </div>

      {/* Processing Timeline Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-border/10 pb-4">
          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-muted-foreground/60">
              Processing Pipeline
            </h3>
            <p className="text-[10px] font-medium text-muted-foreground/30">
              {signature.status === "processing"
                ? "Currently Processing..."
                : "Single Sample Enrolled"}
            </p>
          </div>
        </div>

        {signature.status === "processing" ? (
          <div className="flex animate-in flex-col items-center justify-center space-y-5 rounded-3xl border border-dashed border-border/40 bg-accent/5 p-24 duration-500 fade-in">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-foreground/80">
                Processing Neural Assets
              </p>
              <p className="text-[11px] font-medium text-muted-foreground/60">
                This may take a few moments...
              </p>
            </div>
          </div>
        ) : signature.status === "failed" ? (
          <div className="flex animate-in flex-col items-center justify-center space-y-5 rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 p-24 duration-500 fade-in">
            <AlertCircle className="h-12 w-12 text-destructive opacity-80" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-foreground/80">
                Processing Failed
              </p>
              <p className="text-[11px] font-medium text-muted-foreground/60">
                There was an error processing these signature assets.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 pt-4 sm:grid-cols-2 lg:gap-12">
            {stages.map((stage, idx) => {
              const url = stage.urls[0]
              if (!url)
                return (
                  <div
                    key={stage.id}
                    className="aspect-video rounded-3xl border border-dashed border-border/40 bg-accent/5"
                  />
                )

              return (
                <div key={stage.id} className="group/item space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="rounded-md border-primary/10 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary/70">
                      Step 0{idx + 1}
                    </span>
                    <span className="text-[12px] font-semibold tracking-tight text-foreground/70">
                      {stage.label}
                    </span>
                    <div className="h-[1px] flex-1 bg-border/20 transition-colors group-hover/item:bg-primary/20" />
                  </div>

                  <Dialog>
                    <div
                      className={cn(
                        "group relative aspect-video overflow-hidden rounded-3xl ring-offset-background transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]",
                        stage.bg || "bg-accent/10",
                        stage.border || "border border-border/30"
                      )}
                    >
                      <ImageWithSkeleton
                        src={url}
                        alt={`${stage.label} sample`}
                        className="h-full w-full object-contain p-8 transition-transform duration-700 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background px-5 py-2.5 text-xs font-semibold text-foreground/80 shadow-2xl transition-all hover:scale-105 hover:bg-accent">
                            <Eye className="h-4 w-4 text-primary" />
                            Inspect Stage
                          </button>
                        </DialogTrigger>
                      </div>
                    </div>

                    <DialogContent
                      className={cn(
                        "max-w-4xl overflow-hidden rounded-[2.5rem] p-2 shadow-2xl backdrop-blur-2xl transition-colors duration-500",
                        stage.bg || "bg-background/95",
                        stage.border || "border-border/40"
                      )}
                    >
                      <div className="relative flex aspect-video w-full items-center justify-center p-12">
                        <ImageWithSkeleton
                          src={url}
                          alt="Signature Analysis"
                          className="h-full w-full object-contain drop-shadow-2xl"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export { SignatureDetail }
