import { useState } from "react"
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
            "flex shrink-0 items-center border-b border-border/40 bg-background/80 backdrop-blur-sm",
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

                {doc.approvalStatus !== "pending" && (
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
                <div className="flex gap-1 rounded-xl bg-muted/30 p-1">
                  <button
                    onClick={() => setActiveRightTab("analysis")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
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
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                      effectiveRightTab === "chat"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                        : "text-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Assistant
                  </button>
                  {doc.approvalStatus !== "pending" && (
                    <button
                      onClick={() => setActiveRightTab("notes")}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
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
              )}
              <div className="flex-1" />
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
              <div className="h-full space-y-6 overflow-y-auto p-6">
                <section className="space-y-4 font-bold tracking-widest text-foreground/60 uppercase">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h2 className="text-xs font-bold tracking-widest text-foreground/60 uppercase">
                      Review Notes
                    </h2>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-accent/20 p-5 shadow-inner">
                    <p className="mb-2 px-1 text-[10px] font-bold tracking-widest text-muted-foreground/30 uppercase">
                      Reviewer's Justification:
                    </p>
                    <div className="rounded-lg border border-border/10 bg-background/80 p-3 text-xs leading-relaxed text-foreground/60 italic shadow-sm">
                      "{doc.approvalNotes || "No notes provided"}"
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </>
    </div>
  )
}
