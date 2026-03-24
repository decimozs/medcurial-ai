import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ScoreBarProps {
  label: string
  value: number
  tooltip?: string
}

export function ScoreBar({ label, value, tooltip }: ScoreBarProps) {
  const pct = Math.round(value * 100)
  const barColor = value >= 0.7 ? "bg-primary" : "bg-destructive"
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="group/label flex cursor-help items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground/70 transition-colors">
                  {label}
                </span>
                {tooltip && (
                  <Info className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover/label:text-primary/60" />
                )}
              </div>
            </TooltipTrigger>
            {tooltip && (
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs leading-relaxed">{tooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <span className="text-xs font-medium text-foreground/60">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            barColor
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
