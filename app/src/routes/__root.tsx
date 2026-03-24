import { createRootRoute, Outlet } from "@tanstack/react-router"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CommandMenu } from "@/features/layout/components/command-menu"
import { RecordingOverlay } from "@/features/layout/components/recording-overlay"

export const Route = createRootRoute({
  component: () => (
    <TooltipProvider>
      <Toaster position="top-right" richColors />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <RecordingOverlay />
      <CommandMenu />
    </TooltipProvider>
  ),
})
