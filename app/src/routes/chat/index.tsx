import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { MessageSquare, Sparkles } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ChatInput } from "@/features/chat/components/chat-input"
import { apiClient } from "@/lib/api-client"

export const Route = createFileRoute("/chat/")({
  component: ChatIndex,
})

function ChatIndex() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createSessionMutation = useMutation({
    mutationFn: async (payload?: { content: string; model: string }) => {
      const response = await apiClient.fetch("/chat", {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to create chat")
      const session = await response.json()
      return {
        session,
        initialMessage: payload?.content,
        model: payload?.model,
      }
    },
    onSuccess: ({ session, initialMessage, model }) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] })
      navigate({
        to: "/chat/$id",
        params: { id: session.id },
        search: initialMessage ? { q: initialMessage, m: model } : undefined,
      })
    },
    onError: () => {
      toast.error("Failed to start conversation")
    },
  })

  const handleSuggestionClick = (message: string) => {
    // For suggestions, we'll use a default model or handle it in the mutation
    // We can just call mutate without specific model and let it default or handle it.
    createSessionMutation.mutate({ content: message, model: "minimax-2.5" })
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto px-8 py-12">
      <div className="flex w-full max-w-2xl flex-1 animate-in flex-col items-center justify-center duration-1000 fade-in">
        <div className="relative mb-8">
          <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] border border-primary/20 bg-card shadow-2xl shadow-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight">
          Hello, <span className="text-primary italic">Medcurial.</span>
        </h1>
        <p className="mb-12 max-w-sm text-center leading-relaxed font-medium text-muted-foreground">
          How can I help you with your document integrity and signature
          verification today?
        </p>

        <div className="grid w-full grid-cols-2 gap-4">
          <button
            onClick={() =>
              handleSuggestionClick(
                "How many suspicious signatures were found?"
              )
            }
            className="group cursor-pointer rounded-3xl border border-border/40 bg-accent/20 p-5 text-left transition-all hover:bg-accent/30 active:scale-95"
          >
            <span className="mb-2 block text-[10px] font-bold tracking-widest text-primary/60 uppercase">
              Verify
            </span>
            <p className="text-xs leading-snug font-semibold text-foreground/80">
              "How many suspicious signatures were found?"
            </p>
          </button>
          <button
            onClick={() =>
              handleSuggestionClick("Give me a summary of the latest document.")
            }
            className="group cursor-pointer rounded-3xl border border-border/40 bg-accent/20 p-5 text-left transition-all hover:bg-accent/30 active:scale-95"
          >
            <span className="mb-2 block text-[10px] font-bold tracking-widest text-primary/60 uppercase">
              Analyze
            </span>
            <p className="text-xs leading-snug font-semibold text-foreground/80">
              "Give me a summary of the latest document."
            </p>
          </button>
        </div>
      </div>

      <div className="mt-12 w-full">
        <ChatInput
          onSend={(content, model) =>
            createSessionMutation.mutate({ content, model })
          }
          disabled={createSessionMutation.isPending}
          placeholder="Ask Medcurial AI..."
        />
      </div>
    </div>
  )
}
