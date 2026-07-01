import { ShieldAlert, ShieldQuestion, AlertTriangle, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  AuditorResponse,
  RankingResponse,
  FraudDetectorResponse,
} from "../types"
import { rankColor, getSuspicionDescription } from "../helpers/utils"
import { ScoreBar } from "./score-bar"
import { ScoreRadar } from "./score-radar"
import { CollapsibleSection } from "./collapsible-section"
import { SafeRender } from "./safe-render"
import { RankIcon } from "./rank-icon"

interface AnalysisContentProps {
  auditor: AuditorResponse | null
  ranking: RankingResponse | null
  detector: FraudDetectorResponse | null
  showChart: boolean
  isGrid?: boolean
}

export function AnalysisContent({
  auditor,
  ranking,
  detector,
  showChart,
  isGrid,
}: AnalysisContentProps) {
  const finalRank = auditor?.final_rank ?? ranking?.final_rank
  const overallScore = auditor?.overall_score
  const isFlagged = auditor?.is_flagged_for_review

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "space-y-3 rounded-xl border p-5 shadow-sm",
          rankColor(finalRank)
        )}
      >
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-help items-center gap-2">
                  <RankIcon rank={finalRank} />
                  <span className="text-sm font-semibold capitalize">
                    {(finalRank ?? "Unknown").replace(/-/g, " ")} Risk
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  The overall severity level based on all indicators.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {overallScore !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-sm font-medium opacity-70">
                    {Math.round(overallScore * 100)}% confidence
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">
                    Statistical confidence score of this assessment.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isFlagged && (
            <div className="flex w-fit animate-in items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-1 text-[11px] font-bold tracking-wider text-destructive uppercase shadow-sm duration-500 fade-in slide-in-from-left-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Flagged for manual
              review
            </div>
          )}
          {auditor?.verdict && (
            <div className="relative mt-1">
              <div className="absolute top-0 bottom-0 -left-3 w-0.5 rounded-full bg-current opacity-20" />
              <p className="pl-1 text-sm leading-relaxed font-medium italic opacity-90">
                "{auditor.verdict}"
              </p>
            </div>
          )}
        </div>
      </div>

      {(auditor?.suspicion_type || ranking?.suspicion_type) && (
        <div className="space-y-1.5 rounded-xl border border-border/30 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/30">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3 text-muted-foreground/60" />
            <p className="text-[10px] font-semibold text-muted-foreground/50">
              Suspicion Diagnosis
            </p>
          </div>
          <p className="text-sm leading-relaxed font-medium text-foreground/80">
            {getSuspicionDescription(
              auditor?.suspicion_type || ranking?.suspicion_type
            )}
          </p>
        </div>
      )}

      <div
        className={cn(
          isGrid
            ? "grid grid-cols-1 items-start gap-4 lg:grid-cols-2"
            : "space-y-4"
        )}
      >
        {ranking && (
          <CollapsibleSection
            title="Ranking Report"
            icon={<ShieldQuestion className="h-3.5 w-3.5 text-primary/60" />}
            defaultOpen
          >
            {ranking.overview && (
              <div className="rounded-lg border border-border/20 bg-muted/10 p-3 text-sm leading-relaxed text-muted-foreground/80">
                <SafeRender value={ranking.overview} />
              </div>
            )}
            {ranking.summary_of_evidence && (
              <div className="space-y-1.5 px-1">
                <p className="text-[10px] font-semibold text-muted-foreground/50">
                  Evidence Summary
                </p>
                <div className="line-clamp-4 cursor-pointer text-sm leading-relaxed text-foreground/70 transition-all hover:line-clamp-none">
                  <SafeRender value={ranking.summary_of_evidence} />
                </div>
              </div>
            )}
            {ranking.scores && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-border/20 pb-1">
                  <p className="text-[10px] font-semibold text-muted-foreground/50">
                    Score Breakdown
                  </p>
                </div>

                {showChart ? (
                  <ScoreRadar scores={ranking.scores} />
                ) : (
                  <div className="space-y-3">
                    {ranking.scores.medical_language !== undefined && (
                      <ScoreBar
                        label="Medical Language"
                        value={ranking.scores.medical_language}
                        tooltip="Assesses the accuracy and complexity of medical terminology used."
                      />
                    )}
                    {ranking.scores.protocol_adherence !== undefined && (
                      <ScoreBar
                        label="Protocol Adherence"
                        value={ranking.scores.protocol_adherence}
                        tooltip="Evaluation of how well the document follows standard medical protocols."
                      />
                    )}
                    {ranking.scores.linguistic_naturalness !== undefined && (
                      <ScoreBar
                        label="Linguistic Naturalness"
                        value={ranking.scores.linguistic_naturalness}
                        tooltip="Measures the flow and naturalness of the written language."
                      />
                    )}
                    {ranking.scores.severity_alignment !== undefined && (
                      <ScoreBar
                        label="Severity Alignment"
                        value={ranking.scores.severity_alignment}
                        tooltip="Consistency between the reported symptoms and prescribed treatments."
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
        )}

        {detector && (
          <CollapsibleSection
            title="Fraud Detector"
            icon={<ShieldAlert className="h-3.5 w-3.5 text-destructive/60" />}
          >
            {detector.description_score !== undefined && (
              <ScoreBar
                label="Description Integrity"
                value={detector.description_score}
                tooltip="Detection of potentially copied or procedurally generated descriptions."
              />
            )}
            {detector.assessment && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <div className="text-sm leading-relaxed font-medium text-foreground">
                  <SafeRender value={detector.assessment} />
                </div>
              </div>
            )}
          </CollapsibleSection>
        )}

        {ranking?.notes && Object.values(ranking.notes).some(Boolean) && (
          <CollapsibleSection
            title="Detailed Notes"
            icon={<Bot className="h-3.5 w-3.5 text-primary/60" />}
          >
            <div className="grid gap-4">
              {Object.entries(ranking.notes).map(([key, value]) => {
                if (!value) return null
                const label = key.replace("_note", "").replace(/_/g, " ")
                return (
                  <div
                    key={key}
                    className="group/note space-y-1 rounded-lg border border-transparent p-2 transition-colors hover:border-border/30 hover:bg-muted/20"
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground/50 capitalize transition-colors group-hover/note:text-primary/60">
                      {label}
                    </p>
                    <div className="text-sm leading-relaxed text-foreground/70">
                      <SafeRender value={value} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}
