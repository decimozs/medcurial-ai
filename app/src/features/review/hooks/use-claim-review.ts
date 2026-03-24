import { useState, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import type { DocumentResponse, ViewMode, RightTab } from "../types"

export function useClaimReview(id: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState("")
  const [activeRightTab, setActiveRightTab] = useState<RightTab>("review")
  const [viewMode, setViewMode] = useState<ViewMode>("original")
  const [zoom, setZoom] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [fraudPanelCollapsed, setFraudPanelCollapsed] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: "approve" | "reject" | null
  }>({ open: false, type: null })

  // Panning state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  })

  const {
    data: doc,
    isLoading,
    error,
  } = useQuery<DocumentResponse>({
    queryKey: ["document", id],
    queryFn: async () => {
      const response = await apiClient.fetch(`/documents/${id}`)
      if (!response.ok) throw new Error("Failed to fetch document")
      return response.json()
    },
  })

  const effectiveRightTab =
    activeRightTab === "notes" && doc?.approvalStatus === "pending"
      ? "review"
      : activeRightTab

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setDragStart({
      x: e.pageX - scrollRef.current.offsetLeft,
      y: e.pageY - scrollRef.current.offsetTop,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const y = e.pageY - scrollRef.current.offsetTop
    const walkX = x - dragStart.x
    const walkY = y - dragStart.y
    scrollRef.current.scrollLeft = dragStart.scrollLeft - walkX
    scrollRef.current.scrollTop = dragStart.scrollTop - walkY
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleResetView = () => {
    setZoom(1)
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, left: 0, behavior: "smooth" })
    }
  }

  const approveMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await apiClient.fetch(`/documents/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to approve")
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success("Claim Approved Successfully")
      queryClient.invalidateQueries({ queryKey: ["document", id] })
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      setConfirmDialog({ open: false, type: null })
      navigate({ to: "/documents/$id", params: { id } })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await apiClient.fetch(`/documents/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to reject")
      }
      return response.json()
    },
    onSuccess: () => {
      toast.warning("Claim Rejected")
      queryClient.invalidateQueries({ queryKey: ["document", id] })
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      setConfirmDialog({ open: false, type: null })
      navigate({ to: "/documents/$id", params: { id } })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleConfirmAction = () => {
    if (confirmDialog.type === "approve") {
      approveMutation.mutate(notes)
    } else if (confirmDialog.type === "reject") {
      rejectMutation.mutate(notes)
    }
  }

  const getActiveImageUrl = useCallback(() => {
    if (!doc) return undefined
    switch (viewMode) {
      case "text":
        return doc.imageUrls.text_extraction || doc.imageUrls.original
      case "signature":
        return doc.imageUrls.signature_extraction || doc.imageUrls.original
      default:
        return doc.imageUrls.original
    }
  }, [doc, viewMode])

  const activeImageUrl = getActiveImageUrl()

  return {
    doc,
    isLoading,
    error,
    notes,
    setNotes,
    activeRightTab: effectiveRightTab,
    setActiveRightTab,
    viewMode,
    setViewMode,
    zoom,
    setZoom,
    scrollRef,
    fraudPanelCollapsed,
    setFraudPanelCollapsed,
    isSendDialogOpen,
    setIsSendDialogOpen,
    metadataOpen,
    setMetadataOpen,
    confirmDialog,
    setConfirmDialog,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    handleResetView,
    activeImageUrl,
    approveMutation,
    rejectMutation,
    handleConfirmAction,
  }
}
