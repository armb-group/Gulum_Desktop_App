import { Navigate, Outlet } from "react-router-dom";
import { useAuth, Role } from "@/contexts/AuthContext";
import { ReactNode } from "react";

export const ProtectedRoute = ({ role, children }: { role: Role; children?: ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // If user is logged in but role doesn't match this portal, redirect them
  // to their actual portal instead of bouncing to Welcome
  if (user.role !== role) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "teacher") return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
};
