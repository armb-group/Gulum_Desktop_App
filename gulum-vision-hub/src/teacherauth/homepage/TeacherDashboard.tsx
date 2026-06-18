import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ChevronRight, RefreshCw, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { noticeToNotification, useGetNoticesByLevel } from "@/services/noticeAPI";
import { defaultAdminNotifications, defaultStudentNotifications, notificationTypeStyle, sortByCreatedAt } from "@/lib/notifications";
import { useGetTeacherSchedule } from "@/services/scheduleAPI";
import { getTrackingAll } from "@/services/lectureAuditAPI";
import { useQuery } from "@tanstack/react-query";

const SectionHeader = ({ title, to, linkLabel }: { title: string; to?: string; linkLabel?: string }) => (
  <div className="flex items-center justify-between mb-3">
    <p className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</p>
    {to && (
      <Link to={to} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
        {linkLabel ?? "View all"} <ChevronRight className="h-3 w-3" />
      </Link>
    )}
  </div>
);

// ── Lecture Audit Section (teacher-schedule based) ────────────────────────────
const LectureAuditSection = () => {
  const { user } = useAuth();
  const teacherId = user?.id ?? "";

  // Get teacher's schedule to extract classId + courseCode pairs
  const { data: scheduleData, isLoading } = useGetTeacherSchedule(teacherId, { enabled: !!teacherId });

  const classCourses = useMemo(() => {
    const classes = scheduleData?.classes ?? scheduleData?.responseData?.classes ?? [];
    const pairs: { classId: string; courseCode: string; courseName: string; className: string }[] = [];
    const seen = new Set<string>();
    classes.forEach((cls: any) => {
      const classId = String(cls.classesId ?? cls.classId ?? "");
      const className = cls.className ?? "Class";
      (cls.timeslot ?? cls.timeslots ?? []).forEach((slot: any) => {
        if (!slot.courseCode) return;
        const key = `${classId}::${slot.courseCode}`;
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ classId, courseCode: slot.courseCode, courseName: slot.courseName ?? slot.courseCode, className });
        }
      });
    });
    return pairs;
  }, [scheduleData]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = classCourses[selectedIdx];

  // Fetch tracking for selected class
  const { data: trackingList } = useQuery({
    queryKey: ["tracking-all-dash", selected?.classId ?? ""],
    queryFn: () => getTrackingAll(selected!.classId),
    enabled: !!selected?.classId,
  });

  const trackingRecord = useMemo(() => {
    const list = Array.isArray(trackingList) ? trackingList : [];
    return list.find((t: any) =>
      t.courseCode === selected?.courseCode || t.syllabusMasterId === selected?.courseCode
    ) ?? null;
  }, [trackingList, selected]);

  const pct       = (trackingRecord as any)?.progressPercentage ?? 0;
  const completed = (trackingRecord as any)?.completedModules   ?? 0;
  const total     = (trackingRecord as any)?.totalModules       ?? 0;
  const low       = classCourses.length > 0 && !isLoading && pct > 0 && pct < 60;

  return (
    <Card className="p-4 bg-surface border-border rounded-3xl">
      <SectionHeader title="Lecture Audit" to="/teacher/lecture-audit" linkLabel="Full audit" />

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm justify-center">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading subjects…
        </div>
      ) : classCourses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No subjects assigned yet.</p>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap mb-4">
            {classCourses.map((cc, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedIdx === i ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cc.courseName}
              </button>
            ))}
          </div>

          {low && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive px-3 py-2 text-xs font-semibold mb-3">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Syllabus coverage below 60% — needs attention!
            </div>
          )}

          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-foreground">{selected?.courseName}</span>
            <span className="text-primary font-bold text-sm">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2 [&>div]:bg-primary mb-1" />
          <p className="text-xs text-muted-foreground">{completed}/{total} modules completed</p>
        </>
      )}

      <Button asChild size="sm" className="w-full h-10 rounded-xl mt-4 font-semibold">
        <Link to="/teacher/lecture-audit">View Detailed Audit →</Link>
      </Button>
    </Card>
  );
};

