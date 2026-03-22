import { Link, useLocation } from '@tanstack/react-router';
import { FileText, Fingerprint, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
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
              'relative flex h-10 w-10 items-center justify-center rounded-md transition-all duration-200',
              active
                ? 'bg-primary/15 text-primary shadow-sm'
                : 'text-muted-foreground/50 hover:bg-accent/60 hover:text-foreground',
            )}
          >
            {icon}
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
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
  );
}

export function GlobalNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { toggleSidebar, setOpen } = useSidebar();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, isActive: boolean) => {
    if (isActive) {
      e.preventDefault();
      toggleSidebar();
    } else {
      setOpen(true);
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--global-nav-width)] z-50 flex flex-col items-center py-5 gap-2 border-r border-border/40 bg-sidebar">
      {/* Brand icon */}
      <Link
        to="/"
        className="mb-2 -mt-1 flex h-[31px] w-8 items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <img src='/logo.png' className="w-5 h-5 text-primary" />
      </Link>

      <div className="w-full h-px bg-border/50 mb-1" />

      <NavItem
        to="/documents"
        icon={<FileText className="w-4 h-4" />}
        label="Documents"
        active={pathname.startsWith('/documents')}
        onClick={(e) => handleNavClick(e, pathname.startsWith('/documents'))}
      />
      <NavItem
        to="/signatures"
        icon={<Fingerprint className="w-4 h-4" />}
        label="Signatures"
        active={pathname.startsWith('/signatures')}
        onClick={(e) => handleNavClick(e, pathname.startsWith('/signatures'))}
      />
      <NavItem
        to="/chat"
        icon={<MessageCircle className="w-4 h-4" />}
        label="Agent Manager"
        active={pathname.startsWith('/chat')}
        onClick={(e) => handleNavClick(e, pathname.startsWith('/chat'))}
      />
    </aside>
  );
}
