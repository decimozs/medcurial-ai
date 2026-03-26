import { useState } from "react"
import {
  Undo2,
  CheckCircle2,
  UserPlus,
  Loader2,
  Check,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, stripExtension } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DocumentResponse } from "../types"
import type { UserPresence } from "../hooks/use-review-presence"

interface ReviewHeaderProps {
  doc: DocumentResponse
  isSendDialogOpen: boolean
  setIsSendDialogOpen: (open: boolean) => void
  users: { id: string; name: string; role: string; image: string | null }[]
  notifyMutation: { mutate: (userIds: string[]) => void; isPending: boolean }
  subtitle?: string
  onlineUsers?: UserPresence[]
}

export function ReviewHeader({
  doc,
  isSendDialogOpen,
  setIsSendDialogOpen,
  users,
  notifyMutation,
  subtitle = "Claims Approval Processor",
  onlineUsers = [],
}: ReviewHeaderProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSend = () => {
    if (selectedUserIds.length === 0) return
    notifyMutation.mutate(selectedUserIds)
  }

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
            <h1 className="text-sm font-bold tracking-tight text-foreground/80">
              Reviewing: {stripExtension(doc.name)}
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Realtime Presence Avatars */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center -space-x-2 drop-shadow-sm">
            <TooltipProvider delayDuration={0}>
              {onlineUsers.map((user) => (
                <Tooltip key={user.userId}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7 border-2 border-background ring-2 ring-primary/5 transition-all hover:z-10 hover:scale-110">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="flex flex-col items-center gap-0.5 border-primary/20 bg-background/95 p-2 backdrop-blur-sm"
                  >
                    <p className="text-[10px] font-bold text-foreground">
                      {user.name}
                    </p>
                    <p className="text-[8px] font-medium tracking-widest text-muted-foreground/60 uppercase">
                      {user.role}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            {onlineUsers.length > 5 && (
              <div className="z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-bold text-muted-foreground">
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        )}

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
                Select teammates to notify about this claim for further review
                or medical expertise.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="mb-4 space-y-2">
                <label className="ml-1 text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                  Search Teammates
                </label>
                <div className="relative">
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    placeholder="Search by name or role..."
                    className="h-9 rounded-xl border-border/40 bg-accent/20 pl-9 text-xs transition-all focus:bg-accent/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <label className="ml-1 text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                Select Teammates ({selectedUserIds.length} selected)
              </label>
              <ScrollArea className="mt-2 h-[280px] rounded-xl border border-border/40 bg-accent/5 p-2">
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg p-2 transition-all hover:bg-accent/20",
                        selectedUserIds.includes(user.id)
                          ? "bg-primary/5 ring-1 ring-primary/20"
                          : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border/20">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-[12px] font-bold text-foreground">
                            {user.name}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground/60">
                            {user.role}
                          </span>
                        </div>
                      </div>
                      {selectedUserIds.includes(user.id) && (
                        <div className="rounded-full bg-primary p-1 text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredUsers.length === 0 && searchQuery && (
                    <div className="flex h-32 flex-col items-center justify-center p-4 text-center">
                      <Search className="h-5 w-5 text-muted-foreground/20" />
                      <p className="mt-2 text-[11px] font-medium text-muted-foreground/40">
                        No teammates found for "{searchQuery}"
                      </p>
                    </div>
                  )}
                  {users.length === 0 && !searchQuery && (
                    <div className="flex h-32 flex-col items-center justify-center p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/20" />
                      <p className="mt-2 text-[11px] font-medium text-muted-foreground/40">
                        Loading teammates...
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button
                disabled={
                  selectedUserIds.length === 0 || notifyMutation.isPending
                }
                onClick={handleSend}
                className="w-full rounded-xl text-[11px] font-bold tracking-widest uppercase"
              >
                {notifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Sending Notifications...
                  </>
                ) : (
                  "Confirm Forwarding"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
