import * as React from "react"
import { Clock } from "lucide-react"

export function NavClock() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-accent/30 border border-border/20 text-muted-foreground/60 hover:text-primary transition-all select-none">
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 opacity-50" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {dateFormatter.format(time)}
        </span>
      </div>
      <div className="w-[1px] h-3 bg-border/40" />
      <span className="text-[11px] font-mono font-medium tabular-nums tracking-tight">
        {timeFormatter.format(time)}
      </span>
    </div>
  )
}
