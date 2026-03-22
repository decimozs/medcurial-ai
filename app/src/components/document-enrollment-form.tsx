import React, { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function DocumentEnrollmentForm() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please upload at least one document image');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/workers/document-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        toast.error('Failed to start document analysis');
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let firstDocumentId: string | null = null;
      const toastId = toast.loading('Processing documents in the background...');

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr) {
                try {
                  const eventData = JSON.parse(dataStr);
                  // Grab the first document_id so we can navigate to it.
                  if (eventData.document_id && !firstDocumentId) {
                    firstDocumentId = eventData.document_id;
                  }
                } catch (e) {
                  console.error('Error parsing SSE data', e);
                }
              }
            }
          }
          if (firstDocumentId) {
            reader.cancel(); // Cancel stream immediately to allow redirect
            break;
          }
        }
      }

      if (firstDocumentId) {
        toast.success('Analysis started! You can track progress in the registry.', { id: toastId });
        setFiles([]);

        navigate({
          to: '/documents/$id',
          params: { id: firstDocumentId }
        });
      } else {
        toast.error('Enrollment failed. No documents saved.', { id: toastId });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('An error occurred during analysis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-10 py-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {isSubmitting ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-5 border border-dashed border-border/40 rounded-3xl bg-accent/5 animate-in fade-in zoom-in-95 duration-500">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground/80">Initializing Analysis Stream</p>
            <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">Transmitting documents to neural worker...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground/80">
              Document Analysis
            </h2>
            <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium">
              Initialize structural and contextual analysis of medical documents using Roboflow vision models.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-8">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 ml-1">
                  Document Assets
                </Label>
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4",
                    isDragging
                      ? "border-primary bg-primary/5 scale-[0.99]"
                      : "border-border/40 bg-accent/10 hover:bg-accent/20 hover:border-primary/20"
                  )}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={onFileSelect}
                  />

                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="font-semibold text-sm">Click or drag images here</p>
                    <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
                      PNG · JPEG · 5MB MAX
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Staged Documents ({files.length})
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-square bg-accent/20 border border-border/30 transition-all hover:border-primary/20">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="w-full h-full object-contain p-2 opacity-80 group-hover:opacity-100 transition-opacity"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-background/50 backdrop-blur-md text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-12 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
                disabled={isSubmitting}
              >
                Begin Analysis
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
