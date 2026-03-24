import * as React from "react"
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { ChatMessage } from "@/features/chat/components/chat-message"
import { ChatInput } from "@/features/chat/components/chat-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { apiClient } from "@/lib/api-client"

const chatSearchSchema = z.object({
  q: z.string().optional(),
  m: z.string().optional(),
})

export const Route = createFileRoute("/chat/$id")({
  validateSearch: (search) => chatSearchSchema.parse(search),
  component: ChatSession,
})

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

interface ChatSessionData {
  session: {
    id: string
    title: string
    document?: {
      id: string
      name: string
    }
  }
  messages: Message[]
}

function ChatSession() {
  const { id } = useParams({ from: "/chat/$id" })
  const search = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [parent] = useAutoAnimate()

  const { data, isLoading } = useQuery<ChatSessionData>({
    queryKey: ["chat-session", id],
    queryFn: async () => {
      const response = await apiClient.fetch(`/chat/${id}`)
      if (!response.ok) throw new Error("Failed to fetch chat")
      return response.json()
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      model,
    }: {
      content: string
      model?: string
    }) => {
      const response = await apiClient.fetch(`/chat/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          role: "user",
          content,
          sessionId: id,
          llmModel: model,
        }),
      })
      if (!response.ok) throw new Error("Failed to send message")
      return response.json()
    },
    onMutate: async (newPayload) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["chat-session", id] })
      const previousData = queryClient.getQueryData(["chat-session", id])

      queryClient.setQueryData<ChatSessionData>(["chat-session", id], (old) => {
        if (!old) return undefined
        return {
          ...old,
          messages: [
            ...old.messages,
            {
              id: "temp-" + Date.now(),
              role: "user",
              content: newPayload.content,
              createdAt: new Date().toISOString(),
            },
          ],
        }
      })

      return { previousData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-session", id] })
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] }) // Title might change
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["chat-session", id], context?.previousData)
      toast.error("Failed to send message")
    },
  })

  // Handle initial message from search param
  React.useEffect(() => {
    if (
      search.q &&
      !isLoading &&
      data?.messages &&
      data.messages.length === 0 &&
      !sendMessageMutation.isPending
    ) {
      sendMessageMutation.mutate({ content: search.q, model: search.m })
      // Clear search param
      navigate({
        to: "/chat/$id",
        params: { id },
        search: {},
        replace: true,
      })
    }
  }, [
    search.q,
    search.m,
    isLoading,
    data?.messages,
    id,
    sendMessageMutation,
    navigate,
  ])

  // Gemini-style Focus Scroll: Bring latest message to top
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (data?.messages && data.messages.length > 0) {
        const messages = scrollRef.current?.querySelectorAll(
          "[data-chat-message]"
        )
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1]
          lastMessage.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [data?.messages, sendMessageMutation.isPending])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background/50">
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1 px-4 lg:px-0">
        <div ref={parent} className="mx-auto max-w-4xl space-y-2 py-8">
          {isLoading ? (
            <div className="space-y-6 px-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4 rounded-full" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {data?.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  createdAt={message.createdAt}
                />
              ))}

              {sendMessageMutation.isPending && (
                <div className="flex animate-pulse gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                    <Bot className="h-5 w-5 text-primary/40" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">
                        Agent
                      </span>
                      <Sparkles className="h-3 w-3 text-primary/40" />
                    </div>
                    <div className="h-4 w-32 rounded-full bg-primary/5" />
                  </div>
                </div>
              )}
            </>
          )}

          {data?.messages && data.messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <Bot className="mb-4 h-12 w-12" />
              <p className="text-sm font-medium tracking-tight">
                Conversation started. How can I help you today?
              </p>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      <ChatInput
        onSend={(content, model) =>
          sendMessageMutation.mutate({ content, model })
        }
        disabled={sendMessageMutation.isPending}
        placeholder="Ask the Agent anything about documents or signatures..."
        linkedDocument={data?.session?.document}
      />
    </div>
  )
}
