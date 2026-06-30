import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Role = "student" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  institutionName: string;
  institutionId?: string;
  batchId?: string;
  classId?: string;
  classesId?: string;
  departmentId?: string;
  token?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isTokenExpired = (token?: string): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (typeof payload.exp !== "number") return false;
    return payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("gulum-user");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed.token && isTokenExpired(parsed.token)) {
        localStorage.removeItem("gulum-user");
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("gulum-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("gulum-user");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};