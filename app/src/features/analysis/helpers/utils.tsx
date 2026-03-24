export function parseJson<T>(raw: unknown): T | null {
  if (!raw) return null
  if (typeof raw === "object") return raw as T
  if (typeof raw === "string") {
    try {
      const cleaned = raw
        .replace(/<Answer>/g, "")
        .replace(/<\/Answer>/g, "")
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      return JSON.parse(cleaned) as T
    } catch {
      return null
    }
  }
  return null
}

export function rankColor(rank: string | undefined) {
  switch (rank?.toLowerCase()) {
    case "high":
    case "moderate":
      return "text-destructive bg-destructive/10 border-destructive/20"
    case "low":
      return "text-primary bg-primary/10 border-primary/20"
    default:
      return "text-muted-foreground bg-muted border-border"
  }
}

export function getSuspicionDescription(type: string | undefined): string {
  switch (type?.toLowerCase()) {
    case "signature":
      return "Suspicious activity detected in signature consistency."
    case "description":
      return "Discrepancies found in document text or medical descriptions."
    case "both":
      return "Anomalies detected in both signatures and text descriptions."
    case "none":
      return "No significant suspicion detected."
    default:
      return type || "No suspicion type specified"
  }
}
