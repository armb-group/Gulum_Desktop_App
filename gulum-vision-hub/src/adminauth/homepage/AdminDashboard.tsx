import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeachers } from "@/services/teacherCrudAPI";
import { getStudents } from "@/services/studentCrudAPI";

import {
  Upload,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Zap,
  Activity,
  ClipboardList,
} from "lucide-react";

import { AdminShell } from "./AdminShell";
import { initialData as deptData } from "./departmentsData";

const stats = (studentCount: string, teacherCount: string) => [
  { label: "Total Students", value: studentCount, icon: GraduationCap },
  { label: "Total Teachers", value: teacherCount, icon: BookOpen },
  { label: "Departments", value: String(deptData.length), icon: Users },
  { label: "Active Courses", value: "92", icon: Zap },
];

const recentActivity = [
  { text: "Dr. Sarah Mitchell uploaded 47 student records", time: "2 min" },
  { text: "Engineering Dept updated Q3 curriculum", time: "15 min" },
  { text: "12 new teachers onboarded via bulk import", time: "1 hr" },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [teacherCount, setTeacherCount] = useState("184");
  const [studentCount, setStudentCount] = useState("3,247");

  useEffect(() => {
    getTeachers()
      .then((list) => {
        if (Array.isArray(list)) {
          setTeacherCount(String(list.length));
        }
      })
      .catch(() => {
        setTeacherCount("184");
      });

    getStudents()
      .then((list) => {
        if (Array.isArray(list)) {
          setStudentCount(String(list.length));
        }
      })
      .catch(() => {
        setStudentCount("3,247");
      });
  }, []);

  return (
    <AdminShell title="Admin Console">
      <section className="container py-8 space-y-8">

        {/* Hero Banner */}
        <div
          className="relative rounded-2xl overflow-hidden p-8"
          style={{
            backgroundColor: 'var(--admin-hero)',
            color: 'var(--admin-hero-foreground)',
            boxShadow: '0 8px 40px 0 rgba(102,20,20,0.28), 0 1.5px 0 0 rgba(255,255,255,0.08) inset'
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm opacity-80">Welcome back,</p>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Admin Console
              </h1>
              <p className="mt-2 text-sm opacity-90">
                {user?.institution
                  ? `${user.institution} · Academic Year 2024-25`
                  : "Gulum University · Academic Year 2024-25"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">↑ 12% students this term</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">3 uploads today</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">All systems active</span>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                asChild
                className="bg-white text-rose-800 shadow-md active:scale-95 active:shadow-2xl transition-transform"
              >
                <Link to="/admin/bulk-upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Bulk Upload
                </Link>
              </Button>
            </div>
          </div>

          {/* subtle decorative circle */}
          <div className="absolute right-6 bottom-6 h-40 w-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats(studentCount, teacherCount).map((s) => (
            <Card
              key={s.label}
              className="p-6 rounded-2xl admin-glass"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{s.value}</p>
                </div>

                <div className="flex items-center gap-3">
                  {s.label === "Departments" ? (
                    <Link to="/admin/departments" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shadow-sm hover:scale-105 transition-transform">
                      <s.icon className="w-5 h-5" />
                    </Link>
                  ) : s.label === "Total Teachers" ? (
                    <Link to="/admin/TeacherCrud" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shadow-sm hover:scale-105 transition-transform">
                      <s.icon className="w-6 h-6" />
                    </Link>
                  ) : s.label === "Total Students" ? (
                    <Link to="/admin/StudentCrud" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shadow-sm hover:scale-105 transition-transform">
                      <s.icon className="w-6 h-6" />
                    </Link>
                  ) : (
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <s.icon className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-6 rounded-2xl flex items-center justify-between admin-glass">
                <div>
                  <p className="text-sm font-semibold">Bulk Upload</p>
                  <p className="text-muted-foreground text-sm mt-1">Import users via CSV</p>
                </div>
                <Button asChild variant="ghost" className="active:scale-95 transition-transform">
                  <Link to="/admin/bulk-upload"><ArrowRight className="w-5 h-5" /></Link>
                </Button>
              </Card>

              <Card className="p-6 rounded-2xl flex items-center justify-between admin-glass">
                <div>
                  <p className="text-sm font-semibold">Manage Roles</p>
                  <p className="text-muted-foreground text-sm mt-1">Permissions & access</p>
                </div>
                <Button asChild variant="ghost" className="active:scale-95 transition-transform">
                  <Link to="/admin/roles"><ClipboardList className="w-5 h-5" /></Link>
                </Button>
              </Card>
              <Card className="p-6 rounded-2xl flex items-center justify-between admin-glass">
                <div>
                  <p className="text-sm font-semibold">Departments</p>
                  <p className="text-muted-foreground text-sm mt-1">Manage department hierarchy</p>
                </div>
                <Button asChild variant="ghost" className="active:scale-95 transition-transform">
                  <Link to="/admin/departments"><ArrowRight className="w-5 h-5" /></Link>
                </Button>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
            <Card className="mt-4 p-4 rounded-2xl admin-glass">
              <ul className="space-y-3">
                {recentActivity.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm">{r.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{r.time} ago</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

      </section>
    </AdminShell>
  );
};

export default AdminDashboard;