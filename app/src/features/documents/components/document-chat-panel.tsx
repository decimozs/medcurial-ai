import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Bot, Info, Sparkles } from "lucide-react"
import { ChatMessage as ChatMessageComp } from "@/features/chat/components/chat-message"
import { ChatInput } from "@/features/chat/components/chat-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { apiClient } from "@/lib/api-client"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

interface ChatSession {
  id: string
  title: string
}

interface DocumentChatPanelProps {
  documentId: string
  documentName: string
}

export function DocumentChatPanel({
  documentId,
  documentName,
}: DocumentChatPanelProps) {
  const queryClient = useQueryClient()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [parent] = useAutoAnimate()

  // Fetch sessions for this document
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<
    ChatSession[]
  >({
    queryKey: ["chat-sessions", { documentId }],
    queryFn: async () => {
      const resp = await apiClient.fetch(`/chat?documentId=${documentId}`)
      if (!resp.ok) return []
      return resp.json()
    },
  })

  const activeSessionId = sessions?.[0]?.id

  // Fetch messages for active session
  const { data: sessionData } = useQuery<{
    session: ChatSession
    messages: Message[]
  }>({
    queryKey: ["chat-messages", activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return { session: null, messages: [] }
      const resp = await apiClient.fetch(`/chat/${activeSessionId}`)
      if (!resp.ok) return { session: null, messages: [] }
      return resp.json()
    },
    enabled: !!activeSessionId,
  })

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async () => {
      const resp = await apiClient.fetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          title: `Analysis: ${documentName}`,
          documentId,
        }),
      })
      return resp.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-sessions", { documentId }],
      })
    },
  })

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      model,
    }: {
      content: string
      model: string
    }) => {
      let currentSessionId = activeSessionId

      // Create session if it doesn't exist
      if (!currentSessionId) {
        const newSession = await createSession.mutateAsync()
        currentSessionId = newSession.id
      }

      const resp = await apiClient.fetch(`/chat/${currentSessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          role: "user",
          content: content,
          llmModel: model,
        }),
      })
      return resp.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", activeSessionId],
      })
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] }) // Update global history too
    },
  })

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [sessionData?.messages, sendMessage.isPending])

  if (isLoadingSessions) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 opacity-50">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-xs font-semibold">Loading chat...</span>
      </div>
    )
  }

  const messages = sessionData?.messages || []

  return (
    <div className="flex h-full flex-col bg-background/50">
      {/* Messages Area */}
      <div className="relative flex-1 overflow-hidden">
        {messages.length === 0 && !sendMessage.isPending ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4 px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground/80">
                Analyze Document
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground/60">
                Ask questions about content, data fields, or signatures in this
                document. The AI has access to all extracted text.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-amber-500/80">
              <Info className="h-3.5 w-3.5" />
              <span className="text-left text-[10px] font-medium">
                The AI has access to all extracted text and fraud analysis from
                this document.
              </span>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div ref={parent} className="flex flex-col py-4">
              {messages.map((msg) => (
                <ChatMessageComp
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  createdAt={msg.createdAt}
                />
              ))}
              {sendMessage.isPending && (
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
            </div>
            <div ref={scrollRef} className="h-1" />
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 pt-4">
        <ChatInput
          onSend={(content, model) => sendMessage.mutate({ content, model })}
          disabled={sendMessage.isPending}
          placeholder="Ask about this document..."
        />
      </div>
    </div>
  )
}
