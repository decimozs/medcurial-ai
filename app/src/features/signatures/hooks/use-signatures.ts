import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useQueryState, parseAsString } from "nuqs"
import { useMemo, useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import type { SignatureThumbnail } from "../types"

export function useSignatures() {
  const { id: activeId } = useParams({ strict: false }) as { id?: string }
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false })
  )
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    label: string
  } | null>(null)

  const {
    signatureSortOrder: sortOrder,
    setSignatureSortOrder: setSortOrder,
    signatureExpandedGroups: expandedGroups,
    setSignatureExpandedGroups: setExpandedGroups,
    addSignatureExpandedGroup: addExpandedGroup,
  } = useAppStore()

  const { data: signatures, isLoading } = useQuery<SignatureThumbnail[]>({
    queryKey: ["signatures"],
    queryFn: async () => {
      const response = await apiClient.fetch("/signatures")
      if (!response.ok) throw new Error("Failed to fetch signatures")
      return response.json()
    },
    refetchInterval: (query) => {
      const data = query.state.data as SignatureThumbnail[] | undefined
      return data?.some((sig) => sig.status === "processing") ? 2000 : false
    },
  })

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.fetch(`/signatures/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["signatures"] })
      if (activeId === id) navigate({ to: "/signatures" })
      setDeleteTarget(null)
      toast.success("Signature deleted")
    },
    onError: () => toast.error("Failed to delete signature"),
  })

  const groupedSignatures = useMemo(() => {
    if (!signatures) return {}
    return signatures.reduce(
      (acc, sig) => {
        if (!acc[sig.name]) acc[sig.name] = []
        acc[sig.name].push(sig)
        return acc
      },
      {} as Record<string, SignatureThumbnail[]>
    )
  }, [signatures])

  const filteredGroups = useMemo(() => {
    if (!signatures) return {}
    const sortedKeys = Object.keys(groupedSignatures).sort((a, b) => {
      const cmp = a.localeCompare(b)
      return sortOrder === "asc" ? cmp : -cmp
    })
    const sorted: Record<string, SignatureThumbnail[]> = {}
    for (const key of sortedKeys) {
      if (!search || key.toLowerCase().includes(search.toLowerCase())) {
        sorted[key] = groupedSignatures[key]
      }
    }
    return sorted
  }, [groupedSignatures, search, sortOrder, signatures])

  useEffect(() => {
    if (activeId && signatures) {
      const active = signatures.find((s) => s.id === activeId)
      if (active) addExpandedGroup(active.name)
    }
  }, [activeId, signatures, addExpandedGroup])

  return {
    activeId,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    expandedGroups,
    setExpandedGroups,
    signatures,
    isLoading,
    filteredGroups,
    deleteTarget,
    setDeleteTarget,
    deleteOne,
  }
}
