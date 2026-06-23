import { useMemo } from "react";
import { Link } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Sparkles, Calendar, BookOpen, User, Users, Bell, ArrowRight, ClipboardList } from "lucide-react";
import { defaultAdminNotifications, defaultStudentNotifications, notificationTypeStyle, sortByCreatedAt } from "@/lib/notifications";
import { noticeToNotification, useGetNoticesByLevel } from "@/services/noticeAPI";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherRoutine } from "@/services/teacherRoutine";
import { getTrackingAll } from "@/services/lectureAuditAPI";
import { useQuery } from "@tanstack/react-query";

const tiles = [
  { label: "Insights",      icon: BarChart3,     to: "/teacher/dashboard" },
  { label: "Lecture Audit", icon: BookOpen,       to: "/teacher/lecture-audit" },
  { label: "Timetable",     icon: Calendar,       to: "/teacher/timetable" },
  { label: "Profile",       icon: User,           to: "/teacher/profile" },
];

const TeacherHome = () => {
  const { user } = useAuth();
  const { slots, isLoading } = useTeacherRoutine();

  // Today's slots (deduplicated by course)
  const todaySlots = useMemo(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const seen = new Set<string>();
    return (slots as any[])
      .filter(s => s.day?.toLowerCase() === today.toLowerCase())
      .filter(s => { if (seen.has(s.courseCode)) return false; seen.add(s.courseCode); return true; })
      .sort((a: any, b: any) => a.slotNumber - b.slotNumber);
  }, [slots]);

  // First class's tracking for syllabus coverage
  const firstCourse = useMemo(() => {
    const seen = new Set<string>();
    return (slots as any[]).find(s => { if (seen.has(s.courseCode)) return false; seen.add(s.courseCode); return true; }) ?? null;
  }, [slots]);

  const { data: trackingRaw } = useQuery({
    queryKey: ["tracking-home", firstCourse?.classId ?? ""],
    queryFn: () => getTrackingAll(firstCourse!.classId),
    enabled: !!firstCourse?.classId,
  });

  const trackingRecord = useMemo(() => {
    const list: any[] = Array.isArray(trackingRaw) ? trackingRaw
      : Array.isArray((trackingRaw as any)?.responseData) ? (trackingRaw as any).responseData : [];
    return list.find((t: any) => t.courseCode === firstCourse?.courseCode) ?? list[0] ?? null;
  }, [trackingRaw, firstCourse]);

  const syllabusCoverage = trackingRecord?.progressPercentage ?? 0;
  const completedModules = trackingRecord?.completedModules   ?? 0;
  const totalModules     = trackingRecord?.totalModules       ?? 0;

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

  return (
    <RoleShell role="teacher" title="Teacher Dashboard" showDate>
      <div className="space-y-6">

        {/* Hero */}
        <Card className="relative rounded-2xl overflow-hidden p-6 md:p-8 shrink-0 shadow-md"
          style={{ backgroundColor:"var(--admin-hero)", color:"var(--admin-hero-foreground)",
            boxShadow:"0 8px 40px 0 rgba(102,20,20,0.28), 0 1.5px 0 0 rgba(255,255,255,0.08) inset" }}>
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm opacity-80">Welcome back, {user?.name ?? "Teacher"}</p>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Teacher Console</h1>
              <p className="mt-2 text-sm opacity-90">
                {user?.institution ? `${user.institution} · Academic Year 2024-25` : "Gulum University · Academic Year 2024-25"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{todaySlots.length} classes today</span>
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
              <p className="text-2xl font-bold text-foreground">{isLoading ? "…" : todaySlots.length}</p>
              <p className="text-xs text-muted-foreground text-center">Today</p>
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
              <Link key={t.label} to={t.to}
                className="group rounded-3xl p-5 border border-white/20 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                style={{ backgroundColor:"var(--admin-hero)", color:"var(--admin-hero-foreground)" }}>
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition"
                    style={{ backgroundColor:"rgba(255,241,158,0.35)" }}>
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

            <Card className="p-4 rounded-3xl bg-surface">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lecture Progress</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">{syllabusCoverage}%</p>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
              <Progress value={syllabusCoverage} className="h-2 mt-3 [&>div]:bg-primary" />
              <Link to="/teacher/lecture-audit" className="block text-sm text-primary font-semibold mt-3">View Full Progress →</Link>
            </Card>

            <Card className="p-4 rounded-3xl bg-surface">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Today's Classes</p>
              {isLoading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>
              ) : todaySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No classes today</p>
              ) : (
                <div className="space-y-2">
                  {todaySlots.map((c: any) => (
                    <Link key={`${c.slotNumber}-${c.courseCode}`} to="/teacher/attendance" state={{ slot: c }}
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-brand-soft/60 transition">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.courseName}</p>
                        <p className="text-xs text-muted-foreground">{c.className}{c.semester ? ` · Sem ${c.semester}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                        <Users className="h-3 w-3" /> {c.startTime}–{c.endTime}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/teacher/timetable" className="block text-sm text-primary font-semibold mt-3">View Full Timetable →</Link>
            </Card>

            <Card className="p-4 rounded-3xl bg-surface">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Weekly Schedule</p>
              {isLoading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>
              ) : (slots as any[]).length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No schedule assigned</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const seen = new Set<string>();
                    return (slots as any[]).filter(s => { const k = `${s.day}::${s.courseCode}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3).map((c: any) => (
                      <div key={`${c.day}-${c.courseCode}`} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.courseName}</p>
                          <p className="text-xs text-muted-foreground">{c.day} · {c.courseCode}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{c.startTime}–{c.endTime}</span>
                      </div>
                    ));
                  })()}
                </div>
              )}
              <Link to="/teacher/dashboard" className="block text-sm text-primary font-semibold mt-3">View Insights →</Link>
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
                    {n.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{n.description}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{n.time}</p>
                  </div>
                </div>
              );
            })}
            <Link to="/teacher/notifications"
              className="flex items-center justify-center gap-2 py-3 text-primary font-semibold hover:bg-primary/5 rounded-2xl transition">
              View All Notifications <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </section>

      </div>
    </RoleShell>
  );
};

export default TeacherHome;
