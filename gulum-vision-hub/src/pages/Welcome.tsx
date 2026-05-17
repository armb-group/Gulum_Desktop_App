import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Welcome = () => {
  return (
    <div className="min-h-full flex flex-col px-8 pt-12 pb-16 relative">
      <div className="absolute top-6 right-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-start text-center">
        <Logo size="lg" className="!h-44 mb-10" />
        <h1 className="text-4xl text-foreground">Welcome to GULUM</h1>
        <p className="text-primary mt-4 text-lg">Tech Simply!</p>
      </div>

      <div className="flex-1"></div>

      <div className="flex flex-col items-center justify-center space-y-3">
        <Button asChild size="lg" className="w-full h-14 rounded-full text-lg font-display">
          <Link to="/teacher/login">Login as Teacher</Link>
        </Button>
        <Button asChild size="lg" className="w-full h-14 rounded-full text-lg font-display">
          <Link to="/student/login">Login as Student</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full h-12 rounded-full mt-4 text-primary border-primary/30"
        >
          <Link to="/admin/login">
            <ShieldCheck className="h-4 w-4" /> Admin access
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
