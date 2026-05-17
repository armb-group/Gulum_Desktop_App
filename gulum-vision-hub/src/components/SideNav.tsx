import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, FolderClosed, Bell, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";

interface SideNavProps {
  base: "/student" | "/teacher";
}

const items = [
  { to: "", icon: Home, label: "Home", end: true },
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/assignments", icon: FolderClosed, label: "Assignments" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const SideNav = ({ base }: SideNavProps) => {
  const { logout } = useAuth();
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-border bg-surface sticky top-0 h-screen">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-border">
        <Logo size="sm" className="!h-10" />
        <div>
          <div className="font-display text-xl text-primary leading-none">GULUM</div>
          <div className="text-xs text-muted-foreground mt-1">Institute portal</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={`${base}${item.to}`}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-soft text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
};
