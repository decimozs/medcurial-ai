import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/documents/')({ component: DocumentsIndexComponent });

function DocumentsIndexComponent() {
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const documentId = e.dataTransfer.getData('documentId');
    if (documentId) {
      navigate({
        to: '/documents/$id',
        params: { id: documentId },
      });
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "h-full flex flex-col items-center justify-center p-6 text-center transition-colors duration-300",
        isDragOver ? "bg-primary/5" : "bg-transparent"
      )}
    >
      <div className="flex flex-col items-center max-w-md space-y-6">
        <div className={cn(
          "w-32 h-32 rounded-full bg-accent/30 flex items-center justify-center transition-all duration-500",
          isDragOver ? "scale-110 bg-primary/10" : "scale-100"
        )}>
          {isDragOver ? (
            <Upload className="w-12 h-12 text-primary animate-bounce" />
          ) : (
            <FileText className="w-14 h-14 text-muted-foreground/30" />
          )}
        </div>

        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="text-xl font-semibold tracking-tight text-foreground/80">
            {isDragOver ? "Release to Open" : "Select a Document"}
          </h2>
          <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium">
            {isDragOver
              ? "Drop the document here to open its analysis view."
              : "Choose a document from the sidebar or drag it here to view its extracted text and signatures."}
          </p>
        </div>

        {!isDragOver && (
          <div className="pt-4 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-700 delay-150">
            <Button asChild variant="ghost" className="rounded-full px-6 text-xs font-semibold text-muted-foreground hover:text-primary">
              <Link to="/">
                <ArrowLeft className="mr-2 w-3.5 h-3.5" />
                Return to Dashboard
              </Link>
            </Button>
            <span className="text-muted-foreground/20">|</span>
            <Button asChild variant="secondary" className="rounded-full px-6 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all border-none">
              <Link to="/enroll-documents">
                Process Documents
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
