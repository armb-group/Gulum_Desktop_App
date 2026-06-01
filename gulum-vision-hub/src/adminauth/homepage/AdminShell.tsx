import { ReactNode, useState } from "react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
<<<<<<< Updated upstream
import { LayoutDashboard, Upload, LogOut, ClipboardList, GraduationCap, Users, UserCheck } from "lucide-react";
=======
>>>>>>> Stashed changes
import {
  LayoutDashboard, Upload, LogOut, ClipboardList,
  GraduationCap, Users, Bell, Menu, X, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

const NAV_GROUPS = [
  {
    label: "Manage",
    items: [
      { title: "Dashboard",          url: "/admin/dashboard",    icon: LayoutDashboard },
      { title: "Bulk Upload",        url: "/admin/bulk-upload",  icon: Upload },
      { title: "Teachers",           url: "/admin/TeacherCrud",  icon: Users },
      { title: "Students",           url: "/admin/StudentCrud",  icon: GraduationCap },
      { title: "Notice",             url: "/admin/NoticePage",   icon: Bell },
    ],
  },
  {
    label: "Work",
    items: [
      { title: "Assign Work",        url: "/admin/assign-work",  icon: ClipboardList },
    ],
  },
  {
    label: "Links",
    items: [
      { title: "Role Chooser",       url: "/",                   icon: ShieldCheck },
    ],
  },
];

<<<<<<< Updated upstream
const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <Logo size="sm" className="!h-8" />
          <div className="leading-tight">
            <div className="font-display text-lg text-sidebar-primary">GULUM</div>
            <div className="text-[11px] text-sidebar-foreground/70">Admin Console</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2",
                          isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Assignments</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin/assign-work"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 rounded-md",
                        isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
                      )
                    }
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>Assign Work</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin/assign-teacher"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 rounded-md",
                        isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
                      )
                    }
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Assign Teacher</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Role chooser</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

=======
>>>>>>> Stashed changes
interface AdminShellProps {
  title: string;
  children: ReactNode;
}

export const AdminShell = ({ title, children }: AdminShellProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const handleLogout = () => { logout(); navigate("/admin/login", { replace: true }); };

  return (
    <div className="min-h-screen flex w-full admin-bg">

      {/* ── Discord-style Sidebar ── */}
      <aside
        className={`flex flex-col shrink-0 h-screen sticky top-0 z-20 transition-all duration-300 ${expanded ? "w-56" : "w-16"}`}
        style={{ background: "hsl(var(--sidebar-background))", borderRight: "1px solid hsl(var(--sidebar-border))" }}
      >
        {/* Logo / Server icon */}
        <div className={`flex items-center gap-3 px-3 py-4 border-b border-sidebar-border ${expanded ? "" : "justify-center"}`}>
          <div
            className="h-9 w-9 rounded-2xl bg-primary flex items-center justify-center shrink-0 cursor-pointer hover:rounded-xl transition-all duration-200 shadow-md"
            onClick={() => setExpanded((v) => !v)}
          >
            <Logo size="sm" className="!h-7 w-7" />
          </div>
          {expanded && (
            <div className="min-w-0 flex items-center gap-2">
              <Logo size="sm" className="!h-7" />
              <div>
                <p className="text-sm font-bold text-sidebar-primary leading-none truncate">GULUM</p>
                <p className="text-[10px] text-sidebar-foreground/60 mt-0.5 truncate">Admin Console</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 flex flex-col gap-4 px-2 py-3 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              {expanded && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-2 mb-1">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  title={!expanded ? item.title : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-150 select-none
                    ${isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                    }
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
            </div>
          ))}
        </nav>

        {/* Bottom: collapse + logout + user chip */}
        <div className="border-t border-sidebar-border p-2 flex flex-col gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="group relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all w-full"
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
            className="group relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
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
              A
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sidebar-primary truncate">Admin</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.institution ?? "Gulum"}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 px-4 sticky top-0 z-10 admin-header-glass">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
            {user.institution && (
              <p className="text-xs text-muted-foreground truncate">{user.institution}</p>
            )}
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