// ── Timetable Section — uses teacher's own schedule ──────────────────────────
const TimetableSection = () => {
  const { user } = useAuth();
  const teacherId = user?.id ?? "";

  const { data: scheduleData, isLoading } = useGetTeacherSchedule(teacherId, { enabled: !!teacherId });

  const todaySlots = useMemo(() => {
    const classes = scheduleData?.classes ?? scheduleData?.responseData?.classes ?? [];
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const slots: { time: string; courseName: string; courseCode: string; className: string; semester: string | number }[] = [];
    const seen = new Set<string>();

    classes.forEach((cls: any) => {
      const className = cls.className ?? "";
      const semester  = cls.semester  ?? "";
      (cls.timeslot ?? cls.timeslots ?? []).forEach((s: any) => {
        if (!s.occupied) return;
        if (String(s.day).toLowerCase() !== today.toLowerCase()) return;
        const key = `${s.slotNumber}::${s.courseCode}`;
        if (seen.has(key)) return;
        seen.add(key);
        const time = s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : `Slot ${s.slotNumber}`;
        slots.push({ time, courseName: s.courseName ?? s.courseCode ?? "Class", courseCode: s.courseCode ?? "", className, semester });
      });
    });

    return slots.sort((a, b) => a.time.localeCompare(b.time));
  }, [scheduleData]);

  const allSlots = useMemo(() => {
    const classes = scheduleData?.classes ?? scheduleData?.responseData?.classes ?? [];
    let total = 0;
    classes.forEach((cls: any) =>
      (cls.timeslot ?? cls.timeslots ?? []).forEach((s: any) => { if (s.occupied) total++; })
    );
    return total;
  }, [scheduleData]);

  const getSubjectColor = (subject: string) => {
    if (!subject) return "bg-muted/30 text-muted-foreground";
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    const colors = [
      "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300",
      "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300",
      "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
      "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300",
      "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
      "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className="p-4 bg-surface border-border rounded-3xl">
      <SectionHeader title="Today's Classes" to="/teacher/timetable" linkLabel="View timetable" />

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm justify-center">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading schedule…
        </div>
      ) : todaySlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">No classes scheduled today</p>
          <p className="text-xs text-muted-foreground">{allSlots} total classes this week</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todaySlots.map((slot, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 hover:bg-muted/40 transition">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${getSubjectColor(slot.courseName)}`}>
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{slot.courseName}</p>
                <p className="text-xs text-muted-foreground">
                  {slot.className}{slot.semester ? ` · Sem ${slot.semester}` : ""}
                </p>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                {slot.time}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button asChild size="sm" variant="outline" className="w-full h-10 rounded-xl mt-4 font-semibold">
        <Link to="/teacher/timetable">View Full Timetable →</Link>
      </Button>
    </Card>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user } = useAuth();

  const adminNoticeQuery   = useGetNoticesByLevel("ADMIN", { batchId: user?.batchId ?? "", enabled: Boolean(user?.batchId) });
  const studentNoticeQuery = useGetNoticesByLevel("STUDENT");

  const notifications = useMemo(() => {
    try {
      return sortByCreatedAt([
        ...defaultAdminNotifications,
        ...defaultStudentNotifications,
        ...(Array.isArray(adminNoticeQuery.data)  ? adminNoticeQuery.data.map(n => noticeToNotification(n, "admin"))   : []),
        ...(Array.isArray(studentNoticeQuery.data) ? studentNoticeQuery.data.map(n => noticeToNotification(n, "student")) : []),
      ]).slice(0, 3);
    } catch {
      return [...defaultAdminNotifications, ...defaultStudentNotifications].slice(0, 3);
    }
  }, [adminNoticeQuery.data, studentNoticeQuery.data]);

  return (
    <RoleShell role="teacher" title="Insights Dashboard" subtitle="Academic overview" showDate>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <LectureAuditSection />

        <Card className="p-4 bg-surface border-border rounded-3xl">
          <SectionHeader title="Recent Notifications" to="/teacher/notifications" />
          <div className="space-y-1">
            {notifications.map((n) => {
              const style = notificationTypeStyle[n.type as keyof typeof notificationTypeStyle] ?? notificationTypeStyle.info;
              return (
                <div key={n.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/40 transition">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${style.cls}`}>
                    <style.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Button asChild size="sm" variant="outline" className="w-full h-10 rounded-xl mt-4 font-semibold">
            <Link to="/teacher/notifications">All Notifications →</Link>
          </Button>
        </Card>
      </div>

      <div className="mt-6">
        <TimetableSection />
      </div>
    </RoleShell>
  );
};

export default TeacherDashboard;
