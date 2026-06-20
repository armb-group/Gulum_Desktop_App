import { useMemo, useRef } from "react";
import { RoleShell } from "@/components/RoleShell";
import { useStudentScheduleById } from "@/services/studentRoutineAPI";

// ── Hardcoded break slot ──────────────────────────────────────────────────────
const BREAK_SLOT = "12:50–13:40";

// ── Day config: abbr + unique accent colour (matches the image) ───────────────
const DAY_CONFIG: Record<string, { abbr: string; bg: string; text: string }> = {
  Monday:    { abbr: "MON",   bg: "#5c1a1a", text: "#e88080" },
  Tuesday:   { abbr: "TUES",  bg: "#1a2a4c", text: "#80a8e8" },
  Wednesday: { abbr: "WED",   bg: "#1a3a1a", text: "#80c880" },
  Thursday:  { abbr: "THURS", bg: "#3a2800", text: "#e8c060" },
  Friday:    { abbr: "FRI",   bg: "#26163a", text: "#b080e8" },
  Saturday:  { abbr: "SAT",   bg: "#0d3030", text: "#60d0c8" },
  Sunday:    { abbr: "SUN",   bg: "#1a1a1a", text: "#a0a0a0" },
};

const DAYS_ORDER = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
];

// Subject colours (cycles)
const SUBJECT_COLORS = [
  "#f59e0b","#3b82f6","#22c55e","#a855f7",
  "#ef4444","#06b6d4","#f97316","#ec4899",
  "#14b8a6","#8b5cf6",
];

