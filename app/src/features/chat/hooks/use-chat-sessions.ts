import { useNavigate, useParams } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useQueryState } from "nuqs"
import { useMemo, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export function useChatSessions() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id: activeId } = useParams({ strict: false }) as { id?: string }
  const [search, setSearch] = useQueryState("s", {
    defaultValue: "",
    shallow: true,
  })

  const {
    chatSortOrder: sortOrder,
    setChatSortOrder: setSortOrder,
    chatExpandedGroups: expandedGroups,
    setChatExpandedGroups: setExpandedGroups,
    addChatExpandedGroup: addExpandedGroup,
  } = useAppStore()

  const { data: sessions, isLoading } = useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const response = await apiClient.fetch("/chat")
      if (!response.ok) throw new Error("Failed to fetch chat sessions")
      return response.json()
    },
  })

  const filteredSessions = useMemo(() => {
    if (!sessions) return []
    let filtered = sessions
    if (search) {
      filtered = sessions.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase())
      )
    }
    return [...filtered].sort((a, b) => {
      const da = new Date(a.updatedAt).getTime()
      const db = new Date(b.updatedAt).getTime()
      return sortOrder === "asc" ? da - db : db - da
    })
  }, [sessions, search, sortOrder])

  const groupedSessions = useMemo(() => {
    if (!filteredSessions) return {}
    return filteredSessions.reduce(
      (acc, session) => {
        const dateStr = new Date(session.updatedAt).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        )
        if (!acc[dateStr]) acc[dateStr] = []
        acc[dateStr].push(session)
        return acc
      },
      {} as Record<string, ChatSession[]>
    )
  }, [filteredSessions])

  useEffect(() => {
    if (activeId && sessions) {
      const active = sessions.find((s) => s.id === activeId)
      if (active) {
        const dateStr = new Date(active.updatedAt).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        )
        if (!expandedGroups.includes(dateStr)) {
          addExpandedGroup(dateStr)
        }
      }
    }
  }, [activeId, sessions, addExpandedGroup, expandedGroups])

  const createSession = useMutation({
    mutationFn: async () => {
      const response = await apiClient.fetch("/chat", {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to create chat")
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] })
      navigate({ to: "/chat/$id", params: { id: data.id } })
      toast.success("New chat session created")
    },
    onError: () => {
      toast.error("Failed to create chat session")
    },
  })

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiClient.fetch(`/chat/${sessionId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete chat")
      return response.json()
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] })
      if (activeId === sessionId) {
        navigate({ to: "/chat" })
      }
      toast.success("Chat deleted")
    },
    onError: () => {
      toast.error("Failed to delete chat")
    },
  })

  return {
    activeId,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    expandedGroups,
    setExpandedGroups,
    sessions,
    isLoading,
    filteredSessions,
    groupedSessions,
    createSession,
    deleteSession,
  }
}
