import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-x-hidden bg-background px-6 pt-12 pb-20">
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse duration-[12s] delay-700" />
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[11px] font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            Medical Integrity Systems
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.15] text-foreground/90">
              Transforming <span className="text-primary italic">Claims</span> Integrity<br /> 
              with Neural Analysis
            </h1>
            
            <p className="text-sm sm:text-base text-muted-foreground/60 font-medium max-w-xl mx-auto leading-relaxed">
              Proprietary signature verification and intelligent matrix analysis tailored for next-generation medical fraud detection.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
          <Button asChild size="lg" className="h-12 px-8 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 transition-all shadow-sm">
            <Link to="/enrollment">
              Enroll Signature
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="h-12 px-8 text-sm font-semibold rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm">
            <Link to="/enroll-documents">
              Analyze Document
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12 px-8 text-sm font-medium rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <Link to="/signatures">
              Signature Explorer
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12 px-8 text-sm font-medium rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <Link to="/documents">
              Document Explorer
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 w-full border-t border-border/20">
          {[
            { icon: Zap, label: "Zero-Latency", desc: "Proprietary real-time verification processing" },
            { icon: Activity, label: "Neural Insights", desc: "Multi-layer matrix analysis for every sample" },
            { icon: ShieldCheck, label: "Encrypted Vault", desc: "Military-grade protection for registry assets" }
          ].map((feature, i) => (
            <div key={i} className="group flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center transition-all group-hover:bg-primary/5 group-hover:text-primary">
                <feature.icon className="w-5 h-5 opacity-70 group-hover:opacity-100" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight">{feature.label}</h3>
                <p className="text-xs text-muted-foreground/50 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-24 w-full max-w-4xl pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30">
        <div>&copy; 2026 Medcurial AI Systems</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary transition-colors">Security</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Registry</a>
        </div>
      </footer>
    </div>
  )
}
