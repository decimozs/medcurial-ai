import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { DocumentSidebar } from '@/components/document-sidebar';
import { GlobalNav } from '@/components/global-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { CommandTrigger } from '@/components/command-menu';
import { NavClock } from '@/components/nav-clock';
import { useAppStore } from '@/lib/store';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const Route = createFileRoute('/documents')({
  component: DocumentsLayout,
});

function DocumentsLayout() {
  const { isSidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <GlobalNav />
      <div className="flex h-screen bg-background w-full pl-[var(--global-nav-width)]">
        {isSidebarOpen && <DocumentSidebar />}

        <SidebarInset className="flex flex-col min-w-0 flex-1">
          <header className="h-16 flex items-center px-6 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-10">
            {/* Left Section: Breadcrumbs */}
            <div className="flex-1 flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-primary/5" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild className="text-[13px] font-medium text-muted-foreground/60 hover:text-primary transition-colors">
                      <Link to="/">Explorer</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="opacity-20" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-[13px] font-semibold text-foreground/80 tracking-tight">Documents</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Center Section: Command Palette */}
            <div className="flex-shrink-0 flex justify-center px-4">
              <CommandTrigger />
            </div>

            {/* Right Section: Utilities */}
            <div className="flex-1 flex items-center justify-end gap-3">
              <NavClock />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-hidden flex flex-col">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
