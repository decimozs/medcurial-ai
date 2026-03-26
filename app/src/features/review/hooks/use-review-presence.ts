import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimePresenceState } from "@supabase/supabase-js"

export interface UserPresence {
  userId: string
  name: string
  image?: string | null
  role?: string | null
}

export function useReviewPresence(
  documentId: string,
  currentUser: UserPresence | null
) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])

  useEffect(() => {
    if (!documentId || !currentUser) return

    const channel = supabase.channel(`presence:review:${documentId}`, {
      config: {
        presence: {
          key: currentUser.userId,
        },
      },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state =
          channel.presenceState() as RealtimePresenceState<UserPresence>
        const users = Object.values(state)
          .flat()
          .filter(
            (user, index, self) =>
              self.findIndex((u) => u.userId === user.userId) === index &&
              user.userId !== currentUser.userId // Exclude self
          )

        setOnlineUsers((prev) => {
          const isSame =
            prev.length === users.length &&
            prev.every((u, i) => u.userId === users[i]?.userId)
          return isSame ? prev : users
        })
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("Users joined: ", newPresences)
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("Users left: ", leftPresences)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(currentUser)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [documentId, currentUser])

  return { onlineUsers }
}
