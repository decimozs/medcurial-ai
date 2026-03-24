import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import {
  Loader2,
  AlertCircle,
  Fingerprint,
  Clock,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { ImageWithSkeleton } from "@/components/image-with-skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SignatureThumbnail } from "../types"

interface SignatureItemProps {
  sig: SignatureThumbnail
  activeId?: string
  setDeleteTarget: (target: { id: string; label: string }) => void
}

export function SignatureItem({
  sig,
  activeId,
  setDeleteTarget,
}: SignatureItemProps) {
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("signatureId", id)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div className="group/item relative mb-0.5 grid grid-cols-[1fr_auto] items-center overflow-hidden rounded-xl transition-all group-hover:bg-accent/30">
      <Link
        to="/signatures/$id"
        params={{ id: sig.id }}
        draggable
        onDragStart={(e) => handleDragStart(e, sig.id)}
        className={cn(
          "flex min-w-0 cursor-grab flex-col gap-0.5 rounded-xl p-3 no-underline transition-all active:cursor-grabbing",
          activeId === sig.id
            ? "bg-primary/5 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/40 bg-background/50">
            {sig.status === "processing" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : sig.status === "failed" ? (
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            ) : sig.imageUrls.image_preview?.[0] ? (
              <ImageWithSkeleton
                src={sig.imageUrls.image_preview[0]}
                alt={sig.name}
                className="h-full w-full object-contain p-1 opacity-40 invert transition-opacity group-hover/item:opacity-100 dark:invert-0"
              />
            ) : (
              <Fingerprint className="h-3.5 w-3.5 text-muted-foreground/10" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="block truncate text-xs font-semibold">
              SIGNATURE-{sig.no}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] opacity-40">
              {sig.status === "processing" ? (
                <span className="font-bold tracking-widest text-primary uppercase">
                  Enrolling...
                </span>
              ) : (
                <>
                  <Clock className="h-2.5 w-2.5" />
                  <span className="truncate">ID: {sig.id.slice(0, 8)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div
        className={cn(
          "shrink-0 px-2 transition-opacity",
          activeId === sig.id
            ? "opacity-100"
            : "opacity-0 group-hover/item:opacity-100"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-primary/10">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl">
            <DropdownMenuItem
              className="mx-1 cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() =>
                setDeleteTarget({ id: sig.id, label: `SIGNATURE-${sig.no}` })
              }
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs font-medium">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeId === sig.id && (
        <div className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
    </div>
  )
}
