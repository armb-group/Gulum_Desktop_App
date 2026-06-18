import { useMemo } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileDown, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetTeacherSchedule } from "@/services/scheduleAPI";

const DEFAULT_SLOT_TIME_MAP: Record<number, { startTime: string; endTime: string }> = {
  1: { startTime: "09:30", endTime: "10:20" },
  2: { startTime: "10:20", endTime: "11:10" },
  3: { startTime: "11:10", endTime: "12:00" },
  4: { startTime: "12:00", endTime: "12:50" },
  5: { startTime: "01:40", endTime: "02:30" },
  6: { startTime: "02:30", endTime: "03:20" },
  7: { startTime: "03:20", endTime: "04:10" },
  8: { startTime: "04:10", endTime: "05:00" },
};

const DAY_ORDER = ["MON", "TUES", "WED", "THURS", "FRI"];
const DAY_LABELS: Record<string, string> = {
  MON: "Monday", TUES: "Tuesday", WED: "Wednesday", THURS: "Thursday", FRI: "Friday",
};
const DAY_COLORS: Record<string, string> = {
  MON: "bg-day-mon", TUES: "bg-day-tue", WED: "bg-day-wed", THURS: "bg-day-thu", FRI: "bg-day-fri",
};

const getSubjectColor = (subject: string) => {
  if (!subject) return "bg-muted/30 text-muted-foreground border border-dashed border-border/60";
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-l-4 border-l-rose-500",
    "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-l-4 border-l-indigo-500",
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-l-4 border-l-amber-500",
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-l-4 border-l-emerald-500",
    "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-l-4 border-l-cyan-500",
    "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-l-4 border-l-purple-500",
    "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-l-4 border-l-orange-500",
  ];
  return colors[Math.abs(hash) % colors.length];
};

const TeacherTimetable = () => {
  const { user } = useAuth();
  const teacherId = user?.id ?? "";

  const { data: scheduleData, isLoading, isError } = useGetTeacherSchedule(teacherId, { enabled: !!teacherId });

  // Flatten all timeslots from all assigned classes into a lookup: day+slot → slot info
  const { timetable, slotTimeMap } = useMemo(() => {
    const classes = scheduleData?.classes ?? scheduleData?.responseData?.classes ?? [];
    const flat: any[] = [];

    classes.forEach((cls: any) => {
      const className = cls.className ?? "";
      const semester  = cls.semester ?? "";
      const slots = cls.timeslot ?? cls.timeslots ?? [];
      slots.forEach((s: any) => {
        flat.push({ ...s, className, semester });
      });
    });

    // Build dynamic slot time map from actual data
    const map = { ...DEFAULT_SLOT_TIME_MAP };
    flat.forEach((s: any) => {
      if (s.slotNumber && s.startTime) map[s.slotNumber] = { startTime: s.startTime, endTime: s.endTime };
    });

    return { timetable: flat, slotTimeMap: map };
  }, [scheduleData]);

  const leftSlots  = [1, 2, 3, 4].map(n => ({ n, ...slotTimeMap[n] }));
  const rightSlots = [5, 6, 7, 8].map(n => ({ n, ...slotTimeMap[n] }));

  const getCell = (dayShort: string, slotNumber: number) => {
    const fullDay = DAY_LABELS[dayShort];
    return timetable.find((s: any) =>
      String(s.day).toLowerCase() === fullDay.toLowerCase() &&
      s.slotNumber === slotNumber &&
      s.occupied
    ) ?? null;
  };

  const teacherName = user?.name ?? "";

  return (
    <RoleShell role="teacher" title="My Timetable" subtitle="Your weekly class schedule">

      {isLoading ? (
        <Card className="p-12 rounded-3xl flex flex-col items-center justify-center min-h-[300px] border-border">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Loading your timetable…</p>
        </Card>
      ) : isError || !scheduleData ? (
        <Card className="p-12 rounded-3xl border-dashed border-border flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
          <BookOpen className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">No timetable found.</p>
          <p className="text-xs text-muted-foreground">Your schedule may not be configured yet. Contact the admin.</p>
        </Card>
      ) : timetable.length === 0 ? (
        <Card className="p-12 rounded-3xl border-dashed border-border flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
          <BookOpen className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">No classes scheduled yet.</p>
          <p className="text-xs text-muted-foreground">Your timetable will appear here once assigned by the admin.</p>
        </Card>
      ) : (
        <Card className="p-4 md:p-6 rounded-3xl bg-surface border-border overflow-x-auto">
          <div className="flex items-center justify-between mb-5 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {teacherName ? `${teacherName}'s Schedule` : "Weekly Schedule"}
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                Academic Timetable · All Assigned Classes
              </p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1.5" onClick={() => window.print()}>
              <FileDown className="h-3.5 w-3.5" /> Print
            </Button>
          </div>

          <table className="w-full min-w-[700px] border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40">
                <th className="p-2 border border-border font-bold text-foreground text-center w-16">Day</th>
                {leftSlots.map(s => (
                  <th key={s.n} className="p-2 border border-border font-bold text-center">
                    <div className="text-foreground">{s.startTime}–{s.endTime}</div>
                    <div className="text-[10px] text-muted-foreground">Slot {s.n}</div>
                  </th>
                ))}
                <th className="p-2 border border-border text-center w-10 bg-orange-50/30 dark:bg-orange-950/10">
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400" style={{ writingMode: "vertical-rl" }}>BREAK</span>
                </th>
                {rightSlots.map(s => (
                  <th key={s.n} className="p-2 border border-border font-bold text-center">
                    <div className="text-foreground">{s.startTime}–{s.endTime}</div>
                    <div className="text-[10px] text-muted-foreground">Slot {s.n}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_ORDER.map(day => (
                <tr key={day} className="hover:bg-muted/10">
                  <td className={`p-2 border border-border font-extrabold text-center text-foreground ${DAY_COLORS[day]}`}>
                    {day}
                  </td>
                  {leftSlots.map(s => {
                    const cell = getCell(day, s.n);
                    return (
                      <td key={s.n} className="p-1 border border-border align-top min-h-[60px]">
                        {cell ? (
                          <div className={`rounded-xl p-2 h-full text-xs font-semibold ${getSubjectColor(cell.courseName ?? "")}`}>
                            <p className="font-black leading-tight">{cell.courseName}</p>
                            {cell.courseCode  && <p className="opacity-70 text-[10px] mt-0.5">{cell.courseCode}</p>}
                            {cell.className   && <p className="opacity-60 text-[10px]">{cell.className}{cell.semester ? ` · Sem ${cell.semester}` : ""}</p>}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-14 text-[10px] text-muted-foreground/40 font-semibold">—</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-1 border border-border bg-orange-50/10 dark:bg-orange-950/10" />
                  {rightSlots.map(s => {
                    const cell = getCell(day, s.n);
                    return (
                      <td key={s.n} className="p-1 border border-border align-top min-h-[60px]">
                        {cell ? (
                          <div className={`rounded-xl p-2 h-full text-xs font-semibold ${getSubjectColor(cell.courseName ?? "")}`}>
                            <p className="font-black leading-tight">{cell.courseName}</p>
                            {cell.courseCode  && <p className="opacity-70 text-[10px] mt-0.5">{cell.courseCode}</p>}
                            {cell.className   && <p className="opacity-60 text-[10px]">{cell.className}{cell.semester ? ` · Sem ${cell.semester}` : ""}</p>}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-14 text-[10px] text-muted-foreground/40 font-semibold">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </RoleShell>
  );
};

export default TeacherTimetable;
