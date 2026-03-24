import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/documents/")({
  component: DocumentsIndexComponent,
})

function DocumentsIndexComponent() {
  const [isDragOver, setIsDragOver] = useState(false)
  const navigate = useNavigate()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const documentId = e.dataTransfer.getData("documentId")
    if (documentId) {
      navigate({
        to: "/documents/$id",
        params: { id: documentId },
      })
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex h-full flex-col items-center justify-center p-6 text-center transition-colors duration-300",
        isDragOver ? "bg-primary/5" : "bg-transparent"
      )}
    >
      <div className="flex max-w-md flex-col items-center space-y-6">
        <div
          className={cn(
            "flex h-32 w-32 items-center justify-center rounded-full bg-accent/30 transition-all duration-500",
            isDragOver ? "scale-110 bg-primary/10" : "scale-100"
          )}
        >
          {isDragOver ? (
            <Upload className="h-12 w-12 animate-bounce text-primary" />
          ) : (
            <FileText className="h-14 w-14 text-muted-foreground/30" />
          )}
        </div>

        <div className="animate-in space-y-2 duration-500 fade-in slide-in-from-bottom-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground/80">
            {isDragOver ? "Release to Open" : "Select a Document"}
          </h2>
          <p className="text-sm leading-relaxed font-medium text-muted-foreground/60">
            {isDragOver
              ? "Drop the document here to open its analysis view."
              : "Choose a document from the sidebar or drag it here to view its extracted text and signatures."}
          </p>
        </div>

        {!isDragOver && (
          <div className="flex animate-in items-center gap-3 pt-4 delay-150 duration-700 zoom-in-95 fade-in">
            <Button
              asChild
              variant="ghost"
              className="rounded-full px-6 text-xs font-semibold text-muted-foreground hover:text-primary"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Return to Dashboard
              </Link>
            </Button>
            <span className="text-muted-foreground/20">|</span>
            <Button
              asChild
              variant="secondary"
              className="rounded-full border-none bg-primary/10 px-6 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
            >
              <Link to="/enroll-documents">Process Documents</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
