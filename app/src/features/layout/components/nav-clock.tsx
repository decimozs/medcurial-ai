import * as React from "react"
import { Clock } from "lucide-react"

export function NavClock() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  return (
    <div className="hidden items-center gap-3 rounded-full border border-border/20 bg-accent/30 px-4 py-1.5 text-muted-foreground/60 transition-all select-none hover:text-primary md:flex">
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 opacity-50" />
        <span className="text-[10px] font-bold tracking-widest uppercase">
          {dateFormatter.format(time)}
        </span>
      </div>
      <div className="h-3 w-[1px] bg-border/40" />
      <span className="font-mono text-[11px] font-medium tracking-tight tabular-nums">
        {timeFormatter.format(time)}
      </span>
    </div>
  )
}
