import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 shadow-sm transition-shadow hover:shadow-md">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-foreground/70">
            {title}
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        )}
      </button>
      {open && (
        <div className="space-y-4 bg-background/40 px-4 py-4">{children}</div>
      )}
    </div>
  )
}
