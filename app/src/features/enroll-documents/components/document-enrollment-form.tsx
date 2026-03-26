import React, { useCallback, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

export function DocumentEnrollmentForm() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      )
      setFiles((prev) => [...prev, ...newFiles])
    }
  }, [])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      toast.error("Please upload at least one document image")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    try {
      const response = await apiClient.fetch(
        "http://localhost:8000/workers/document-analysis",
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        toast.error("Failed to start document analysis")
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      let firstDocumentId: string | null = null
      const toastId = toast.loading("Processing documents in the background...")

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim()
              if (dataStr) {
                try {
                  const eventData = JSON.parse(dataStr)
                  if (eventData.document_id && !firstDocumentId) {
                    firstDocumentId = eventData.document_id
                  }
                  if (firstDocumentId && eventData.status === "completed") {
                    reader.cancel()
                    break
                  }
                } catch (e) {
                  console.error("Error parsing SSE data", e)
                }
              }
            }
          }
        }
      }

      if (firstDocumentId) {
        toast.success(
          "Analysis started! You can track progress in the registry.",
          { id: toastId }
        )
        setFiles([])

        navigate({
          to: "/documents/$id",
          params: { id: firstDocumentId },
        })
      } else {
        toast.error("Enrollment failed. No documents saved.", { id: toastId })
      }
    } catch (error) {
      console.error("Analysis error:", error)
      toast.error("An error occurred during analysis. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl animate-in space-y-10 py-8 duration-500 fade-in slide-in-from-bottom-2">
      {isSubmitting ? (
        <div className="flex min-h-[60vh] animate-in flex-col items-center justify-center space-y-5 rounded-3xl border border-dashed border-border/40 bg-accent/5 duration-500 zoom-in-95 fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-foreground/80">
              Initializing Analysis Stream
            </p>
            <p className="text-[11px] font-medium tracking-widest text-muted-foreground/60 uppercase">
              Transmitting documents to neural worker...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground/80">
              Document Analysis
            </h2>
            <p className="text-sm leading-relaxed font-medium text-muted-foreground/60">
              Initialize structural and contextual analysis of medical documents
              using Roboflow vision models.
            </p>
          </div>
          <form
            onSubmit={onSubmit}
            className="animate-in space-y-8 duration-500 fade-in"
          >
            <div className="space-y-8">
              <div className="space-y-2">
                <Label className="ml-1 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Document Assets
                </Label>
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={cn(
                    "group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-all duration-300 sm:p-12",
                    isDragging
                      ? "scale-[0.99] border-primary bg-primary/5"
                      : "border-border/40 bg-accent/10 hover:border-primary/20 hover:bg-accent/20"
                  )}
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={onFileSelect}
                  />

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <Upload className="h-6 w-6" />
                  </div>

                  <div className="space-y-1 text-center">
                    <p className="text-sm font-semibold">
                      Click or drag images here
                    </p>
                    <p className="text-[10px] font-medium tracking-widest text-muted-foreground/40 uppercase">
                      PNG · JPEG · 5MB MAX
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-4 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase">
                    Staged Documents ({files.length})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border/30 bg-accent/20 transition-all hover:border-primary/20"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="h-full w-full object-contain p-2 opacity-80 transition-opacity group-hover:opacity-100"
                        onLoad={(e) =>
                          URL.revokeObjectURL(
                            (e.target as HTMLImageElement).src
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        className="absolute top-1 right-1 rounded-full bg-background/50 p-1 text-foreground opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-destructive hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                disabled={isSubmitting}
              >
                Begin Analysis
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
