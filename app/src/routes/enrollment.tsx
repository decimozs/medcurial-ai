import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { EnrollmentForm } from "@/features/enrollment/components/enrollment-form"

import { authClient } from "@/lib/auth-client"
import { redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/enrollment")({
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({
        to: "/login",
      })
    }
  },
  component: EnrollmentPage,
})

function EnrollmentPage() {
  return (
    <div className="relative container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="fixed top-8 left-8 z-50 sm:top-12 sm:left-12">
        <Link
          to="/signatures"
          className="inline-flex items-center text-[13px] font-semibold text-muted-foreground/60 transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Registry
        </Link>
      </div>

      <div className="w-full max-w-2xl animate-in duration-700 fade-in slide-in-from-bottom-4">
        <EnrollmentForm />
      </div>
    </div>
  )
}
