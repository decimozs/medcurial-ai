import { createFileRoute, Link } from "@tanstack/react-router"
import { TaskKanban } from "@/features/tasks/components/task-kanban"
import { GlobalNav } from "@/features/layout/components/global-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/features/layout/components/theme-toggle"
import { CommandTrigger } from "@/features/layout/components/command-menu"
import { NavClock } from "@/features/layout/components/nav-clock"
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
import { useAppStore } from "@/lib/store"
import { useEffect } from "react"

export const Route = createFileRoute("/tasks")({
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({
        to: "/login",
      })
    }
  },
  component: TasksLayout,
})

function TasksLayout() {
  const { isSidebarOpen, setSidebarOpen } = useAppStore()

  // Ensure sidebar is handled consistently
  useEffect(() => {
    // For tasks, we might not have a task-specific sidebar, so we can keep it closed or open
    // based on preference. Let's keep it consistent with the user's last state but for now
    // just ensure the provider is there for the SidebarInset to work correctly.
  }, [])

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <GlobalNav />
      <div className="flex h-screen w-full bg-background pl-[var(--global-nav-width)]">
        <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-border/40 bg-background/50 px-6 backdrop-blur-md">
            {/* Left Section: Breadcrumbs */}
            <div className="flex flex-1 items-center gap-4">
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
                      Task Board
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

          <main className="flex flex-1 flex-col overflow-hidden bg-muted/5">
            <TaskKanban />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
