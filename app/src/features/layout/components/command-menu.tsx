import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  FileText,
  LayoutDashboard,
  Files,
  Users,
  Search,
  MessageSquare,
  History,
  Plus,
  LayoutList,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

interface DocumentThumbnail {
  id: string
  name: string
}

interface ChatSession {
  id: string
  title: string
}

interface ChatMessage {
  id: string
  content: string
  sessionId: string
  session: ChatSession
}

interface ChatSearchResult {
  sessions: ChatSession[]
  messages: ChatMessage[]
}

export function CommandTrigger() {
  const setIsOpen = useAppStore((state) => state.setIsCommandMenuOpen)

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="group flex h-10 w-72 items-center justify-between gap-2 rounded-full border border-transparent bg-accent/30 px-4 py-1.5 text-muted-foreground transition-all hover:border-primary/20 hover:bg-accent/50 hover:text-foreground"
    >
      <div className="flex items-center gap-3">
        <Search className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
        <span className="text-[12px] font-medium opacity-50 transition-opacity group-hover:opacity-100">
          Search or type a command...
        </span>
      </div>
      <kbd className="pointer-events-none hidden h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}

export function CommandMenu() {
  const [search, setSearch] = React.useState("")
  const { isCommandMenuOpen: open, setIsCommandMenuOpen: setOpen } =
    useAppStore()
  const navigate = useNavigate()
  const session = authClient.useSession()
  const userRole = session.data?.user?.role
  const showTasks =
    userRole === "claims-approval-user" ||
    userRole === "fraud-investigation-user"

  const { data: documents } = useQuery<DocumentThumbnail[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await apiClient.fetch("/documents")
      if (!response.ok) return []
      return response.json()
    },
  })

  const { data: chatSessions } = useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const response = await apiClient.fetch("/chat")
      if (!response.ok) return []
      return response.json()
    },
  })

  const { data: searchResults } = useQuery<ChatSearchResult>({
    queryKey: ["chat-search", search],
    queryFn: async () => {
      if (!search) return { sessions: [], messages: [] }
      const response = await apiClient.fetch(
        `/chat/search?q=${encodeURIComponent(search)}`
      )
      if (!response.ok) return { sessions: [], messages: [] }
      return response.json()
    },
    enabled: search.length > 0,
  })

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, setOpen])

  const runCommand = React.useCallback(
    (callback: () => void) => {
      setOpen(false)
      setSearch("") // Reset search on navigation
      callback()
    },
    [setOpen]
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
        className="ml-2"
      />
      <CommandList className="pb-2">
        <CommandEmpty>No results found.</CommandEmpty>

        {!search && (
          <CommandGroup heading="Suggestions" className="px-4">
            <CommandItem
              onSelect={() => runCommand(() => navigate({ to: "/" }))}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Explorer</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate({ to: "/documents" }))}
            >
              <Files className="mr-2 h-4 w-4" />
              <span>Documents Registry</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate({ to: "/signatures" }))}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Signatures Registry</span>
            </CommandItem>
            {showTasks && (
              <CommandItem
                onSelect={() => runCommand(() => navigate({ to: "/tasks" }))}
              >
                <LayoutList className="mr-2 h-4 w-4" />
                <span>Task Board</span>
              </CommandItem>
            )}
            <CommandItem
              onSelect={() =>
                runCommand(async () => {
                  const res = await apiClient.fetch("/chat", { method: "POST" })
                  if (res.ok) {
                    const chat = await res.json()
                    navigate({ to: "/chat/$id", params: { id: chat.id } })
                  }
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New AI Chat</span>
            </CommandItem>
          </CommandGroup>
        )}

        {!search && chatSessions && chatSessions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Chats" className="px-4">
              {chatSessions.slice(0, 5).map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={chat.title + chat.id}
                  onSelect={() =>
                    runCommand(() =>
                      navigate({ to: "/chat/$id", params: { id: chat.id } })
                    )
                  }
                >
                  <History className="mr-2 h-4 w-4" />
                  <span className="truncate">{chat.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {search && documents && documents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Documents" className="px-4">
              {documents.slice(0, 10).map((doc) => (
                <CommandItem
                  key={doc.id}
                  value={doc.name + doc.id}
                  onSelect={() =>
                    runCommand(() =>
                      navigate({ to: "/documents/$id", params: { id: doc.id } })
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="truncate">{doc.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {search && searchResults && (
          <>
            {searchResults.sessions.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Chat Sessions" className="px-4">
                  {searchResults.sessions.map((session) => (
                    <CommandItem
                      key={session.id}
                      value={session.title + session.id}
                      onSelect={() =>
                        runCommand(() =>
                          navigate({
                            to: "/chat/$id",
                            params: { id: session.id },
                          })
                        )
                      }
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span className="truncate">{session.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {searchResults.messages.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="In Chats (Messages)" className="px-4">
                  {searchResults.messages.map((msg) => (
                    <CommandItem
                      key={msg.id}
                      value={msg.content + msg.id}
                      onSelect={() =>
                        runCommand(() =>
                          navigate({
                            to: "/chat/$id",
                            params: { id: msg.sessionId },
                          })
                        )
                      }
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <div className="flex min-w-0 flex-col">
                        <span className="mb-0.5 truncate text-xs text-muted-foreground">
                          In: {msg.session.title}
                        </span>
                        <span className="truncate">{msg.content}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
