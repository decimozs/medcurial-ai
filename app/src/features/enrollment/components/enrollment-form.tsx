import React, { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "@tanstack/react-router"
import { Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

const enrollmentSchema = z.object({
  signatory_name: z.string().min(2, "Name must be at least 2 characters"),
})

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>

export function EnrollmentForm() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
  })

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

  const onSubmit = async (data: EnrollmentFormValues) => {
    if (files.length === 0) {
      toast.error("Please upload at least one signature image")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("signatory_name", data.signatory_name)
    files.forEach((file) => {
      formData.append("files", file)
    })

    try {
      const response = await apiClient.fetch(
        "http://localhost:8000/workers/enroll-signature?signatory_name=" +
          encodeURIComponent(data.signatory_name),
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        toast.error("Failed to start enrollment")
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      let finalSignatureId: string | null = null
      const toastId = toast.loading("Enrolling signatures in the background...")

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
                  if (eventData.signature_id && !finalSignatureId) {
                    finalSignatureId = eventData.signature_id
                  }
                } catch (e) {
                  console.error("Error parsing SSE data", e)
                }
              }
            }
          }
          if (finalSignatureId) {
            reader.cancel()
            break
          }
        }
      }

      if (finalSignatureId) {
        toast.success(
          "Registration started! You can track progress in the registry.",
          { id: toastId }
        )
        reset()
        setFiles([])

        navigate({
          to: "/signatures/$id",
          params: { id: finalSignatureId },
        })
      } else {
        toast.error("Enrollment failed. No signatures saved.", { id: toastId })
      }
    } catch (error) {
      console.error("Enrollment error:", error)
      toast.error("An error occurred during enrollment. Please try again.")
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
              Initializing Enrollment Stream
            </p>
            <p className="text-[11px] font-medium tracking-widest text-muted-foreground/60 uppercase">
              Establishing secure connection to neural worker...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground/80">
              Signature Enrollment
            </h2>
            <p className="text-sm leading-relaxed font-medium text-muted-foreground/60">
              Initialize a new signatory profile by providing authentic
              signature samples for neural analysis.
            </p>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="animate-in space-y-8 duration-500 fade-in"
          >
            <div className="space-y-8">
              <div className="space-y-2">
                <Label
                  htmlFor="signatory_name"
                  className="ml-1 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase"
                >
                  Signatory Name
                </Label>
                <Input
                  id="signatory_name"
                  placeholder="e.g. John Doe"
                  {...register("signatory_name")}
                  className={cn(
                    "h-12 rounded-xl border-none bg-accent/30 px-4 text-sm font-medium transition-all placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20",
                    errors.signatory_name &&
                      "bg-destructive/5 text-destructive focus-visible:ring-destructive/20"
                  )}
                />
                {errors.signatory_name && (
                  <p className="px-1 text-[10px] font-semibold tracking-tight text-destructive uppercase">
                    {errors.signatory_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Sample Assets
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
                    Staged Sampling ({files.length})
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
                Complete Enrollment
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
