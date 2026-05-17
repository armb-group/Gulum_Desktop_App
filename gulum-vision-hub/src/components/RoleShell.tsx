import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { Navigate } from "react-router-dom";

interface RoleShellProps {
  role: "student" | "teacher";
  title: string;
  subtitle?: string;
  showDate?: boolean;
  children: ReactNode;
}

export const RoleShell = ({ role, title, subtitle, showDate, children }: RoleShellProps) => {
  const { user } = useAuth();
  if (!user) return <Navigate to={role === "student" ? "/student/login" : "/teacher/login"} replace />;
  if (user.role !== role) return <Navigate to="/" replace />;

  const headerSubtitle = subtitle ?? user.institution ?? "MCKV Institute of Engineering";
  const base = role === "student" ? "/student" : "/teacher";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <SideNav base={base} />

      {/* Main content column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader title={title} subtitle={headerSubtitle} showDate={showDate} />
        <main className="flex-1 px-4 md:px-8 lg:px-12 pb-24 md:pb-10 space-y-4 md:space-y-6 w-full max-w-6xl md:mx-auto">
          {children}
        </main>
        {/* Mobile bottom nav */}
        <div className="md:hidden">
          <BottomNav base={base} />
        </div>
      </div>
    </div>
  );
};
