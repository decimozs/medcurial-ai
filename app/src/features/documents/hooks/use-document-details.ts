import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { stripExtension } from "@/lib/utils"
import type { DocumentResponse, ViewMode } from "../types"

export function useDocumentDetails(id: string) {
  const [viewMode, setViewMode] = useState<ViewMode>("original")
  const [zoom, setZoom] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

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
    isFetching,
  } = useQuery<DocumentResponse>({
    queryKey: ["document", id],
    queryFn: async () => {
      const response = await apiClient.fetch(`/documents/${id}`)
      if (!response.ok) throw new Error("Failed to fetch document details")
      return response.json()
    },
    refetchInterval: (query) => {
      return query.state.data?.status === "processing" ? 2000 : false
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0)
    }
  }, [id])

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

  const getActiveImageUrl = () => {
    if (!doc) return undefined
    switch (viewMode) {
      case "text":
        return doc.imageUrls.text_extraction || doc.imageUrls.original
      case "signature":
        return (
          doc.imageUrls.signature_crop ||
          doc.imageUrls.signature_extraction ||
          doc.imageUrls.original
        )
      default:
        return doc.imageUrls.original
    }
  }

  const handleDownload = async () => {
    const activeImageUrl = getActiveImageUrl()
    if (!activeImageUrl || !doc) return
    try {
      const response = await fetch(activeImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = `${stripExtension(doc.name)}-${viewMode}.png`
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetryAnalysis = async () => {
    if (!doc || isRetrying) return
    setIsRetrying(true)
    try {
      const response = await apiClient.fetch(`/documents/${doc.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "processing",
          extractedText: doc.extractedText || "",
          name: doc.name,
          imageUrls: doc.imageUrls,
        }),
      })

      if (!response.ok) throw new Error("Failed to retry analysis")
    } catch (err) {
      console.error("Retry failed:", err)
    } finally {
      setIsRetrying(false)
    }
  }

  return {
    doc,
    isLoading,
    error,
    isFetching,
    viewMode,
    setViewMode,
    zoom,
    setZoom,
    scrollRef,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    handleResetView,
    handleDownload,
    isRetrying,
    handleRetryAnalysis,
    activeImageUrl: getActiveImageUrl(),
  }
}
