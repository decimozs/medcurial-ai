import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useQueryState, parseAsString } from "nuqs"
import { useMemo, useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import type { FraudAnalysis } from "@/features/review/types"

export interface DocumentThumbnail {
  id: string
  name: string
  status: string
  createdAt: string
  imageUrls: {
    original?: string
    text_extraction?: string
    signature_extraction?: string
  }
  approvalStatus: "pending" | "approved" | "rejected"
  extractedText?: string
  fraudAnalysis?: FraudAnalysis
}

export function useDocuments() {
  const { id: activeId } = useParams({ strict: false }) as { id?: string }
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false })
  )
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("all").withOptions({ shallow: false })
  )
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

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

  const flatFilteredDocuments = useMemo(() => {
    if (!documents) return []
    let filtered = [...documents]

    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.approvalStatus === statusFilter)
    }

    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(s) ||
          d.approvalStatus.toLowerCase().includes(s)
      )
    }

    return filtered.sort((a, b) => {
      const da = new Date(a.createdAt).getTime(),
        db = new Date(b.createdAt).getTime()
      return sortOrder === "asc" ? da - db : db - da
    })
  }, [documents, search, statusFilter, sortOrder])

  const groupedDocuments = useMemo(() => {
    if (!flatFilteredDocuments) return {}
    const groups = flatFilteredDocuments.reduce(
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

    const sortedKeys = Object.keys(groups).sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a).getTime() - new Date(b).getTime()
        : new Date(b).getTime() - new Date(a).getTime()
    )

    const sorted: Record<string, DocumentThumbnail[]> = {}
    for (const key of sortedKeys) sorted[key] = groups[key]
    return sorted
  }, [flatFilteredDocuments, sortOrder])

  useEffect(() => {
    if (activeId && documents) {
      const activeDoc = documents.find((d) => d.id === activeId)
      if (activeDoc) {
        const dateStr = new Date(activeDoc.createdAt).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        )
        addExpandedGroup(dateStr)
      }
    }
  }, [activeId, documents, addExpandedGroup])

  return {
    activeId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    expandedGroups,
    setExpandedGroups,
    documents,
    isLoading,
    deleteTarget,
    setDeleteTarget,
    deleteOne,
    flatFilteredDocuments,
    groupedDocuments,
  }
}
