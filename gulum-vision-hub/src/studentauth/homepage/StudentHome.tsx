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
  Users,
  Bell,
  ArrowRight,
  ClipboardList,
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
import { useStudentRoutine } from "@/services/studentRoutineAPI";
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


  

  const { data: routine = [] } = useStudentRoutine(
    user?.institutionId,
    user?.departmentId,
    user?.classId,
  );

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

  
const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
});

const todayRoutine = routine
  .filter((r: any) => r.day === today)
  .slice(0, 4);
  return (
    <RoleShell role="student" title="Student Dashboard" showDate>
      <div className="space-y-6">
        {/* Hero Section */}
        <Card className="overflow-hidden border-0 rounded-3xl bg-brand-soft text-brand-soft-foreground shadow-xl">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">Student Portal</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome Back 👋
            </h1>

            <p className="mt-2 text-foreground/80 max-w-lg">
              Stay updated with your classes, attendance, notices, and upcoming
              activities.
            </p>
          </div>
        </Card>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4">
          <Card className="p-4 rounded-3xl border-0 bg-surface shadow-sm">
            <div className="flex flex-col items-center">
              <BarChart3 className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">
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
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-lg">Quick Access</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tiles.map((t) => (
              <Link
                key={t.label}
                to={t.to}
                className="group bg-brand-soft text-brand-soft-foreground rounded-3xl p-5 border-0 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-2xl bg-background/60 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition">
                    <t.icon className="h-7 w-7 text-primary" />
                  </div>

                  <p className="font-semibold text-sm text-foreground">
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
                Syllabus Coverage
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
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                My Attendance
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {attendancePercent}%
                </p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
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

            <Card className="p-4 rounded-3xl bg-surface">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Daily Routine
              </p>
              <div className="space-y-2">
                {todayRoutine.length > 0 ? (
  todayRoutine.map((r: any) => (
                    <div
                      key={`${r.subject}-${r.time}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {r.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.teacher} · {r.code}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        {r.time}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No classes scheduled today
                  </p>
                )}
              </div>
              <Link
              to="/student/timetable"
              className="block text-sm text-primary font-semibold mt-3"
            >
              View Full Timetable →
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
