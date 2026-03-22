import * as React from "react"
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from 'zod'
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAutoAnimate } from "@formkit/auto-animate/react"

const chatSearchSchema = z.object({
  q: z.string().optional(),
  m: z.string().optional(),
})

export const Route = createFileRoute('/chat/$id')({
  validateSearch: (search) => chatSearchSchema.parse(search),
  component: ChatSession,
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface ChatSessionData {
  session: {
    id: string
    title: string
  }
  messages: Message[]
}

function ChatSession() {
  const { id } = useParams({ from: '/chat/$id' })
  const search = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [parent] = useAutoAnimate()

  const { data, isLoading } = useQuery<ChatSessionData>({
    queryKey: ['chat-session', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/api/v1/chat/${id}`)
      if (!response.ok) throw new Error('Failed to fetch chat')
      return response.json()
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, model }: { content: string, model?: string }) => {
      const response = await fetch(`http://localhost:3000/api/v1/chat/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: 'user', 
          content, 
          sessionId: id,
          llmModel: model
        }),
      })
      if (!response.ok) throw new Error('Failed to send message')
      return response.json()
    },
    onMutate: async (newPayload) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['chat-session', id] })
      const previousData = queryClient.getQueryData(['chat-session', id])

      queryClient.setQueryData(['chat-session', id], (old: any) => ({
        ...old,
        messages: [
          ...(old?.messages || []),
          {
            id: 'temp-' + Date.now(),
            role: 'user',
            content: newPayload.content,
            createdAt: new Date().toISOString(),
          },
        ],
      }))

      return { previousData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-session', id] })
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] }) // Title might change
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['chat-session', id], context?.previousData)
      toast.error('Failed to send message')
    }
  })

  // Handle initial message from search param
  React.useEffect(() => {
    if (search.q && !isLoading && data?.messages && data.messages.length === 0 && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ content: search.q, model: search.m })
      // Clear search param
      navigate({
        to: '/chat/$id',
        params: { id },
        search: {},
        replace: true
      })
    }
  }, [search.q, isLoading, data?.messages, id])

  // Gemini-style Focus Scroll: Bring latest message to top
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (data?.messages && data.messages.length > 0) {
        const messages = scrollRef.current?.querySelectorAll('[data-chat-message]')
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1]
          lastMessage.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [data?.messages, sendMessageMutation.isPending])

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-background/50">
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-4 lg:px-0">
        <div ref={parent} className="max-w-4xl mx-auto py-8 space-y-2">
          {isLoading ? (
            <div className="space-y-6 px-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
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
                <div className="flex gap-4 p-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary/40" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Agent</span>
                      <Sparkles className="w-3 h-3 text-primary/40" />
                    </div>
                    <div className="h-4 w-32 bg-primary/5 rounded-full" />
                  </div>
                </div>
              )}
            </>
          )}

          {data?.messages && data.messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <Bot className="w-12 h-12 mb-4" />
              <p className="text-sm font-medium tracking-tight">Conversation started. How can I help you today?</p>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      <ChatInput
        onSend={(content, model) => sendMessageMutation.mutate({ content, model })}
        disabled={sendMessageMutation.isPending}
        placeholder="Ask the Agent anything about documents or signatures..."
      />
    </div>
  )
}
