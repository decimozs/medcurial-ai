import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { SignupForm } from "@/features/auth/components/signup-form"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useEffect } from "react"

export const Route = createFileRoute("/signup")({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const session = authClient.useSession()

  useEffect(() => {
    if (session.data) {
      navigate({ to: "/" })
    }
  }, [session.data, navigate])

  return (
    <div className="font-inter flex min-h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* Left Side: Branding & Info (Hidden on mobile) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 md:flex md:w-1/2">
        {/* Subtle Ambient Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] animate-pulse rounded-full bg-primary/5 blur-[120px] duration-[10s]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[60%] w-[60%] animate-pulse rounded-full bg-accent/10 blur-[120px] delay-700 duration-[12s]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-primary/20 bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-inter text-xl font-bold tracking-tight text-foreground/90">
            Medcurial AI
          </span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-inter max-w-md text-4xl leading-[1.1] font-semibold tracking-tight text-foreground/90 lg:text-5xl">
            Join the <span className="text-primary italic">registry</span> of
            high-integrity claims.
          </h2>
          <p className="max-w-sm text-base leading-relaxed font-medium text-muted-foreground/60">
            Create an account to begin using our proprietery neural analysis
            pipelines and automated medical fraud detection.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-[10px] font-bold tracking-widest text-muted-foreground/30 uppercase">
          <span>&copy; 2026 Medcurial AI</span>
          <div className="flex gap-4">
            <a href="#" className="transition-colors hover:text-primary">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Privacy
            </a>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex flex-1 flex-col p-6 md:p-12">
        <div className="mb-12 flex items-center justify-between md:mb-20">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-9 font-medium text-muted-foreground hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to site
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">
              Already have an account?
            </span>
            <Link
              to="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center">
          <SignupForm />
        </div>

        <div className="mt-auto pt-8 text-center md:hidden">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground/30 uppercase">
            &copy; 2026 Medcurial AI Systems
          </p>
        </div>
      </div>
    </div>
  )
}
