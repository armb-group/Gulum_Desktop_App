import { RoleShell } from "@/components/RoleShell";
import { useStudentRoutine } from "@/services/studentRoutineAPI";

const StudentTimetable = () => {
  const user = JSON.parse(
    localStorage.getItem("gulum-user") || "null"
  );

  


  const { data: routine = [] } = useStudentRoutine(
    user?.institutionId,
    user?.departmentId,
    user?.classId
  );

  

  return (
    <RoleShell role="student" title="Full Timetable">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          Weekly Timetable
        </h1>

        {Object.entries(
  routine.reduce((acc: any, item: any) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {})
).map(([day, classes]: any) => (
  <div
    key={day}
    className="border rounded-xl p-4"
  >
    <h2 className="text-lg font-semibold mb-4">
      {day}
    </h2>

    {classes.map((r: any, index: number) => (
      <div
        key={index}
        className="flex justify-between py-2 border-b last:border-b-0"
      >
        <div>
          <p className="font-semibold">
            {r.subject}
          </p>
          <p className="text-sm text-muted-foreground">
            {r.teacher}
          </p>
        </div>

        <div className="text-right">
          <p>{r.time}</p>
        </div>
      </div>
    ))}
  </div>
))}
      </div>
    </RoleShell>
  );
};

export default StudentTimetable;