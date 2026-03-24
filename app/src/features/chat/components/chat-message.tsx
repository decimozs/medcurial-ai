import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, User, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

export function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const isAssistant = role === "assistant"

  return (
    <div
      data-chat-message
      className={cn(
        "group flex w-full animate-in items-start gap-4 p-4 transition-colors duration-300 fade-in slide-in-from-bottom-2",
        isAssistant ? "bg-accent/5 backdrop-blur-sm" : "bg-transparent"
      )}
    >
      <Avatar
        className={cn(
          "h-9 w-9 border transition-all duration-300",
          isAssistant
            ? "border-primary/20 bg-primary/5 shadow-sm shadow-primary/10"
            : "border-border/40 bg-accent/20"
        )}
      >
        {isAssistant ? (
          <>
            <AvatarImage src="/bot-avatar.png" />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarFallback className="bg-accent/20 text-muted-foreground/60">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-xs font-bold tracking-widest uppercase transition-colors",
              isAssistant ? "text-primary/70" : "text-muted-foreground/50"
            )}
          >
            {isAssistant ? "Agent" : "You"}
          </span>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground/40 transition-all hover:bg-primary/5 hover:text-primary"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed",
            isAssistant
              ? "font-medium text-foreground"
              : "text-muted-foreground"
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-2 leading-relaxed font-medium last:mb-0">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="marker:text-primary/40">{children}</li>
              ),
              code: ({ children }) => (
                <code className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="my-2 overflow-x-auto rounded-xl border border-border/20 bg-accent/20 p-3 font-mono text-xs">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-2 rounded-r-lg border-l-4 border-primary/20 bg-primary/5 py-1 pl-4 text-muted-foreground/70 italic">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary decoration-primary/30 underline-offset-4 hover:underline"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="my-4 w-full overflow-x-auto rounded-2xl border border-border/40 bg-card/20 shadow-sm shadow-primary/5">
                  <table className="w-full border-collapse text-left text-xs leading-loose">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b border-border/40 bg-primary/[0.03]">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="border-r border-border/10 px-5 py-3 font-bold tracking-wider text-primary/60 uppercase last:border-r-0">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-r border-b border-border/5 border-border/10 px-5 py-3 font-medium text-muted-foreground/80 last:border-r-0 last:border-b-0">
                  {children}
                </td>
              ),
              tr: ({ children }) => (
                <tr className="transition-all duration-200 hover:bg-primary/[0.02]">
                  {children}
                </tr>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {createdAt && (
          <div className="text-[10px] font-medium text-muted-foreground/30">
            {new Date(createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  )
}
