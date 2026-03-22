import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  Calendar
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useQueryState } from "nuqs"
import { toast } from "sonner"
import React from "react"
import { useAppStore } from "@/lib/store"

interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export function ChatSidebar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id: activeId } = useParams({ strict: false }) as { id?: string }
  const [search, setSearch] = useQueryState('s', {
    defaultValue: '',
    shallow: true,
  })

  const {
    chatSortOrder: sortOrder,
    setChatSortOrder: setSortOrder,
    chatExpandedGroups: expandedGroups,
    setChatExpandedGroups: setExpandedGroups,
    addChatExpandedGroup: addExpandedGroup
  } = useAppStore()

  const { data: sessions, isLoading } = useQuery<ChatSession[]>({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/v1/chat')
      if (!response.ok) throw new Error('Failed to fetch chat sessions')
      return response.json()
    },
  })

  const filteredSessions = React.useMemo(() => {
    if (!sessions) return []
    let filtered = sessions
    if (search) {
      filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    }
    return [...filtered].sort((a, b) => {
      const da = new Date(a.updatedAt).getTime()
      const db = new Date(b.updatedAt).getTime()
      return sortOrder === 'asc' ? da - db : db - da
    })
  }, [sessions, search, sortOrder])

  const groupedSessions = React.useMemo(() => {
    if (!filteredSessions) return {}
    return filteredSessions.reduce((acc, session) => {
      const dateStr = new Date(session.updatedAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      })
      if (!acc[dateStr]) acc[dateStr] = []
      acc[dateStr].push(session)
      return acc
    }, {} as Record<string, ChatSession[]>)
  }, [filteredSessions])

  React.useEffect(() => {
    if (activeId && sessions) {
      const active = sessions.find(s => s.id === activeId)
      if (active) {
        const dateStr = new Date(active.updatedAt).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        })
        if (!expandedGroups.includes(dateStr)) {
          addExpandedGroup(dateStr)
        }
      }
    }
  }, [activeId, sessions])

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:3000/api/v1/chat', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to create chat')
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      navigate({ to: '/chat/$id', params: { id: data.id } })
      toast.success('New chat session created')
    },
    onError: () => {
      toast.error('Failed to create chat session')
    }
  })

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`http://localhost:3000/api/v1/chat/${sessionId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete chat')
      return response.json()
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      if (activeId === sessionId) {
        navigate({ to: '/chat' })
      }
      toast.success('Chat deleted')
    },
    onError: () => {
      toast.error('Failed to delete chat')
    }
  })

  const renderSessionLink = (session: ChatSession) => (
    <div key={session.id} className="relative group/session grid grid-cols-[1fr_auto] items-center mb-0.5 overflow-hidden group-hover:bg-accent/30 rounded-xl transition-all">
      <Link
        to="/chat/$id"
        params={{ id: session.id }}
        className={cn(
          "flex flex-col gap-0.5 p-3 min-w-0 no-underline rounded-xl transition-all",
          activeId === session.id
            ? "bg-primary/5 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="text-xs font-semibold truncate block">
          {session.title}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] opacity-40">
          <Clock className="w-2.5 h-2.5" />
          <span className="truncate">{new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </Link>

      <div className={cn(
        "px-2 transition-opacity shrink-0",
        activeId === session.id ? "opacity-100" : "opacity-0 group-hover/session:opacity-100"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl">
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg mx-1"
              onClick={() => deleteSessionMutation.mutate(session.id)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs font-medium">Delete Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeId === session.id && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full border-r border-border/40 bg-card/30 backdrop-blur-sm w-80">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground/80">Agent Manager</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 w-8 rounded-full hover:bg-primary/5 text-muted-foreground/40 hover:text-primary flex items-center justify-center transition-all"
              title={sortOrder === 'asc' ? "Newest First" : "Oldest First"}
            >
              {sortOrder === 'asc' ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpZA className="w-4 h-4" />}
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-xs rounded-full bg-accent/30 border-none outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/30 transition-all font-medium"
          />
        </div>
      </div>

      <Separator className="opacity-40" />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 pt-4">
          <div className="flex items-center px-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              {search ? 'Search Results' : 'History'}
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
              <div className="text-center py-10 px-4 animate-in fade-in duration-500">
                <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/40 font-medium">
                  {search ? 'No matching conversations' : 'No conversations yet'}
                </p>
                {search && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearch('')}
                    className="text-[10px] text-primary h-auto p-0 mt-1 hover:no-underline"
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
                  <AccordionItem value={dateStr} key={dateStr} className="border-none">
                    <AccordionTrigger className="no-underline hover:no-underline group/trigger py-1.5 px-1 transition-all [&[data-state=open]>svg]:rotate-90">
                      <div className="flex items-center gap-3 w-full text-left">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover/trigger:bg-primary/10 transition-colors">
                          <Calendar className="w-4 h-4 text-primary/40 group-hover/trigger:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold tracking-tight text-foreground/70 truncate group-hover/trigger:text-primary transition-colors">{dateStr}</p>
                          <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">{entries.length} chats</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 pt-1.5 px-0 space-y-1 border-none">
                      {entries.map(renderSessionLink)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 bg-accent/10">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-10 rounded-xl border-border/40 hover:bg-primary/5 hover:text-primary transition-all text-xs font-semibold bg-background/50 border"
          onClick={() => createSessionMutation.mutate()}
        >
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <Plus className="w-3 h-3" />
          </div>
          New Conversation
        </Button>
      </div>
    </div>
  )
}
