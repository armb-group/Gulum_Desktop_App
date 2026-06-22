import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Bell,
  FolderClosed,
  User,
  AlertTriangle,
  ChevronRight,
  CalendarDays,
  MapPin,
} from "lucide-react";
import {
  useStudentTrackingAll,
  useStudentMasters,
} from "@/services/lectureAuditAPI";
import {
  noticeToNotification,
  useGetNoticesByLevel,
} from "@/services/noticeAPI";
import { useStudentAttendance } from "@/services/studentAttendanceAPI";
import { useQuery } from "@tanstack/react-query";
import { fetchCalendarEvents } from "@/services/calendarAPI";

import {
  defaultStudentNotifications,
  notificationTypeStyle,
  sortByCreatedAt,
} from "@/lib/notifications";

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Local Types ───────────────────────────────────────────────────────────────
type Subject = {
  id?: string | number;
  name?: string;
  syllabusName?: string;
  courseName?: string;
  courseCode?: string;
};

type TrackingRecord = {
  syllabusMasterId?: string | number;
  progressPercentage?: number;
};

type AttendanceItem = {
  attendancePercentage: number;
  courseName?: string;
};

const SectionHeader = ({
  title,
  to,
  linkLabel,
}: {
  title: string;
  to?: string;
  linkLabel?: string;
}) => (
  <div className="flex items-center justify-between mb-3">
    <p className="text-sm font-bold text-foreground uppercase tracking-wider">
      {title}
    </p>
    {to && (
      <Link
        to={to}
        className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
      >
        {linkLabel ?? "View all"} <ChevronRight className="h-3 w-3" />
      </Link>
    )}
  </div>
);



// ── Main Component ────────────────────────────────────────────────────────────

