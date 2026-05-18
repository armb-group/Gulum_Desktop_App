import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Upload,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
} from "lucide-react";

import { AdminShell } from "./AdminShell";

const stats = [
  {
    label: "Total Students",
    value: "1,284",
    icon: GraduationCap,
    color: "from-blue-500/20 to-cyan-500/20",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-600",
  },
  {
    label: "Total Teachers",
    value: "96",
    icon: BookOpen,
    color: "from-purple-500/20 to-pink-500/20",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-600",
  },
  {
    label: "Departments",
    value: "12",
    icon: Users,
    color: "from-emerald-500/20 to-green-500/20",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-600",
  },
];

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <AdminShell title="Admin Console">
      <section className="container py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Admin Console
            </h1>

            <p className="text-muted-foreground mt-2 text-sm">
              {user?.institution
                ? `Institution: ${user.institution}`
                : "Welcome back"}
            </p>
          </div>

          <Button
            asChild
            className="shadow-lg hover:scale-105 transition-transform"
          >
            <Link to="/admin/bulk-upload">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Link>
          </Button>

        </div>

        {/* Stats Cards */}
        <div className="grid gap-5 md:grid-cols-3">

          {stats.map((s) => (
            <Card
              key={s.label}
              className={`p-6 border-0 bg-gradient-to-br ${s.color} backdrop-blur-md shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl`}
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </p>

                  <p className="text-4xl font-bold mt-2 text-foreground">
                    {s.value}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl ${s.iconBg} shadow-inner`}
                >
                  <s.icon
                    className={`h-8 w-8 ${s.iconColor}`}
                  />
                </div>

              </div>

            </Card>
          ))}

        </div>

        {/* Bulk Upload Section */}
        <Card className="relative overflow-hidden p-8 border-0 rounded-2xl bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 shadow-lg">

          {/* Decorative Blur */}
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/20 blur-3xl rounded-full"></div>

          <div className="relative flex flex-wrap items-center justify-between gap-4">

            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Onboard users in bulk
              </h2>

              <p className="text-muted-foreground mt-2 max-w-xl">
                Upload a CSV of students or teachers and review parsed
                records before importing into the system.
              </p>
            </div>

            <Button
              asChild
              variant="default"
              className="shadow-md hover:scale-105 transition-transform"
            >
              <Link to="/admin/bulk-upload">
                Open Bulk Upload
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>

          </div>

        </Card>

      </section>
    </AdminShell>
  );
};

export default AdminDashboard;