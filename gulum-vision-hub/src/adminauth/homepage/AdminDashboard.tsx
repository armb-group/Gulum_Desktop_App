import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Users, GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { AdminShell } from "./AdminShell";

const stats = [
  { label: "Total Students", value: "1,284", icon: GraduationCap },
  { label: "Total Teachers", value: "96", icon: BookOpen },
  { label: "Departments", value: "12", icon: Users },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  return (
    <AdminShell title="Admin Console">
    <section className="container py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Admin Console</h1>
          <p className="text-muted-foreground mt-1">
            {user?.institution ? `Institution: ${user.institution}` : "Welcome back"}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/bulk-upload">
            <Upload className="h-4 w-4" /> Bulk Upload
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-6 bg-surface border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <s.icon className="h-8 w-8 text-primary" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-surface border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Onboard users in bulk</h2>
            <p className="text-muted-foreground mt-1">
              Upload a CSV of students or teachers and review parsed records before importing.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/bulk-upload">
              Open Bulk Upload <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </section>
    </AdminShell>
  );
};

export default AdminDashboard;
