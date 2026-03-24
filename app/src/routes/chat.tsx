import { createFileRoute, Outlet, Link } from "@tanstack/react-router"
import { ChatSidebar } from "@/features/chat/components/chat-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { GlobalNav } from "@/features/layout/components/global-nav"
import { ThemeToggle } from "@/features/layout/components/theme-toggle"
import { NavClock } from "@/features/layout/components/nav-clock"
import { CommandTrigger } from "@/features/layout/components/command-menu"
import { useAppStore } from "@/lib/store"
import { useEffect } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { authClient } from "@/lib/auth-client"
import { redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/chat")({
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({
        to: "/login",
      })
    }
  },
  component: ChatLayout,
})

function ChatLayout() {
  const { isSidebarOpen, setSidebarOpen } = useAppStore()

  // Ensure sidebar is open when navigating to chat section
  useEffect(() => {
    setSidebarOpen(true)
  }, [setSidebarOpen])

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <GlobalNav />
      <div className="flex h-screen w-full overflow-hidden bg-background pl-[var(--global-nav-width)]">
        {isSidebarOpen && <ChatSidebar />}

        <SidebarInset className="relative flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center border-b border-border/40 bg-background/50 px-6 backdrop-blur-md">
            {/* Left Section: Breadcrumbs */}
            <div className="flex flex-1 items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-primary/5" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      asChild
                      className="text-[13px] font-medium text-muted-foreground/60 transition-colors hover:text-primary"
                    >
                      <Link to="/">Explorer</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="opacity-20" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-[13px] font-semibold tracking-tight text-foreground/80">
                      Agent Manager
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Center Section: Command Palette */}
            <div className="flex flex-shrink-0 justify-center px-4">
              <CommandTrigger />
            </div>

            {/* Right Section: Utilities */}
            <div className="flex flex-1 items-center justify-end gap-3">
              <NavClock />
              <ThemeToggle />
            </div>
          </header>

          <main className="relative flex flex-1 flex-col overflow-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
