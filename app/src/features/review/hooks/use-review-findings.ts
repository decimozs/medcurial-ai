import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useReviewFindings(documentId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!documentId) return

    const channel = supabase
      .channel(`findings:review:${documentId}`)
      .on("broadcast", { event: "INSERT" }, async (payload) => {
        console.log("[DEBUG] Realtime finding broadcast received:", payload)

        // The broadcast payload already has the full finding
        // but we invalidate to ensure we get any populated relations
        // or side effects from other teammates
        queryClient.invalidateQueries({ queryKey: ["document", documentId] })
      })
      .subscribe((status, err) => {
        console.log(
          `[DEBUG] Supabase findings channel status for ${documentId}:`,
          status
        )
        if (err) console.error("[DEBUG] Supabase channel error:", err)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [documentId, queryClient])
}
