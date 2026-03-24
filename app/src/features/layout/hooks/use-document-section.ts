import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useQueryState, parseAsString } from "nuqs"
import { useMemo, useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import type { DocumentThumbnail } from "../types"

export function useDocumentSection() {
  const { id: activeId } = useParams({ strict: false }) as { id?: string }
  const [search, setSearch] = useQueryState(
    "dq",
    parseAsString.withDefault("").withOptions({ shallow: false })
  )
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [sectionOpen, setSectionOpen] = useState(true)

  const {
    documentSortOrder: sortOrder,
    setDocumentSortOrder: setSortOrder,
    documentExpandedGroups: expandedGroups,
    setDocumentExpandedGroups: setExpandedGroups,
    addDocumentExpandedGroup: addExpandedGroup,
  } = useAppStore()

  const { data: documents, isLoading } = useQuery<DocumentThumbnail[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await apiClient.fetch("/documents")
      if (!response.ok) throw new Error("Failed to fetch documents")
      return response.json()
    },
    refetchInterval: (query) => {
      const data = query.state.data as DocumentThumbnail[] | undefined
      return data?.some((doc) => doc.status === "processing") ? 2000 : false
    },
  })

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.fetch(`/documents/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      if (activeId === id) navigate({ to: "/documents" })
      setDeleteTarget(null)
      toast.success("Document deleted")
    },
    onError: () => toast.error("Failed to delete document"),
  })

  const groupedDocuments = useMemo(() => {
    if (!documents) return {}
    return documents.reduce(
      (acc, doc) => {
        const dateStr = new Date(doc.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        if (!acc[dateStr]) acc[dateStr] = []
        acc[dateStr].push(doc)
        return acc
      },
      {} as Record<string, DocumentThumbnail[]>
    )
  }, [documents])

  const flatFilteredDocuments = useMemo(() => {
    if (!documents) return []
    const sorted = [...documents].sort((a, b) => {
      const da = new Date(a.createdAt).getTime(),
        db = new Date(b.createdAt).getTime()
      return sortOrder === "asc" ? da - db : db - da
    })
    return !search
      ? sorted
      : sorted.filter((d) =>
          d.name.toLowerCase().includes(search.toLowerCase())
        )
  }, [documents, search, sortOrder])

  const filteredGroups = useMemo(() => {
    if (!documents) return {}
    const sortedKeys = Object.keys(groupedDocuments).sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a).getTime() - new Date(b).getTime()
        : new Date(b).getTime() - new Date(a).getTime()
    )
    const sorted: Record<string, DocumentThumbnail[]> = {}
    for (const key of sortedKeys) sorted[key] = groupedDocuments[key]
    return sorted
  }, [groupedDocuments, sortOrder, documents])

  useEffect(() => {
    if (activeId && documents) {
      const activeDoc = documents.find((d) => d.id === activeId)
      if (activeDoc) {
        const dateStr = new Date(activeDoc.createdAt).toLocaleDateString(
          undefined,
          { year: "numeric", month: "short", day: "numeric" }
        )
        addExpandedGroup(dateStr)
      }
    }
  }, [activeId, documents, addExpandedGroup])

  return {
    activeId,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    expandedGroups,
    setExpandedGroups,
    documents,
    isLoading,
    deleteTarget,
    setDeleteTarget,
    deleteOne,
    sectionOpen,
    setSectionOpen,
    groupedDocuments,
    flatFilteredDocuments,
    filteredGroups,
  }
}
