import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { SignatureViewMode } from "../components/signature-navigation"

interface Signature {
  id: string
  name: string
  status: string
  imageUrls: {
    original: string[]
    roi: string[]
    normalized: string[]
    siamese: string[]
    image_preview: string[]
  }
  createdAt: string
  updatedAt: string
}

export function useSignatureDetails(id: string) {
  const [viewMode, setViewMode] = useState<SignatureViewMode>("grid")
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
    data: signature,
    isLoading,
    error,
    isFetching,
  } = useQuery<Signature>({
    queryKey: ["signature", id],
    queryFn: async () => {
      const response = await apiClient.fetch(`/signatures/${id}`)
      if (!response.ok) throw new Error("Failed to fetch signature details")
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
    if (!signature || viewMode === "grid") return undefined
    switch (viewMode) {
      case "roi":
        return signature.imageUrls.roi[0] || signature.imageUrls.original[0]
      case "normalized":
        return (
          signature.imageUrls.normalized[0] || signature.imageUrls.original[0]
        )
      case "preview":
        return (
          signature.imageUrls.image_preview[0] ||
          signature.imageUrls.original[0]
        )
      default:
        return signature.imageUrls.original[0]
    }
  }

  return {
    signature,
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
    activeImageUrl: getActiveImageUrl(),
  }
}