const StudentDashboard = () => {
  useEffect(() => {
    console.log("All Local Storage:");
    console.log(localStorage);

    console.log("gulum-user:");
    console.log(JSON.parse(localStorage.getItem("gulum-user") || "null"));
  }, []);
  const { data: apiSubjects } = useStudentMasters();


  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");

  const classId = user?.classId;

  // Calendar events
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
      .slice(0, 2);
  }, [allEvents]);



  const { data: attendance = [], isLoading } = useStudentAttendance();

  const subjects = apiSubjects ?? [];

  // ✅ FIX 1: SAFE ATTENDANCE HANDLING

  const { data: trackingAll } = useStudentTrackingAll(classId);

  const studentNoticeQuery = useGetNoticesByLevel("STUDENT");

  const apiNotifications = useMemo(
    () =>
      (studentNoticeQuery.data ?? []).map((n) =>
        noticeToNotification(n, "student"),
      ),
    [studentNoticeQuery.data],
  );

  const notifications = useMemo(
    () =>
      sortByCreatedAt([
        ...defaultStudentNotifications,
        ...apiNotifications,
      ]).slice(0, 3),
    [apiNotifications],
  );

  // ✅ FIX 2: SAFE CALCULATIONS
  const studentAttendance = attendance as AttendanceItem[];

  const lowCount = studentAttendance.filter(
    (item) => item.attendancePercentage < 75,
  ).length;

  // ✅ FIX 3: PROPER UI MAPPING (IMPORTANT)
  const attendanceData = studentAttendance.map((item) => ({
    subject: item.courseName,
    value: item.attendancePercentage,
    low: item.attendancePercentage < 75,
  }));

  return (
    <RoleShell
      role="student"
      title="Insights Dashboard"
      subtitle="Your academic overview"
      showDate
    >
      {/* ── Attendance warning ── */}
      {lowCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {lowCount} subject{lowCount > 1 ? "s" : ""} below 75% — risk of
          detention!
        </div>
      )}

      {/* ── PTM Banner ──
      <Card className="p-4 bg-surface border-border">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-purple/15 text-purple flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Parent-Teacher Meeting
            </p>
            <p className="text-xs text-muted-foreground">
              28 July 2025 · 10:00 AM · Hall B
            </p>
          </div>
          <span className="text-xs font-semibold text-purple bg-purple/10 px-2.5 py-1 rounded-full shrink-0">
            SOON
          </span>
        </div>
      </Card> */}

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Syllabus */}
        <Card className="p-4 bg-surface border-border">
          <SectionHeader
            title="Lecture Progress"
            to="/student/lecture-audit"
            linkLabel="Full progress"
          />
          <div className="space-y-3">
            {subjects.map((s: Subject) => {
              const trackingRecord = trackingAll?.find(
                (item: TrackingRecord) =>
                  (item as any)?.courseCode === s.courseCode ||
                  (item as any)?.syllabusMaster?.courseCode === s.courseCode ||
                  item.syllabusMasterId === s.id,
              );

              const pct = trackingRecord?.progressPercentage ?? 0;

              return (
                <div key={s.id ?? s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-foreground">
                      {s.name ?? s.syllabusName ?? s.courseName}
                    </span>
                    <span className="text-primary font-semibold">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2 [&>div]:bg-primary" />
                </div>
              );
            })}
          </div>

          <Button
            asChild
            size="sm"
            className="w-full h-10 rounded-xl mt-4 font-semibold"
          >
            <Link to="/student/lecture-audit">View Full Progress →</Link>
          </Button>
        </Card>

        {/* ── ATTENDANCE (FIXED UI LOOP) ── */}
        <Card className="p-4 bg-surface border-border">
          <SectionHeader
            title="My Attendance"
            to="/student/attendance"
            linkLabel="Details"
          />

          <div className="space-y-3">
            {attendanceData.map((a) => (
              <div key={a.subject} className="flex items-center gap-3">
                <span className="w-36 text-sm text-foreground truncate">
                  {a.subject}
                </span>

                <span
                  className={`text-sm font-bold w-10 shrink-0 ${a.low ? "text-destructive" : "text-success"
                    }`}
                >
                  {a.value}%
                </span>

                <Progress
                  value={a.value}
                  className={`h-2 flex-1 ${a.low ? "[&>div]:bg-destructive" : "[&>div]:bg-success"
                    }`}
                />

                {a.low && (
                  <span className="text-[10px] font-bold bg-destructive/15 text-destructive px-1.5 py-0.5 rounded shrink-0">
                    LOW
                  </span>
                )}
              </div>
            ))}
          </div>

          <Button
            asChild
            size="sm"
            className="w-full h-10 rounded-xl mt-4 font-semibold"
          >
            <Link to="/student/attendance">View Attendance Details →</Link>
          </Button>
        </Card>

        {/* ── Upcoming Events / Calendar Shortcut ── */}
        <Card className="p-4 bg-surface border-border">
          <SectionHeader
            title="Upcoming Events"
            to="/student/calendar"
            linkLabel="View calendar"
          />

          <div className="space-y-2">
            {eventsLoading ? (
              <p className="text-sm text-muted-foreground">Loading events…</p>
            ) : upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map((ev: any) => {
                const evDate = new Date(ev.date);
                const dayNum = evDate.toLocaleDateString("en-US", { day: "2-digit" });
                const mon = evDate.toLocaleDateString("en-US", { month: "short" });
                const isToday = evDate.toDateString() === now.toDateString();

                const categoryStyle: Record<string, { dot: string; badge: string }> = {
                  class: { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500" },
                  holiday: { dot: "bg-rose-500", badge: "bg-rose-500/10 text-rose-500" },
                  activity: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-500" },
                };
                const style = categoryStyle[ev.category] ?? categoryStyle.activity;

                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-background/60 hover:bg-muted/40 transition-colors"
                  >
                    {/* Date badge */}
                    <div className={`flex flex-col items-center justify-center rounded-xl w-11 h-11 shrink-0 ${isToday ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <span className="text-[10px] font-bold uppercase leading-none opacity-70">{mon}</span>
                      <span className="text-base font-black leading-tight">{dayNum}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
                        <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ev.time}{ev.location ? ` · ${ev.location}` : ""}
                      </p>
                    </div>

                    {/* Category badge */}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                      {ev.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <Button
            asChild
            size="sm"
            className="w-full h-10 rounded-xl mt-4 font-semibold"
          >
            <Link to="/student/calendar">View Full Calendar →</Link>
          </Button>
        </Card>

        {/* Notifications (unchanged) */}
        <Card className="p-4 bg-surface border-border">
          <SectionHeader
            title="Recent Notifications"
            to="/student/notifications"
          />

          <div className="space-y-1">
            {notifications.map((n) => {
              const Icon =
                notificationTypeStyle[n.type]?.icon ??
                notificationTypeStyle.info.icon;
              const cls =
                notificationTypeStyle[n.type]?.cls ??
                notificationTypeStyle.info.cls;

              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/40 transition"
                >
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full h-10 rounded-xl mt-4 font-semibold"
          >
            <Link to="/student/notifications">All Notifications →</Link>
          </Button>
        </Card>
      </div>
    </RoleShell>
  );
};

export default StudentDashboard;
