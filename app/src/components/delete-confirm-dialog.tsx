import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn, stripExtension } from '@/lib/utils';
import { Loader2, ShieldAlert } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name displayed in the prompt and that the user must type */
  itemName: string;
  /** Count of items when doing a batch delete. Omit for single. */
  itemCount?: number;
  isPending?: boolean;
  onConfirm: () => void;
  /** Describes the type of item, e.g. "signature", "document" */
  itemType?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName: rawItemName,
  itemCount,
  isPending,
  onConfirm,
  itemType = 'item',
}: DeleteConfirmDialogProps) {
  const itemName = stripExtension(rawItemName);
  const [value, setValue] = useState('');

  const isBatch = typeof itemCount === 'number' && itemCount > 1;
  const confirmPhrase = isBatch
    ? `delete ${itemCount} ${itemType}s`
    : itemName;
  const isMatch = value.trim() === confirmPhrase;

  function handleOpenChange(next: boolean) {
    if (!next) setValue('');
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!isMatch || isPending) return;
    onConfirm();
    setValue('');
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {isBatch ? `Delete ${itemCount} ${itemType}s?` : `Delete ${itemType}?`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/70 mt-0.5">
                This action is <span className="font-bold text-destructive">permanent</span> and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isBatch && (
            <div className="px-3 py-2.5 rounded-lg bg-muted/30 border border-border/40">
              <p className="text-[11px] font-medium text-muted-foreground/60 mb-0.5">Item</p>
              <p className="text-sm font-semibold text-foreground truncate">{itemName}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              Type{' '}
              <span className="font-mono text-destructive/80 select-all">
                {confirmPhrase}
              </span>{' '}
              to confirm
            </label>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder={confirmPhrase}
              className={cn(
                "w-full h-10 px-4 rounded-xl border text-sm font-medium bg-background transition-all outline-none",
                isMatch
                  ? "border-destructive/50 text-destructive focus:ring-1 focus:ring-destructive/30"
                  : "border-border/40 focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
              )}
            />
            {value.length > 0 && !isMatch && (
              <p className="text-[10px] text-destructive/60 font-medium">
                Phrase doesn't match — keep typing
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent/50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMatch || isPending}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              isMatch && !isPending
                ? "bg-destructive text-white hover:bg-destructive/90 shadow-sm shadow-destructive/20"
                : "bg-destructive/20 text-destructive/40 cursor-not-allowed"
            )}
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isBatch ? `Delete ${itemCount} ${itemType}s` : `Delete ${itemType}`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
