import { useTheme } from "@/contexts/ThemeContext";

export function useAdminGlass() {
  const { isDark } = useTheme();

  const glass: React.CSSProperties = isDark
    ? {
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 4px 28px 0 rgba(0,0,0,0.35), 0 1px 0 0 rgba(255,255,255,0.06) inset",
        border: "1px solid rgba(255,255,255,0.08)",
      }
    : {
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 4px 28px 0 rgba(102,20,20,0.10), 0 1px 0 0 rgba(255,255,255,0.8) inset",
        border: "1px solid rgba(255,255,255,0.35)",
      };

  const glassStrong: React.CSSProperties = isDark
    ? {
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 8px 40px 0 rgba(0,0,0,0.45), 0 1px 0 0 rgba(255,255,255,0.07) inset",
        border: "1px solid rgba(255,255,255,0.10)",
      }
    : {
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 8px 40px 0 rgba(102,20,20,0.13), 0 1px 0 0 rgba(255,255,255,0.9) inset",
        border: "1px solid rgba(255,255,255,0.4)",
      };

  const glassModal: React.CSSProperties = isDark
    ? {
        background: "rgba(20,20,20,0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 16px 60px 0 rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.10)",
      }
    : {
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 16px 60px 0 rgba(102,20,20,0.18)",
        border: "1px solid rgba(255,255,255,0.4)",
      };

  const headerGlass: React.CSSProperties = isDark
    ? {
        background: "rgba(10,10,10,0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 24px 0 rgba(0,0,0,0.4)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }
    : {
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 24px 0 rgba(102,20,20,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.3)",
      };

  const pageBackground: React.CSSProperties = isDark
    ? { background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(0 0% 7%) 100%)" }
    : { background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)" };

  return { glass, glassStrong, glassModal, headerGlass, pageBackground };
}
