import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommandMenu } from '@/components/command-menu'
import { RecordingOverlay } from '@/components/recording-overlay'

export const Route = createRootRoute({
  component: () => (
    <TooltipProvider>
      <Toaster position="top-right" richColors />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <RecordingOverlay />
      <CommandMenu />
      <TanStackRouterDevtools />
    </TooltipProvider>
  ),
})
