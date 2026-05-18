import { FormEvent, useState } from "react";
import { loginApi } from "@/services/authApi";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, IdCard, Info, Lock, User } from "lucide-react";
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
    idLabel: "Roll Number",
    idPlaceholder: "e.g. BCA2024001",
    idIcon: IdCard,
    helper: "Your roll number and password are provided by your institution",
    switchLabel: "Sign in as Teacher instead",
    switchTo: "/teacher/login",
    redirect: "/student",
  },
  teacher: {
    portalLabel: "Teacher Portal",
    idLabel: "Email",
    idPlaceholder: "e.g. sp@gmail.com",
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
      const payload = { email: identifier, password };
      const res = await loginApi(payload);
      const data = res.responseData ?? res;
      const rawRole = String(data.role ?? data.userType ?? "").toUpperCase();

      if (role === "teacher" && rawRole !== "TEACHER") {
        throw new Error("Only teacher accounts can sign in here.");
      }

      if (role === "student" && rawRole !== "USER") {
        throw new Error("Only student accounts can sign in here.");
      }

      const normalizedRole =
        rawRole === "USER"
          ? "student"
          : rawRole === "TEACHER"
          ? "teacher"
          : rawRole === "ADMIN"
          ? "admin"
          : role;

      login({
        id: data.id ?? data._id ?? data.userId ?? crypto.randomUUID(),
        name: data.name ?? data.fullName ?? identifier,
        email: data.email ?? data.emailId ?? identifier,
        role: normalizedRole as Role,
        institution: data.institution ?? data.collegeName,
        token: data.token,
      });
      toast.success("Welcome back!");
      navigate(cfg.redirect);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const IdIcon = cfg.idIcon;

  return (
    <div className="min-h-full flex flex-col px-6 pt-6 pb-8">
      <button
        onClick={() => navigate("/")}
        aria-label="Back"
        className="text-primary hover:opacity-80 self-start"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center mt-2">
        <Logo size="md" className="!h-20" />
        <p className="mt-2 text-2xl tracking-[0.3em] font-semibold text-foreground">GULUM</p>
      </div>

      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft text-brand-soft-foreground px-4 py-1.5 text-sm font-semibold">
          <User className="h-4 w-4" /> {cfg.portalLabel}
        </span>
      </div>

      <h1 className="mt-4 text-4xl text-foreground">Sign In</h1>
      <p className="text-muted-foreground mt-1">
        Use your {cfg.idLabel.toLowerCase()} and password to sign in
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <label className="text-sm text-muted-foreground italic">{cfg.idLabel}</label>
          <div className="relative mt-1">
            <IdIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={cfg.idPlaceholder}
              className="h-14 pl-11 rounded-2xl bg-muted/60 border-transparent text-base"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground italic">Password</label>
          <div className="relative mt-1">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-14 pl-11 pr-11 rounded-2xl bg-muted/60 border-transparent text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="text-right mt-2">
            <button type="button" className="text-primary text-sm font-semibold">
              Forgot Password?
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full h-14 rounded-2xl text-lg font-display italic">
          {loading ? "Signing in…" : <> Sign In <ArrowRight className="h-5 w-5" /> </>}
        </Button>

        <div className="flex items-start gap-2 rounded-2xl bg-brand-soft text-brand-soft-foreground px-4 py-3 text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="italic">{cfg.helper}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs text-muted-foreground italic">or</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <Button
          asChild
          variant="outline"
          className="w-full h-14 rounded-2xl bg-muted/40 border-transparent text-foreground hover:bg-muted/60"
        >
          <Link to={cfg.switchTo}>
            <GraduationCap className="h-4 w-4" /> {cfg.switchLabel}
          </Link>
        </Button>
      </form>
    </div>
  );
};

export default SignIn;
