import { Link } from "@tanstack/react-router"
import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Search,
  MessageCircle,
  Clock,
  ArrowDownAZ,
  ArrowUpZA,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useChatSessions, type ChatSession } from "../hooks/use-chat-sessions"

export function ChatSidebar() {
  const {
    activeId,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    expandedGroups,
    setExpandedGroups,
    isLoading,
    filteredSessions,
    groupedSessions,
    createSession,
    deleteSession,
  } = useChatSessions()

  const renderSessionLink = (session: ChatSession) => (
    <div
      key={session.id}
      className="group/session relative mb-0.5 grid grid-cols-[1fr_auto] items-center overflow-hidden rounded-xl transition-all group-hover:bg-accent/30"
    >
      <Link
        to="/chat/$id"
        params={{ id: session.id }}
        className={cn(
          "flex min-w-0 flex-col gap-0.5 rounded-xl p-3 no-underline transition-all",
          activeId === session.id
            ? "bg-primary/5 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="block truncate text-xs font-semibold">
          {session.title}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] opacity-40">
          <Clock className="h-2.5 w-2.5" />
          <span className="truncate">
            {new Date(session.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </Link>

      <div
        className={cn(
          "shrink-0 px-2 transition-opacity",
          activeId === session.id
            ? "opacity-100"
            : "opacity-0 group-hover/session:opacity-100"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-primary/10"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl">
            <DropdownMenuItem
              className="mx-1 cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => deleteSession.mutate(session.id)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs font-medium">Delete Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeId === session.id && (
        <div className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
    </div>
  )

  return (
    <div className="flex h-full w-80 flex-col border-r border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground/80">
              Agent Manager
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/40 transition-all hover:bg-primary/5 hover:text-primary"
              title={sortOrder === "asc" ? "Newest First" : "Oldest First"}
            >
              {sortOrder === "asc" ? (
                <ArrowDownAZ className="h-4 w-4" />
              ) : (
                <ArrowUpZA className="h-4 w-4" />
              )}
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-primary/10 text-primary transition-all hover:bg-primary/20"
              onClick={() => createSession.mutate()}
              disabled={createSession.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-full border-none bg-accent/30 pr-3 pl-8 text-xs font-medium transition-all outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <Separator className="opacity-40" />

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3 pt-4">
          <div className="mb-3 flex items-center px-2">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
              {search ? "Search Results" : "History"}
            </span>
          </div>

          <div className="space-y-1">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 p-3">
                  <Skeleton className="h-4 w-3/4 rounded-full opacity-20" />
                  <Skeleton className="h-3 w-1/2 rounded-full opacity-10" />
                </div>
              ))
            ) : filteredSessions.length === 0 ? (
              <div className="animate-in px-4 py-10 text-center duration-500 fade-in">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs font-medium text-muted-foreground/40">
                  {search
                    ? "No matching conversations"
                    : "No conversations yet"}
                </p>
                {search && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearch("")}
                    className="mt-1 h-auto p-0 text-[10px] text-primary hover:no-underline"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : search ? (
              filteredSessions.map(renderSessionLink)
            ) : (
              <Accordion
                type="multiple"
                value={expandedGroups}
                onValueChange={setExpandedGroups}
                className="w-full space-y-1 border-none"
              >
                {Object.entries(groupedSessions).map(([dateStr, entries]) => (
                  <AccordionItem
                    value={dateStr}
                    key={dateStr}
                    className="border-none"
                  >
                    <AccordionTrigger className="group/trigger px-1 py-1.5 no-underline transition-all hover:no-underline [&[data-state=open]>svg]:rotate-90">
                      <div className="flex w-full items-center gap-3 text-left">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors group-hover/trigger:bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary/40 transition-colors group-hover/trigger:text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold tracking-tight text-foreground/70 transition-colors group-hover/trigger:text-primary">
                            {dateStr}
                          </p>
                          <p className="text-[9px] font-bold tracking-widest text-muted-foreground/20 uppercase">
                            {entries.length} chats
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1 border-none px-0 pt-1.5 pb-2">
                      {entries.map(renderSessionLink)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="bg-accent/10 p-4">
        <Button
          variant="outline"
          className="h-10 w-full justify-start gap-2 rounded-xl border border-border/40 bg-background/50 text-xs font-semibold transition-all hover:bg-primary/5 hover:text-primary"
          onClick={() => createSession.mutate()}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
            <Plus className="h-3 w-3" />
          </div>
          New Conversation
        </Button>
      </div>
    </div>
  )
}
