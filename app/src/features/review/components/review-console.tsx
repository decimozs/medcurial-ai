import { cn } from "@/lib/utils"
import {
  BarChart2,
  ClipboardCheck,
  FileText,
  MessageSquare,
  XCircle,
  CheckCircle2,
  Loader2,
  ChevronsUpDown,
  Wand2,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useMutation } from "@tanstack/react-query"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FraudAnalysisPanel } from "@/features/review/components/fraud-analysis-panel"
import { DocumentChatPanel } from "@/features/documents/components/document-chat-panel"
import type { DocumentResponse, RightTab } from "../types"

interface ReviewConsoleProps {
  doc: DocumentResponse
  activeRightTab: RightTab
  setActiveRightTab: (tab: RightTab) => void
  fraudPanelCollapsed: boolean
  setFraudPanelCollapsed: (collapsed: boolean) => void
  notes: string
  setNotes: (notes: string) => void
  setConfirmDialog: (dialog: {
    open: boolean
    type: "approve" | "reject" | null
  }) => void
  approveMutationPending: boolean
  rejectMutationPending: boolean
  showChatTab?: boolean
}

export function ReviewConsole({
  doc,
  activeRightTab,
  setActiveRightTab,
  fraudPanelCollapsed,
  setFraudPanelCollapsed,
  notes,
  setNotes,
  setConfirmDialog,
  approveMutationPending,
  rejectMutationPending,
  showChatTab = false,
}: ReviewConsoleProps) {
  const isPending = doc.approvalStatus === "pending"
  const isCompleted = doc.status === "completed"

  const [enhancedNotes, setEnhancedNotes] = useState("")

  const enhanceMutation = useMutation({
    mutationFn: async (currentNotes: string) => {
      const response = await fetch("http://localhost:8001/analyze/enhance-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: currentNotes,
          document_context: JSON.stringify({
            name: doc.name,
            fraudAnalysis: doc.fraudAnalysis,
          }),
        }),
      })
      if (!response.ok) throw new Error("Failed to enhance notes")
      const data = await response.json()
      return data.enhanced_notes
    },
    onSuccess: (improvedNotes) => {
      setEnhancedNotes(improvedNotes)
    },
  })

  if (!isCompleted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-6 p-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
          <Loader2 className="relative z-10 h-12 w-12 animate-spin text-primary" />
        </div>
        <div className="z-10 space-y-3">
          <h3 className="text-sm font-bold tracking-[0.2em] text-foreground/80 uppercase">
            Neural Analysis Active
          </h3>
          <p className="mx-auto max-w-[280px] text-[11px] leading-relaxed font-medium text-muted-foreground">
            Our AI agents are currently extracting text nodes and performing
            deep fraud detection. The investigation console will be available
            shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-l border-border/40 bg-background/40 transition-all duration-300",
        fraudPanelCollapsed ? "w-16" : "w-[480px]"
      )}
    >
      {/* Panel Header w/ Tabs */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-border/40 bg-background/80 backdrop-blur-sm transition-all",
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
                      activeRightTab === "analysis"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <BarChart2 className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Analysis</TooltipContent>
              </Tooltip>

              {showChatTab && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setActiveRightTab("chat")
                        setFraudPanelCollapsed(false)
                      }}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md transition-all",
                        activeRightTab === "chat"
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Assistant</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveRightTab("review")
                      setFraudPanelCollapsed(false)
                    }}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md transition-all",
                      activeRightTab === "review"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <ClipboardCheck className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Decision</TooltipContent>
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
                        activeRightTab === "notes"
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
          <div className="flex w-full items-center">
            <div className="flex flex-1 gap-1 rounded-xl bg-muted/30 p-1">
              <button
                onClick={() => setActiveRightTab("analysis")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                  activeRightTab === "analysis"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                Analysis
              </button>
              {showChatTab && (
                <button
                  onClick={() => setActiveRightTab("chat")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                    activeRightTab === "chat"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                      : "text-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Assistant
                </button>
              )}
              <button
                onClick={() => setActiveRightTab("review")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                  activeRightTab === "review"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Decision
              </button>
              {doc.approvalStatus !== "pending" && (
                <button
                  onClick={() => setActiveRightTab("notes")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                    activeRightTab === "notes"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                      : "text-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Notes
                </button>
              )}
            </div>
            <button
              onClick={() => setFraudPanelCollapsed(true)}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-all hover:bg-muted/60 hover:text-foreground"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 rotate-90" />
            </button>
          </div>
        )}
      </div>

      {!fraudPanelCollapsed && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeRightTab === "analysis" && (
            <div className="h-full overflow-y-auto">
              <FraudAnalysisPanel
                data={doc.fraudAnalysis}
                isCollapsed={false}
              />
            </div>
          )}
          {activeRightTab === "chat" && showChatTab && (
            <DocumentChatPanel documentId={doc.id} documentName={doc.name} />
          )}
          {activeRightTab === "review" && (
            <div className="h-full space-y-6 overflow-y-auto p-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h2 className="text-xs font-bold tracking-widest text-foreground/60 uppercase">
                    Review Findings
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mx-1">
                      <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                        Investigation Notes
                      </label>
                      {isPending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold gap-1.5"
                          disabled={enhanceMutation.isPending || !notes.trim()}
                          onClick={() => enhanceMutation.mutate(notes)}
                        >
                          {enhanceMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          Enhance Notes
                        </Button>
                      )}
                    </div>
                    {!enhancedNotes ? (
                      <Textarea
                        placeholder="Enter detailed findings, discrepancy notes, or justification for approval/rejection..."
                        className="min-h-[200px] resize-none rounded-xl border-border/40 bg-accent/20 text-[13px] leading-relaxed font-medium focus:ring-primary/20 disabled:opacity-50"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={!isPending || enhanceMutation.isPending}
                      />
                    ) : (
                      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="relative pt-2">
                          <span className="absolute top-0 left-3 bg-background px-1 text-[9px] font-bold uppercase tracking-wider text-blue-500 rounded">
                            Original Notes
                          </span>
                          <Textarea
                            className="min-h-[100px] resize-none rounded-xl border-blue-500/30 bg-blue-500/5 text-[13px] leading-relaxed font-medium focus-visible:ring-0 shadow-sm"
                            value={notes}
                            readOnly
                          />
                        </div>
                        <div className="flex justify-center -my-1 opacity-60">
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="relative pt-2">
                          <span className="absolute top-0 left-3 bg-background px-1 text-[9px] font-bold uppercase tracking-wider text-primary rounded shadow-sm">
                            AI Enhanced
                          </span>
                          <Textarea
                            className="min-h-[140px] resize-none rounded-xl border-primary/40 bg-primary/5 text-[13px] leading-relaxed font-medium focus-visible:ring-0 shadow-[0_0_15px_rgba(var(--primary),0.08)]"
                            value={enhancedNotes}
                            onChange={(e) => setEnhancedNotes(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 justify-end mt-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEnhancedNotes("")}
                            className="text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            Discard AI Context
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setNotes(enhancedNotes)
                              setEnhancedNotes("")
                            }}
                            className="text-xs bg-primary text-primary-foreground shadow-sm hover:scale-[1.02] transition-transform"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Use Enhanced Version
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isPending ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                       <Button
                        onClick={() =>
                          setConfirmDialog({ open: true, type: "reject" })
                        }
                        disabled={
                          rejectMutationPending ||
                          approveMutationPending ||
                          !notes.trim() ||
                          enhanceMutation.isPending
                        }
                        variant="destructive"
                        className="h-12 rounded-xl text-[10px] font-bold tracking-widest uppercase"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Claim
                      </Button>
                      <Button
                        onClick={() =>
                          setConfirmDialog({ open: true, type: "approve" })
                        }
                        disabled={
                          approveMutationPending ||
                          rejectMutationPending ||
                          !notes.trim() ||
                          enhanceMutation.isPending
                        }
                        className="h-12 rounded-xl bg-green-600 text-[10px] font-bold tracking-widest text-white uppercase hover:bg-green-700"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve Claim
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/40 bg-accent/20 p-5 shadow-inner">
                      <div className="mb-4 flex flex-col items-center gap-2">
                        {doc.approvalStatus === "approved" ? (
                          <>
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                            <p className="text-[11px] font-bold tracking-widest text-green-600 uppercase">
                              Claim Approved
                            </p>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-10 w-10 text-destructive" />
                            <p className="text-[11px] font-bold tracking-widest text-destructive uppercase">
                              Claim Rejected
                            </p>
                          </>
                        )}
                      </div>
                      {doc.approvalNotes && (
                        <div className="mt-3 border-t border-border/20 pt-4">
                          <p className="mb-2 px-1 text-[10px] font-bold tracking-widest text-muted-foreground/30 uppercase">
                            Reviewer's Justification:
                          </p>
                          <div className="rounded-lg border border-border/10 bg-background/80 p-3 text-xs leading-relaxed text-foreground/60 italic shadow-sm">
                            "{doc.approvalNotes}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
          {activeRightTab === "notes" && (
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

    </div>
  )
}
