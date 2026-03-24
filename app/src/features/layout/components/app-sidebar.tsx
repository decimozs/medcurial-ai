import { Link } from "@tanstack/react-router"
import { Home } from "lucide-react"
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/features/layout/components/theme-toggle"
import { DocumentSection } from "./document-section"
import { SignatureSection } from "./signature-section"

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border/40">
      {/* Brand Header */}
      <SidebarHeader className="border-b border-border/20 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5 no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 transition-colors group-hover:bg-primary/25">
              <img
                src="/logo.png"
                className="h-4 w-4 text-primary"
                alt="Logo"
              />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground/80 transition-colors group-hover:text-primary">
              Medcurial
            </span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Home Nav Item */}
        <Link
          to="/"
          className="group mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2 text-muted-foreground/60 no-underline transition-all hover:bg-primary/5 hover:text-primary"
        >
          <Home className="h-4 w-4 transition-colors group-hover:text-primary" />
          <span className="text-xs font-semibold tracking-tight">Home</span>
        </Link>
      </SidebarHeader>

      {/* Registry Sections */}
      <SidebarContent className="gap-0 py-2">
        {/* Divider */}
        <div className="mx-4 my-1 h-px bg-border/30" />
        <DocumentSection />
        <div className="mx-4 my-1 h-px bg-border/30" />
        <SignatureSection />
      </SidebarContent>
    </Sidebar>
  )
}
