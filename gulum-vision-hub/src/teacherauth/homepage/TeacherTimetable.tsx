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

// Day label config — dark backgrounds matching student portal
const DAY_CFG: Record<string, { dot: string; badge: string; header: string; border: string; labelBg: string; labelText: string }> = {
  Monday:    { dot: "bg-rose-500",    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",    header: "bg-rose-50 dark:bg-rose-950/20",    border: "border-l-rose-500",    labelBg: "#5c1a1a", labelText: "#e88080" },
  Tuesday:   { dot: "bg-indigo-500",  badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",  header: "bg-indigo-50 dark:bg-indigo-950/20",  border: "border-l-indigo-500",  labelBg: "#1a2a4c", labelText: "#80a8e8" },
  Wednesday: { dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",   header: "bg-amber-50 dark:bg-amber-950/20",   border: "border-l-amber-500",   labelBg: "#1a3a1a", labelText: "#80c880" },
  Thursday:  { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", header: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-l-emerald-500", labelBg: "#3a2800", labelText: "#e8c060" },
  Friday:    { dot: "bg-purple-500",  badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",  header: "bg-purple-50 dark:bg-purple-950/20",  border: "border-l-purple-500",  labelBg: "#26163a", labelText: "#b080e8" },
};

// Vivid subject colors — same as student timetable, but yellow moved away from position 0
// to avoid confusion with the amber BREAK column
const PALETTE = [
  "#3b82f6","#22c55e","#a855f7","#ef4444","#06b6d4",
  "#f97316","#ec4899","#14b8a6","#8b5cf6","#f59e0b",
];

// CSS-variable-based theme — matches student portal
const THEME = {
  cardBg:     "hsl(var(--card))",
  cardText:   "hsl(var(--card-foreground))",
  mutedBg:    "hsl(var(--muted))",
  softBg:     "hsl(var(--background) / 0.55)",
  border:     "hsl(var(--border))",
  mutedText:  "hsl(var(--muted-foreground))",
  buttonBg:   "hsl(var(--secondary))",
  buttonText: "hsl(var(--secondary-foreground))",
  primary:    "hsl(var(--primary))",
  warningBg:  "hsl(var(--warning-soft))",
  warning:    "hsl(var(--warning))",
};

const fmt = (t: string) => (t || "").slice(0, 5);

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

  // Colour map keyed by courseCode::className — gives each unique teaching assignment
  // its own vivid distinct color (DBMS-CSE3A and DBMS-CSE3B get different colors)
  // This produces the same attractive multi-color appearance as the student timetable
  const colOf: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    let ci = 0;
    const key = (s: any) => `${s.courseCode || s.courseName}::${s.className || ""}`;
    // Build from slots (teacher's own classes) first
    (slots as any[]).forEach((s: any) => {
      const k = key(s);
      if (k && !map[k]) map[k] = PALETTE[ci++ % PALETTE.length];
    });
    // Also map by courseName alone so lookup always works
    (slots as any[]).forEach((s: any) => {
      const nameKey = s.courseName || s.courseCode;
      if (nameKey && !map[nameKey]) map[nameKey] = map[key(s)] ?? PALETTE[ci++ % PALETTE.length];
    });
    return map;
  }, [slots]);

  // Table helpers
  const timeOf: Record<number, { s: string; e: string }> = {};
  (timetable as any[]).forEach(s => {
    if (s.slotNumber && s.startTime && !timeOf[s.slotNumber])
      timeOf[s.slotNumber] = { s: fmt(s.startTime), e: fmt(s.endTime) };
  });

  // All 8 slots shown in order (1→8), BREAK appears on the far right
  const allNums: number[] = Array.from(new Set([
    ...(timetable as any[]).map((s: any) => s.slotNumber).filter(Boolean),
    1, 2, 3, 4, 5, 6, 7, 8,
  ])).sort((a: number, b: number) => a - b).filter((n: number) => n >= 1 && n <= 8);
  const days  = DAY_ORDER.filter(d => (timetable as any[]).some(s => s.day === d));

  // Day abbreviations matching student portal
  const DAY_ABBR: Record<string, string> = {
    Monday: "MON", Tuesday: "TUES", Wednesday: "WED",
    Thursday: "THURS", Friday: "FRI", Saturday: "SAT", Sunday: "SUN",
  };

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

            {/* Outer card — same colors as student timetable */}
            <div className="rounded-2xl overflow-hidden hidden md:block"
              style={{ background: THEME.cardBg, border: `1px solid ${THEME.border}`, color: THEME.cardText, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>

              {/* Card Header — same as student portal */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${THEME.border}`, background: THEME.cardBg }}>
                <div>
                  <h2 style={{ color: THEME.cardText, fontSize: 20, fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                    {user?.name ?? "Teacher"}'s Schedule
                  </h2>
                  <p style={{ color: THEME.mutedText, fontSize: 11, fontWeight: 700, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Academic Timetable · All Assigned Classes
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  style={{ display: "flex", alignItems: "center", gap: 6, color: THEME.buttonText, fontSize: 13, fontWeight: 700, background: THEME.buttonBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.primary; (e.currentTarget as HTMLButtonElement).style.color = THEME.primary; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border; (e.currentTarget as HTMLButtonElement).style.color = THEME.buttonText; }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                  </svg>
                  Print
                </button>
              </div>

              {/* Timetable Grid — same colors as student timetable */}
              <div style={{ overflowX: "auto", background: THEME.cardBg }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 680 }}>
                  <colgroup>
                    <col style={{ width: 70 }} />
                    {allNums.map((n: number) => <col key={n} />)}
                    {/* BREAK column — far right, narrow */}
                    <col style={{ width: 36 }} />
                  </colgroup>

                  {/* Header row — same muted bg as student timetable */}
                  <thead>
                    <tr>
                      {/* DAY corner */}
                      <th style={{ background: THEME.mutedBg, borderRight: `1px solid ${THEME.border}`, borderBottom: `1px solid ${THEME.border}`, color: THEME.mutedText, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", padding: "12px 4px" }}>
                        DAY
                      </th>
                      {/* Slot headers */}
                      {allNums.map((n: number) => (
                        <th key={n} style={{ background: THEME.mutedBg, borderRight: `1px solid ${THEME.border}`, borderBottom: `1px solid ${THEME.border}`, textAlign: "center", padding: "10px 4px", verticalAlign: "middle" }}>
                          <p style={{ color: THEME.cardText, fontSize: 12, fontWeight: 800, lineHeight: 1.2, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {timeOf[n]?.s ?? ""}–{timeOf[n]?.e ?? ""}
                          </p>
                          <p style={{ color: THEME.mutedText, fontSize: 10, fontWeight: 700, marginTop: 3 }}>Slot {n}</p>
                        </th>
                      ))}
                      {/* BREAK header — same warning colors as student timetable */}
                      <th style={{ background: THEME.warningBg, borderLeft: `2px solid ${THEME.warning}`, borderRight: `2px solid ${THEME.warning}`, borderBottom: `1px solid ${THEME.border}`, textAlign: "center", padding: "10px 2px", verticalAlign: "middle" }}>
                        <span style={{ color: THEME.warning, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", display: "inline-block" }}>BREAK</span>
                      </th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {days.map((day, rowIdx) => {
                      const isToday = day === today;
                      const isLast  = rowIdx === days.length - 1;
                      const dc = DAY_CFG[day] ?? { dot: "bg-muted", badge: "", header: "", border: "", labelBg: "#1e1e1e", labelText: "#a0a0a0" };
                      const bdr = isLast ? "none" : `1px solid ${THEME.border}`;
                      return (
                        <tr key={day}>
                          {/* Day label — same dark bg colors as student timetable */}
                          <td style={{
                            background: isToday ? "#065f46" : dc.labelBg,
                            borderRight: `1px solid ${THEME.border}`,
                            borderBottom: bdr,
                            textAlign: "center", verticalAlign: "middle",
                            color: isToday ? "#6ee7b7" : dc.labelText,
                            fontSize: 12, fontWeight: 900,
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            padding: "0 4px",
                          }}>
                            {DAY_ABBR[day] ?? day.slice(0, 3).toUpperCase()}
                            {isToday && (
                              <div style={{ fontSize: 7, fontWeight: 900, color: "#6ee7b7", letterSpacing: "0.1em", marginTop: 3 }}>TODAY</div>
                            )}
                          </td>

                          {/* Slot cells 1–8 — vivid colorful like student timetable screenshot */}
                          {allNums.map((n: number) => {
                            const mine  = myCell(day, n);
                            const other = !mine ? anyCell(day, n) : null;
                            // Key by courseCode::className for max color variety
                            const slotKey = mine ? `${mine.courseCode || mine.courseName}::${mine.className || ""}` : "";
                            const col = mine ? (colOf[slotKey] ?? colOf[mine.courseName || mine.courseCode] ?? PALETTE[n % PALETTE.length]) : null;

                            /* My class — vivid colored background like student timetable */
                            if (mine) return (
                              <td key={n}
                                style={{
                                  background: col! + "28",
                                  borderRight: `1px solid ${THEME.border}`,
                                  borderBottom: bdr,
                                  borderTop: `3px solid ${col}`,
                                  padding: "10px 8px",
                                  verticalAlign: "top",
                                  cursor: "pointer",
                                  transition: "background 0.15s",
                                }}
                                onClick={() => navigate("/teacher/attendance", { state: { slot: { ...mine } } })}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = col! + "40"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = col! + "28"; }}
                              >
                                <p style={{ color: col!, fontSize: 12, fontWeight: 800, lineHeight: 1.3, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                  {mine.courseName}
                                </p>
                                {mine.courseCode && (
                                  <p style={{ color: col!, fontSize: 10, fontWeight: 600, marginTop: 3, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {mine.courseCode}
                                  </p>
                                )}
                                {mine.className && (
                                  <p style={{ color: col!, fontSize: 10, fontWeight: 600, marginTop: 2, opacity: 0.65, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {mine.className}
                                  </p>
                                )}
                              </td>
                            );

                            /* Another teacher's class (dimmed) */
                            if (other) return (
                              <td key={n} style={{ background: THEME.softBg, borderRight: `1px solid ${THEME.border}`, borderBottom: bdr, padding: "10px 8px", verticalAlign: "top", opacity: 0.5 }}>
                                <p style={{ color: THEME.cardText, fontSize: 10, fontWeight: 700, lineHeight: 1.3, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other.courseName}</p>
                                <p style={{ color: THEME.mutedText, fontSize: 9, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other.teacherName}</p>
                              </td>
                            );

                            /* Empty cell — same soft bg as student timetable */
                            return (
                              <td key={n} style={{ background: THEME.softBg, borderRight: `1px solid ${THEME.border}`, borderBottom: bdr, textAlign: "center", verticalAlign: "middle", color: THEME.mutedText, fontSize: 16, fontWeight: 700 }}>
                                —
                              </td>
                            );
                          })}

                          {/* BREAK cell — far right, same warning colors as student timetable */}
                          <td style={{ background: THEME.warningBg, borderLeft: `2px solid ${THEME.warning}`, borderRight: `2px solid ${THEME.warning}`, borderBottom: bdr, textAlign: "center", verticalAlign: "middle", padding: "4px 0" }}>
                            <span style={{ color: THEME.warning, fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", display: "inline-block" }}>BREAK</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Subject Legend — same as student timetable */}
              {Object.keys(colOf).length > 0 && (
                <div style={{ padding: "12px 24px", borderTop: `1px solid ${THEME.border}`, background: THEME.cardBg, display: "flex", flexWrap: "wrap", gap: "8px 24px", alignItems: "center" }}>
                  <p style={{ color: THEME.mutedText, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", width: "100%", marginBottom: 2 }}>Subject Legend</p>
                  {Object.entries(colOf).map(([name, colour]) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: colour, width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
                      <span style={{ color: THEME.mutedText, fontSize: 11, fontWeight: 600 }}>{name}</span>
                    </div>
                  ))}
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
