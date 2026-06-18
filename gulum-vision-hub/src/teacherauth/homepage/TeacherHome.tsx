import { useMemo } from "react";
import { Link } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, Sparkles, Calendar, BookOpen, User,
  Users, Bell, ArrowRight, ClipboardList,
} from "lucide-react";
import {
  defaultAdminNotifications,
  defaultStudentNotifications,
  notificationTypeStyle,
  sortByCreatedAt,
} from "@/lib/notifications";
import { noticeToNotification, useGetNoticesByLevel } from "@/services/noticeAPI";
import { useSyllabusMasters, useTracking } from "@/services/lectureAuditAPI";
import { useAuth } from "@/contexts/AuthContext";

const tiles = [
  { label: "Insights",      icon: BarChart3,     to: "/teacher/dashboard" },
  { label: "Lecture Audit", icon: BookOpen,       to: "/teacher/lecture-audit" },
  { label: "Timetable",     icon: Calendar,      to: "/teacher/timetable" },
  { label: "Profile",       icon: User,           to: "/teacher/profile" },
];

const TODAY_SCHEDULE = [
  { time: "09:00–10:00", subject: "DBMS",    details: "BCA Sem 4 · Room 204", count: 42 },
  { time: "11:00–12:00", subject: "OS",      details: "BCA Sem 4 · Room 101", count: 38 },
  { time: "14:00–15:00", subject: "Web Dev", details: "BCA Sem 6 · Room 305", count: 35 },
];

const TeacherHome = () => {
  const { user } = useAuth();

  const adminNoticeQuery   = useGetNoticesByLevel("ADMIN",   { batchId: user?.batchId ?? "", enabled: Boolean(user?.batchId) });
  const studentNoticeQuery = useGetNoticesByLevel("STUDENT");

  const notifications = useMemo(() =>
    sortByCreatedAt([
      ...defaultAdminNotifications,
      ...defaultStudentNotifications,
      ...(adminNoticeQuery.data  ?? []).map(n => noticeToNotification(n, "admin")),
      ...(studentNoticeQuery.data ?? []).map(n => noticeToNotification(n, "student")),
    ]).slice(0, 3),
    [adminNoticeQuery.data, studentNoticeQuery.data]
  );

  const { data: subjects = [] } = useSyllabusMasters();
  const { data: tracking } = useTracking({
    classId:    (subjects as any[])[0]?.classId    ?? "",
    courseCode: (subjects as any[])[0]?.courseCode ?? "",
  });

  const syllabusCoverage = tracking?.progressPercentage ?? 0;
  const completedModules  = tracking?.completedModules  ?? 0;
  const totalModules      = tracking?.totalModules      ?? 0;

  return (
    <RoleShell role="teacher" title="Teacher Dashboard" showDate>
      <div className="space-y-6">

        {/* Hero */}
        <Card
          className="relative rounded-2xl overflow-hidden p-6 md:p-8 shrink-0 shadow-md"
          style={{
            backgroundColor: "var(--admin-hero)",
            color: "var(--admin-hero-foreground)",
            boxShadow: "0 8px 40px 0 rgba(102,20,20,0.28), 0 1.5px 0 0 rgba(255,255,255,0.08) inset",
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm opacity-80">Welcome back,</p>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Teacher Console
              </h1>
              <p className="mt-2 text-sm opacity-90">
                {user?.institution
                  ? `${user.institution} · Academic Year 2024-25`
                  : "Gulum University · Academic Year 2024-25"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{TODAY_SCHEDULE.length} classes today</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{syllabusCoverage}% syllabus covered</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{completedModules}/{totalModules} modules done</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4">
          <Card className="p-4 rounded-3xl border-0 bg-surface shadow-sm">
            <div className="flex flex-col items-center">
              <BarChart3 className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{syllabusCoverage}%</p>
              <p className="text-xs text-muted-foreground text-center">Syllabus</p>
            </div>
          </Card>
          <Card className="p-4 rounded-3xl border-0 bg-surface shadow-sm">
            <div className="flex flex-col items-center">
              <BookOpen className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{completedModules}/{totalModules}</p>
              <p className="text-xs text-muted-foreground text-center">Modules</p>
            </div>
          </Card>
          <Card className="p-4 rounded-3xl border-0 bg-surface shadow-sm">
            <div className="flex flex-col items-center">
              <ClipboardList className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{TODAY_SCHEDULE.length}</p>
              <p className="text-xs text-muted-foreground text-center">Classes Today</p>
            </div>
          </Card>
        </section>

        {/* Quick Access */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[var(--admin-hero)]" />
            <h2 className="font-bold text-lg text-[var(--admin-hero)]">Quick Access</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiles.map((t) => (
              <Link
                key={t.label}
                to={t.to}
                className="group rounded-3xl p-5 border border-white/20 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                style={{ backgroundColor: "var(--admin-hero)", color: "var(--admin-hero-foreground)" }}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition"
                    style={{ backgroundColor: "rgba(255, 241, 158, 0.35)" }}
                  >
                    <t.icon className="h-7 w-7 text-[var(--admin-hero-foreground)]" />
                  </div>
                  <p className="font-semibold text-sm text-[var(--admin-hero-foreground)]">{t.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Main sections */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Syllabus Coverage */}
            <Card className="p-4 rounded-3xl bg-surface">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Lecture Progress
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">{syllabusCoverage}%</p>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
              <Progress value={syllabusCoverage} className="h-2 mt-3 [&>div]:bg-primary" />
              <Link to="/teacher/lecture-audit" className="block text-sm text-primary font-semibold mt-3">
                View Full Progress →
              </Link>
            </Card>

            {/* Today's Classes */}
            <Card className="p-4 rounded-3xl bg-surface">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Today's Classes
              </p>
              <div className="space-y-2">
                {TODAY_SCHEDULE.map((c) => (
                  <Link
                    key={c.subject}
                    to="/teacher/attendance"
                    className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-brand-soft/60 transition"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">{c.details}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      <Users className="h-3 w-3" /> {c.count}
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/teacher/timetable" className="block text-sm text-primary font-semibold mt-3">
                View Full Timetable →
              </Link>
            </Card>

            {/* Daily Routine */}
            <Card className="p-4 rounded-3xl bg-surface">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Schedule
              </p>
              <div className="space-y-2">
                {TODAY_SCHEDULE.map((c) => (
                  <div key={c.subject} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">{c.details}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{c.time}</span>
                  </div>
                ))}
              </div>
              <Link to="/teacher/dashboard" className="block text-sm text-primary font-semibold mt-3">
                View Insights →
              </Link>
            </Card>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-lg">Latest Notifications</h2>
          </div>
          <Card className="rounded-3xl border shadow-sm p-4 space-y-3">
            {notifications.map((n) => {
              const Icon = notificationTypeStyle[n.type]?.icon ?? notificationTypeStyle.info.icon;
              const cls  = notificationTypeStyle[n.type]?.cls  ?? notificationTypeStyle.info.cls;
              return (
                <div key={n.id} className="flex gap-3 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${cls}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground whitespace-pre-line">{n.title}</p>
                    {n.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{n.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{n.time}</p>
                  </div>
                </div>
              );
            })}
            <Link
              to="/teacher/notifications"
              className="flex items-center justify-center gap-2 py-3 text-primary font-semibold hover:bg-primary/5 rounded-2xl transition"
            >
              View All Notifications ({notifications.length})
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </section>

      </div>
    </RoleShell>
  );
};

export default TeacherHome;
