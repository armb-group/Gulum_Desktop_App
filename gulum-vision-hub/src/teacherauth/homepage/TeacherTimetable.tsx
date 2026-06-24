import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTeacherRoutine } from "@/services/teacherRoutine";
import {
  Loader2, CalendarDays, BookOpen, Clock, Users, ChevronRight, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Soft warm pastel per day — white base with colored accents
const DAY_CFG: Record<string, { dot: string; badge: string; header: string; border: string; tdBg: string; tdFg: string; tdAccent: string }> = {
  Monday:    { dot: "bg-rose-500",    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",    header: "bg-rose-50 dark:bg-rose-950/20",    border: "border-l-rose-500",    tdBg: "#fff1f2", tdFg: "#be123c", tdAccent: "#f43f5e" },
  Tuesday:   { dot: "bg-indigo-500",  badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",  header: "bg-indigo-50 dark:bg-indigo-950/20",  border: "border-l-indigo-500",  tdBg: "#eef2ff", tdFg: "#3730a3", tdAccent: "#6366f1" },
  Wednesday: { dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",   header: "bg-amber-50 dark:bg-amber-950/20",   border: "border-l-amber-500",   tdBg: "#fffbeb", tdFg: "#b45309", tdAccent: "#f59e0b" },
  Thursday:  { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", header: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-l-emerald-500", tdBg: "#ecfdf5", tdFg: "#065f46", tdAccent: "#10b981" },
  Friday:    { dot: "bg-purple-500",  badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",  header: "bg-purple-50 dark:bg-purple-950/20",  border: "border-l-purple-500",  tdBg: "#faf5ff", tdFg: "#6b21a8", tdAccent: "#a855f7" },
};

const PALETTE = [
  "#f59e0b","#3b82f6","#22c55e","#a855f7","#ef4444",
  "#06b6d4","#f97316","#ec4899","#14b8a6","#8b5cf6",
];

const fmt = (t: string) => (t || "").slice(0, 5);
const brd = "1px solid #e8edf3";  // soft cool-grey border

export default function TeacherTimetable() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");

  const { slots, timetable, meta, isLoading, isError } = useTeacherRoutine();

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // Deduplicate slots by day+courseCode for the card list view
  const byDay = useMemo(() => {
    const seen = new Set<string>();
    const map: Record<string, typeof slots> = {};
    (slots as any[]).forEach(s => {
      const key = `${s.day}::${s.courseCode}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!map[s.day]) map[s.day] = [];
      map[s.day].push(s);
    });
    return map;
  }, [slots]);

  // Colour palette per course name
  const colOf: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    let ci = 0;
    (slots as any[]).forEach(s => {
      if (s.courseName && !map[s.courseName]) map[s.courseName] = PALETTE[ci++ % PALETTE.length];
    });
    return map;
  }, [slots]);

  // Table helpers
  const timeOf: Record<number, { s: string; e: string }> = {};
  (timetable as any[]).forEach(s => {
    if (s.slotNumber && s.startTime && !timeOf[s.slotNumber])
      timeOf[s.slotNumber] = { s: fmt(s.startTime), e: fmt(s.endTime) };
  });

  const allNums = Array.from(new Set((timetable as any[]).map(s => s.slotNumber))).filter(Boolean).sort((a, b) => a - b);
  const left  = allNums.filter(n => n <= 4);
  const right = allNums.filter(n => n >= 5);
  const days  = DAY_ORDER.filter(d => (timetable as any[]).some(s => s.day === d));

  const myCell  = (d: string, n: number) => (slots as any[]).find(s => s.day === d && s.slotNumber === n) ?? null;
  const anyCell = (d: string, n: number) => (timetable as any[]).find(s => s.day === d && s.slotNumber === n && (s.courseCode || s.courseName)) ?? null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <RoleShell role="teacher" title="My Timetable" subtitle="Weekly schedule">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-7 w-7 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading your timetable…</p>
      </div>
    </RoleShell>
  );

  if (isError || (!isLoading && (timetable as any[]).length === 0 && (slots as any[]).length === 0)) return (
    <RoleShell role="teacher" title="My Timetable" subtitle="Weekly schedule">
      <Card className="p-12 rounded-3xl border-dashed flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
        <p className="font-semibold text-muted-foreground">No timetable found</p>
        <p className="text-xs text-muted-foreground">Your schedule hasn't been configured yet. Contact admin.</p>
      </Card>
    </RoleShell>
  );

  return (
    <RoleShell role="teacher" title="My Timetable" subtitle={`${meta.className ? `${meta.className} · ` : ""}${(slots as any[]).length} slots assigned`}>
      <div className="space-y-6">

        {/* ── Today's classes quick-bar ─────────────────────────────────────── */}
        {byDay[today]?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-bold text-foreground">Today — {today}</p>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {byDay[today].length} class{byDay[today].length !== 1 ? "es" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {(byDay[today] as any[]).sort((a, b) => a.slotNumber - b.slotNumber).map((slot: any) => (
                <button
                  key={`today-${slot.courseCode}-${slot.slotNumber}`}
                  onClick={() => navigate("/teacher/attendance", { state: { slot } })}
                  className="w-full text-left rounded-2xl p-4 border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100 truncate">{slot.courseName}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {slot.className}{slot.semester ? ` · Sem ${slot.semester}` : ""}{slot.courseCode ? ` · ${slot.courseCode}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Tap to mark attendance →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Full weekly table (desktop) ───────────────────────────────────── */}
        {days.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Full Weekly Schedule</p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border bg-card hidden md:block"
              style={{ background: "#ffffff", border: "1px solid #e8edf3", boxShadow: "0 2px 16px rgba(99,102,241,0.06)" }}>
              {/* Table header — warm cream gradient */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid #eef0f5", background: "linear-gradient(135deg, #fefce8 0%, #faf5ff 100%)" }}>
                <div>
                  <p style={{ color: "#374151", fontSize: 13, fontWeight: 900, margin: 0 }}>
                    {user?.name ?? "Teacher"}'s Weekly Schedule
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: 10, fontWeight: 600, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {(slots as any[]).length} assigned slots
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 11, fontWeight: 600, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "6px 14px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                  </svg>
                  Print
                </button>
              </div>

              <div style={{ overflowX: "auto", background: "#ffffff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 600 }}>
                  <colgroup>
                    <col style={{ width: 72 }} />
                    {left.map(n => <col key={n} />)}
                    {right.length > 0 && <col style={{ width: 28 }} />}
                    {right.map(n => <col key={n} />)}
                  </colgroup>
                  <thead>
                    <tr>
                      {/* Corner cell — soft warm grey */}
                      <th style={{ background: "#f8f7f4", borderRight: brd, borderBottom: brd, color: "#9ca3af", fontSize: 10, fontWeight: 900, textAlign: "center", padding: "10px 4px", textTransform: "uppercase", letterSpacing: "0.12em" }}>Day</th>
                      {left.map(n => (
                        <th key={n} style={{ background: "#f8f9ff", borderRight: brd, borderBottom: brd, textAlign: "center", padding: "8px 4px" }}>
                          <p style={{ color: "#374151", fontSize: 11, fontWeight: 800, margin: 0 }}>{timeOf[n]?.s}–{timeOf[n]?.e}</p>
                          <p style={{ color: "#9ca3af", fontSize: 9, fontWeight: 700, marginTop: 2 }}>Slot {n}</p>
                        </th>
                      ))}
                      {right.length > 0 && (
                        <th style={{ background: "#fffbeb", borderRight: brd, borderLeft: brd, borderBottom: brd, textAlign: "center", padding: "8px 2px", verticalAlign: "middle" }}>
                          <span style={{ color: "#d97706", fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", display: "inline-block" }}>BREAK</span>
                        </th>
                      )}
                      {right.map(n => (
                        <th key={n} style={{ background: "#f8f9ff", borderRight: brd, borderBottom: brd, textAlign: "center", padding: "8px 4px" }}>
                          <p style={{ color: "#374151", fontSize: 11, fontWeight: 800, margin: 0 }}>{timeOf[n]?.s}–{timeOf[n]?.e}</p>
                          <p style={{ color: "#9ca3af", fontSize: 9, fontWeight: 700, marginTop: 2 }}>Slot {n}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day, ri) => {
                      const isToday = day === today;
                      const last = ri === days.length - 1;
                      const dc = DAY_CFG[day] ?? { dot: "bg-muted", badge: "", header: "", border: "", tdBg: "#f8fafc", tdFg: "#64748b", tdAccent: "#94a3b8" };
                      const cols = ([...left, ...(right.length > 0 ? [-1, ...right] : [])] as number[]);
                      return (
                        <tr key={day}>
                          {/* Day column — soft pastel per day, green for today */}
                          <td style={{
                            background: isToday ? "#d1fae5" : dc.tdBg,
                            borderRight: brd,
                            borderBottom: last ? "none" : brd,
                            textAlign: "center", verticalAlign: "middle",
                            fontSize: 10, fontWeight: 900, letterSpacing: "0.08em",
                            textTransform: "uppercase", height: 74,
                            color: isToday ? "#065f46" : dc.tdFg,
                            borderLeft: isToday ? "3px solid #10b981" : "3px solid transparent",
                          }}>
                            {day.slice(0, 3).toUpperCase()}
                            {isToday && <div style={{ fontSize: 7, fontWeight: 900, color: "#059669", letterSpacing: "0.1em", marginTop: 3 }}>TODAY</div>}
                          </td>
                          {cols.map(n => {
                            if (n === -1) return (
                              <td key="break" style={{ background: "#fffbeb", borderRight: "2px solid #fde68a", borderLeft: "2px solid #fde68a", borderBottom: last ? "none" : brd, textAlign: "center", verticalAlign: "middle", padding: "4px 0" }}>
                                <span style={{ color: "#d97706", fontSize: 7, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", display: "inline-block" }}>BREAK</span>
                              </td>
                            );
                            const mine  = myCell(day, n);
                            const other = !mine ? anyCell(day, n) : null;
                            const col   = mine ? (colOf[mine.courseName] ?? PALETTE[0]) : null;

                            if (mine) return (
                              <td key={n}
                                style={{ background: col! + "18", borderRight: brd, borderBottom: last ? "none" : brd, borderTop: `2.5px solid ${col}`, padding: "8px 10px", verticalAlign: "top", cursor: "pointer", transition: "background 0.15s" }}
                                onClick={() => navigate("/teacher/attendance", { state: { slot: { ...mine } } })}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = col! + "28"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = col! + "18"; }}
                              >
                                <p style={{ color: col!, fontSize: 11, fontWeight: 800, lineHeight: 1.3, margin: 0 }}>{mine.courseName}</p>
                                <p style={{ color: col! + "cc", fontSize: 9, fontWeight: 600, marginTop: 2 }}>{mine.courseCode}</p>
                                <p style={{ color: col!, fontSize: 8, fontWeight: 700, marginTop: 5, display: "flex", alignItems: "center", gap: 3, opacity: 0.85 }}>▶ Mark Attendance</p>
                              </td>
                            );

                            if (other) return (
                              <td key={n} style={{ background: "#f8fafc", borderRight: brd, borderBottom: last ? "none" : brd, padding: "8px 10px", verticalAlign: "top", opacity: 0.5 }}>
                                <p style={{ color: "#6b7280", fontSize: 10, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>{other.courseName}</p>
                                <p style={{ color: "#9ca3af", fontSize: 9, marginTop: 2 }}>{other.teacherName}</p>
                              </td>
                            );

                            return (
                              <td key={n} style={{ background: "#fafafa", borderRight: brd, borderBottom: last ? "none" : brd, verticalAlign: "middle" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, opacity: 0.15, fontSize: 18, color: "#94a3b8" }}>–</div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend — warm cream footer */}
              {Object.keys(colOf).length > 0 && (
                <div style={{ padding: "10px 22px", borderTop: "1px solid #eef0f5", background: "#fefce8", display: "flex", flexWrap: "wrap", gap: "6px 20px", alignItems: "center" }}>
                  <p style={{ color: "#9ca3af", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", width: "100%", marginBottom: 2 }}>Your Subjects</p>
                  {Object.entries(colOf).map(([name, colour]) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ background: colour, width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0, boxShadow: `0 0 0 2px ${colour}33` }} />
                      <span style={{ color: "#374151", fontSize: 11, fontWeight: 600 }}>{name}</span>
                    </div>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: 9, color: "#9ca3af" }}>Dimmed = other teachers · Click to mark attendance</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Mobile card list (all days) ───────────────────────────────────── */}
        <section className="md:hidden space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Weekly Classes</p>
          </div>
          {DAY_ORDER.filter(d => byDay[d]?.length).map(day => {
            const isToday = day === today;
            const dc = DAY_CFG[day] ?? { dot: "bg-muted", badge: "bg-muted text-muted-foreground", header: "bg-muted", border: "border-l-muted" };
            return (
              <div key={day}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dc.dot, isToday && "animate-pulse")} />
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{day}</p>
                  {isToday && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">Today</span>}
                  <span className="text-[10px] text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
                    {(byDay[day] as any[]).length} class{(byDay[day] as any[]).length !== 1 ? "es" : ""}
                  </span>
                </div>
                {(byDay[day] as any[]).sort((a, b) => a.slotNumber - b.slotNumber).map((slot: any) => (
                  <button
                    key={`${slot.courseCode}-${slot.slotNumber}`}
                    onClick={() => navigate("/teacher/attendance", { state: { slot } })}
                    className={cn(
                      "w-full text-left rounded-2xl p-4 border-l-4 mb-2 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]",
                      isToday
                        ? "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                        : dc.border + " " + dc.header
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
            );
          })}
        </section>

        {/* ── Go to Attendance ─────────────────────────────────────────────── */}
        <div className="pt-2 pb-4">
          <Button asChild className="w-full h-11 rounded-2xl font-bold text-sm">
            <Link to="/teacher/attendance">
              <CalendarDays className="h-4 w-4 mr-2" />
              Go to Attendance Page
            </Link>
          </Button>
        </div>

      </div>
    </RoleShell>
  );
}
