import * as React from "react"
import { Send, ChevronDown, Mic, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppStore, AVAILABLE_MODELS } from "@/lib/store"
import { toast } from "sonner"
import { cn, stripExtension } from "@/lib/utils"

interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: () => void
  onend: () => void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  start: () => void
  stop: () => void
}

interface ChatInputProps {
  onSend: (message: string, model: string) => void
  disabled?: boolean
  placeholder?: string
  linkedDocument?: {
    id: string
    name: string
  }
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Ask Medcurial AI...",
  linkedDocument,
}: ChatInputProps) {
  const [input, setInput] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const { selectedModel, setSelectedModel, isRecording, setIsRecording } =
    useAppStore()
  const recognitionRef = React.useRef<SpeechRecognition | null>(null)
  const transcriptRef = React.useRef("")

  const handleSendWithText = React.useCallback(
    (text: string) => {
      if (text.trim() && !disabled) {
        const modelValue =
          AVAILABLE_MODELS[selectedModel as keyof typeof AVAILABLE_MODELS]
        onSend(text.trim(), modelValue)
        setInput("")
      }
    },
    [disabled, selectedModel, onSend]
  )

  const handleSend = () => {
    handleSendWithText(input)
  }

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

  // Initialize Speech Recognition
  React.useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition: new () => SpeechRecognition })
        .SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition: new () => SpeechRecognition
        }
      ).webkitSpeechRecognition
    if (SR) {
      recognitionRef.current = new SR()
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = "en-US"
      }

      if (recognitionRef.current) {
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

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          if (transcript) {
            setInput(transcript)
            transcriptRef.current = transcript
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error)
          setIsRecording(false)
          toast.error(`Speech recognition error: ${event.error}`)
        }
      }
    }
  }, [handleSendWithText, setIsRecording])

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
      const height =
        textarea.scrollHeight +
        parseInt(computed.borderTopWidth) +
        parseInt(computed.borderBottomWidth)
      textarea.style.height = `${Math.min(height, 200)}px`
    }
  }, [input])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-6">
      <div
        className={cn(
          "relative flex flex-col rounded-[28px] border border-border/40 bg-muted/30 p-2 shadow-sm shadow-black/10 transition-all duration-300 focus-within:bg-muted/40 focus-within:ring-1 focus-within:ring-primary/10",
          disabled && "opacity-50"
        )}
      >
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="min-h-[52px] w-full resize-none border-none bg-transparent px-4 py-3 text-sm leading-relaxed font-medium placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-300",
                isRecording
                  ? "animate-pulse bg-destructive/10 text-destructive"
                  : "text-muted-foreground/50 hover:bg-primary/5 hover:text-primary"
              )}
              disabled={disabled}
            >
              <Mic className={cn("h-4 w-4", isRecording && "fill-current")} />
            </Button>

            {linkedDocument && (
              <div className="flex animate-in items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 duration-500 fade-in slide-in-from-left-2">
                <FileText className="h-3 w-3 text-primary" />
                <span className="max-w-[120px] truncate text-[10px] font-bold tracking-wider text-primary uppercase">
                  {stripExtension(linkedDocument.name)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full border border-border/5 px-3 text-[11px] font-semibold text-muted-foreground/40 transition-all hover:bg-accent/50"
                  disabled={disabled}
                >
                  <span className="capitalize">{selectedModel}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl border-border/40 p-1 shadow-xl backdrop-blur-md"
              >
                {Object.keys(AVAILABLE_MODELS).map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    className={cn(
                      "cursor-pointer rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
                      selectedModel === model
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground/60 hover:bg-primary/5 hover:text-primary"
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
                "h-8 w-8 rounded-full shadow-md transition-all duration-300",
                input.trim()
                  ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-110 active:scale-95"
                  : "bg-muted text-muted-foreground/20"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-3 animate-in text-center text-[10px] font-medium text-muted-foreground/40 duration-700 fade-in slide-in-from-top-1">
        Medcurial AI can make mistakes. Check important info.
      </p>
    </div>
  )
}
