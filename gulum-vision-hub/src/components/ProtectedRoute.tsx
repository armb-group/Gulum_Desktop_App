import { Navigate } from "react-router-dom";
import { useAuth, Role } from "@/contexts/AuthContext";
import { ReactNode } from "react";

export const ProtectedRoute = ({ role, children }: { role: Role; children: ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to={`/${role}/login`} replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};
