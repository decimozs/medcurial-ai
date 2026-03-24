import { Link, useLocation } from "@tanstack/react-router"
import { FileText, Fingerprint, MessageCircle, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/features/layout/hooks/use-sidebar"
import { authClient } from "@/lib/auth-client"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  active: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

function NavItem({ to, icon, label, active, onClick }: NavItemProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to}
            onClick={onClick}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-md transition-all duration-200",
              active
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground/50 hover:bg-accent/60 hover:text-foreground"
            )}
          >
            {icon}
            {active && (
              <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={14}
          className="text-xs font-medium capitalize"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function GlobalNav() {
  const location = useLocation()
  const pathname = location.pathname
  const { toggleSidebar, setOpen } = useSidebar()
  const session = authClient.useSession()
  const userName = session.data?.user?.name || "Guest"

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login"
        },
      },
    })
  }

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    isActive: boolean
  ) => {
    if (isActive) {
      e.preventDefault()
      toggleSidebar()
    } else {
      setOpen(true)
    }
  }

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-50 flex w-[var(--global-nav-width)] flex-col items-center gap-2 border-r border-border/40 bg-sidebar py-5">
      {/* Brand icon */}
      <Link
        to="/"
        className="-mt-1 mb-2 flex h-[31px] w-8 items-center justify-center rounded-xl bg-primary/10 transition-colors hover:bg-primary/20"
      >
        <img src="/logo.png" className="h-5 w-5 text-primary" />
      </Link>

      <div className="mb-1 h-px w-full bg-border/50" />

      <NavItem
        to="/documents"
        icon={<FileText className="h-4 w-4" />}
        label="Documents"
        active={pathname.startsWith("/documents")}
        onClick={(e) => handleNavClick(e, pathname.startsWith("/documents"))}
      />
      <NavItem
        to="/signatures"
        icon={<Fingerprint className="h-4 w-4" />}
        label="Signatures"
        active={pathname.startsWith("/signatures")}
        onClick={(e) => handleNavClick(e, pathname.startsWith("/signatures"))}
      />
      <NavItem
        to="/chat"
        icon={<MessageCircle className="h-4 w-4" />}
        label="Agent Manager"
        active={pathname.startsWith("/chat")}
        onClick={(e) => handleNavClick(e, pathname.startsWith("/chat"))}
      />

      <div className="mt-auto flex w-full animate-in flex-col items-center gap-3 duration-700 fade-in">
        <div className="mb-1 h-px w-full bg-border/40" />

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-9 w-9 cursor-default items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-[13px] font-bold text-primary uppercase transition-all hover:bg-primary/15">
                {userName.charAt(0)}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={14}
              className="text-[11px] font-semibold"
            >
              {userName}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground/40 transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={14}
              className="text-[11px] font-semibold"
            >
              Sign Out
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  )
}
