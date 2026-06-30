import { ReactNode, useState } from "react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { Home, Bell, User, LogOut, Menu, X, BarChart3, Calendar, BookOpen, Clock, ClipboardList } from "lucide-react";

interface RoleShellProps {
  role: "student" | "teacher";
  title: string;
  subtitle?: string;
  showDate?: boolean;
  wide?: boolean;
  children: ReactNode;
}

const getMenuItems = (base: string, role: string) => {
  const common = [
    { title: "Home",     url: base,                    icon: Home,     end: true },
    { title: "Insights", url: `${base}/dashboard`,     icon: BarChart3 },
  ];
  const teacherOnly = [
    { title: "Lecture Audit", url: `${base}/lecture-audit`, icon: BookOpen },
    { title: "Timetable",     url: `${base}/timetable`,     icon: Clock },
    { title: "Attendance",    url: `${base}/attendance`,    icon: ClipboardList },
  ];
  const studentOnly = [
    { title: "Timetable",     url: `${base}/timetable`,     icon: Clock },
  ];
  const rest = [
    { title: "Alerts",   url: `${base}/notifications`, icon: Bell },
    { title: "Calendar", url: `${base}/calendar`,      icon: Calendar },
    { title: "Profile",  url: `${base}/profile`,       icon: User },
  ];
  return role === "teacher" ? [...common, ...teacherOnly, ...rest] : [...common, ...studentOnly, ...rest];
};

const formatDate = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

export const RoleShell = ({ role, title, subtitle, showDate, wide, children }: RoleShellProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;

  const base = role === "student" ? "/student" : "/teacher";
  const items = getMenuItems(base, role);
  const headerSubtitle = subtitle ?? user.institution ?? "MCKV Institute of Engineering";
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen flex w-full bg-background">

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col shrink-0 h-screen sticky top-0 z-20 transition-all duration-300 ${expanded ? "w-56" : "w-16"}`}
        style={{ background: "hsl(var(--sidebar-background))", borderRight: "1px solid hsl(var(--sidebar-border))" }}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-3 px-3 py-4 border-b border-sidebar-border cursor-pointer ${!expanded ? "justify-center" : ""}`}
          onClick={() => setExpanded(v => !v)}
        >
          <Logo size="sm" className="!h-10 w-10 shrink-0" />
          {expanded && (
            <div className="min-w-0">
              <p className="text-sm font-black text-sidebar-primary leading-none tracking-tight">GULUM</p>
              <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 truncate">
                {role === "student" ? "Student Portal" : "Teacher Portal"}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto">
          {expanded && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-2 mb-1">
              {role === "student" ? "Student" : "Teacher"}
            </p>
          )}
          {items.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.end}
              title={!expanded ? item.title : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-150 select-none
                ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"}
                ${!expanded ? "justify-center" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !expanded && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-foreground" />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" />
                  {expanded && <span className="truncate">{item.title}</span>}
                  {!expanded && (
                    <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                      {item.title}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 flex flex-col gap-1">
          <button
            onClick={() => setExpanded(v => !v)}
            className="group relative flex items-center gap-3 rounded-lg px-2 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all w-full"
          >
            {expanded ? <X className="h-4 w-4 shrink-0" /> : <Menu className="h-4 w-4 shrink-0" />}
            {expanded && <span className="text-xs font-medium">Collapse</span>}
            {!expanded && (
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                Expand
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="group relative flex items-center gap-3 rounded-lg px-2 py-2 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {expanded && <span className="text-xs font-medium">Sign out</span>}
            {!expanded && (
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                Sign out
              </span>
            )}
          </button>

          <div className={`flex items-center gap-2 rounded-lg px-2 py-2 mt-1 bg-sidebar-accent ${!expanded ? "justify-center" : ""}`}>
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
              {user.name?.[0]?.toUpperCase() ?? (role === "student" ? "S" : "T")}
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sidebar-primary truncate">{user.name ?? "User"}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate capitalize">{role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
            <p className="text-xs text-muted-foreground truncate">{headerSubtitle}</p>
          </div>
          <ThemeToggle />
        </header>
        {showDate && (
          <div className="border-b border-border bg-background/95 backdrop-blur px-4 py-3">
            <div className="rounded-xl bg-brand-soft text-brand-soft-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
              {formatDate()}
            </div>
          </div>
        )}
        <main className={wide ? "flex-1 overflow-hidden flex flex-col" : "flex-1 px-4 md:px-8 lg:px-12 py-6 w-full max-w-6xl md:mx-auto overflow-auto"}>
          {children}
        </main>
      </div>
    </div>
  );
};
