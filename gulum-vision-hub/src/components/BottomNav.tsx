import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, FolderClosed, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  base: "/student" | "/teacher";
}

const items = [
  { to: "", icon: Home, label: "Home", end: true },
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/assignments", icon: FolderClosed, label: "Assignments" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = ({ base }: BottomNavProps) => {
  return (
    <nav
      className="sticky bottom-0 left-0 right-0 z-20 px-3 pb-3 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent"
      aria-label="Primary"
    >
      <div className="bg-surface border border-border rounded-full shadow-lg flex items-center justify-around py-2 px-2">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={`${base}${item.to}`}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-center h-11 w-11 rounded-full transition-colors",
                isActive
                  ? "bg-brand-soft text-primary"
                  : "text-muted-foreground hover:text-primary"
              )
            }
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
