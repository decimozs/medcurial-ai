import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Zap, Activity } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({
        to: "/login",
      })
    }
  },
  component: Index,
})

function Index() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-x-hidden bg-background px-6 pt-12 pb-20">
      {/* Subtle Ambient Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] h-[40%] w-[40%] animate-pulse rounded-full bg-primary/5 blur-[120px] duration-[10s]" />
        <div className="absolute right-[-5%] bottom-[-5%] h-[40%] w-[40%] animate-pulse rounded-full bg-accent/10 blur-[120px] delay-700 duration-[12s]" />
      </div>

      <div className="mx-auto flex w-full max-w-4xl animate-in flex-col items-center space-y-10 text-center duration-700 fade-in slide-in-from-bottom-4">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            Medical Integrity Systems
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl leading-[1.15] font-semibold tracking-tight text-foreground/90 sm:text-5xl md:text-6xl">
              Transforming <span className="text-primary italic">Claims</span>{" "}
              Integrity
              <br />
              with Neural Analysis
            </h1>

            <p className="mx-auto max-w-xl text-sm leading-relaxed font-medium text-muted-foreground/60 sm:text-base">
              Proprietary signature verification and intelligent matrix analysis
              tailored for next-generation medical fraud detection.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-primary px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
          >
            <Link to="/enrollment">
              Enroll Signature
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="h-12 rounded-full px-8 text-sm font-semibold shadow-sm transition-all hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Link to="/enroll-documents">
              Analyze Document
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-full px-8 text-sm font-medium transition-all hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Link to="/signatures">Signature Explorer</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-full px-8 text-sm font-medium transition-all hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Link to="/documents">Document Explorer</Link>
          </Button>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 border-t border-border/20 pt-12 md:grid-cols-3">
          {[
            {
              icon: Zap,
              label: "Zero-Latency",
              desc: "Proprietary real-time verification processing",
            },
            {
              icon: Activity,
              label: "Neural Insights",
              desc: "Multi-layer matrix analysis for every sample",
            },
            {
              icon: ShieldCheck,
              label: "Encrypted Vault",
              desc: "Military-grade protection for registry assets",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group flex flex-col items-center space-y-3 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/30 transition-all group-hover:bg-primary/5 group-hover:text-primary">
                <feature.icon className="h-5 w-5 opacity-70 group-hover:opacity-100" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight">
                  {feature.label}
                </h3>
                <p className="text-xs leading-relaxed font-medium text-muted-foreground/50">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-24 flex w-full max-w-4xl flex-col items-center justify-between gap-4 pt-8 text-[10px] font-semibold tracking-widest text-muted-foreground/30 uppercase sm:flex-row">
        <div>&copy; 2026 Medcurial AI Systems</div>
        <div className="flex gap-6">
          <a href="#" className="transition-colors hover:text-primary">
            Security
          </a>
          <a href="#" className="transition-colors hover:text-primary">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-primary">
            Registry
          </a>
        </div>
      </footer>
    </div>
  )
}
