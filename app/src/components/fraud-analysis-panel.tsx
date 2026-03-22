import { cn } from '@/lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ChevronDown,
  ChevronRight,
  Bot,
  AlertTriangle,
  Info,
  BarChart2,
  ChevronsUpDown,
} from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

// ─── Type definitions ────────────────────────────────────────────────
interface FraudScores {
  medical_language?: number;
  protocol_adherence?: number;
  linguistic_naturalness?: number;
  severity_alignment?: number;
}

interface FraudNotes {
  language_note?: string;
  protocol_note?: string;
  naturalness_note?: string;
  severity_note?: string;
}

interface RankingResponse {
  overview?: string;
  final_rank?: string;
  suspicion_type?: string;
  summary_of_evidence?: string;
  scores?: FraudScores;
  notes?: FraudNotes;
}

interface AuditorResponse {
  final_rank?: string;
  suspicion_type?: string;
  is_flagged_for_review?: boolean;
  verdict?: string;
  overall_score?: number;
}

interface FraudDetectorResponse {
  description_score?: number;
  assessment?: string;
}

interface FraudAnalysisData {
  auditor_response?: string | AuditorResponse | { raw_response?: string };
  ranking_response?: string | RankingResponse;
  fraud_detector_response?: string | FraudDetectorResponse;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function parseJson<T>(raw: any): T | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as T;
  try {
    const cleaned = raw
      .replace(/<Answer>/g, '')
      .replace(/<\/Answer>/g, '')
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function rankColor(rank: string | undefined) {
  switch (rank?.toLowerCase()) {
    case 'high':
    case 'moderate':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    case 'low':
      return 'text-primary bg-primary/10 border-primary/20';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

function RankIcon({ rank }: { rank: string | undefined }) {
  switch (rank?.toLowerCase()) {
    case 'high':
      return <ShieldAlert className="w-4 h-4 text-destructive" />;
    case 'moderate':
      return <ShieldQuestion className="w-4 h-4 text-destructive" />;
    case 'low':
      return <ShieldCheck className="w-4 h-4 text-primary" />;
    default:
      return <ShieldQuestion className="w-4 h-4 text-muted-foreground" />;
  }
}

function getSuspicionDescription(type: string | undefined): string {
  switch (type?.toLowerCase()) {
    case 'signature':
      return 'Suspicious activity detected in signature consistency.';
    case 'description':
      return 'Discrepancies found in document text or medical descriptions.';
    case 'both':
      return 'Anomalies detected in both signatures and text descriptions.';
    case 'none':
      return 'No significant suspicion detected.';
    default:
      return type || 'No suspicion type specified';
  }
}

function ScoreBar({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: number;
  tooltip?: string;
}) {
  const pct = Math.round(value * 100);
  const barColor =
    value >= 0.7
      ? 'bg-primary'
      : 'bg-destructive';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help group/label">
                <span className="text-xs font-medium text-muted-foreground/70 transition-colors">
                  {label}
                </span>
                {tooltip && (
                  <Info className="w-3 h-3 text-muted-foreground/40 group-hover/label:text-primary/60 transition-colors" />
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
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            barColor,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ScoreRadar({ scores }: { scores: FraudScores }) {
  const data = [
    {
      metric: 'Medical\nLanguage',
      value: Math.round((scores.medical_language ?? 0) * 100),
    },
    {
      metric: 'Protocol',
      value: Math.round((scores.protocol_adherence ?? 0) * 100),
    },
    {
      metric: 'Linguistic',
      value: Math.round((scores.linguistic_naturalness ?? 0) * 100),
    },
    {
      metric: 'Severity',
      value: Math.round((scores.severity_alignment ?? 0) * 100),
    },
  ];

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
          <PolarGrid
            stroke="var(--border)"
            strokeOpacity={0.4}
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{
              fill: 'var(--muted-foreground)',
              fontSize: 10,
              fontWeight: 500,
            }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ fill: 'var(--primary)', r: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/40 rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-foreground/70">
            {title}
          </span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        )}
      </button>
      {open && (
        <div className="px-4 py-4 space-y-4 bg-background/40">{children}</div>
      )}
    </div>
  );
}

function SafeRender({ value }: { value: any }) {
  if (value === null || value === undefined) return null;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return <>{value}</>;
  }
  if (typeof value === 'object') {
    return (
      <div className="space-y-1 pl-2 border-l border-border/20 mt-1">
        {Object.entries(value).map(([sk, sv]) => (
          <div key={sk} className="space-y-0.5">
            <p className="text-[10px] font-medium text-muted-foreground/40 capitalize">
              {sk.replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-foreground/60 leading-tight">
              <SafeRender value={sv} />
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ─── Analysis Content (shared between panel & dialog) ──────────────────────

interface AnalysisContentProps {
  auditor: AuditorResponse | null;
  ranking: RankingResponse | null;
  detector: FraudDetectorResponse | null;
  showChart: boolean;
  isGrid?: boolean;
}

function AnalysisContent({
  auditor,
  ranking,
  detector,
  showChart,
  isGrid,
}: AnalysisContentProps) {
  const finalRank = auditor?.final_rank ?? ranking?.final_rank;
  const overallScore = auditor?.overall_score;
  const isFlagged = auditor?.is_flagged_for_review;

  return (
    <div className="space-y-4">
      {/* Overall verdict card */}
      <div
        className={cn(
          'rounded-xl border p-5 space-y-3 shadow-sm',
          rankColor(finalRank),
        )}
      >
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <RankIcon rank={finalRank} />
                  <span className="text-sm font-semibold">
                    {finalRank ?? 'Unknown'} Risk
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
                  <span className="text-sm font-medium opacity-70 cursor-help">
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
        {isFlagged && (
          <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
            <AlertTriangle className="w-4 h-4" /> Flagged for manual review
          </div>
        )}
        {auditor?.verdict && (
          <div className="relative">
            <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-current opacity-20 rounded-full" />
            <p className="text-sm leading-relaxed font-medium opacity-90 pl-1 italic">
              "{auditor.verdict}"
            </p>
          </div>
        )}
      </div>

      {/* Suspicion Diagnosis */}
      {(auditor?.suspicion_type || ranking?.suspicion_type) && (
        <div className="px-4 py-3 rounded-xl bg-muted/20 border border-border/30 space-y-1.5 transition-colors hover:bg-muted/30">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-muted-foreground/60" />
            <p className="text-[10px] font-semibold text-muted-foreground/50">
              Suspicion Diagnosis
            </p>
          </div>
          <p className="text-sm font-medium text-foreground/80 leading-relaxed">
            {getSuspicionDescription(
              auditor?.suspicion_type || ranking?.suspicion_type,
            )}
          </p>
        </div>
      )}

      <div className={cn(isGrid ? "grid grid-cols-1 lg:grid-cols-2 gap-4 items-start" : "space-y-4")}>
        {/* Ranking Breakdown */}
        {ranking && (
          <CollapsibleSection
            title="Ranking Report"
            icon={<ShieldQuestion className="w-3.5 h-3.5 text-primary/60" />}
            defaultOpen
          >
            {ranking.overview && (
              <div className="text-sm text-muted-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/20">
                <SafeRender value={ranking.overview} />
              </div>
            )}
            {ranking.summary_of_evidence && (
              <div className="space-y-1.5 px-1">
                <p className="text-[10px] font-semibold text-muted-foreground/50">
                  Evidence Summary
                </p>
                <div className="text-sm text-foreground/70 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
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

        {/* Fraud Detector */}
        {detector && (
          <CollapsibleSection
            title="Fraud Detector"
            icon={<ShieldAlert className="w-3.5 h-3.5 text-destructive/60" />}
          >
            {detector.description_score !== undefined && (
              <ScoreBar
                label="Description Integrity"
                value={detector.description_score}
                tooltip="Detection of potentially copied or procedurally generated descriptions."
              />
            )}
            {detector.assessment && (
              <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                <div className="text-sm text-destructive/80 leading-relaxed font-medium">
                  <SafeRender value={detector.assessment} />
                </div>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Detailed Notes */}
        {ranking?.notes && Object.values(ranking.notes).some(Boolean) && (
          <CollapsibleSection
            title="Detailed Notes"
            icon={<Bot className="w-3.5 h-3.5 text-primary/60" />}
          >
            <div className="grid gap-4">
              {Object.entries(ranking.notes).map(([key, value]) => {
                if (!value) return null;
                const label = key.replace('_note', '').replace(/_/g, ' ');
                return (
                  <div
                    key={key}
                    className="space-y-1 group/note p-2 rounded-lg hover:bg-muted/20 transition-colors border border-transparent hover:border-border/30"
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground/50 group-hover/note:text-primary/60 transition-colors capitalize">
                      {label}
                    </p>
                    <div className="text-sm text-foreground/70 leading-relaxed">
                      <SafeRender value={value} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export interface FraudAnalysisPanelProps {
  data: FraudAnalysisData | null | undefined;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function FraudAnalysisPanel({
  data,
  isCollapsed,
  onToggleCollapse,
}: FraudAnalysisPanelProps) {
  const [showChart, setShowChart] = useState(false);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center opacity-40 space-y-3">
        <Bot className="w-8 h-8 text-primary/40" />
        <p className="text-[10px] font-semibold text-muted-foreground">
          No fraud analysis yet
        </p>
        <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
          Analysis will appear here after document processing completes.
        </p>
      </div>
    );
  }

  const auditorRaw =
    typeof data.auditor_response === 'object' &&
      'raw_response' in data.auditor_response
      ? data.auditor_response.raw_response
      : data.auditor_response;

  const auditor = parseJson<AuditorResponse>(auditorRaw);
  const ranking = parseJson<RankingResponse>(data.ranking_response);
  const detector = parseJson<FraudDetectorResponse>(data.fraud_detector_response);

  const hasScores =
    ranking?.scores &&
    Object.values(ranking.scores).some((v) => v !== undefined);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden bg-background/50">
        {/* Panel Header */}
        <div className={cn(
          "flex items-center border-b border-border/40 shrink-0 bg-background/80 backdrop-blur-sm transition-all",
          isCollapsed ? "justify-center px-0 py-3" : "gap-2 px-4 py-3"
        )}>
          {!isCollapsed && (
            <>
              <Bot className="w-4 h-4 text-primary shrink-0 transition-opacity" />
              <span className="text-sm font-semibold text-foreground/70 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                Analysis
              </span>
            </>
          )}

          {/* Action buttons */}
          <div className={cn("flex items-center gap-0.5", isCollapsed && "px-1.5")}>
            {/* Chart toggle — only show when scores exist */}
            {!isCollapsed && hasScores && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowChart((v) => !v)}
                      className={cn(
                        'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
                        showChart
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {showChart ? 'Show score bars' : 'Show radar chart'}
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
                          ? "w-10 h-10 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                          : "w-7 h-7 rounded-lg text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      {isCollapsed ? (
                        <Bot className="w-5 h-5" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 rotate-90" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {isCollapsed ? 'Expand panel' : 'Collapse panel'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Scrollable content — hidden when collapsed */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto px-4 py-6 animate-in slide-in-from-right-2 duration-300">
            <AnalysisContent
              auditor={auditor}
              ranking={ranking}
              detector={detector}
              showChart={showChart}
            />
          </div>
        )}
      </div>
    </>
  );
}
