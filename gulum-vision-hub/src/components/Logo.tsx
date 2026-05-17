import { useTheme } from "@/contexts/ThemeContext";
import logoLight from "@/assets/gulum-logo-light.png";
import logoDark from "@/assets/gulum-logo-dark.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-10",
  md: "h-16",
  lg: "h-28",
};

export const Logo = ({ className = "", size = "md" }: LogoProps) => {
  const { theme } = useTheme();
  const src = theme === "dark" ? logoDark : logoLight;
  return (
    <img
      src={src}
      alt="GULUM"
      width={768}
      height={512}
      className={`${sizeMap[size]} w-auto object-contain ${className}`}
    />
  );
};
