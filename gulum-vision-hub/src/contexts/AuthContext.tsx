import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Role = "student" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  institution?: string;
  institutionId?: string;
  batchId?: string;
  classId?: string;
  departmentId?: string;
  token?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("gulum-user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("gulum-user", JSON.stringify(user));
    else localStorage.removeItem("gulum-user");
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
