import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useStudentSyllabus } from "@/services/lectureAuditAPI";

const STATIC_SYLLABUS = [
  { name: "DBMS", totalCompleted: 28, totalHours: 48 },
  { name: "Operating System", totalCompleted: 20, totalHours: 40 },
  { name: "Web Development", totalCompleted: 20, totalHours: 45 },
];

const attendance = [
  { subject: "DBMS", value: 82, color: "bg-success", text: "text-success" },
  { subject: "OS", value: 68, color: "bg-destructive", text: "text-destructive" },
  { subject: "Web Dev", value: 91, color: "bg-success", text: "text-success" },
];

const StudentDashboard = () => {
  const { data: apiSubjects } = useStudentSyllabus();
  const subjects = apiSubjects ?? STATIC_SYLLABUS;

  return (
    <RoleShell role="student" title="Student">
      <Card className="p-4 bg-surface border-border">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Syllabus Coverage</h3>
            <p className="text-sm text-muted-foreground">Your syllabus coverage</p>
          </div>
        </div>
        <div className="space-y-3">
          {subjects.map((s: any) => {
            const pct = Math.round((s.totalCompleted / s.totalHours) * 100);
            return (
              <div key={s.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-foreground">{s.name}</span>
                  <span className="text-primary font-semibold">{s.totalCompleted}/{s.totalHours} hrs</span>
                </div>
                <Progress value={pct} className="h-2 [&>div]:bg-primary" />
              </div>
            );
          })}
        </div>
        <Button asChild className="w-full h-11 rounded-xl mt-4 font-semibold">
          <Link to="/student/lecture-audit">View Full Progress →</Link>
        </Button>
      </Card>

      <Card className="p-4 bg-surface border-border">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-14 w-14 rounded-2xl bg-success-soft flex items-center justify-center">
            <BarChart3 className="h-7 w-7 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">My Attendance</h3>
            <p className="text-sm text-muted-foreground">Subject-wise overview</p>
          </div>
        </div>
        <div className="space-y-3">
          {attendance.map((a) => (
            <div key={a.subject} className="flex items-center gap-3">
              <span className="w-20 text-foreground">{a.subject}</span>
              <span className={`font-bold w-12 ${a.text}`}>{a.value}%</span>
              <Progress value={a.value} className={`h-2 flex-1 [&>div]:${a.color}`} />
            </div>
          ))}
        </div>
        <Button asChild className="w-full h-11 rounded-xl mt-4 font-semibold">
          <Link to="/student/attendance">View Attendance Details →</Link>
        </Button>
      </Card>
    </RoleShell>
  );
};

export default StudentDashboard;