const THEME = {
  pageBg:
    "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)",
  cardBg: "hsl(var(--card))",
  cardText: "hsl(var(--card-foreground))",
  mutedBg: "hsl(var(--muted))",
  softBg: "hsl(var(--background) / 0.55)",
  border: "hsl(var(--border))",
  mutedText: "hsl(var(--muted-foreground))",
  buttonBg: "hsl(var(--secondary))",
  buttonText: "hsl(var(--secondary-foreground))",
  primary: "hsl(var(--primary))",
  warningBg: "hsl(var(--warning-soft))",
  warning: "hsl(var(--warning))",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseStartMinutes(time: string): number {
  const start = time.split(/[–\-]/)[0].trim();
  const [h, m] = start.split(":").map(Number);
  return h * 60 + (m || 0);
}

// ── Component ─────────────────────────────────────────────────────────────────
const StudentTimetable = () => {
  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
  const studentId = user?.id ?? "";
  const studentName: string = user?.name ?? user?.email ?? "Student";

  const {
    data: schedule = [],
    isLoading,
    isError,
  } = useStudentScheduleById(studentId);

  const printRef = useRef<HTMLDivElement>(null);

  /* ── Time slots (always inject break) ── */
  const timeSlots = useMemo(() => {
    const set = new Set<string>();
    schedule.forEach((d) => d.periods.forEach((p) => set.add(p.time)));
    set.add(BREAK_SLOT);
    return Array.from(set).sort(
      (a, b) => parseStartMinutes(a) - parseStartMinutes(b)
    );
  }, [schedule]);

  /* ── Slot numbers (skip break) ── */
  const slotIndex = useMemo(() => {
    const map: Record<string, number> = {};
    let n = 1;
    timeSlots.forEach((t) => { if (t !== BREAK_SLOT) map[t] = n++; });
    return map;
  }, [timeSlots]);

  /* ── day → time → period lookup ── */
  const cellMap = useMemo(() => {
    const map: Record<string, Record<string, (typeof schedule)[0]["periods"][0]>> = {};
    schedule.forEach((d) => {
      map[d.day] = {};
      d.periods.forEach((p) => { map[d.day][p.time] = p; });
    });
    return map;
  }, [schedule]);

  /* ── Stable color per subject ── */
  const subjectColor = useMemo(() => {
    const colorMap: Record<string, string> = {};
    let idx = 0;
    schedule.forEach((d) =>
      d.periods.forEach((p) => {
        if (p.subject && !colorMap[p.subject]) {
          colorMap[p.subject] = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
          idx++;
        }
      })
    );
    return colorMap;
  }, [schedule]);

  /* ── Only days present in schedule ── */
  const activeDays = useMemo(
    () => DAYS_ORDER.filter((d) => schedule.some((s) => s.day === d)),
    [schedule]
  );

  const handlePrint = () => window.print();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <RoleShell role="student" title="My Timetable" wide>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <span
            className="animate-spin w-10 h-10 rounded-full border-4 border-t-transparent inline-block"
            style={{ borderColor: "#e8a020", borderTopColor: "transparent" }}
          />
          <p style={{ color: "#808080", fontSize: 14 }}>Loading timetable…</p>
        </div>
      </RoleShell>
    );
  }

  if (isError) {
    return (
      <RoleShell role="student" title="My Timetable" wide>
        <div className="flex items-center justify-center h-full">
          <p style={{ color: "#ef4444", fontSize: 14 }}>
            Failed to load timetable. Please try again.
          </p>
        </div>
      </RoleShell>
    );
  }

  if (!schedule.length) {
    return (
      <RoleShell role="student" title="My Timetable" wide>
        <div className="flex flex-col items-center justify-center h-full gap-3"
          style={{ color: "#505050" }}>
          <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 600 }}>No timetable data available.</p>
        </div>
      </RoleShell>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <RoleShell role="student" title="My Timetable" wide>
      <div
        className="flex flex-col h-full p-4 md:p-6 overflow-auto"
        style={{ background: THEME.pageBg }}
      >
        {/* ── Outer Card ── */}
        <div
          ref={printRef}
          className="flex-1 rounded-2xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: THEME.cardBg,
            border: `1px solid ${THEME.border}`,
            color: THEME.cardText,
            minHeight: 0,
          }}
        >
          {/* ── Card Header ── */}
          <div
            className="flex items-start justify-between px-6 py-5"
            style={{ borderBottom: `1px solid ${THEME.border}` }}
          >
            <div>
              <h2
                className="font-black tracking-tight"
                style={{ color: THEME.cardText, fontSize: 20, lineHeight: 1.2 }}
              >
                {studentName}'s Schedule
              </h2>
              <p
                className="mt-1 font-bold uppercase tracking-widest"
                style={{ color: THEME.mutedText, fontSize: 11 }}
              >
                Academic Timetable · All Assigned Classes
              </p>
            </div>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all"
              style={{
                backgroundColor: THEME.buttonBg,
                border: `1px solid ${THEME.border}`,
                color: THEME.buttonText,
                fontSize: 13,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.primary;
                (e.currentTarget as HTMLButtonElement).style.color = THEME.primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border;
                (e.currentTarget as HTMLButtonElement).style.color = THEME.buttonText;
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
              </svg>
              Print
            </button>
          </div>

          {/* ── Timetable Grid ── */}
          <div className="flex-1 overflow-auto">
            <table
              className="w-full h-full border-collapse"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                {/* Day column */}
                <col style={{ width: 70 }} />
                {timeSlots.map((slot) => (
                  <col
                    key={slot}
                    style={{ width: slot === BREAK_SLOT ? 38 : undefined }}
                  />
                ))}
              </colgroup>

              {/* ── Header Row ── */}
              <thead>
                <tr>
                  {/* "Day" corner */}
                  <th
                    style={{
                      backgroundColor: THEME.mutedBg,
                      borderRight: `1px solid ${THEME.border}`,
                      borderBottom: `1px solid ${THEME.border}`,
                      color: THEME.mutedText,
                      fontSize: 11,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      textAlign: "center",
                      padding: "12px 4px",
                    }}
                  >
                    Day
                  </th>

                  {timeSlots.map((slot) => {
                    const isBreak = slot === BREAK_SLOT;
                    const [start, end] = slot.split(/[–\-]/);
                    return (
                      <th
                        key={slot}
                        style={{
                          backgroundColor: isBreak ? THEME.warningBg : THEME.mutedBg,
                          borderRight: `1px solid ${THEME.border}`,
                          borderBottom: `1px solid ${THEME.border}`,
                          textAlign: "center",
                          padding: "10px 4px",
                          verticalAlign: "middle",
                        }}
                      >
                        {isBreak ? (
                          <span
                            style={{
                              color: THEME.warning,
                              fontSize: 9,
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "0.15em",
                              writingMode: "vertical-rl",
                              textOrientation: "mixed",
                              display: "inline-block",
                            }}
                          >
                            BREAK
                          </span>
                        ) : (
                          <>
                            <p
                              style={{
                                color: THEME.cardText,
                                fontSize: 12,
                                fontWeight: 800,
                                lineHeight: 1.2,
                                margin: 0,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {start?.trim()}–{end?.trim()}
                            </p>
                            <p
                              style={{
                                color: THEME.mutedText,
                                fontSize: 10,
                                fontWeight: 700,
                                marginTop: 3,
                              }}
                            >
                              Slot {slotIndex[slot]}
                            </p>
                          </>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* ── Body ── */}
              <tbody>
                {activeDays.map((day, rowIdx) => {
                  const dayMap = cellMap[day] ?? {};
                  const isLast = rowIdx === activeDays.length - 1;
                  const dayCfg = DAY_CONFIG[day] ?? {
                    abbr: day.slice(0, 3).toUpperCase(),
                    bg: "#1e1e1e",
                    text: "#a0a0a0",
                  };

                  return (
                    <tr key={day}>
                      {/* Day label cell */}
                      <td
                        style={{
                          backgroundColor: dayCfg.bg,
                          borderRight: `1px solid ${THEME.border}`,
                          borderBottom: isLast ? "none" : `1px solid ${THEME.border}`,
                          textAlign: "center",
                          verticalAlign: "middle",
                          color: dayCfg.text,
                          fontSize: 12,
                          fontWeight: 900,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "0 4px",
                        }}
                      >
                        {dayCfg.abbr}
                      </td>

                      {timeSlots.map((slot) => {
                        const isBreak = slot === BREAK_SLOT;
                        const period = dayMap[slot];

                        /* ── Break cell ── */
                        if (isBreak) {
                          return (
                            <td
                              key={slot}
                              style={{
                                backgroundColor: THEME.warningBg,
                                borderRight: `2px solid ${THEME.warning}`,
                                borderLeft: `2px solid ${THEME.warning}`,
                                borderBottom: isLast ? "none" : `1px solid ${THEME.border}`,
                                textAlign: "center",
                                verticalAlign: "middle",
                                padding: "4px 0",
                              }}
                            >
                              <span
                                style={{
                                  color: THEME.warning,
                                  fontSize: 8,
                                  fontWeight: 900,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.15em",
                                  writingMode: "vertical-rl",
                                  textOrientation: "mixed",
                                  display: "inline-block",
                                }}
                              >
                                BREAK
                              </span>
                            </td>
                          );
                        }

                        /* ── Class cell ── */
                        if (period) {
                          const color =
                            subjectColor[period.subject] ?? "#e8a020";
                          return (
                            <td
                              key={slot}
                              style={{
                                backgroundColor: color + "16",
                                borderRight: `1px solid ${THEME.border}`,
                                borderBottom: isLast ? "none" : `1px solid ${THEME.border}`,
                                borderTop: `2px solid ${color}55`,
                                padding: "10px 8px",
                                verticalAlign: "top",
                              }}
                            >
                              <p
                                style={{
                                  color,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  lineHeight: 1.3,
                                  margin: 0,
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {period.subject}
                              </p>
                              {period.teacher && (
                                <p
                                  style={{
                                    color: color + "99",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    marginTop: 3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {period.teacher}
                                </p>
                              )}
                              {period.classroom && (
                                <p
                                  style={{
                                    color: THEME.mutedText,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    marginTop: 2,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {period.classroom}
                                </p>
                              )}
                            </td>
                          );
                        }

                        /* ── Empty cell ── */
                        return (
                          <td
                            key={slot}
                            style={{
                              backgroundColor: THEME.softBg,
                              borderRight: `1px solid ${THEME.border}`,
                              borderBottom: isLast ? "none" : `1px solid ${THEME.border}`,
                              textAlign: "center",
                              verticalAlign: "middle",
                              color: THEME.mutedText,
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            —
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Subject Legend ── */}
          {Object.keys(subjectColor).length > 0 && (
            <div
              className="px-6 py-3 flex flex-wrap gap-x-6 gap-y-2"
              style={{ borderTop: `1px solid ${THEME.border}` }}
            >
              <p
                style={{
                  color: THEME.mutedText,
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  width: "100%",
                  marginBottom: 2,
                }}
              >
                Subject Legend
              </p>
              {Object.entries(subjectColor).map(([name, color]) => (
                <div key={name} className="flex items-center gap-2">
                  <span
                    className="rounded-full shrink-0"
                    style={{ backgroundColor: color, width: 8, height: 8 }}
                  />
                  <span style={{ color: THEME.mutedText, fontSize: 11, fontWeight: 600 }}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleShell>
  );
};

export default StudentTimetable;
