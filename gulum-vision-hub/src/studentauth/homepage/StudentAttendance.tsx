import { useState } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, ChevronDown, Calendar } from "lucide-react";
import { useStudentAttendance } from "@/services/studentAttendanceAPI";
import AttendanceCalendarModal from "./AttendanceCalendarModal";

const subjects = [
  { code: "CS301 · Prof. A. Sharma", name: "DBMS", value: 82, attended: 28, total: 34, color: "bg-primary text-primary-foreground" },
  { code: "CS302 · Prof. B. Roy", name: "Operating System", value: 60, attended: 21, total: 35, color: "bg-info text-info-foreground", low: true },
  { code: "CS303 · Prof. C. Das", name: "Web Development", value: 91, attended: 32, total: 35, color: "bg-success text-success-foreground" },
];

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { data } = useStudentAttendance();
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | null>(null);

 const overallAttendance =
  data?.length
    ? Math.round(
        data.reduce(
          (sum, item) => sum + item.attendancePercentage,
          0
        ) / data.length
      )
    : 0;

const totalAttended =
  data?.reduce(
    (sum, item) => sum + item.presentCount,
    0
  ) || 0;

const totalClasses =
  data?.reduce(
    (sum, item) => sum + item.totalClasses,
    0
  ) || 0;

const lowSubjects =
  data?.filter(
    (item) => item.attendancePercentage < 75
  ).length || 0;
  return (
    <RoleShell role="student" title="My Attendance" subtitle="Subject-wise attendance record">
      <button
        onClick={() => navigate(-1)}
        className="text-primary font-semibold flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Card className="p-4 bg-surface border-border">
        <div className="flex justify-between items-center">
        <p className="text-lg font-semibold text-foreground">Overall Attendance</p>
          <p className={`text-2xl font-bold ${overallAttendance < 75 ? "text-destructive" : "text-success"}`}>{overallAttendance}%</p>
        </div>
        <Progress
          value={overallAttendance}
          className={`h-2 mt-2 [&>div]:${overallAttendance < 75 ? "bg-destructive" : "bg-success"}`}
        />
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div>
            <p className="text-xl text-success font-bold">{totalAttended}</p>
            <p className="text-xs text-muted-foreground">Classes Attended</p>
          </div>
          <div>
            <p className="text-xl text-foreground font-bold">{totalClasses}</p>
            <p className="text-xs text-muted-foreground">Total Classes</p>
          </div>
          <div>
            <p className="text-xl text-destructive font-bold">{lowSubjects}</p>
            <p className="text-xs text-muted-foreground">Low Subjects</p>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl bg-destructive/10 text-destructive p-3 m-2 flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-5 w-5" /> {lowSubjects} subjects below 75% — risk of detention!
      </div>

      <div className="space-y-3">
        {data?.map((s, index) => (
          <Card key={index} className="overflow-hidden border-transparent">
            <div className={`p-4 ${s.color}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base font-semibold">{s.courseName}</p>
                  <p className="text-sm opacity-80">{s.courseCode}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {s.attendancePercentage < 75 && (
                      <span className="inline-block text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded">
                        LOW
                      </span>
                    )}
                    <p className="text-lg font-bold">{s.attendancePercentage}%</p>
                  </div>
                  <button 
                    onClick={() => setSelectedCourse({ id: s.courseId || s.courseCode, name: s.courseName })}
                    className="flex items-center justify-center p-2 rounded-full hover:bg-black/20 transition-colors bg-black/10"
                    title="View Calendar"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface p-3">
              <Progress
                value={s.attendancePercentage}
                className={`h-2 [&>div]:${s.attendancePercentage < 75 ? "bg-destructive" : "bg-success"}`}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {s.presentCount}/{s.totalClasses} classes attended
              </p>
            </div>
          </Card>
        ))}
      </div>

      <AttendanceCalendarModal 
        isOpen={!!selectedCourse} 
        onClose={() => setSelectedCourse(null)} 
        courseId={selectedCourse?.id || ""} 
        courseName={selectedCourse?.name || ""} 
      />
    </RoleShell>
  );
};

export default StudentAttendance;
