import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react"

export function RankIcon({ rank }: { rank: string | undefined }) {
  switch (rank?.toLowerCase()) {
    case "high":
      return <ShieldAlert className="h-4 w-4 text-destructive" />
    case "moderate":
      return <ShieldQuestion className="h-4 w-4 text-destructive" />
    case "low":
      return <ShieldCheck className="h-4 w-4 text-primary" />
    default:
      return <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
  }
}
