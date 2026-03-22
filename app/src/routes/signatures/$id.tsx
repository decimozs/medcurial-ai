import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Calendar,
  Hash,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { cn } from '@/lib/utils';

interface Signature {
  id: string;
  name: string;
  status: string;
  imageUrls: {
    original: string[];
    roi: string[];
    normalized: string[];
    siamese: string[];
    image_preview: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute('/signatures/$id')({
  component: SignatureDetail,
});

function SignatureDetail() {
  const { id } = Route.useParams();

  const { data: signature, isLoading } = useQuery<Signature>({
    queryKey: ['signature', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/api/v1/signatures/${id}`);
      if (!response.ok) throw new Error('Failed to fetch signature');
      return response.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as Signature | undefined;
      return data?.status === 'processing' ? 2000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!signature) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-xl font-bold">Signature not found</p>
      </div>
    );
  }

  const stages = [
    { id: 'original', label: 'Original', urls: signature.imageUrls.original, bg: 'bg-white' },
    { id: 'roi', label: 'ROI', urls: signature.imageUrls.roi, bg: 'bg-white' },
    { id: 'normalized', label: 'Normalized', urls: signature.imageUrls.normalized, bg: 'bg-black', border: 'border-white/5' },
    { id: 'preview', label: 'Neural Matrix', urls: signature.imageUrls.image_preview, bg: 'bg-white', border: 'border-black/5' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-border/40">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/5 border-primary/10 text-primary text-[10px] font-medium capitalize">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Registry
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground/90">
              {signature.name}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground/40 font-medium text-xs tracking-wide">
              <span>Signature</span>
              <span>/</span>
              <span className="text-muted-foreground/60">{signature.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-5 py-3 rounded-2xl bg-accent/30 border border-border/40">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground/40 font-medium text-[10px]">
              <Calendar className="w-3.5 h-3.5" /> Date
            </div>
            <p className="font-medium text-sm text-foreground/80">
              {new Date(signature.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-accent/30 border border-border/40">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground/40 font-medium text-[10px]">
              <Hash className="w-3.5 h-3.5" /> Assets
            </div>
            <p className="font-medium text-sm text-foreground/80">
              {Object.values(signature.imageUrls).flat().length - Object.values(signature.imageUrls.original).length} References
            </p>
          </div>
        </div>
      </div>

      {/* Processing Timeline Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-border/10">
          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-muted-foreground/60">
              Processing Pipeline
            </h3>
            <p className="text-[10px] text-muted-foreground/30 font-medium">
              {signature.status === 'processing' ? 'Currently Processing...' : 'Single Sample Enrolled'}
            </p>
          </div>
        </div>

        {signature.status === 'processing' ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-5 border border-dashed border-border/40 rounded-3xl bg-accent/5 animate-in fade-in duration-500">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground/80">Processing Neural Assets</p>
              <p className="text-[11px] font-medium text-muted-foreground/60">This may take a few moments...</p>
            </div>
          </div>
        ) : signature.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-5 border border-dashed border-destructive/40 rounded-3xl bg-destructive/5 animate-in fade-in duration-500">
            <AlertCircle className="w-12 h-12 text-destructive opacity-80" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground/80">Processing Failed</p>
              <p className="text-[11px] font-medium text-muted-foreground/60">There was an error processing these signature assets.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12 pt-4">
            {stages.map((stage, idx) => {
              const url = stage.urls[0];
              if (!url) return <div key={stage.id} className="aspect-video rounded-3xl bg-accent/5 border border-dashed border-border/40" />;

              return (
                <div key={stage.id} className="space-y-4 group/item">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-semibold text-primary/70 bg-primary/5 px-2.5 py-1 rounded-md border-primary/10">
                      Step 0{idx + 1}
                    </span>
                    <span className="text-[12px] font-semibold tracking-tight text-foreground/70">
                      {stage.label}
                    </span>
                    <div className="flex-1 h-[1px] bg-border/20 group-hover/item:bg-primary/20 transition-colors" />
                  </div>

                  <Dialog>
                    <div
                      className={cn(
                        "group relative aspect-video rounded-3xl overflow-hidden ring-offset-background transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl hover:shadow-primary/5",
                        stage.bg || "bg-accent/10",
                        stage.border || "border border-border/30"
                      )}
                    >
                      <ImageWithSkeleton
                        src={url}
                        alt={`${stage.label} sample`}
                        className="w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-background shadow-2xl border border-border/40 hover:bg-accent hover:scale-105 transition-all text-xs font-semibold text-foreground/80">
                            <Eye className="w-4 h-4 text-primary" />
                            Inspect Stage
                          </button>
                        </DialogTrigger>
                      </div>
                    </div>

                    <DialogContent className={cn(
                      "max-w-4xl backdrop-blur-2xl p-2 overflow-hidden rounded-[2.5rem] shadow-2xl transition-colors duration-500",
                      stage.bg || "bg-background/95",
                      stage.border || "border-border/40"
                    )}>
                      <div className="relative aspect-video w-full flex items-center justify-center p-12">
                        <ImageWithSkeleton
                          src={url}
                          alt="Signature Analysis"
                          className="w-full h-full object-contain drop-shadow-2xl"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { SignatureDetail };
