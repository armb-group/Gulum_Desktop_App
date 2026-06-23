import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Clock, X, ChevronLeft, RefreshCw, Users, BookOpen, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useGetStudentsByCourse,
  useStartAttendanceSession,
  useCompleteAttendanceSession,
  useMarkAttendance,
  useGetAttendancePercentage,
} from "@/services/teacherAttendance";
import { useTeacherRoutine } from "@/services/teacherRoutine";

type Status = "PRESENT" | "LATE" | "ABSENT" | null;

interface Slot {
  day: string;
  slotNumber: number;
  startTime: string;
  endTime: string;
  courseName: string;
  courseCode: string;
  courseId: string;
  className: string;
  classId: string;
  semester: string | number;
}
interface Student { id: string; name: string; roll: string; }

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_ACCENT: Record<string, string> = {
  Monday: "border-l-rose-500    bg-rose-50    dark:bg-rose-950/20",
  Tuesday: "border-l-indigo-500  bg-indigo-50  dark:bg-indigo-950/20",
  Wednesday: "border-l-amber-500   bg-amber-50   dark:bg-amber-950/20",
  Thursday: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
  Friday: "border-l-purple-500  bg-purple-50  dark:bg-purple-950/20",
};
const DAY_DOT: Record<string, string> = {
  Monday: "bg-rose-500", Tuesday: "bg-indigo-500", Wednesday: "bg-amber-500",
  Thursday: "bg-emerald-500", Friday: "bg-purple-500",
};

