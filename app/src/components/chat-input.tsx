import * as React from "react"
import { Send, ChevronDown, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppStore, AVAILABLE_MODELS } from "@/lib/store"
import { toast } from "sonner"

interface ChatInputProps {
  onSend: (message: string, model: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder = "Ask Medcurial AI..." }: ChatInputProps) {
  const [input, setInput] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const { selectedModel, setSelectedModel, isRecording, setIsRecording } = useAppStore()
  const recognitionRef = React.useRef<any>(null)
  const transcriptRef = React.useRef("")

  // Initialize Speech Recognition
  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsRecording(true)
        transcriptRef.current = ""
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
        // Auto-send if we have a transcript
        if (transcriptRef.current.trim()) {
          // Small delay to ensure state sync if needed/visible
          setTimeout(() => {
            handleSendWithText(transcriptRef.current)
            transcriptRef.current = ""
          }, 100)
        }
      }
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setInput(transcript)
          transcriptRef.current = transcript
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsRecording(false)
        toast.error(`Speech recognition error: ${event.error}`)
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      setInput("")
      transcriptRef.current = ""
      recognitionRef.current.start()
    }
  }

  const handleSendWithText = (text: string) => {
    if (text.trim() && !disabled) {
      const modelValue = AVAILABLE_MODELS[selectedModel as keyof typeof AVAILABLE_MODELS]
      onSend(text.trim(), modelValue)
      setInput("")
    }
  }

  const handleSend = () => {
    handleSendWithText(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "inherit"
      const computed = window.getComputedStyle(textarea)
      const height = textarea.scrollHeight + parseInt(computed.borderTopWidth) + parseInt(computed.borderBottomWidth)
      textarea.style.height = `${Math.min(height, 200)}px`
    }
  }, [input])

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-6">
      <div className={cn(
        "relative flex flex-col bg-muted/30 border border-border/40 rounded-[28px] p-2 transition-all duration-300 focus-within:bg-muted/40 focus-within:ring-1 focus-within:ring-primary/10 shadow-sm shadow-black/10",
        disabled && "opacity-50"
      )}>
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="min-h-[52px] w-full resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-4 text-sm font-medium placeholder:text-muted-foreground/30 leading-relaxed"
        />

        <div className="flex items-center justify-between px-2 pb-1 pt-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-300",
                isRecording 
                  ? "bg-destructive/10 text-destructive animate-pulse" 
                  : "text-muted-foreground/50 hover:bg-primary/5 hover:text-primary"
              )}
              disabled={disabled}
            >
              <Mic className={cn("h-4 w-4", isRecording && "fill-current")} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full px-3 text-[11px] font-semibold text-muted-foreground/40 hover:bg-accent/50 transition-all border border-border/5"
                  disabled={disabled}
                >
                  <span className="capitalize">{selectedModel}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl p-1 w-48 shadow-xl border-border/40 backdrop-blur-md">
                {Object.keys(AVAILABLE_MODELS).map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    className={cn(
                      "rounded-lg text-[11px] font-semibold px-3 py-2 cursor-pointer transition-colors",
                      selectedModel === model ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    {model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="icon"
              onClick={handleSend}
              disabled={disabled || !input.trim()}
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-300 shadow-md",
                input.trim()
                  ? "bg-primary text-primary-foreground hover:scale-110 active:scale-95 shadow-primary/20"
                  : "bg-muted text-muted-foreground/20"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/40 font-medium mt-3 animate-in fade-in slide-in-from-top-1 duration-700">
        Medcurial AI can make mistakes. Check important info.
      </p>
    </div>
  )
}
