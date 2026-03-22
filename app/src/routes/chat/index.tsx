import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ChatInput } from "@/components/chat-input"

export const Route = createFileRoute('/chat/')({
  component: ChatIndex,
})

function ChatIndex() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createSessionMutation = useMutation({
    mutationFn: async (payload?: { content: string, model: string }) => {
      const response = await fetch('http://localhost:3000/api/v1/chat', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to create chat')
      const session = await response.json()
      return { session, initialMessage: payload?.content, model: payload?.model }
    },
    onSuccess: ({ session, initialMessage, model }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      navigate({ 
        to: '/chat/$id', 
        params: { id: session.id },
        search: (initialMessage ? { q: initialMessage, m: model } : undefined) as any
      })
    },
    onError: () => {
      toast.error('Failed to start conversation')
    }
  })

  const handleSuggestionClick = (message: string) => {
    // For suggestions, we'll use a default model or handle it in the mutation
    // We can just call mutate without specific model and let it default or handle it.
    createSessionMutation.mutate({ content: message, model: 'minimax-2.5' })
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-12 px-8 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl animate-in fade-in duration-1000">
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full animate-pulse" />
          <div className="relative w-20 h-20 rounded-[28px] bg-card border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/10">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Hello, <span className="text-primary italic">Medcurial.</span>
        </h1>
        <p className="text-muted-foreground max-w-sm mb-12 leading-relaxed font-medium text-center">
          How can I help you with your document integrity and signature verification today?
        </p>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button 
            onClick={() => handleSuggestionClick("How many suspicious signatures were found?")}
            className="p-5 rounded-3xl bg-accent/20 border border-border/40 text-left hover:bg-accent/30 transition-all cursor-pointer group active:scale-95"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 block mb-2">Verify</span>
            <p className="text-xs font-semibold text-foreground/80 leading-snug">"How many suspicious signatures were found?"</p>
          </button>
          <button 
            onClick={() => handleSuggestionClick("Give me a summary of the latest document.")}
            className="p-5 rounded-3xl bg-accent/20 border border-border/40 text-left hover:bg-accent/30 transition-all cursor-pointer group active:scale-95"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 block mb-2">Analyze</span>
            <p className="text-xs font-semibold text-foreground/80 leading-snug">"Give me a summary of the latest document."</p>
          </button>
        </div>
      </div>

      <div className="w-full mt-12">
        <ChatInput 
          onSend={(content, model) => createSessionMutation.mutate({ content, model })}
          disabled={createSessionMutation.isPending}
          placeholder="Ask Medcurial AI..."
        />
      </div>
    </div>
  )
}
