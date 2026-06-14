import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeachers } from "@/services/teacherCrudAPI";
import { getStudents } from "@/services/studentCrudAPI";
import { getDepartments } from "@/services/departmentAPI";
import { getNoticesByInstitution } from "@/services/noticeAPI";

import {
  Upload,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Zap,
  Bell,
  ClipboardCheck,
  UserCheck,
  Calendar,
  Building2,
  Loader2,
} from "lucide-react";

import { AdminShell } from "./AdminShell";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teacherCount, setTeacherCount] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState<string | null>(null);
  const [deptCount, setDeptCount] = useState<string | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  useEffect(() => {
    getTeachers()
      .then((list) => {
        if (Array.isArray(list)) setTeacherCount(String(list.length));
        else setTeacherCount("0");
      })
      .catch(() => setTeacherCount("0"));

    getStudents()
      .then((list) => {
        if (Array.isArray(list)) setStudentCount(String(list.length));
        else setStudentCount("0");
      })
      .catch(() => setStudentCount("0"));

    getDepartments()
      .then((list) => {
        if (Array.isArray(list)) setDeptCount(String(list.length));
        else setDeptCount("0");
      })
      .catch(() => setDeptCount("0"));

    // Fetch recent notices
    setNoticesLoading(true);
    getNoticesByInstitution(user.institutionId)
      .then((list) => {
        const items = Array.isArray(list) ? list : [];
        // Sort by createdAt descending and take latest 5
        const sorted = items
          .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
            const dateB = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 3);
        setNotices(sorted);
      })
      .catch(() => setNotices([]))
      .finally(() => setNoticesLoading(false));
  }, []);

  const statsCards = [
    { label: "Total Students", value: studentCount, icon: GraduationCap, route: "/admin/StudentCrud", color: "from-indigo-500/10 to-blue-500/10 border-indigo-200/50 dark:border-indigo-800/40" },
    { label: "Total Teachers", value: teacherCount, icon: BookOpen, route: "/admin/TeacherCrud", color: "from-amber-500/10 to-orange-500/10 border-amber-200/50 dark:border-amber-800/40" },
    { label: "Departments", value: deptCount, icon: Building2, route: "/admin/department", color: "from-emerald-500/10 to-teal-500/10 border-emerald-200/50 dark:border-emerald-800/40" },
  ];

  const quickActions = [
    { title: "Attendance", desc: "Track attendance", icon: ClipboardCheck, route: "/admin/attendance", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" },
    { title: "Assign Teacher", desc: "Map faculty to classes", icon: UserCheck, route: "/admin/assign-teacher", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
    { title: "Schedule Routine", desc: "Manage class timetables", icon: Calendar, route: "/admin/routine", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
    { title: "Lecture Audit", desc: "Track syllabus progress", icon: BookOpen, route: "/admin/lecture-audit", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10" },
  ];

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "just now";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <AdminShell title="Admin Console">
      <section className="container py-5 space-y-5 h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col justify-between">

        {/* Hero Banner */}
        <div
          className="relative rounded-2xl overflow-hidden p-6 md:p-8 shrink-0 shadow-md"
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
                className="bg-white text-zinc-900 hover:bg-gray-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:shadow-2xl transition-all duration-200"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 shrink-0">
          {statsCards.map((s) => (
            <Card
              key={s.label}
              onClick={() => navigate(s.route)}
              className={`p-5 md:p-6 rounded-2xl admin-glass cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  {s.value !== null ? (
                    <p className="text-2xl md:text-3xl font-bold mt-2">{s.value}</p>
                  ) : (
                    <div className="mt-3">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200">
                  <s.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch flex-1 min-h-0">

          {/* Quick Actions (2/3 width on desktop) */}
          <div className="lg:col-span-2 flex flex-col min-h-0 space-y-3">
            <div className="h-9 flex items-center shrink-0">
              <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-0">
              {quickActions.map((action) => (
                <Card
                  key={action.title}
                  onClick={() => navigate(action.route)}
                  className="p-5 rounded-2xl flex items-center gap-4 admin-glass cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group h-full"
                >
                  <div className={`p-3 rounded-xl ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-md font-semibold text-foreground">{action.title}</p>
                    <p className="text-muted-foreground text-sm mt-0.5">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Notices (1/3 width on desktop) */}
          <div className="flex flex-col min-h-0 space-y-3">
            <div className="h-9 flex items-center justify-between shrink-0">
              <h3 className="text-base font-semibold text-foreground">Recent Notices</h3>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-primary"
              >
                <Link to="/admin/NoticePage">View all</Link>
              </Button>
            </div>
            <Card className="p-4 rounded-2xl admin-glass flex-1 flex flex-col min-h-0">
              {noticesLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 flex-1">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading notices...
                </div>
              ) : notices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground flex-1">
                  <Bell className="h-6 w-6 mb-2 opacity-40" />
                  <p className="text-sm">No recent notices</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1">
                  <ul className="space-y-3">
                    {notices.map((notice, idx) => {
                      const title = notice.title ?? "Untitled Notice";
                      const time = notice.createdAt ?? notice.created_at ?? "";
                      const level = notice.level ?? "GENERAL";
                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate("/admin/NoticePage")}
                        >
                          <div className="p-2 rounded-full shrink-0 bg-primary/10 text-primary">
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatTimeAgo(time)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>
          </div>

        </div>

      </section>
    </AdminShell>
  );
};

export default AdminDashboard;