import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ReviewConfirmDialogProps {
  confirmDialog: {
    open: boolean
    type: "approve" | "reject" | "mark_fraud" | "mark_not_fraud" | null
  }
  setConfirmDialog: (dialog: {
    open: boolean
    type: "approve" | "reject" | "mark_fraud" | "mark_not_fraud" | null
  }) => void
  handleConfirmAction: () => void
  isLoading: boolean
}

export function ReviewConfirmDialog({
  confirmDialog,
  setConfirmDialog,
  handleConfirmAction,
  isLoading,
}: ReviewConfirmDialogProps) {
  return (
    <Dialog
      open={confirmDialog.open}
      onOpenChange={(open) =>
        !open && setConfirmDialog({ open: false, type: null })
      }
    >
      <DialogContent className="rounded-2xl border-border/40 bg-background/95 shadow-2xl backdrop-blur-md sm:max-w-[400px]">
        <DialogHeader className="flex flex-col items-center pt-4">
          <div
            className={cn(
              "mb-4 flex h-12 w-12 animate-in items-center justify-center rounded-full duration-300 zoom-in",
              confirmDialog.type === "approve"
                ? "bg-green-500/10 text-green-500"
                : confirmDialog.type === "mark_fraud"
                  ? "bg-orange-500/10 text-orange-500"
                  : confirmDialog.type === "mark_not_fraud"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-destructive/10 text-destructive"
            )}
          >
            {confirmDialog.type === "approve" ||
            confirmDialog.type === "mark_not_fraud" ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>
          <DialogTitle className="text-center text-lg font-bold tracking-tight">
            {confirmDialog.type === "approve"
              ? "Confirm Approval"
              : confirmDialog.type === "reject"
                ? "Confirm Rejection"
                : confirmDialog.type === "mark_fraud"
                  ? "Confirm Fraud Finding"
                  : "Confirm Clear Finding"}
          </DialogTitle>
          <DialogDescription className="pt-1 text-center text-[13px] text-muted-foreground/70">
            {confirmDialog.type === "approve"
              ? "Are you sure you want to approve this claim? This will finalize the payment process."
              : confirmDialog.type === "reject"
                ? "Are you sure you want to reject this claim? This action is irreversible."
                : confirmDialog.type === "mark_fraud"
                  ? "Are you sure you want to mark this as fraud? It will be sent to CAP for final rejection."
                  : "Are you sure you want to mark this as not fraud? It will be sent to CAP for final approval."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 px-1 pb-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => setConfirmDialog({ open: false, type: null })}
            className="h-11 rounded-xl border-border/40 text-[10px] font-bold tracking-[0.1em] uppercase hover:bg-muted/50"
          >
            Cancel
          </Button>
          <Button
            variant={
              confirmDialog.type === "approve" ||
              confirmDialog.type === "mark_not_fraud"
                ? "default"
                : "destructive"
            }
            onClick={handleConfirmAction}
            disabled={isLoading}
            className={cn(
              "h-11 rounded-xl text-[10px] font-bold tracking-[0.1em] uppercase shadow-lg",
              confirmDialog.type === "approve"
                ? "bg-green-600 text-white shadow-green-500/20 hover:bg-green-700"
                : confirmDialog.type === "mark_fraud"
                  ? "bg-orange-600 text-white shadow-orange-500/20 hover:bg-orange-700"
                  : confirmDialog.type === "mark_not_fraud"
                    ? "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700"
                    : "shadow-destructive/20"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : confirmDialog.type === "approve" ? (
              "Confirm Approve"
            ) : confirmDialog.type === "reject" ? (
              "Confirm Reject"
            ) : confirmDialog.type === "mark_fraud" ? (
              "Confirm Fraud"
            ) : (
              "Confirm Clear"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
