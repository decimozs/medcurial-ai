import {
  Undo2,
  CheckCircle2,
  UserPlus,
  XCircle,
  ShieldQuestion,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { stripExtension } from "@/lib/utils"
import type { DocumentResponse } from "../types"

interface ReviewHeaderProps {
  doc: DocumentResponse
  isSendDialogOpen: boolean
  setIsSendDialogOpen: (open: boolean) => void
  subtitle?: string
}

export function ReviewHeader({
  doc,
  isSendDialogOpen,
  setIsSendDialogOpen,
  subtitle = "Claims Approval Processor",
}: ReviewHeaderProps) {
  const isPending = doc.approvalStatus === "pending"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background/50 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="-mr-[7px] -ml-[10px] rounded-full hover:bg-primary/5"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-15 w-px bg-border/40" />
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="max-w-[200px] truncate text-sm font-bold tracking-tight text-foreground/80">
              Reviewing: {stripExtension(doc.name)}
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-primary/20 bg-primary/5 text-[10px] font-bold tracking-widest text-primary uppercase transition-all hover:bg-primary/10"
            >
              <UserPlus className="mr-2 h-3.5 w-3.5" />
              Send for Review
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send for Review</DialogTitle>
              <DialogDescription>
                Select a senior investigator or medical expert to review this
                claim.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                  Select Recipient
                </label>
                <Select>
                  <SelectTrigger className="rounded-xl border-border/40 bg-accent/20">
                    <SelectValue placeholder="Choose an investigator..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="dr-smith">
                      Dr. Sarah Smith (Senior Medical Auditor)
                    </SelectItem>
                    <SelectItem value="inv-jones">
                      Mark Jones (Lead Fraud Investigator)
                    </SelectItem>
                    <SelectItem value="legal-team">
                      Legal Compliance Team
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                  Internal Note (Optional)
                </label>
                <Textarea
                  placeholder="Briefly describe why you are escalating this claim..."
                  className="min-h-[100px] resize-none rounded-xl border-border/40 bg-accent/20 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsSendDialogOpen(false)
                  toast.success("Document forwarded for review")
                }}
                className="w-full rounded-xl text-[11px] font-bold tracking-widest uppercase"
              >
                Confirm Forwarding
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mx-2 h-15 w-px bg-border/40" />

        {doc.approvalStatus === "approved" && (
          <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[11px] font-bold tracking-wider text-green-600 uppercase dark:text-green-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </div>
        )}
        {doc.approvalStatus === "rejected" && (
          <div className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-[11px] font-bold tracking-wider text-destructive uppercase">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </div>
        )}
        {isPending && (
          <div className="flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-[11px] font-bold tracking-wider text-yellow-600 uppercase dark:text-yellow-500">
            <ShieldQuestion className="h-3.5 w-3.5" />
            Pending Review
          </div>
        )}
      </div>
    </header>
  )
}
