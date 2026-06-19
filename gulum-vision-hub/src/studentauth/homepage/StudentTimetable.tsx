import { useMemo } from "react";

// ── Hardcoded break slot ─────────────────────────────────────────────────────
const BREAK_SLOT = "12:50–13:40";
import { RoleShell } from "@/components/RoleShell";
import { useStudentScheduleById } from "@/services/studentRoutineAPI";

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_ABBR: Record<string, string> = {
  Monday: "MON",
  Tuesday: "TUES",
  Wednesday: "WED",
  Thursday: "THURS",
  Friday: "FRI",
  Saturday: "SAT",
  Sunday: "SUN",
};

const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SUBJECT_COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#8b5cf6", // violet
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseStartMinutes(time: string): number {
  const start = time.split(/[–\-]/)[0].trim();
  const [h, m] = start.split(":").map(Number);
  return h * 60 + (m || 0);
}

// ── Component ────────────────────────────────────────────────────────────────

const StudentTimetable = () => {
  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
  const studentId = user?.id ?? "";

  const {
    data: schedule = [],
    isLoading,
    isError,
  } = useStudentScheduleById(studentId);

  /* ── Sorted unique time slots (always includes the break slot) ── */
  const timeSlots = useMemo(() => {
    const set = new Set<string>();
    schedule.forEach((d) => d.periods.forEach((p) => set.add(p.time)));
    set.add(BREAK_SLOT); // always inject the break
    return Array.from(set).sort(
      (a, b) => parseStartMinutes(a) - parseStartMinutes(b)
    );
  }, [schedule]);

  /* ── Slot number label (skip break in numbering) ── */
  const slotIndex = useMemo(() => {
    const map: Record<string, number> = {};
    let n = 1;
    timeSlots.forEach((t) => {
      if (t !== BREAK_SLOT) map[t] = n++;
    });
    return map;
  }, [timeSlots]);

  /* ── Break slot is always the hardcoded one ── */
  const breakSlot = BREAK_SLOT;

  /* ── day → time → period lookup ── */
  const cellMap = useMemo(() => {
    const map: Record<
      string,
      Record<string, (typeof schedule)[0]["periods"][0]>
    > = {};
    schedule.forEach((d) => {
      map[d.day] = {};
      d.periods.forEach((p) => {
        map[d.day][p.time] = p;
      });
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
          colorMap[p.subject] =
            SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
          idx++;
        }
      })
    );
    return colorMap;
  }, [schedule]);

  /* ── Only render days present in the schedule ── */
  const activeDays = useMemo(
    () => DAYS_ORDER.filter((d) => schedule.some((s) => s.day === d)),
    [schedule]
  );

  const institution = user?.institution ?? "";
  const section = user?.section ?? "";
  const semester = user?.semester ?? "";

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <RoleShell role="student" title="My Timetable">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full inline-block" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading your timetable…
          </p>
        </div>
      </RoleShell>
    );
  }

  if (isError) {
    return (
      <RoleShell role="student" title="My Timetable">
        <div className="px-4 py-3 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive">
          Failed to load timetable. Please try again later.
        </div>
      </RoleShell>
    );
  }

  if (!schedule.length) {
    return (
      <RoleShell role="student" title="My Timetable">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center text-muted-foreground">
          <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-semibold">No timetable data available.</p>
        </div>
      </RoleShell>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <RoleShell role="student" title="My Timetable" wide>
      <div className="flex flex-col h-full gap-4 p-4 md:p-6 overflow-auto">

        {/* ── Page Header ── */}
        <div className="rounded-2xl border border-border bg-card px-6 py-4 text-center shrink-0">
          <h1 className="text-xl font-black tracking-tight text-primary">
            {institution || "My Timetable"}
          </h1>
          {(section || semester) && (
            <p className="text-[11px] font-bold tracking-widest uppercase mt-1 text-muted-foreground">
              {[
                `${new Date().getFullYear()}–${new Date().getFullYear() + 1}`,
                section ? `Section ${section}` : null,
                semester ? `Semester ${semester}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        {/* ── Timetable Grid — fills remaining space ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden flex-1">
          <table
            className="w-full h-full border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            {/* Column widths: narrow day col + equal-width slot cols */}
            <colgroup>
              <col style={{ width: "62px" }} />
              {timeSlots.map((slot) => (
                <col
                  key={slot}
                  style={{ width: slot === breakSlot ? "42px" : undefined }}
                />
              ))}
            </colgroup>

            {/* ── Header Row ── */}
            <thead>
              <tr>
                {/* DAY corner */}
                <th
                  className="text-center text-xs font-black tracking-widest uppercase px-1 py-3 text-muted-foreground bg-muted/60"
                  style={{ borderRight: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}
                >
                  DAY
                </th>

                {timeSlots.map((slot) => {
                  const isBreak = slot === breakSlot;
                  const [start, end] = slot.split(/[–\-]/);
                  return (
                    <th
                      key={slot}
                      className="text-center px-1 py-2"
                      style={{
                        backgroundColor: isBreak
                          ? "hsl(var(--primary) / 0.08)"
                          : "hsl(var(--muted) / 0.4)",
                        borderRight: "1px solid hsl(var(--border))",
                        borderBottom: "1px solid hsl(var(--border))",
                      }}
                    >
                      {isBreak ? (
                        <span className="text-xs font-black uppercase text-primary tracking-widest">
                          BREAK
                        </span>
                      ) : (
                        <>
                          <p className="text-xs font-black text-foreground leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                            {start?.trim()} - {end?.trim()}
                          </p>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                            (SLOT-{slotIndex[slot]})
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

                return (
                  <tr key={day}>
                    {/* Day label */}
                    <td
                      className="text-center text-sm font-black tracking-wider uppercase px-1 text-primary bg-muted/30"
                      style={{
                        borderRight: "1px solid hsl(var(--border))",
                        borderBottom: isLast ? "none" : "1px solid hsl(var(--border))",
                      }}
                    >
                      {DAY_ABBR[day] ?? day.slice(0, 3).toUpperCase()}
                    </td>

                    {timeSlots.map((slot) => {
                      const isBreak = slot === breakSlot;
                      const period = dayMap[slot];

                      /* Break column */
                      if (isBreak) {
                        return (
                          <td
                            key={slot}
                            className="text-center align-middle"
                            style={{
                              backgroundColor: "hsl(var(--primary) / 0.06)",
                              borderRight: "1px solid hsl(var(--border))",
                              borderBottom: isLast ? "none" : "1px solid hsl(var(--border))",
                              borderLeft: "2px solid hsl(var(--primary) / 0.3)",
                            }}
                          >
                            <span
                              className="text-[8px] font-black uppercase text-primary"
                              style={{
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                                letterSpacing: "0.12em",
                                display: "inline-block",
                              }}
                            >
                              BREAK
                            </span>
                          </td>
                        );
                      }

                      /* Class cell */
                      if (period) {
                        const color = subjectColor[period.subject] ?? "hsl(var(--primary))";
                        return (
                          <td
                            key={slot}
                            className="px-1.5 py-2 align-top"
                            style={{
                              backgroundColor: color + "14",
                              borderRight: "1px solid hsl(var(--border))",
                              borderBottom: isLast ? "none" : "1px solid hsl(var(--border))",
                              borderTop: `2px solid ${color}66`,
                            }}
                          >
                            <p
                              className="text-xs font-black leading-tight overflow-hidden"
                              style={{
                                color,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {period.subject}
                            </p>
                            {period.teacher && (
                              <p
                                className="text-[11px] font-bold mt-0.5 leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
                                style={{ color: color + "99" }}
                              >
                                {period.teacher}
                              </p>
                            )}
                            {period.classroom && (
                              <p className="text-[10px] font-semibold text-muted-foreground leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
                                {period.classroom}
                              </p>
                            )}
                          </td>
                        );
                      }

                      /* No class */
                      return (
                        <td
                          key={slot}
                          className="text-center align-middle"
                          style={{
                            backgroundColor: "hsl(var(--muted) / 0.2)",
                            borderRight: "1px solid hsl(var(--border))",
                            borderBottom: isLast ? "none" : "1px solid hsl(var(--border))",
                          }}
                        >
                          <span className="text-[9px] font-semibold text-muted-foreground/40">
                            No Class
                          </span>
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
          <div className="rounded-2xl border border-border bg-card px-5 py-3 shrink-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Subject Legend
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {Object.entries(subjectColor).map(([name, color]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RoleShell>
  );
};

export default StudentTimetable;