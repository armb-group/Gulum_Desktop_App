import { useNavigate } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { useTeacherScheduleById } from "@/services/teacherRoutine";
import { Loader2 } from "lucide-react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "MON", Tuesday: "TUES", Wednesday: "WED", Thursday: "THURS", Friday: "FRI",
};
const DAY_CFG: Record<string, { bg: string; fg: string }> = {
  Monday: { bg: "#5c1a1a", fg: "#e88080" },
  Tuesday: { bg: "#1a2a4c", fg: "#80a8e8" },
  Wednesday: { bg: "#1a3a1a", fg: "#80c880" },
  Thursday: { bg: "#3a2800", fg: "#e8c060" },
  Friday: { bg: "#26163a", fg: "#b080e8" },
};
const PALETTE = ["#f59e0b", "#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#8b5cf6"];
const fmt = (t: string) => (t || "").slice(0, 5);



export default function TeacherTimetable() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
  const teacherId = user?.id ?? "";

  const { data, isLoading, isError } = useTeacherScheduleById(teacherId);
  const timetable = data?.timetable ?? [];
  const meta = data?.meta ?? { className: "", semester: "", classId: "", classesId: "" };

  // slots = already-normalised rows for THIS teacher (from teacherRoutine.js)
  const slots = data?.slots ?? [];

  // Column time labels
  const timeOf: Record<number, { s: string; e: string }> = {};
  timetable.forEach(s => {
    if (s.slotNumber && s.startTime && !timeOf[s.slotNumber])
      timeOf[s.slotNumber] = { s: fmt(s.startTime), e: fmt(s.endTime) };
  });

  const allNums = Array.from(new Set(timetable.map(s => s.slotNumber))).filter(Boolean).sort((a, b) => a - b);
  const left = allNums.filter(n => n <= 4);
  const right = allNums.filter(n => n >= 5);
  const days = DAY_ORDER.filter(d => timetable.some(s => s.day === d));

  // Colour per course (my slots only)
  const colOf: Record<string, string> = {};
  let ci = 0;
  slots.forEach(s => { if (s.courseName && !colOf[s.courseName!]) colOf[s.courseName!] = PALETTE[ci++ % PALETTE.length]; });

  const myCell = (d: string, n: number) => slots.find((s:any) => s.day === d && s.slotNumber === n) ?? null;
  const anyCell = (d: string, n: number) => timetable.find((s:any) => s.day === d && s.slotNumber === n && (s.courseCode || s.courseName)) ?? null;

  const brd = "1px solid hsl(var(--border))";

  if (isLoading) return (
    <RoleShell role="teacher" title="My Timetable" wide>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "hsl(var(--muted-foreground))" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Loading your timetable…</span>
      </div>
    </RoleShell>
  );

  if (isError || (timetable.length === 0 && !isLoading)) return (
    <RoleShell role="teacher" title="My Timetable" wide>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 8, color: "hsl(var(--muted-foreground))" }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>No timetable found.</span>
        <span style={{ fontSize: 12 }}>Your schedule may not be configured yet. Contact the admin.</span>
      </div>
    </RoleShell>
  );

  return (
    <RoleShell role="teacher" title="My Timetable" wide>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px 24px", overflow: "auto", background: "hsl(var(--background))" }}>
        <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", background: "hsl(var(--card))", border: brd }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: brd }}>
            <div>
              <p style={{ color: "hsl(var(--foreground))", fontSize: 20, fontWeight: 900, lineHeight: 1.2, margin: 0 }}>
                {user?.name ?? "Teacher"}'s Schedule
              </p>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
                {meta.className} · Sem {meta.semester} · {slots.length} slots assigned
              </p>
            </div>
            <button onClick={() => window.print()}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, border: brd, background: "hsl(var(--muted))", color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
              </svg>
              Print
            </button>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 700 }}>
              <colgroup>
                <col style={{ width: 68 }} />
                {left.map(n => <col key={n} />)}
                {right.length > 0 && <col style={{ width: 32 }} />}
                {right.map(n => <col key={n} />)}
              </colgroup>

              <thead>
                <tr>
                  <th style={{ background: "hsl(var(--muted))", borderRight: brd, borderBottom: brd, color: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 900, textAlign: "center", padding: "12px 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Day
                  </th>
                  {left.map(n => (
                    <th key={n} style={{ background: "hsl(var(--card))", borderRight: brd, borderBottom: brd, textAlign: "center", padding: "10px 4px" }}>
                      <p style={{ color: "hsl(var(--foreground))", fontSize: 11, fontWeight: 800, margin: 0 }}>{timeOf[n]?.s}–{timeOf[n]?.e}</p>
                      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 700, marginTop: 2 }}>Slot {n}</p>
                    </th>
                  ))}
                  {right.length > 0 && (
                    <th style={{ background: "hsl(var(--muted))", borderRight: brd, borderLeft: brd, borderBottom: brd, textAlign: "center", padding: "10px 2px", verticalAlign: "middle" }}>
                      <span style={{ color: "#e8a020", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", display: "inline-block" }}>BREAK</span>
                    </th>
                  )}
                  {right.map(n => (
                    <th key={n} style={{ background: "hsl(var(--card))", borderRight: brd, borderBottom: brd, textAlign: "center", padding: "10px 4px" }}>
                      <p style={{ color: "hsl(var(--foreground))", fontSize: 11, fontWeight: 800, margin: 0 }}>{timeOf[n]?.s}–{timeOf[n]?.e}</p>
                      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 700, marginTop: 2 }}>Slot {n}</p>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {days.map((day, ri) => {
                  const last = ri === days.length - 1;
                  const dc = DAY_CFG[day] ?? { bg: "#1e1e1e", fg: "#a0a0a0" };
                  const cols = ([...left, ...(right.length > 0 ? [-1, ...right] : [])] as number[]);
                  return (
                    <tr key={day}>
                      <td style={{ background: dc.bg, borderRight: brd, borderBottom: last ? "none" : brd, textAlign: "center", verticalAlign: "middle", color: dc.fg, fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", height: 76 }}>
                        {DAY_SHORT[day]}
                      </td>
                      {cols.map(n => {
                        if (n === -1) return (
                          <td key="break" style={{ background: "hsl(var(--muted))", borderRight: "2px solid #e8a02044", borderLeft: "2px solid #e8a02044", borderBottom: last ? "none" : brd, textAlign: "center", verticalAlign: "middle", padding: "4px 0" }}>
                            <span style={{ color: "#e8a020", fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", display: "inline-block" }}>BREAK</span>
                          </td>
                        );

                        const mine = myCell(day, n);
                        const other = !mine ? anyCell(day, n) : null;
                        const col = mine ? (colOf[mine.courseName!] ?? PALETTE[0]) : null;

                        if (mine) return (
                          <td key={n}
                            style={{ background: col! + "22", borderRight: brd, borderBottom: last ? "none" : brd, borderTop: `2px solid ${col}`, padding: "8px", verticalAlign: "top", cursor: "pointer", transition: "opacity 0.15s" }}
                            onClick={() => navigate("/teacher/attendance", { state: { slot: { ...mine } } })}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
                            <p style={{ color: col!, fontSize: 11, fontWeight: 800, lineHeight: 1.3, margin: 0 }}>{mine.courseName}</p>
                            <p style={{ color: col! + "bb", fontSize: 10, fontWeight: 600, marginTop: 2 }}>{mine.courseCode}</p>
                            {mine.noofgroups && <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, marginTop: 2 }}>Grp {mine.noofgroups}</p>}
                            <p style={{ color: col!, fontSize: 9, fontWeight: 700, marginTop: 4, opacity: 0.9 }}>▶ Mark Attendance</p>
                          </td>
                        );

                        if (other) return (
                          <td key={n} style={{ background: "hsl(var(--muted))", borderRight: brd, borderBottom: last ? "none" : brd, padding: "8px", verticalAlign: "top", opacity: 0.38 }}>
                            <p style={{ color: "hsl(var(--foreground))", fontSize: 10, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>{other.courseName}</p>
                            <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, marginTop: 2 }}>{other.teacherName}</p>
                          </td>
                        );

                        return (
                          <td key={n} style={{ background: "hsl(var(--card))", borderRight: brd, borderBottom: last ? "none" : brd, padding: 0, verticalAlign: "middle" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, opacity: 0.1, fontSize: 16, color: "hsl(var(--muted-foreground))" }}>—</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          {Object.keys(colOf).length > 0 && (
            <div style={{ padding: "12px 24px", borderTop: brd, display: "flex", flexWrap: "wrap", gap: "8px 24px", alignItems: "center" }}>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", width: "100%", marginBottom: 2 }}>Your Subjects</p>
              {Object.entries(colOf).map(([name, colour]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: colour, width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
                  <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}>{name}</span>
                </div>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 10, color: "hsl(var(--muted-foreground))", opacity: 0.45 }}>Dimmed = other teachers</span>
            </div>
          )}

        </div>
      </div>
    </RoleShell>
  );
}