// ── Schedule View ─────────────────────────────────────────────────────────────
function ScheduleView({ onSelect }: { onSelect: (s: Slot) => void }) {
  const { slots, isLoading, isError } = useTeacherRoutine();

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
      <RefreshCw className="h-7 w-7 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading your schedule…</p>
    </div>
  );

  if (isError || !slots.length) return (
    <Card className="p-12 rounded-3xl border-dashed flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
      <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
      <p className="font-semibold text-muted-foreground">No classes assigned yet</p>
      <p className="text-xs text-muted-foreground">Your schedule will appear once assigned by admin.</p>
    </Card>
  );

  // Deduplicate by day::courseCode — keep earliest slot, merge time range across the block
  const dedupMap: Record<string, Slot> = {};
  slots.forEach(s => {
    const key = `${s.day}::${s.courseCode}`;
    if (!dedupMap[key]) { dedupMap[key] = { ...s } as Slot; return; }
    if (s.slotNumber < dedupMap[key].slotNumber) dedupMap[key].startTime = s.startTime;
    if (s.slotNumber > dedupMap[key].slotNumber) dedupMap[key].endTime = s.endTime;
  });
  const uniqueSlots = Object.values(dedupMap);
  const byDay: Record<string, Slot[]> = {};
  uniqueSlots.forEach(s => { if (!byDay[s.day]) byDay[s.day] = []; byDay[s.day].push(s); });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 px-1 mb-4">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{uniqueSlots.length} Course{uniqueSlots.length !== 1 ? "s" : ""} / Week</p>
          <p className="text-xs text-muted-foreground">Tap a class to mark attendance</p>
        </div>
      </div>
      {DAY_ORDER.filter(d => byDay[d]?.length).map(day => (
        <div key={day} className="space-y-2">
          <div className="flex items-center gap-2 px-1 pt-2">
            <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", DAY_DOT[day])} />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{day}</p>
            <span className="text-[10px] font-semibold text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
              {byDay[day].length} {byDay[day].length === 1 ? "class" : "classes"}
            </span>
          </div>
          {byDay[day].map((slot, i) => (
            <button
              key={`${slot.courseCode}-${i}`}
              onClick={() => onSelect(slot)}
              className={cn(
                "w-full text-left rounded-2xl p-4 border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]",
                DAY_ACCENT[day]
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{slot.courseName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {slot.className}{slot.semester ? ` · Sem ${slot.semester}` : ""}{slot.courseCode ? ` · ${slot.courseCode}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-bold text-foreground bg-background/70 px-2.5 py-1 rounded-full border border-border">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Slot {slot.slotNumber}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <Users className="h-3 w-3" /> Tap to mark attendance →
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Student Row ───────────────────────────────────────────────────────────────
function StudentRow({ student, idx, status, isMarking, courseId, onMark }: {
  student: Student; idx: number; status: Status; isMarking: boolean;
  courseId: string; onMark: (s: Student, st: Status) => void;
}) {
  const { data: stat } = useGetAttendancePercentage(student.id, courseId, { enabled: !!student.id && !!courseId });
  const pct = (stat as any)?.attendancePercentage ?? null;
  const present = (stat as any)?.presentCount ?? 0;
  const absent = (stat as any)?.absentCount ?? 0;
  const total = (stat as any)?.totalClasses ?? 0;

  // Status-button colour sets — work in both light and dark modes
  const btnStyle = (s: "PRESENT" | "LATE" | "ABSENT") => {
    const isActive = status === s;
    if (s === "PRESENT") return isActive
      ? "bg-emerald-500 text-white shadow-md scale-110 ring-2 ring-emerald-300 dark:ring-emerald-600"
      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white";
    if (s === "LATE") return isActive
      ? "bg-amber-500 text-white shadow-md scale-110 ring-2 ring-amber-300 dark:ring-amber-600"
      : "bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white";
    // ABSENT
    return isActive
      ? "bg-red-500 text-white shadow-md scale-110 ring-2 ring-red-300 dark:ring-red-600"
      : "bg-red-100 text-red-700 hover:bg-red-500 hover:text-white dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white";
  };

  const headerBg =
    status === "PRESENT" ? "bg-emerald-600 dark:bg-emerald-800" :
      status === "LATE" ? "bg-amber-500  dark:bg-amber-700" :
        status === "ABSENT" ? "bg-red-600    dark:bg-red-800" :
          "bg-primary";


  const headerText = status ? "text-white" : "text-primary-foreground";

  return (
    <Card className={cn("overflow-hidden border-transparent")}>
      <div className={cn("p-4", headerBg, headerText)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black bg-white/20 shrink-0">
              {isMarking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : idx + 1}
            </div>
            <div>
              <p className="font-semibold text-sm">{student.name}</p>
              <p className="text-xs opacity-80">
                Roll: {student.roll}
                {pct !== null && <span className="ml-2 font-bold">{Math.round(pct)}%</span>}
                {total > 0 && <span className="ml-1 opacity-70">· {present}P/{absent}A/{total}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(["PRESENT", "LATE", "ABSENT"] as const).map(s => (
              <button
                key={s}
                disabled={isMarking}
                onClick={() => onMark(student, s)}
                title={s.charAt(0) + s.slice(1).toLowerCase()}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-50",
                  btnStyle(s)
                )}
              >
                {s === "PRESENT" ? <Check className="h-4 w-4" /> : s === "LATE" ? <Clock className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-surface p-3">
        <Progress value={pct ?? 0} className={`h-2 ${(pct ?? 0) < 75 ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} />
        <p className="text-xs text-muted-foreground mt-2">
          {present}/{total} classes attended
          {pct !== null && (
            <span className={cn("ml-2 font-semibold", pct < 75 ? "text-destructive" : "text-success")}>
              {Math.round(pct)}%
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}


// ── Marking View ──────────────────────────────────────────────────────────────
function MarkingView({ slot, onBack }: { slot: Slot; onBack: () => void }) {
  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
  const userId = user?.id ?? "";

  // GET /api/students/course/{courseCode}
  const { data: rawStudents = [], isLoading: loadingStudents } = useGetStudentsByCourse(
    slot.courseCode, { enabled: !!slot.courseCode }
  );

  const students: Student[] = useMemo(() =>
    (Array.isArray(rawStudents) ? rawStudents : []).map((s: any) => ({
      id: String(s.studentId ?? s.id ?? s.userId ?? ""),
      name: s.fullName ?? s.full_name ?? s.name ?? s.studentName ?? "Student",
      roll: s.rollNo ?? s.roll_no ?? s.rollNumber ?? s.admissionNo ?? "–",
    })),
    [rawStudents]
  );

  const courseId = slot.courseId || slot.courseCode;
  const sessionRef = useRef<string | null>(null);
  const startingRef = useRef(false);          // prevents concurrent session starts
  const [sessionReady, setSessionReady] = useState(false);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [marking, setMarking] = useState<Record<string, boolean>>({});

  // POST /attendance/session/start
  const { mutateAsync: startSession, isPending: starting } = useStartAttendanceSession();
  // PUT /attendance/session/complete/{id}
  const { mutateAsync: completeSession, isPending: completing } = useCompleteAttendanceSession();
  // POST /attendance
  const { mutateAsync: markRecord } = useMarkAttendance();

  // Start session once on mount — guard with startingRef so concurrent calls are impossible.
  useEffect(() => {
    if (sessionReady || sessionRef.current || startingRef.current) return;
    startingRef.current = true;
    startSession({
      courseCode: slot.courseCode,
      courseId: slot.courseId || undefined,
      classId: slot.classId || undefined,
      classesId: slot.classId || undefined,
      teacherId: userId,
      date: new Date().toISOString().split("T")[0],
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotNumber: slot.slotNumber,
    }).then((res: any) => {
      const sid = res?.sessionId ?? res?.id ?? res?.attendanceSessionId ?? res?.data?.sessionId ?? "";
      sessionRef.current = sid ? String(sid) : null;
      setSessionReady(true);
    }).catch((err: any) => {
      // Session API failed — allow marking without sessionId (it's optional on backend)
      console.warn("Session start failed:", err?.response?.data ?? err?.message);
      setSessionReady(true);
    }).finally(() => {
      startingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  const handleMark = async (student: Student, status: Status) => {
    const prev = marks[student.id] ?? null;
    // Toggle off — deselect locally
    if (prev === status) {
      setMarks(m => ({ ...m, [student.id]: null }));
      return;
    }
    // Optimistic update
    setMarks(m => ({ ...m, [student.id]: status }));
    setMarking(m => ({ ...m, [student.id]: true }));
    try {
      // Send both classId + classesId so backend accepts either field name
      const payload: Record<string, any> = {
        studentId: student.id,
        courseCode: slot.courseCode,
        date: new Date().toISOString().split("T")[0],
        status,
      };
      if (slot.courseId) payload.courseId = slot.courseId;
      if (slot.classId) { payload.classId = slot.classId; payload.classesId = slot.classId; }
      if (sessionRef.current) payload.sessionId = sessionRef.current;

      await markRecord(payload);
    } catch (err: any) {
      // Roll back on failure and show actual server error
      setMarks(m => ({ ...m, [student.id]: prev }));
      const serverMsg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.response?.data ??
        err?.message ??
        "Unknown error";
      console.error("markAttendance failed:", err?.response?.status, serverMsg);
      toast.error(`Failed to mark ${student.name}: ${serverMsg}`);
    } finally {
      setMarking(m => ({ ...m, [student.id]: false }));
    }
  };
  const counts = useMemo(() => ({
    present: Object.values(marks).filter(v => v === "PRESENT").length,
    late: Object.values(marks).filter(v => v === "LATE").length,
    absent: Object.values(marks).filter(v => v === "ABSENT").length,
    unmarked: students.length - Object.values(marks).filter(Boolean).length,
  }), [marks, students]);

  const overallPct = students.length ? Math.round((counts.present / students.length) * 100) : 0;

  const submit = async () => {
    if (counts.unmarked > 0) { toast.warning(`${counts.unmarked} student(s) still not marked`); return; }
    try {
      // PUT /attendance/session/complete/{id}
      if (sessionRef.current) await completeSession({
        sessionId: sessionRef.current,
        payload: { presentCount: counts.present, lateCount: counts.late, absentCount: counts.absent },
      });
      toast.success(`Submitted — ${counts.present}P / ${counts.late}L / ${counts.absent}A`);
      onBack();
    } catch {
      toast.error("Failed to complete session.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Back + session badge */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground truncate">{slot.courseName}</p>
          <p className="text-xs text-muted-foreground">
            {slot.className}{slot.semester ? ` · Sem ${slot.semester}` : ""} · {slot.startTime}–{slot.endTime}
          </p>
        </div>
        <div className={cn(
          "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold",
          sessionReady
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
        )}>
          {starting
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <span className="h-1.5 w-1.5 rounded-full bg-current" />
          }
          {starting ? "Starting…" : sessionReady ? "Session Live" : "Pending"}
        </div>
      </div>

      {/* Overall card */}
      <Card className="p-4 bg-surface border-border">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-foreground">Class Attendance</p>
          <p className={cn("text-2xl font-bold", overallPct < 75 ? "text-destructive" : "text-success")}>
            {overallPct}%
          </p>
        </div>
        <Progress value={overallPct} className={`h-2 mt-2 ${overallPct < 75 ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} />
        <div className="grid grid-cols-4 gap-3 mt-4 text-center">
          {[
            { label: "Present", count: counts.present, cls: "text-emerald-600 dark:text-emerald-400" },
            { label: "Late", count: counts.late, cls: "text-amber-600   dark:text-amber-400" },
            { label: "Absent", count: counts.absent, cls: "text-red-600     dark:text-red-400" },
            { label: "Pending", count: counts.unmarked, cls: "text-muted-foreground" },
          ].map(b => (
            <div key={b.label}>
              <p className={cn("text-xl font-bold", b.cls)}>{b.count}</p>
              <p className="text-xs text-muted-foreground">{b.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Attendance legend */}
      <div className="flex items-center gap-3 px-1">
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="h-3 w-3" /> Present
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Clock className="h-3 w-3" /> Late
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
          <X className="h-3 w-3" /> Absent
        </span>
      </div>

      {/* Students list */}
      {loadingStudents || starting ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            {loadingStudents ? "Loading students…" : "Starting session…"}
          </p>
        </div>
      ) : students.length === 0 ? (
        <Card className="p-10 rounded-3xl border-dashed flex flex-col items-center justify-center gap-3 text-center">
          <Users className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">
            No students found for {slot.courseCode}
          </p>
          <p className="text-xs text-muted-foreground">
            Students may not be enrolled in this course yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {students.map((s, idx) => (
            <StudentRow
              key={s.id || idx}
              student={s}
              idx={idx}
              status={marks[s.id] ?? null}
              isMarking={marking[s.id] ?? false}
              courseId={courseId}
              onMark={handleMark}
            />
          ))}
        </div>
      )}

      {students.length > 0 && (
        <div className="pt-2 pb-4">
          <Button
            onClick={submit}
            disabled={completing || loadingStudents}
            className="w-full h-11 rounded-2xl font-bold text-sm"
          >
            {completing
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
              : `Submit Attendance · ${students.length} Students`
            }
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function TeacherAttendance() {
  const location = useLocation();
  const [selected, setSelected] = useState<Slot | null>((location.state as any)?.slot ?? null);

  return (
    <RoleShell
      role="teacher"
      title={selected ? "Mark Attendance" : "Attendance"}
      subtitle={selected ? `${selected.courseName} · ${selected.startTime}–${selected.endTime}` : "Weekly class schedule"}
    >
      {selected
        ? <MarkingView slot={selected} onBack={() => setSelected(null)} />
        : <ScheduleView onSelect={setSelected} />
      }
    </RoleShell>
  );
}
