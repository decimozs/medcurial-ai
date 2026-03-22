import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquare, Plus, Loader2, Bot, Info, Sparkles } from "lucide-react"
import { ChatMessage as ChatMessageComp } from "./chat-message"
import { ChatInput } from "./chat-input"
import { cn } from "@/lib/utils"
import { ScrollArea } from "./ui/scroll-area"
import { useAutoAnimate } from "@formkit/auto-animate/react"

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
}

interface DocumentChatPanelProps {
  documentId: string;
  documentName: string;
}

export function DocumentChatPanel({ documentId, documentName }: DocumentChatPanelProps) {
  const queryClient = useQueryClient();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [parent] = useAutoAnimate();

  // Fetch sessions for this document
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<ChatSession[]>({
    queryKey: ['chat-sessions', { documentId }],
    queryFn: async () => {
      const resp = await fetch(`http://localhost:3000/api/v1/chat?documentId=${documentId}`);
      if (!resp.ok) return [];
      return resp.json();
    }
  });

  const activeSessionId = sessions?.[0]?.id;

  // Fetch messages for active session
  const { data: sessionData, isLoading: isLoadingMessages } = useQuery<{ session: ChatSession, messages: Message[] }>({
    queryKey: ['chat-messages', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return { session: null, messages: [] };
      const resp = await fetch(`http://localhost:3000/api/v1/chat/${activeSessionId}`);
      if (!resp.ok) return { session: null, messages: [] };
      return resp.json();
    },
    enabled: !!activeSessionId
  });

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async () => {
      const resp = await fetch('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: `Analysis: ${documentName}`,
          documentId 
        })
      });
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', { documentId }] });
    }
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ content, model }: { content: string, model: string }) => {
      let currentSessionId = activeSessionId;
      
      // Create session if it doesn't exist
      if (!currentSessionId) {
        const newSession = await createSession.mutateAsync();
        currentSessionId = newSession.id;
      }

      const resp = await fetch(`http://localhost:3000/api/v1/chat/${currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: content,
          llmModel: model
        })
      });
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] }); // Update global history too
    }
  });

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessionData?.messages, sendMessage.isPending]);

  if (isLoadingSessions) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs font-semibold">Loading chat...</span>
      </div>
    );
  }

  const messages = sessionData?.messages || [];

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        {messages.length === 0 && !sendMessage.isPending ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground/80">Analyze Document</h3>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Ask questions about content, data fields, or signatures in this document. The AI has access to all extracted text.
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-500/80">
              <Info className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium text-left">
                The AI has access to all extracted text and fraud analysis from this document.
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
  );
}
