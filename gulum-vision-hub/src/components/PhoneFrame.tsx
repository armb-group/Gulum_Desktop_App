import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PhoneFrameProps {
  children: ReactNode;
}

/**
 * Responsive app shell.
 * - Mobile: fills viewport.
 * - Desktop: full-width app (no phone bezel) so it works as a desktop application.
 */
export const PhoneFrame = ({ children }: PhoneFrameProps) => {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = document.getElementById("phone-scroll");
    if (el) el.scrollTop = 0;
    else window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div id="phone-scroll" className="min-h-screen">
        {children}
      </div>
    </div>
  );
};
