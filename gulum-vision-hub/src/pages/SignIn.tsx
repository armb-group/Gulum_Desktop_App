import { FormEvent, useState } from "react";
import { loginApi } from "@/services/authApi";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Info,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useAuth, Role } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SignInProps {
  role: "student" | "teacher";
}

const config = {
  student: {
    portalLabel: "Student Portal",
    idLabel: "Email",
    idPlaceholder: "e.g. student@example.com",
    idIcon: Mail,
    helper: "Use the email issued by your institution",
    switchLabel: "Sign in as Teacher instead",
    switchTo: "/teacher/login",
    redirect: "/student",
  },
  teacher: {
    portalLabel: "Teacher Portal",
    idLabel: "Email",
    idPlaceholder: "e.g. teacher@gmail.com",
    idIcon: User,
    helper: "Use the email issued by your institution",
    switchLabel: "Sign in as Student instead",
    switchTo: "/student/login",
    redirect: "/teacher",
  },
} as const;

const SignIn = ({ role }: SignInProps) => {
  const cfg = config[role];
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ email: identifier, password });
      const data = res.responseData ?? res;
      // Always trust the portal the user signed into — ignore backend role field
      // because the backend may return "USER" or inconsistent role strings
      const authUser = {
        id: data.id ?? data._id ?? data.userId ?? crypto.randomUUID(),
        name: data.name ?? data.fullName ?? identifier,
        email: data.email ?? data.emailId ?? identifier,
        role: role as Role,
        institution: data.institution ?? data.collegeName,
        institutionId: data.institutionId ?? data.institution_id,
        batchId: data.batchId ?? data.batch_id,
        classId: data.classesId ?? data.classId,
        departmentId: data.departmentId ?? data.department_id,
        token: data.token,
      };
      localStorage.setItem("gulum-user", JSON.stringify(authUser));
      login(authUser);
      toast.success("Welcome back!");
      navigate(cfg.redirect, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "";
      if (msg.toLowerCase().includes("timeout") || err?.code === "ECONNABORTED") {
        toast.error("Server took too long to respond. Please try again.");
      } else {
        toast.error(msg || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const IdIcon = cfg.idIcon;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      {/* Decorative Background Blurs */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-0 w-[220px] h-[220px] bg-primary/5 rounded-full blur-3xl" />

      {/* Top Nav Bar */}
      <header className="relative z-20 flex items-center px-6 md:px-10 pt-5 pb-2">
        <button
          onClick={() => navigate("/")}
          aria-label="Back"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 group"
        >
          <span className="w-8 h-8 rounded-full border border-primary/20 bg-background/80 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/40 transition-all duration-200">
            <ArrowLeft className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Back</span>
        </button>
      </header>

      {/* Scrollable Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-8">
            {/* Portal Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {cfg.portalLabel}
            </div>

            {/* Logo */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150 opacity-60" />
              <Logo
                size="md"
                className="relative !h-16 md:!h-20 w-auto drop-shadow-lg"
              />
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
              Welcome back to{" "}
              <span className="text-primary">GULUM</span>
            </h1>

            {/* Subtitle */}
            {/* <p className="text-muted-foreground mt-1.5 text-sm max-w-xs leading-relaxed">
              Sign in with your {cfg.idLabel.toLowerCase()} and password to
              continue.
            </p> */}
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl shadow-xl shadow-primary/5 p-6 md:p-7">
            <form onSubmit={onSubmit} className="space-y-5">

              {/* Identifier Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/80">
                  {cfg.idLabel}
                </label>
                <div className="relative">
                  <IdIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={cfg.idPlaceholder}
                    className="h-11 pl-10 rounded-xl border-border/50 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground/80">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-primary text-xs font-medium hover:underline underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 pl-10 pr-10 rounded-xl border-border/50 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/15 transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] mt-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>

              {/* Helper Info */}
              <div className="flex items-start gap-2.5 rounded-xl border border-primary/10 bg-primary/5 px-3.5 py-3 text-xs text-primary">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p className="leading-relaxed">{cfg.helper}</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="h-px bg-border/60 flex-1" />
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                  or
                </span>
                <div className="h-px bg-border/60 flex-1" />
              </div>

              {/* Switch Role Button */}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full h-11 rounded-xl border-primary/20 bg-background/50 text-sm font-medium hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
              >
                <Link
                  to={cfg.switchTo}
                  className="flex items-center justify-center gap-2"
                >
                  <GraduationCap className="h-4 w-4 text-primary" />
                  {cfg.switchLabel}
                </Link>
              </Button>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
