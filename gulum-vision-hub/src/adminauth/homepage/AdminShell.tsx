import { ReactNode } from "react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Upload, LogOut, Building2,
  GraduationCap, Users, Bell, ShieldCheck, UserCheck, Calendar,
  PanelLeft, ClipboardCheck, BookOpen, Layers, BookMarked, FolderOpen
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { CustomTooltip } from "@/components/CustomTooltip";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_GROUPS = [
  {
    label: "Manage",
    items: [
      { title: "Dashboard",          url: "/admin/dashboard",    icon: LayoutDashboard },
      { title: "Bulk Upload",        url: "/admin/bulk-upload",  icon: Upload },
      { title: "Department",        url: "/admin/department",  icon: Building2 },
      { title: "Classes",           url: "/admin/ClassCrud",   icon: Layers },
      { title: "Subjects",          url: "/admin/SubjectCrud",  icon: BookMarked },
      { title: "Modules",           url: "/admin/ModuleCrud",   icon: FolderOpen },
      { title: "Teachers",           url: "/admin/TeacherCrud",  icon: Users },
      { title: "Students",           url: "/admin/StudentCrud",  icon: GraduationCap },
      { title: "Notice",             url: "/admin/NoticePage",   icon: Bell },
      { title: "Attendance",         url: "/admin/attendance",   icon: ClipboardCheck },
      { title: "Lecture Audit",      url: "/admin/lecture-audit", icon: BookOpen },
      { title: "Calendar",           url: "/admin/calendar",      icon: Calendar },
    ],
  },

  {
  label: "Work",
  items: [
    {
      title: "Assign Teacher",
      url: "/admin/assign-teacher",
      icon: UserCheck,
    },
    {
      title: "Assign Subject",
      url: "/admin/assign-subject",
      icon: BookMarked,
    },
    {
      title: "Schedule Routine",
      url: "/admin/routine",
      icon: Calendar,
    },
  ],
}
];

interface AdminShellProps {
  title: string;
  children: ReactNode;
}

const AdminSidebarHeader = () => {
  const { state, toggleSidebar } = useSidebar();
  const expanded = state === "expanded";

  return expanded ? (
    <div className="flex items-center justify-between px-3 py-4 border-b border-sidebar-border h-14 shrink-0">
      <div className="min-w-0 flex items-center gap-2">
        <Logo size="sm" className="!h-7 w-7 shrink-0" />
        <div>
          <p className="text-sm font-bold text-sidebar-primary leading-none truncate">GULUM</p>
          <p className="text-[10px] text-sidebar-foreground/60 mt-0.5 truncate">Admin Console</p>
        </div>
      </div>
      <CustomTooltip content="Collapse Sidebar" side="right">
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors shrink-0 print-hide"
        >
          <PanelLeft className="h-4 w-4 text-sidebar-foreground" />
        </button>
      </CustomTooltip>
    </div>
  ) : (
    <div className="flex items-center justify-center px-3 py-4 border-b border-sidebar-border h-14 shrink-0">
      <CustomTooltip content="Expand Sidebar" side="right">
        <button
          onClick={toggleSidebar}
          className="relative h-9 w-9 flex items-center justify-center shrink-0 group/logo-btn cursor-ew-resize hover:bg-sidebar-accent hover:text-sidebar-primary rounded-lg transition-all duration-200"
        >
          <div className="group-hover/logo-btn:hidden">
            <Logo size="sm" className="!h-7 w-7" />
          </div>
          <div className="hidden group-hover/logo-btn:block animate-in fade-in zoom-in-95 duration-150">
            <PanelLeft className="h-4 w-4 text-sidebar-foreground" />
          </div>
        </button>
      </CustomTooltip>
    </div>
  );
};

const AdminSidebarContent = () => {
  const { state } = useSidebar();
  const expanded = state === "expanded";

  return (
    <SidebarContent className=" py-3 scrollbar-beautiful overflow-y-auto overflow-x-hidden group-data-[collapsible=icon]:overflow-y-auto group-data-[collapsible=icon]:overflow-x-hidden">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5 mb-4">
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
              className={({ isActive }) =>
                `group/nav-item relative flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-150 select-none
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
                  {!expanded ? (
                    <CustomTooltip content={item.title} side="right">
                      <span className="flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 shrink-0" />
                      </span>
                    </CustomTooltip>
                  ) : (
                    <item.icon className="h-4 w-4 shrink-0" />
                  )}
                  {expanded && <span className="truncate">{item.title}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </SidebarContent>
  );
};

const AdminSidebarFooter = ({ handleLogout, user }: { handleLogout: () => void; user: any }) => {
  const { state } = useSidebar();
  const expanded = state === "expanded";

  return (
    <SidebarFooter className="border-t border-sidebar-border p-2 flex flex-col gap-1 shrink-0">
      <button
        onClick={handleLogout}
        className={`group/logout-btn relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full
          ${!expanded ? "justify-center" : ""}`}
      >
        {!expanded ? (
          <CustomTooltip content="Sign out" side="right">
            <span className="flex items-center justify-center shrink-0">
              <LogOut className="h-4 w-4 shrink-0" />
            </span>
          </CustomTooltip>
        ) : (
          <LogOut className="h-4 w-4 shrink-0" />
        )}
        {expanded && <span className="text-xs font-medium">Sign out</span>}
      </button>

      <div className={`group/avatar relative flex items-center gap-2 rounded-lg px-2 py-2 mt-1 bg-sidebar-accent ${!expanded ? "justify-center" : ""}`}>
        {!expanded ? (
          <CustomTooltip content={`Admin (${user?.institution ?? "Gulum"})`} side="right">
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer">
              A
            </div>
          </CustomTooltip>
        ) : (
          <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
            A
          </div>
        )}
        {expanded && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-primary truncate">Admin</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.institution ?? "Gulum"}</p>
          </div>
        )}
      </div>
    </SidebarFooter>
  );
};

export const AdminShell = ({ title, children }: AdminShellProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full admin-bg">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border" style={{ background: "hsl(var(--sidebar-background))" }}>
          <AdminSidebarHeader />
          <AdminSidebarContent />
          <AdminSidebarFooter handleLogout={handleLogout} user={user} />
        </Sidebar>

        <SidebarInset className="peer-data-[state=collapsed]:ml-0 flex-1 flex flex-col min-w-0 bg-transparent">
          <header className="h-14 flex items-center gap-3 px-4 sticky top-0 z-10 admin-header-glass">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
              {user.institution && (
                <p className="text-xs text-muted-foreground truncate">{user.institution}</p>
              )}
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto scrollbar-beautiful flex flex-col">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
