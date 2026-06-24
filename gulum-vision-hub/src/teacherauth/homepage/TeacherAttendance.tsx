import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check, Clock, X, ChevronLeft, RefreshCw, Users,
  BookOpen, CalendarDays, Loader2, TrendingUp, TrendingDown, Minus,
  BarChart2,
} from "lucide-react";
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

// ── Circular progress indicator ───────────────────────────────────────────────
function CircleProgress({ pct, size = 48 }: { pct: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (pct / 100) * circumference;
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor"
        strokeWidth={5} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
        strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - filled}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ── Attendance badge ──────────────────────────────────────────────────────────
function AttBadge({ pct }: { pct: number | null }) {
  if (pct === null) return (
    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      —
    </span>
  );
  const color = pct >= 75
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    : pct >= 50
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  const Icon = pct >= 75 ? TrendingUp : pct >= 50 ? Minus : TrendingDown;
  return (
    <span className={cn("flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full", color)}>
      <Icon className="h-3 w-3" />{Math.round(pct)}%
    </span>
  );
}

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
function StudentRow({ student, idx, status, isMarking, isLocked, rawCourseId, onMark }: {
  student: Student; idx: number; status: Status; isMarking: boolean; isLocked: boolean;
  rawCourseId: string;   // slot.courseId only (no courseCode fallback) — percentage API rejects codes
  onMark: (s: Student, st: Status) => void;
}) {
  // Only query if we have a real numeric/UUID courseId — NOT a courseCode string
  const { data: stat } = useGetAttendancePercentage(student.id, rawCourseId, { enabled: !!student.id && !!rawCourseId });
  const pct     = (stat as any)?.attendancePercentage ?? null;
  const present = (stat as any)?.presentCount ?? 0;
  const late    = (stat as any)?.lateCount ?? 0;
  const absent  = (stat as any)?.absentCount ?? 0;
  const total   = (stat as any)?.totalClasses ?? 0;

  const pctNum = pct !== null ? Math.round(pct) : null;

  // Status-button colour sets — work in both light and dark modes
  const btnStyle = (s: "PRESENT" | "LATE" | "ABSENT") => {
    const isActive = status === s;
    if (s === "PRESENT") return isActive
      ? "bg-emerald-500 text-white shadow-md scale-110 ring-2 ring-emerald-300 dark:ring-emerald-600"
      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white";
    if (s === "LATE") return isActive
      ? "bg-amber-500 text-white shadow-md scale-110 ring-2 ring-amber-300 dark:ring-amber-600"
      : "bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white";
    return isActive
      ? "bg-red-500 text-white shadow-md scale-110 ring-2 ring-red-300 dark:ring-red-600"
      : "bg-red-100 text-red-700 hover:bg-red-500 hover:text-white dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white";
  };

  const borderColor =
    status === "PRESENT" ? "border-emerald-400 dark:border-emerald-600" :
    status === "LATE"    ? "border-amber-400   dark:border-amber-600"   :
    status === "ABSENT"  ? "border-red-400     dark:border-red-600"     :
    "border-border";

  return (
    <Card className={cn("overflow-hidden border-2 transition-colors duration-300", borderColor)}>
      {/* Top row: avatar + name + action buttons */}
      <div className="p-3 flex items-center gap-3">
        {/* Circular attendance indicator */}
        <div className="relative shrink-0">
          {pctNum !== null
            ? <CircleProgress pct={pctNum} size={44} />
            : <div className="h-11 w-11 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-[9px] text-muted-foreground">–</span>
              </div>
          }
          <div className="absolute inset-0 flex items-center justify-center">
            {isMarking
              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              : <span className="text-[9px] font-black text-foreground">{idx + 1}</span>
            }
          </div>
        </div>

        {/* Name + roll + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground truncate">{student.name}</p>
            <AttBadge pct={pctNum} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Roll: {student.roll}
            {total > 0 && (
              <span className="ml-2 opacity-70">
                {present}P · {late > 0 ? `${late}L · ` : ""}{absent}A · {total} total
              </span>
            )}
          </p>
        </div>

        {/* Status buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(["PRESENT", "LATE", "ABSENT"] as const).map(s => {
            const isActive = status === s;
            return (
              <button
                key={s}
                disabled={isMarking || isLocked}
                onClick={() => !isLocked && onMark(student, s)}
                title={isLocked ? "Already marked" : s.charAt(0) + s.slice(1).toLowerCase()}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                  isLocked
                    ? isActive
                      ? "opacity-80 cursor-default ring-2 " + (
                          s === "PRESENT" ? "bg-emerald-500 text-white ring-emerald-300 dark:ring-emerald-600"
                          : s === "LATE"  ? "bg-amber-500  text-white ring-amber-300  dark:ring-amber-600"
                          :                 "bg-red-500    text-white ring-red-300    dark:ring-red-600"
                        )
                      : "opacity-20 cursor-not-allowed bg-muted text-muted-foreground"
                    : cn("disabled:opacity-50", btnStyle(s))
                )}
              >
                {s === "PRESENT" ? <Check className="h-4 w-4" /> : s === "LATE" ? <Clock className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </button>
            );
          })}
          {isLocked && (
            <span className="ml-1 text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full" title="Saved">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Attendance progress bar + subject label */}
      <div className="px-3 pb-3 pt-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground font-medium">Subject Attendance</span>
          {pctNum !== null && (
            <span className={cn(
              "text-[10px] font-bold",
              pctNum >= 75 ? "text-emerald-600 dark:text-emerald-400"
                : pctNum >= 50 ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
            )}>
              {pctNum}% · {present}/{total} classes
            </span>
          )}
        </div>
        <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              (pctNum ?? 0) >= 75 ? "bg-emerald-500" : (pctNum ?? 0) >= 50 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${pctNum ?? 0}%` }}
          />
        </div>
        {pctNum !== null && pctNum < 75 && (
          <p className={cn("text-[10px] mt-1 font-medium",
            pctNum < 50 ? "text-red-500 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
          )}>
            {pctNum < 50 ? "⚠ Critical — below 50%" : "Below 75% threshold"}
          </p>
        )}
      </div>
    </Card>
  );
}

// ── Subject Attendance Overview (per-class summary) ───────────────────────────
function SubjectAttendanceOverview({
  students, courseId, courseName,
}: { students: Student[]; courseId: string; courseName: string }) {
  // We collect individual stats to compute a class average
  // Each StudentRow already fetches via hook — here we just show a summary card
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-primary/20 rounded-2xl">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Subject Attendance</p>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{courseName}</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {students.length} students {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-1 border-t border-border pt-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-2">
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">≥75%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">On track</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-2">
              <p className="text-xs font-black text-amber-700 dark:text-amber-300">50–74%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">At risk</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-2">
              <p className="text-xs font-black text-red-700 dark:text-red-300">{"<50%"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Critical</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Individual % shown on each student card below
          </p>
        </div>
      )}
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

  const courseId = slot.courseId || slot.courseCode;  // used for session/mark payloads
  const rawCourseId = slot.courseId;                  // used for percentage API (no courseCode fallback)
  const sessionRef = useRef<string | null>(null);
  const startingRef = useRef(false);
  // Synchronous guard against double-click race — Set of student IDs currently in-flight
  const pendingMarksRef = useRef<Set<string>>(new Set());
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [marking, setMarking] = useState<Record<string, boolean>>({});
  // Tracks students whose mark was successfully saved to the API — these rows are locked
  const [apiMarked, setApiMarked] = useState<Record<string, Status>>({}); 

  const { mutateAsync: startSession, isPending: starting } = useStartAttendanceSession();
  const { mutateAsync: completeSession, isPending: completing } = useCompleteAttendanceSession();
  const { mutateAsync: markRecord } = useMarkAttendance();

  const doStartSession = () => {
    if (sessionRef.current || startingRef.current) return;
    startingRef.current = true;
    setSessionError(null);
    // Build the session payload — never send undefined for NOT-NULL fields.
    // If the schedule didn't return a numeric courseId/classId, fall back to
    // courseCode / classId so the backend constraint is satisfied.
    const sessionPayload: Record<string, any> = {
      courseCode: slot.courseCode,
      courseId:   slot.courseId   || slot.courseCode,   // NOT NULL on backend
      classId:    slot.classId    || slot.courseCode,   // NOT NULL on backend
      classesId:  slot.classId    || slot.courseCode,   // alias for same column
      teacherId:  userId,
      date:       new Date().toISOString().split("T")[0],
      startTime:  slot.startTime,
      endTime:    slot.endTime,
      slotNumber: slot.slotNumber,
      period:     slot.slotNumber,                      // NOT NULL on backend (AttendanceSession.period)
    };
    // Log the payload so it's easy to debug field-name mismatches in the network tab
    console.log("[AttendanceSession] starting with payload:", sessionPayload);
    startSession(sessionPayload).then((res: any) => {
      const sid =
        res?.sessionId ??
        res?.id ??
        res?.attendanceSessionId ??
        res?.data?.sessionId ??
        res?.responseData?.sessionId ??
        "";
      if (sid) {
        sessionRef.current = String(sid);
        setSessionReady(true);
        setSessionError(null);
      } else {
        // Response succeeded but returned no ID — treat as error
        const msg = "Session started but no sessionId was returned. Contact admin.";
        console.error(msg, res);
        setSessionError(msg);
      }
    }).catch((err: any) => {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        (typeof err?.response?.data === "string" ? err.response.data : null) ??
        err?.message ??
        "Failed to start attendance session";
      console.error("Session start failed:", err?.response?.status, msg);
      setSessionError(msg);
    }).finally(() => {
      startingRef.current = false;
    });
  };

  useEffect(() => {
    doStartSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMark = async (student: Student, status: Status) => {
    // Backend requires sessionId — block if session isn't ready yet
    if (!sessionRef.current) {
      toast.error("Session not started yet. Please wait or retry.");
      return;
    }
    // SYNCHRONOUS guard — checked before any await to prevent double-click races
    if (pendingMarksRef.current.has(student.id)) return;
    // Already saved to API — prevent duplicate mark (persists across re-renders)
    if (apiMarked[student.id]) return;
    const prev = marks[student.id] ?? null;
    // Toggle off (deselect before first API call) — only local state change
    if (prev === status) {
      setMarks(m => ({ ...m, [student.id]: null }));
      return;
    }
    // Lock synchronously before any await
    pendingMarksRef.current.add(student.id);
    // Optimistic local update
    setMarks(m => ({ ...m, [student.id]: status }));
    setMarking(m => ({ ...m, [student.id]: true }));
    try {
      const payload: Record<string, any> = {
        studentId: student.id,
        courseCode: slot.courseCode,
        date: new Date().toISOString().split("T")[0],
        status,
        sessionId: sessionRef.current,   // always required by backend
      };
      if (slot.courseId) payload.courseId = slot.courseId;
      if (slot.classId) { payload.classId = slot.classId; payload.classesId = slot.classId; }
      await markRecord(payload);
      // Persist lock in state — survives re-renders
      setApiMarked(m => ({ ...m, [student.id]: status }));
    } catch (err: any) {
      const serverMsg: string =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        (typeof err?.response?.data === "string" ? err.response.data : null) ??
        err?.message ??
        "Unknown error";

      // Backend says student already has a mark for this session —
      // this happens when the session was reused from a previous page load.
      // Treat as a silent success: lock the row with the selected status.
      const alreadyMarked =
        serverMsg.toLowerCase().includes("already marked") ||
        err?.response?.status === 409;

      if (alreadyMarked) {
        // Keep the optimistic mark and lock the row — the student IS marked
        setApiMarked(m => ({ ...m, [student.id]: status }));
        // pendingMarksRef already has student.id; do NOT delete it
        return;
      }

      // Genuine failure — roll back and let the teacher retry
      setMarks(m => ({ ...m, [student.id]: prev }));
      pendingMarksRef.current.delete(student.id);
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

  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ present: number; late: number; absent: number } | null>(null);

  const submit = async () => {
    if (counts.unmarked > 0) { toast.warning(`${counts.unmarked} student(s) still not marked`); return; }
    try {
      if (sessionRef.current) await completeSession({
        sessionId: sessionRef.current,
        payload: { presentCount: counts.present, lateCount: counts.late, absentCount: counts.absent },
      });
      setSubmitResult({ present: counts.present, late: counts.late, absent: counts.absent });
      setSubmitted(true);
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
          submitted
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
            : sessionError
              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
              : sessionReady
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
        )}>
          {starting
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <span className="h-1.5 w-1.5 rounded-full bg-current" />
          }
          {starting ? "Starting…" : submitted ? "Submitted ✓" : sessionError ? "Session Error" : sessionReady ? "Session Live" : "Pending"}
        </div>
      </div>

      {/* Subject attendance overview card */}
      {!loadingStudents && students.length > 0 && (
        <SubjectAttendanceOverview
          students={students}
          courseId={courseId}
          courseName={slot.courseName}
        />
      )}

      {/* Today's session summary */}
      <Card className="p-4 bg-surface border-border">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-foreground">Today's Class</p>
          <p className={cn("text-2xl font-bold", overallPct < 75 ? "text-destructive" : "text-success")}>
            {overallPct}%
          </p>
        </div>
        <Progress value={overallPct} className={`h-2 mt-2 ${overallPct < 75 ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`} />
        <div className="grid grid-cols-4 gap-3 mt-4 text-center">
          {[
            { label: "Present", count: counts.present, cls: "text-emerald-600 dark:text-emerald-400" },
            { label: "Late",    count: counts.late,    cls: "text-amber-600   dark:text-amber-400"   },
            { label: "Absent",  count: counts.absent,  cls: "text-red-600     dark:text-red-400"     },
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
      <div className="flex items-center gap-4 px-1">
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="h-3 w-3" /> Present
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Clock className="h-3 w-3" /> Late
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
          <X className="h-3 w-3" /> Absent
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">Ring = historical %</span>
      </div>

      {/* Session error — block marking, show retry */}
      {sessionError && (
        <Card className="p-5 rounded-2xl border-destructive/40 bg-destructive/5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
              <X className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-destructive">Session failed to start</p>
              <p className="text-xs text-muted-foreground mt-1 break-words">{sessionError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 rounded-xl font-semibold border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={doStartSession}
            disabled={starting}
          >
            {starting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Retrying…</>
              : <><RefreshCw className="h-3.5 w-3.5 mr-2" />Retry Session Start</>
            }
          </Button>
        </Card>
      )}

      {/* Students list — loads in parallel with session start */}
      {loadingStudents || starting ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            {loadingStudents ? "Loading students…" : "Starting session…"}
          </p>
        </div>
      ) : sessionError && students.length === 0 ? null /* error card already shown above, no students */ : students.length === 0 ? (
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
              isMarking={submitted ? false : (marking[s.id] ?? false)}
              isLocked={submitted || !!apiMarked[s.id] || pendingMarksRef.current.has(s.id)}
              rawCourseId={rawCourseId}
              onMark={submitted ? () => {} : handleMark}
            />
          ))}
        </div>
      )}

      {/* ── Submitted success banner ── */}
      {submitted && submitResult && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-200">Attendance Submitted</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                {slot.courseName} · {slot.className}{slot.semester ? ` · Sem ${slot.semester}` : ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-xl p-3">
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{submitResult.present}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Present</p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/40 rounded-xl p-3">
              <p className="text-xl font-black text-amber-700 dark:text-amber-300">{submitResult.late}</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Late</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/40 rounded-xl p-3">
              <p className="text-xl font-black text-red-700 dark:text-red-300">{submitResult.absent}</p>
              <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">Absent</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="w-full h-9 rounded-xl font-semibold border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
          >
            ← Back to Schedule
          </Button>
        </div>
      )}

      {/* Submit button — only shown before submission */}
      {students.length > 0 && !sessionError && !submitted && (
        <div className="pt-2 pb-4">
          <Button
            onClick={submit}
            disabled={completing || loadingStudents || !sessionRef.current}
            className="w-full h-11 rounded-2xl font-bold text-sm"
          >
            {completing
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
              : !sessionRef.current
                ? "Waiting for session…"
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
