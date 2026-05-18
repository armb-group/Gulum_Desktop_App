import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ShieldCheck, GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Welcome = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Decorative Background Blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl" />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col px-6">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center pt-10">
          {/* Floating Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Smart Education Platform
          </div>

          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-125" />
            <Logo size="lg" className="relative !h-40 w-auto mb-6 drop-shadow-lg" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Welcome to{" "}
            <span className="text-primary">GULUM</span>
          </h1>

          {/* Subtitle */}
          <p className="text-primary mt-3 text-xl font-semibold">
            Tech Simply!
          </p>

          {/* Description */}
          <p className="text-muted-foreground mt-4 text-sm md:text-base max-w-sm leading-relaxed">
            Empowering teachers, students, and administrators with a seamless
            and modern learning experience.
          </p>

          {/* Feature Icons */}
          {/* <div className="flex items-center gap-6 mt-6 text-muted-foreground">
            <div className="flex flex-col items-center gap-1">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-xs">Teachers</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-xs">Students</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-xs">Admin</span>
            </div>
          </div> */}
        </div>

        {/* Push Buttons to Bottom */}
        <div className="flex-1" />

        {/* Login Buttons */}
        <div className="pb-10 space-y-4">
          <Button
            asChild
            size="lg"
            className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-primary/10 transition-all duration-300 hover:scale-[1.02]"
          >
            <Link to="/teacher/login">Login as Teacher</Link>
          </Button>

          <Button
            asChild
            size="lg"
            className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-primary/10 transition-all duration-300 hover:scale-[1.02]"
          >
            <Link to="/student/login">Login as Student</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full h-12 rounded-2xl border-primary/30 text-primary font-medium backdrop-blur-sm bg-background/70 hover:scale-[1.01] transition-all duration-300"
          >
            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Access
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;