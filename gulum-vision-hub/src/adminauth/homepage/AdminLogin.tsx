import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    login({
      id: crypto.randomUUID(),
      name: email.split("@")[0],
      email,
      role: "admin",
      institution: institution || "MCKV Institute of Engineering",
    });
    toast.success("Welcome, admin!");
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-full flex flex-col px-6 pt-6 pb-8">
      <button
        onClick={() => navigate("/")}
        aria-label="Back"
        className="text-primary self-start"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center mt-2">
        <Logo size="md" className="!h-20" />
        <p className="mt-2 text-2xl tracking-[0.3em] font-semibold text-foreground">GULUM</p>
      </div>

      <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-soft text-brand-soft-foreground px-4 py-1.5 text-sm font-semibold w-fit">
        <ShieldCheck className="h-4 w-4" /> Admin Portal
      </span>

      <h1 className="mt-4 text-4xl text-foreground">Sign In</h1>
      <p className="text-muted-foreground mt-1">Institution administration access</p>

      <Card className="mt-6 p-5 bg-surface border-border">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Institution Code</Label>
            <Input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. GULUM-001"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@institution.edu"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full h-12 rounded-full font-display">
            Sign In
          </Button>
          <Link to="/" className="block text-center text-sm text-muted-foreground">
            ← Back to portals
          </Link>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
