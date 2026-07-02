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
  AlertTriangle,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

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
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    type: "approve" | "reject" | "mark_fraud" | "mark_not_fraud" | null
  }) => void
  approveMutationPending: boolean
  rejectMutationPending: boolean
  fiuMutationPending?: boolean
  showChatTab?: boolean
  unit?: "fiu" | "cap"
  addFindingMutation: {
    mutate: (finding: {
      content: string
      type: "fiu" | "cap"
      status?: string
    }) => void
    isPending: boolean
  }
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
  fiuMutationPending = false,
  showChatTab = false,
  unit = "cap",
  addFindingMutation,
}: ReviewConsoleProps) {
  const isPending =
    unit === "fiu"
      ? true // Allow multiple determinations in FIU route
      : doc.approvalStatus === "pending"
  const isCompleted = doc.status === "completed"

  const [enhancedNotes, setEnhancedNotes] = useState("")

  const enhanceMutation = useMutation({
    mutationFn: async (currentNotes: string) => {
      const response = await fetch(
        "http://localhost:8001/analyze/enhance-notes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: currentNotes,
            document_context: JSON.stringify({
              name: doc.name,
              fraudAnalysis: doc.fraudAnalysis,
            }),
          }),
        }
      )
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
                signatureVerification={doc.signatureVerification}
                extractedSignatureImageUrl={
                  doc.imageUrls.signature_crop ||
                  doc.signatureVerification?.extractedSignatureUrl
                }
                isCollapsed={false}
              />
            </div>
          )}
          {activeRightTab === "chat" && showChatTab && (
            <DocumentChatPanel documentId={doc.id} documentName={doc.name} />
          )}
          {activeRightTab === "review" && (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-6">
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h2 className="text-xs font-bold tracking-widest text-foreground/60 uppercase">
                      Review Findings
                    </h2>
                  </div>

                  {/* Multi-User FIU Investigation Results */}
                  {doc.findings?.some(
                    (f) =>
                      f.type === "fiu" &&
                      (f.status === "fraud" || f.status === "not_fraud")
                  ) && (
                    <div className="space-y-3 pb-2">
                      {doc.findings
                        .filter(
                          (f) =>
                            f.type === "fiu" &&
                            (f.status === "fraud" || f.status === "not_fraud")
                        )
                        .map((result, idx) => (
                          <div
                            key={result.id}
                            className="animate-in rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 shadow-sm transition-all fade-in slide-in-from-left-2 hover:bg-orange-500/10"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle
                                  className={cn(
                                    "h-4 w-4",
                                    result.status === "fraud"
                                      ? "text-orange-600"
                                      : "text-blue-600"
                                  )}
                                />
                                <span
                                  className={cn(
                                    "text-[10px] font-black tracking-widest uppercase",
                                    result.status === "fraud"
                                      ? "text-orange-600"
                                      : "text-blue-600"
                                  )}
                                >
                                  Investigation Result {idx + 1}:{" "}
                                  {result.status === "fraud"
                                    ? "Fraud Detected"
                                    : "Clear"}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "h-5 border-orange-500/30 px-2 text-[9px] font-bold uppercase",
                                  result.status === "fraud"
                                    ? "bg-orange-100/50 text-orange-700"
                                    : "bg-blue-100/50 text-blue-700"
                                )}
                              >
                                {result.status === "fraud"
                                  ? "Flagged"
                                  : "Verified"}
                              </Badge>
                            </div>
                            <p className="mb-4 text-xs leading-relaxed font-medium text-foreground/70 italic">
                              "{result.content}"
                            </p>
                            <div className="flex items-center gap-2 border-t border-orange-500/10 pt-3">
                              <Avatar className="h-5 w-5 border border-orange-500/20">
                                <AvatarImage
                                  src={result.user.image || undefined}
                                />
                                <AvatarFallback className="bg-orange-500/20 text-[9px] font-black text-orange-600">
                                  {result.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] font-semibold text-foreground/60">
                                {result.user.name}
                              </span>
                              <span className="text-[9px] text-muted-foreground/30">
                                •
                              </span>
                              <span className="text-[9px] font-medium text-muted-foreground/40">
                                {formatDistanceToNow(
                                  new Date(result.createdAt),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {!doc.findings?.some(
                    (f) =>
                      f.type === "fiu" &&
                      (f.status === "fraud" || f.status === "not_fraud")
                  ) &&
                    doc.fiuStatus !== "pending" && (
                      <div className="animate-in rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 shadow-sm fade-in slide-in-from-top-2">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase">
                              Final Investigation Result:{" "}
                              {doc.fiuStatus === "fraud"
                                ? "Fraud Detected"
                                : "Clear"}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="h-5 border-orange-500/30 bg-orange-100 px-2 text-[9px] font-bold text-orange-700 uppercase"
                          >
                            {doc.fiuStatus === "fraud" ? "Flagged" : "Verified"}
                          </Badge>
                        </div>
                        <p className="mb-4 text-xs leading-relaxed font-medium text-foreground/70 italic">
                          "{doc.fiuNotes || "No detailed notes provided."}"
                        </p>
                      </div>
                    )}

                  {/* Teammate Findings Timeline */}
                  {doc.findings && doc.findings.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2 px-1">
                        <MessageSquare className="h-3.5 w-3.5 text-primary/60" />
                        <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">
                          Teammate Contributions
                        </h3>
                      </div>
                      <div className="space-y-4 px-1">
                        {doc.findings
                          .filter(
                            (f) =>
                              !f.status ||
                              (f.type !== "fiu" && f.type !== "cap")
                          ) // Only show regular findings here
                          .map((finding) => (
                            <div
                              key={finding.id}
                              className="group relative animate-in fade-in slide-in-from-top-1"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5 border border-border/40 transition-transform group-hover:scale-110">
                                    <AvatarImage
                                      src={finding.user.image || undefined}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-[8px] font-bold text-primary">
                                      {finding.user.name
                                        ? finding.user.name.charAt(0)
                                        : "T"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-foreground/80">
                                      {finding.user.name}
                                    </span>
                                    <span className="text-[8px] font-medium text-muted-foreground/40">
                                      {finding.type === "fiu"
                                        ? "Fraud Unit"
                                        : "Claims Unit"}{" "}
                                      •{" "}
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
                                    className="h-4 border-primary/20 bg-primary/5 px-1 text-[8px] font-black tracking-tighter text-primary/60 uppercase"
                                  >
                                    {finding.status}
                                  </Badge>
                                )}
                              </div>
                              <div className="rounded-xl border border-border/10 bg-accent/5 p-3 text-[11px] leading-relaxed text-foreground/70 italic shadow-sm transition-all group-hover:bg-accent/10">
                                "{finding.content}"
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Pinned Justification Footer */}
              <div className="scrollbar-hide shrink-0 border-t border-border/40 bg-background/80 p-6 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="mx-1 flex items-center justify-between">
                      <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                        {unit === "fiu"
                          ? "Investigation Notes"
                          : "Approval Justification"}
                      </label>
                      {isPending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1.5 bg-primary/10 px-2 text-[10px] font-semibold text-primary transition-all hover:bg-primary/20"
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
                        className="min-h-[140px] resize-none rounded-xl border-border/40 bg-accent/20 text-[13px] leading-relaxed font-medium focus:ring-primary/20 disabled:opacity-50"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={!isPending || enhanceMutation.isPending}
                      />
                    ) : (
                      <div className="flex animate-in flex-col gap-3 duration-300 fade-in slide-in-from-bottom-2">
                        <div className="relative pt-2">
                          <span className="absolute top-0 left-3 rounded bg-background px-1 text-[9px] font-bold tracking-wider text-blue-500 uppercase">
                            Original Notes
                          </span>
                          <Textarea
                            className="min-h-[80px] resize-none rounded-xl border-blue-500/30 bg-blue-500/5 text-[13px] leading-relaxed font-medium shadow-sm focus-visible:ring-0"
                            value={notes}
                            readOnly
                          />
                        </div>
                        <div className="-my-1 flex justify-center opacity-60">
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="relative pt-2">
                          <span className="absolute top-0 left-3 rounded bg-background px-1 text-[9px] font-bold tracking-wider text-primary uppercase shadow-sm">
                            AI Enhanced
                          </span>
                          <Textarea
                            className="min-h-[100px] resize-none rounded-xl border-primary/40 bg-primary/5 text-[13px] leading-relaxed font-medium shadow-[0_0_15px_rgba(var(--primary),0.08)] focus-visible:ring-0"
                            value={enhancedNotes}
                            onChange={(e) => setEnhancedNotes(e.target.value)}
                          />
                        </div>
                        <div className="mt-1 flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEnhancedNotes("")}
                            className="text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            Discard
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNotes(enhancedNotes)
                              setEnhancedNotes("")
                            }}
                            className="bg-primary text-xs text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          addFindingMutation.mutate({
                            content: notes,
                            type: unit,
                          })
                          setNotes("")
                          setEnhancedNotes("")
                        }}
                        disabled={
                          addFindingMutation.isPending ||
                          !notes.trim() ||
                          enhanceMutation.isPending
                        }
                        variant="ghost"
                        className="h-10 w-full rounded-xl border border-primary/20 bg-primary/5 text-[10px] font-bold tracking-widest text-primary uppercase transition-all hover:bg-primary/10"
                      >
                        {addFindingMutation.isPending ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ClipboardCheck className="mr-2 h-3.5 w-3.5" />
                        )}
                        Post Review Note
                      </Button>
                    </div>
                  )}

                  {isPending ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {unit === "fiu" ? (
                        <>
                          <Button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                type: "mark_fraud",
                              })
                            }
                            disabled={
                              fiuMutationPending ||
                              !notes.trim() ||
                              enhanceMutation.isPending
                            }
                            variant="destructive"
                            className="h-12 rounded-xl border-2 border-orange-500/20 bg-orange-600 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg shadow-orange-500/10 hover:bg-orange-700"
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Mark Fraud
                          </Button>
                          <Button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                type: "mark_not_fraud",
                              })
                            }
                            disabled={
                              fiuMutationPending ||
                              !notes.trim() ||
                              enhanceMutation.isPending
                            }
                            className="h-12 rounded-xl bg-blue-600 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg shadow-blue-500/10 hover:bg-blue-700"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Clear
                          </Button>
                        </>
                      ) : (
                        <>
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
                            Reject
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
                            Approve
                          </Button>
                        </>
                      )}
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
                            Justification:
                          </p>
                          <div className="rounded-lg border border-border/10 bg-background/80 p-3 text-xs leading-relaxed text-foreground/60 italic shadow-sm">
                            "{doc.approvalNotes}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
