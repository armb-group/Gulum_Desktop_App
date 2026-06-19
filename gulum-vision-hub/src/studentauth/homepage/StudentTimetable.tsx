import { RoleShell } from "@/components/RoleShell";
import { useStudentScheduleById } from "@/services/studentRoutineAPI";

const DAY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Monday:    { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700" },
  Tuesday:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700" },
  Wednesday: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
  Thursday:  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  Friday:    { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  Saturday:  { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700" },
  Sunday:    { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
};

const StudentTimetable = () => {
  const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
  const studentId = user?.id ?? "";

  const { data: schedule = [], isLoading, isError } = useStudentScheduleById(studentId);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <RoleShell role="student" title="Full Timetable">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Weekly Timetable</h1>
          <span className="text-sm text-muted-foreground font-medium">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm p-4">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            Loading timetable...
          </div>
        )}

        {isError && (
          <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-xl">
            Failed to load timetable. Please try again later.
          </div>
        )}

        {!isLoading && !isError && schedule.map(({ day, periods }) => {
          const isToday = day === today;
          const colors = DAY_COLORS[day] ?? { bg: "bg-muted", border: "border-border", text: "text-foreground" };

          return (
            <div
              key={day}
              className={`border rounded-xl overflow-hidden ${isToday ? `${colors.border} shadow-md` : "border-border"}`}
            >
              {/* Day Header */}
              <div className={`flex items-center justify-between px-4 py-3 ${isToday ? colors.bg : "bg-muted/40"}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black uppercase tracking-wide ${isToday ? colors.text : "text-foreground"}`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                      TODAY
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {periods.length === 0 ? "Free day" : `${periods.length} class${periods.length !== 1 ? "es" : ""}`}
                </span>
              </div>

              {/* Periods */}
              {periods.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-4 text-muted-foreground text-sm">
                  ☕ No classes scheduled
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {periods.map((p, idx) => (
                    <div key={p.id ?? idx} className="flex items-start justify-between px-4 py-3 hover:bg-muted/20 transition">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{p.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.teacher}
                          {p.code ? ` · ${p.code}` : ""}
                          {p.classroom ? ` · ${p.classroom}` : ""}
                        </p>
                      </div>
                      <span className={`ml-4 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${isToday ? `${colors.bg} ${colors.text} ${colors.border}` : "bg-muted text-muted-foreground border-border"}`}>
                        {p.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {!isLoading && !isError && schedule.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            No timetable data available.
          </div>
        )}
      </div>
    </RoleShell>
  );
};

export default StudentTimetable;