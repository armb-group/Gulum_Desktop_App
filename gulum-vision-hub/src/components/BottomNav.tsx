import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, FolderClosed, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getNotificationCountForRole } from "@/lib/notifications";

interface BottomNavProps {
  base: "/student" | "/teacher";
}

const items = [
  { to: "", icon: Home, label: "Home", end: true },
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = ({ base }: BottomNavProps) => {
  const { user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      if (!user) return;
      setAlertCount(getNotificationCountForRole(user.role === "teacher" ? "teacher" : "student"));
    };

    updateCount();
    window.addEventListener("gulum-shared-notifications-updated", updateCount);
    return () => window.removeEventListener("gulum-shared-notifications-updated", updateCount);
  }, [user]);

  return (
    <nav
      className="sticky bottom-0 left-0 right-0 z-20 px-3 pb-3 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent"
      aria-label="Primary"
    >
      <div className="bg-surface border border-border rounded-full shadow-lg flex items-center justify-around py-2 px-2">
        {items.map((item) => {
          const isAlerts = item.to === "/notifications";
          return (
            <NavLink
              key={item.label}
              to={`${base}${item.to}`}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center justify-center h-11 w-11 rounded-full transition-colors",
                  isActive
                    ? "bg-brand-soft text-primary"
                    : "text-muted-foreground hover:text-primary"
                )
              }
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
              {isAlerts && alertCount > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
              ) : null}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
