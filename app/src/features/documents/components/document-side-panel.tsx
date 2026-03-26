import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  BarChart2,
  MessageSquare,
  FileText,
  Loader2,
  AlertCircle,
  RotateCcw,
  ChevronsUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FraudAnalysisPanel } from "@/features/review/components/fraud-analysis-panel"
import { DocumentChatPanel } from "@/features/documents/components/document-chat-panel"
import type { DocumentResponse } from "../types"

interface DocumentSidePanelProps {
  doc: DocumentResponse
  handleRetryAnalysis: () => void
  isRetrying: boolean
}

export function DocumentSidePanel({
  doc,
  handleRetryAnalysis,
  isRetrying,
}: DocumentSidePanelProps) {
  const [fraudPanelCollapsed, setFraudPanelCollapsed] = useState(false)
  const [activeRightTab, setActiveRightTab] = useState<
    "analysis" | "chat" | "notes"
  >("analysis")

  const isProcessing = doc.status === "processing"
  const isFailed = doc.status === "failed"

  const effectiveRightTab =
    activeRightTab === "notes" && doc?.approvalStatus === "pending"
      ? "analysis"
      : activeRightTab

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-l border-border/40 bg-background/40 transition-all duration-300",
        fraudPanelCollapsed ? "w-16" : "w-[480px]"
      )}
    >
      <>
        {/* Panel Header w/ Tabs */}
        <div
          className={cn(
            "flex w-full shrink-0 items-center border-b border-border/40 bg-background/80 backdrop-blur-sm",
            fraudPanelCollapsed ? "justify-center px-0 py-3" : "px-4 py-2"
          )}
        >
          {fraudPanelCollapsed ? (
            <div className="flex flex-col gap-4 py-2">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setActiveRightTab("analysis")
                        setFraudPanelCollapsed(false)
                      }}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md transition-all",
                        effectiveRightTab === "analysis"
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <BarChart2 className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Analysis</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setActiveRightTab("chat")
                        setFraudPanelCollapsed(false)
                      }}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md transition-all",
                        effectiveRightTab === "chat"
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Assistant</TooltipContent>
                </Tooltip>

                {(doc.fiuStatus !== "pending" ||
                  doc.approvalStatus !== "pending") && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setActiveRightTab("notes")
                          setFraudPanelCollapsed(false)
                        }}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md transition-all",
                          effectiveRightTab === "notes"
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Notes</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          ) : (
            <>
              {!isProcessing && !isFailed && doc.fraudAnalysis ? (
                <div className="flex flex-1 gap-1 rounded-xl bg-muted/30 p-1">
                  <button
                    onClick={() => setActiveRightTab("analysis")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                      effectiveRightTab === "analysis"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                        : "text-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    Analysis
                  </button>
                  <button
                    onClick={() => setActiveRightTab("chat")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                      effectiveRightTab === "chat"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                        : "text-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Assistant
                  </button>
                  {(doc.fiuStatus !== "pending" ||
                    doc.approvalStatus !== "pending") && (
                    <button
                      onClick={() => setActiveRightTab("notes")}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                        effectiveRightTab === "notes"
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                          : "text-muted-foreground/50 hover:text-foreground"
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Notes
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex animate-pulse items-center gap-2 rounded-lg px-1 py-1.5 text-[10px] font-bold tracking-wider text-primary/60 uppercase">
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />{" "}
                        Analyzing...
                      </>
                    ) : isFailed ? (
                      <>
                        <AlertCircle className="mr-1 h-3.5 w-3.5 text-destructive" />{" "}
                        Analysis Failed
                      </>
                    ) : (
                      <>
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />{" "}
                        Initializing...
                      </>
                    )}
                  </div>
                  <div className="flex-1" />
                </>
              )}
              <button
                onClick={() => setFraudPanelCollapsed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-all hover:bg-muted/60 hover:text-foreground"
              >
                <ChevronsUpDown className="h-3.5 w-3.5 rotate-90" />
              </button>
            </>
          )}
        </div>

        {/* Panel Content */}
        {!fraudPanelCollapsed && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            {effectiveRightTab === "analysis" ? (
              isProcessing ? (
                <div className="flex flex-1 animate-in flex-col items-center justify-center space-y-6 p-8 text-center duration-500 fade-in">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
                    <Loader2 className="relative z-10 h-12 w-12 animate-spin text-primary" />
                  </div>
                  <div className="z-10 space-y-3">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-foreground/80 uppercase">
                      Neural Analysis Active
                    </h3>
                    <p className="mx-auto max-w-[240px] text-[11px] leading-relaxed font-medium text-muted-foreground">
                      Our AI agents are currently extracting text nodes and
                      performing deep fraud detection.
                    </p>
                  </div>
                </div>
              ) : isFailed ? (
                <div className="flex h-full animate-in flex-col items-center justify-center bg-destructive/5 p-12 text-center duration-500 fade-in">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 shadow-lg shadow-destructive/10">
                    <AlertCircle className="h-8 w-8 animate-pulse text-destructive" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">
                    Analysis Failed
                  </h3>
                  <p className="mb-8 max-w-[280px] text-xs leading-relaxed font-medium text-muted-foreground">
                    The neural analysis system encountered an error. This
                    usually happens when AI nodes are at capacity.
                  </p>
                  <Button
                    onClick={handleRetryAnalysis}
                    disabled={isRetrying}
                    className="text-destructive-foreground border-destructive-foreground/20 h-11 rounded-xl border-b-4 bg-destructive px-8 text-[11px] font-bold tracking-widest uppercase shadow-lg shadow-destructive/20 transition-all hover:bg-destructive/90 active:translate-y-1 active:border-b-0"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" /> Retry Analysis
                      </>
                    )}
                  </Button>
                </div>
              ) : !doc.fraudAnalysis ? (
                <div className="flex flex-1 animate-in flex-col items-center justify-center space-y-6 p-8 text-center duration-500 fade-in">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Finalizing Analysis...
                  </p>
                </div>
              ) : (
                <FraudAnalysisPanel
                  data={doc.fraudAnalysis}
                  isCollapsed={false}
                  // No toggle inside, we have the external one
                />
              )
            ) : effectiveRightTab === "chat" ? (
              <DocumentChatPanel documentId={doc.id} documentName={doc.name} />
            ) : (
              <div className="scrollbar-hide flex flex-1 flex-col overflow-x-hidden overflow-y-auto p-6">
                {/* Findings Timeline */}
                <div className="space-y-8">
                  {/* Stage 1: FIU Investigation */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                          <BarChart2 className="h-3.5 w-3.5" />
                        </div>
                        <h2 className="text-[10px] font-black tracking-widest text-foreground/60 uppercase">
                          FIU Investigation
                        </h2>
                      </div>
                      {doc.fiuStatus !== "pending" && (
                        <Badge
                          variant={
                            doc.fiuStatus === "fraud"
                              ? "destructive"
                              : "success"
                          }
                          className="text-[9px] font-black tracking-tighter uppercase"
                        >
                          {doc.fiuStatus === "fraud"
                            ? "Fraud Detected"
                            : "Clear / Not Fraud"}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      {doc.findings
                        ?.filter((f) => f.type === "fiu")
                        .map((finding) => (
                          <div
                            key={finding.id}
                            className="group relative rounded-2xl border border-border/40 bg-accent/5 p-4 transition-all hover:bg-accent/10"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-7 w-7 border border-border/40 ring-1 ring-background">
                                  <AvatarImage
                                    src={finding.user.image || undefined}
                                  />
                                  <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                                    {finding.user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-foreground/80">
                                    {finding.user.name}
                                  </span>
                                  <span className="text-[8px] font-medium text-muted-foreground/50">
                                    {formatDistanceToNow(
                                      new Date(finding.createdAt),
                                      { addSuffix: true }
                                    )}
                                  </span>
                                </div>
                              </div>
                              {finding.status && (
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1.5 text-[8px] font-bold tracking-tight text-muted-foreground/60 uppercase"
                                >
                                  {finding.status}
                                </Badge>
                              )}
                            </div>
                            <div className="rounded-xl border border-border/10 bg-background/60 p-3 text-[11px] leading-relaxed text-foreground/70 italic shadow-sm">
                              "{finding.content}"
                            </div>
                          </div>
                        ))}

                      {doc.fiuStatus !== "pending" &&
                        !doc.findings?.some((f) => f.type === "fiu") && (
                          <div className="group relative rounded-2xl border border-border/40 bg-accent/5 p-4 opacity-70 transition-all hover:bg-accent/10">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-7 w-7 border border-border/40">
                                  <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                                    {doc.investigator?.name?.charAt(0) || "F"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-foreground/80">
                                    {doc.investigator?.name ||
                                      "Lead Investigator"}
                                  </span>
                                  <span className="text-[8px] font-medium text-muted-foreground/50">
                                    Final Determination
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-xl border border-border/10 bg-background/60 p-3 text-[11px] leading-relaxed text-foreground/70 italic">
                              "{doc.fiuNotes || "No notes provided."}"
                            </div>
                          </div>
                        )}

                      {doc.fiuStatus === "pending" &&
                        !doc.findings?.some((f) => f.type === "fiu") && (
                          <div className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-muted/5">
                            <p className="text-[10px] font-medium text-muted-foreground/40">
                              No FIU findings yet.
                            </p>
                          </div>
                        )}
                    </div>
                  </section>

                  {/* Stage 2: Claims Approval */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <h2 className="text-[10px] font-black tracking-widest text-foreground/60 uppercase">
                          Claims Approval
                        </h2>
                      </div>
                      {doc.approvalStatus !== "pending" && (
                        <Badge
                          variant={
                            doc.approvalStatus === "approved"
                              ? "success"
                              : "destructive"
                          }
                          className="text-[9px] font-black tracking-tighter uppercase"
                        >
                          {doc.approvalStatus}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      {doc.findings
                        ?.filter((f) => f.type === "cap")
                        .map((finding) => (
                          <div
                            key={finding.id}
                            className="group relative rounded-2xl border border-border/40 bg-accent/5 p-4 transition-all hover:bg-accent/10"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-7 w-7 border border-border/40 ring-1 ring-background">
                                  <AvatarImage
                                    src={finding.user.image || undefined}
                                  />
                                  <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                                    {finding.user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-foreground/80">
                                    {finding.user.name}
                                  </span>
                                  <span className="text-[8px] font-medium text-muted-foreground/50">
                                    {formatDistanceToNow(
                                      new Date(finding.createdAt),
                                      { addSuffix: true }
                                    )}
                                  </span>
                                </div>
                              </div>
                              {finding.status && (
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1.5 text-[8px] font-bold tracking-tight text-muted-foreground/60 uppercase"
                                >
                                  {finding.status}
                                </Badge>
                              )}
                            </div>
                            <div className="rounded-xl border border-border/10 bg-background/60 p-3 text-[11px] leading-relaxed text-foreground/70 italic shadow-sm">
                              "{finding.content}"
                            </div>
                          </div>
                        ))}

                      {doc.approvalStatus !== "pending" &&
                        !doc.findings?.some((f) => f.type === "cap") && (
                          <div className="group relative rounded-2xl border border-border/40 bg-accent/5 p-4 opacity-70 transition-all hover:bg-accent/10">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-7 w-7 border border-border/40">
                                  <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                                    {(
                                      doc.approver?.name ||
                                      doc.rejector?.name ||
                                      "C"
                                    ).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-foreground/80">
                                    {doc.approver?.name ||
                                      doc.rejector?.name ||
                                      "Lead Processor"}
                                  </span>
                                  <span className="text-[8px] font-medium text-muted-foreground/50">
                                    Final Decision
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-xl border border-border/10 bg-background/60 p-3 text-[11px] leading-relaxed text-foreground/70 italic">
                              "
                              {doc.approvalNotes ||
                                "No justification provided."}
                              "
                            </div>
                          </div>
                        )}

                      {doc.approvalStatus === "pending" &&
                        !doc.findings?.some((f) => f.type === "cap") && (
                          <div className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-muted/5">
                            <p className="text-[10px] font-medium text-muted-foreground/40">
                              No CAP findings yet.
                            </p>
                          </div>
                        )}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    </div>
  )
}
