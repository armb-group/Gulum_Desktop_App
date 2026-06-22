import { useMemo } from "react";
import { Link } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Sparkles,
  Calendar,
  BookOpen,
  User,
  Bell,
  ArrowRight,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
import {
  defaultStudentNotifications,
  notificationTypeStyle,
  sortByCreatedAt,
} from "@/lib/notifications";
import {
  noticeToNotification,
  useGetNoticesByLevel,
} from "@/services/noticeAPI";
import {
  useStudentMasters,
  useStudentTrackingAll,
} from "@/services/lectureAuditAPI";
import { useStudentAttendance } from "@/services/studentAttendanceAPI";
import { useQuery } from "@tanstack/react-query";
import { fetchCalendarEvents } from "@/services/calendarAPI";
const tiles = [
  {
    label: "AI Assistant",
    icon: Sparkles,
    to: "/student",
  },
  {
    label: "Timetable",
    icon: Calendar,
    to: "/student/dashboard",
  },
  {
    label: "Profile",
    icon: User,
    to: "/student/profile",
  },
];

const StudentHome = () => {
  const studentNoticeQuery = useGetNoticesByLevel("STUDENT");

  const apiStudentNotifications = useMemo(
    () =>
      (studentNoticeQuery.data ?? []).map((notice) =>
        noticeToNotification(notice, "student"),
      ),
    [studentNoticeQuery.data],
  );

  const notifications = useMemo(
    () =>
      sortByCreatedAt([
        ...defaultStudentNotifications,
        ...apiStudentNotifications,
      ]),
    [apiStudentNotifications],
  );

  const previewNotifications = notifications.slice(0, 3);

  // data hooks
  const { data: attendanceData = [] } = useStudentAttendance();
  const { data: syllabusData } = useStudentMasters();

  // derived metrics
  const attendancePercent = attendanceData.length
    ? Math.round(
        attendanceData.reduce(
          (s, it) => s + (it.attendancePercentage || 0),
          0,
        ) / attendanceData.length,
      )
    : 0;

  const lecturesCount = Array.isArray(syllabusData)
    ? syllabusData.reduce((s, it) => s + (it.totalCompleted ?? 0), 0)
    : 0;

  const tasksCount = notifications.filter((n) =>
    /assign|task/i.test(n.title),
  ).length;

  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");


  

  // Calendar: top 4 upcoming events
  const { data: allEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => fetchCalendarEvents("student"),
    staleTime: 5 * 60 * 1000,
  });

  const now = new Date();
  const upcomingEvents = useMemo(() => {
    return allEvents
      .filter((e: any) => new Date(e.date) >= now)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }, [allEvents]);

  const { data: trackingAll = [] } = useStudentTrackingAll(user?.classId);
  const syllabusCoverage =
    trackingAll.length > 0
      ? Math.round(
          trackingAll.reduce(
            (sum, item) => sum + (item.progressPercentage || 0),
            0,
          ) / trackingAll.length,
        )
      : 0;

  const lowCount = attendanceData.filter(
    (a) => (a.attendancePercentage ?? 0) < 75,
  ).length;

  return (
    <RoleShell role="student" title="Student Dashboard" showDate>
      <div className="space-y-6">
        {/* Hero Section */}
        <Card
          className="relative rounded-2xl overflow-hidden p-6 md:p-8 shrink-0 shadow-md"
          style={{
            backgroundColor: 'var(--admin-hero)',
            color: 'var(--admin-hero-foreground)',
            boxShadow: '0 8px 40px 0 rgba(102,20,20,0.28), 0 1.5px 0 0 rgba(255,255,255,0.08) inset',
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm opacity-80">Welcome back,</p>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Student Console
              </h1>
              <p className="mt-2 text-sm opacity-90">
                {user?.institution
                  ? `${user.institution} · Academic Year 2024-25`
                  : "Gulum University · Academic Year 2024-25"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">↑ {lowCount}% low attendance risk</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{attendanceData.length} subjects tracked</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{lowCount} below threshold</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4">
          <Card className="p-4 rounded-3xl border-0 bg-surface shadow-sm">
            <div className="flex flex-col items-center">
              <BarChart3 className="h-6 w-6 text-primary mb-2" />
              <p className={`text-2xl font-bold ${attendancePercent < 75 ? "text-destructive" : "text-success"}`}>
                {attendancePercent}%
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Attendance
              </p>
            </div>
          </Card>

          <Card className="p-4 rounded-3xl border-0 bg-surface shadow-sm">
            <div className="flex flex-col items-center">
              <BookOpen className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {lecturesCount}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Lectures
              </p>
            </div>
          </Card>

          <Card className="p-4 rounded-3xl border-0 bg-surface shadow-sm">
            <div className="flex flex-col items-center">
              <ClipboardList className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{tasksCount}</p>
              <p className="text-xs text-muted-foreground text-center">Tasks</p>
            </div>
          </Card>
        </section>

        {/* Quick Access */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[var(--admin-hero)]" />
            <h2 className="font-bold text-lg text-[var(--admin-hero)]">Quick Access</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tiles.map((t) => (
              <Link
                key={t.label}
                to={t.to}
                className="group rounded-3xl p-5 border border-white/20 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                style={{ backgroundColor: 'var(--admin-hero)', color: 'var(--admin-hero-foreground)' }}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition"
                    style={{ backgroundColor: 'rgba(255, 241, 158, 0.35)' }}
                  >
                    <t.icon className="h-7 w-7 text-[var(--admin-hero-foreground)]" />
                  </div>

                  <p className="font-semibold text-sm text-[var(--admin-hero-foreground)]">
                    {t.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Main student sections: Syllabus, Attendance, Daily routine */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 rounded-3xl bg-surface">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Lecture Progress
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {syllabusCoverage}%
                </p>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
              <Progress
                value={syllabusCoverage}
                className="h-2 mt-3 [&>div]:bg-primary"
              />
              <Link
                to="/student/lecture-audit"
                className="block text-sm text-primary font-semibold mt-3"
              >
                View Full Progress →
              </Link>
            </Card>

            <Card className="p-4 rounded-3xl bg-surface">
              <p className={`text-sm font-semibold uppercase tracking-wider mb-2 ${attendancePercent < 75 ? "text-destructive" : "text-foreground"}`}>
                My Attendance
              </p>
              <div className="flex items-center justify-between">
                <p className={`text-2xl font-bold ${attendancePercent < 75 ? "text-destructive" : "text-success"}`}>
                  {attendancePercent}%
                </p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <Progress
                value={attendancePercent}
                className={`h-2 mt-3 [&>div]:${attendancePercent < 75 ? "bg-destructive" : "bg-success"}`}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-success-soft p-2 text-center">
                  <p className="font-bold text-success">
                    {
                      attendanceData.filter(
                        (a) => (a.attendancePercentage ?? 0) >= 75,
                      ).length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">OK</p>
                </div>
                <div className="rounded-md bg-destructive/10 p-2 text-center">
                  <p className="font-bold text-destructive">{lowCount}</p>
                  <p className="text-xs text-muted-foreground">Low</p>
                </div>
              </div>
              <Link
                to="/student/attendance"
                className="block text-sm text-primary font-semibold mt-3"
              >
                View Attendance →
              </Link>
            </Card>

            {/* Upcoming Events card */}
            <Card className="p-4 rounded-3xl bg-surface">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> Upcoming Events
                </p>
                <Link to="/student/calendar" className="text-xs text-primary font-semibold hover:underline">
                  View all →
                </Link>
              </div>

              <div className="space-y-2">
                {eventsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 py-3 text-center">
                    <CalendarDays className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No upcoming events</p>
                  </div>
                ) : (
                  upcomingEvents.map((ev: any) => {
                    const evDate = new Date(ev.date);
                    const dayNum = evDate.toLocaleDateString("en-US", { day: "2-digit" });
                    const mon   = evDate.toLocaleDateString("en-US", { month: "short" });
                    const isToday = evDate.toDateString() === now.toDateString();
                    const catStyle: Record<string, { dot: string; text: string }> = {
                      class:    { dot: "bg-emerald-500", text: "text-emerald-500" },
                      holiday:  { dot: "bg-rose-500",    text: "text-rose-500" },
                      activity: { dot: "bg-blue-500",    text: "text-blue-500" },
                    };
                    const cs = catStyle[ev.category] ?? catStyle.activity;
                    return (
                      <div key={ev.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-background/60 transition-colors">
                        {/* date pill */}
                        <div className={`flex flex-col items-center justify-center rounded-xl w-10 h-10 shrink-0 ${
                          isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}>
                          <span className="text-[9px] font-bold uppercase leading-none opacity-70">{mon}</span>
                          <span className="text-sm font-black leading-tight">{dayNum}</span>
                        </div>
                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${cs.dot}`} />
                            <p className={`text-sm font-semibold truncate ${cs.text}`}>{ev.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {ev.time}{ev.location ? ` · ${ev.location}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Link to="/student/calendar" className="block text-sm text-primary font-semibold mt-3">
                View Full Calendar →
              </Link>
            </Card>
          </div>
        </section>

        {/* PTM Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-lg">Latest Notifications</h2>
          </div>

          <Card className="rounded-3xl border shadow-sm p-4 space-y-3">
            {previewNotifications.map((n) => {
              const Icon =
                notificationTypeStyle[n.type]?.icon ??
                notificationTypeStyle.info.icon;

              const cls =
                notificationTypeStyle[n.type]?.cls ??
                notificationTypeStyle.info.cls;

              return (
                <div
                  key={n.id}
                  className="flex gap-3 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition"
                >
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center ${cls}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground whitespace-pre-line">
                      {n.title}
                    </p>

                    {n.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                        {n.description}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {n.time}
                    </p>
                  </div>
                </div>
              );
            })}

            <Link
              to="/student/notifications"
              className="
                flex
                items-center
                justify-center
                gap-2
                py-3
                text-primary
                font-semibold
                hover:bg-primary/5
                rounded-2xl
                transition
              "
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

export default StudentHome;
