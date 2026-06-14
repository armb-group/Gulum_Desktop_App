import { RoleShell } from "@/components/RoleShell";
import { useStudentRoutine } from "@/services/studentRoutineAPI";

const StudentTimetable = () => {
  const user = JSON.parse(
    localStorage.getItem("gulum-user") || "null"
  );

  
//console log
console.log("USER:", user);
console.log("institutionId:", user?.institutionId);
console.log("departmentId:", user?.departmentId);
console.log("classId:", user?.classId);

  const { data: routine = [] } = useStudentRoutine(
    user?.institutionId,
    user?.departmentId,
    user?.classId
  );
// Add this here console log
  console.log("ROUTINE DATA:", routine);
  

  return (
    <RoleShell role="student" title="Full Timetable">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          Weekly Timetable
        </h1>

        {routine.map((r: any, index: number) => (
          <div
            key={index}
            className="border rounded-xl p-4"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">
                  {r.subject}
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.teacher}
                </p>
              </div>

              <div className="text-right">
                <p>{r.day}</p>
                <p>{r.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </RoleShell>
  );
};

export default StudentTimetable;