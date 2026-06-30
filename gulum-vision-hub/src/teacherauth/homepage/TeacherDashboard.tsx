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
import { useTeacherRoutine } from "@/services/teacherRoutine";
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

// ── Lecture Audit Section ────────────────────────────────────────────────────
const LectureAuditSection = () => {
  const { slots, meta, isLoading } = useTeacherRoutine();
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Deduplicate courses from this teacher's slots
  const courses = useMemo(() => {
    const seen = new Set<string>();
    return (slots as any[]).filter(s => {
      if (!s.courseCode || seen.has(s.courseCode)) return false;
      seen.add(s.courseCode);
      return true;
    });
  }, [slots]);

  const selected = courses[selectedIdx];

  const { data: trackingRaw } = useQuery({
    queryKey: ["tracking-dash", selected?.classId ?? ""],
    queryFn: () => getTrackingAll(selected!.classId),
    enabled: !!selected?.classId,
  });

  const trackingRecord = useMemo(() => {
    const list: any[] = Array.isArray(trackingRaw) ? trackingRaw
      : Array.isArray((trackingRaw as any)?.responseData) ? (trackingRaw as any).responseData : [];
    return list.find((t: any) => t.courseCode === selected?.courseCode) ?? null;
  }, [trackingRaw, selected]);

  const pct       = trackingRecord?.progressPercentage ?? 0;
  const completed = trackingRecord?.completedModules   ?? 0;
  const total     = trackingRecord?.totalModules       ?? 0;

  return (
    <Card className="p-4 bg-surface border-border rounded-3xl">
      <SectionHeader title="Lecture Audit" to="/teacher/lecture-audit" linkLabel="Full audit" />

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm justify-center">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading subjects…
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No subjects assigned yet.</p>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap mb-4">
            {courses.map((cc: any, i: number) => (
              <button key={cc.courseCode} onClick={() => setSelectedIdx(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedIdx === i ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}>
                {cc.courseName}
              </button>
            ))}
          </div>
          {pct > 0 && pct < 60 && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive px-3 py-2 text-xs font-semibold mb-3">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Coverage below 60% — needs attention!
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

// ── Today's Classes Section ──────────────────────────────────────────────────
const TimetableSection = () => {
  const { slots, isLoading } = useTeacherRoutine();

  const todaySlots = useMemo(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const seen = new Set<string>();
    return (slots as any[])
      .filter(s => s.day?.toLowerCase() === today.toLowerCase() && s.courseName)
      .filter(s => { const k = `${s.slotNumber}::${s.courseCode}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a: any, b: any) => a.slotNumber - b.slotNumber);
  }, [slots]);

  const COLORS = [
    "bg-rose-50 dark:bg-rose-950/30 text-rose-700",
    "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700",
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700",
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700",
    "bg-purple-50 dark:bg-purple-950/30 text-purple-700",
  ];

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
          <p className="text-sm font-semibold text-muted-foreground">No classes today</p>
          <p className="text-xs text-muted-foreground">{(slots as any[]).length} total slots this week</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todaySlots.map((slot: any, i: number) => (
            <Link key={`${slot.slotNumber}-${slot.courseCode}`} to="/teacher/attendance" state={{ slot }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 hover:bg-muted/40 transition">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${COLORS[i % COLORS.length]}`}>
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{slot.courseName}</p>
                <p className="text-xs text-muted-foreground">{slot.className}{slot.semester ? ` · Sem ${slot.semester}` : ""}</p>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                {slot.startTime}–{slot.endTime}
              </span>
            </Link>
          ))}
        </div>
      )}
      <Button asChild size="sm" variant="outline" className="w-full h-10 rounded-xl mt-4 font-semibold">
        <Link to="/teacher/timetable">View Full Timetable →</Link>
      </Button>
    </Card>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user } = useAuth();

  const adminNoticeQuery   = useGetNoticesByLevel("ADMIN", { batchId: user?.batchId ?? "", enabled: Boolean(user?.batchId) });
  const studentNoticeQuery = useGetNoticesByLevel("STUDENT");

  const notifications = useMemo(() => {
    try {
      return sortByCreatedAt([
        ...defaultAdminNotifications,
        ...defaultStudentNotifications,
        ...(Array.isArray(adminNoticeQuery.data)   ? adminNoticeQuery.data.map(n => noticeToNotification(n, "admin"))   : []),
        ...(Array.isArray(studentNoticeQuery.data) ? studentNoticeQuery.data.map(n => noticeToNotification(n, "student")) : []),
      ]).slice(0, 3);
    } catch { return [...defaultAdminNotifications, ...defaultStudentNotifications].slice(0, 3); }
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
