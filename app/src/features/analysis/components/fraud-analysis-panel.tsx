import { cn } from "@/lib/utils"
import { Bot, BarChart2, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  FraudAnalysisData,
  AuditorResponse,
  RankingResponse,
  FraudDetectorResponse,
} from "../types"
import { parseJson } from "../helpers/utils"
import { AnalysisContent } from "./analysis-content"

export interface FraudAnalysisPanelProps {
  data: FraudAnalysisData | null | undefined
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function FraudAnalysisPanel({
  data,
  isCollapsed,
  onToggleCollapse,
}: FraudAnalysisPanelProps) {
  const [showChart, setShowChart] = useState(false)

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-3 p-6 text-center opacity-40">
        <Bot className="h-8 w-8 text-primary/40" />
        <p className="text-[10px] font-semibold text-muted-foreground">
          No fraud analysis yet
        </p>
        <p className="text-[9px] leading-relaxed text-muted-foreground/60">
          Analysis will appear here after document processing completes.
        </p>
      </div>
    )
  }

  const auditorRaw =
    typeof data.auditor_response === "object" &&
    data.auditor_response !== null &&
    "raw_response" in data.auditor_response
      ? data.auditor_response.raw_response
      : data.auditor_response

  const auditor = parseJson<AuditorResponse>(auditorRaw)
  const ranking = parseJson<RankingResponse>(data.ranking_response)
  const detector = parseJson<FraudDetectorResponse>(
    data.fraud_detector_response
  )

  const hasScores =
    ranking?.scores &&
    Object.values(ranking.scores).some((v) => v !== undefined)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background/50">
      {/* Panel Header */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-border/40 bg-background/80 backdrop-blur-sm transition-all",
          isCollapsed ? "justify-center px-0 py-3" : "gap-2 px-4 py-3"
        )}
      >
        {!isCollapsed && (
          <>
            <Bot className="h-4 w-4 shrink-0 text-primary transition-opacity" />
            <span className="flex-1 overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap text-foreground/70">
              Analysis
            </span>
          </>
        )}

        {/* Action buttons */}
        <div
          className={cn("flex items-center gap-0.5", isCollapsed && "px-1.5")}
        >
          {/* Chart toggle — only show when scores exist */}
          {!isCollapsed && hasScores && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowChart((v) => !v)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                      showChart
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {showChart ? "Show score bars" : "Show radar chart"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Collapse toggle (only if controlled) */}
          {onToggleCollapse && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleCollapse}
                    className={cn(
                      "flex items-center justify-center transition-all",
                      isCollapsed
                        ? "h-10 w-10 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                        : "h-7 w-7 rounded-lg text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {isCollapsed ? (
                      <Bot className="h-5 w-5" />
                    ) : (
                      <ChevronsUpDown className="h-3.5 w-3.5 rotate-90" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isCollapsed ? "Expand panel" : "Collapse panel"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Scrollable content — hidden when collapsed */}
      {!isCollapsed && (
        <div className="flex-1 animate-in overflow-y-auto px-4 py-6 duration-300 slide-in-from-right-2">
          <AnalysisContent
            auditor={auditor}
            ranking={ranking}
            detector={detector}
            showChart={showChart}
          />
        </div>
      )}
    </div>
  )
}
