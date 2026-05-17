import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Calendar, Moon, Sun, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "./ui/button";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showDate?: boolean;
  showThemeToggle?: boolean;
}

const today = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const AppHeader = ({ title, subtitle, showDate, showThemeToggle = true }: AppHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="px-4 pt-6 pb-3 sticky top-0 z-10 bg-background/95 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <User className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl leading-tight text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {showThemeToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-10 w-10 rounded-full bg-brand-soft text-primary hover:bg-brand-soft/80"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}
        <Logo size="sm" className="!h-9" />
      </div>
      {showDate && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-soft text-brand-soft-foreground px-4 py-2.5 text-sm font-medium">
          <Calendar className="h-4 w-4" />
          {today()}
        </div>
      )}
    </header>
  );
};
