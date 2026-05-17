import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const syllabus = [
  { title: "DBMS — Module 3: Joins", value: 60, label: "6/10 hrs" },
  { title: "OS — Module 2: Memory Mgmt", value: 80, label: "8/10 hrs" },
  { title: "Web Dev — Module 1: HTML/CSS", value: 40, label: "4/10 hrs" },
];

const attendance = [
  { subject: "DBMS", value: 82, color: "bg-success", text: "text-success" },
  { subject: "OS", value: 68, color: "bg-destructive", text: "text-destructive" },
  { subject: "Web Dev", value: 91, color: "bg-success", text: "text-success" },
];

const StudentDashboard = () => (
  <RoleShell role="student" title="Student">
    <Card className="p-4 bg-surface border-border">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl text-foreground">Syllabus Coverage</h3>
          <p className="text-sm text-muted-foreground italic">Your syllabus coverage</p>
        </div>
      </div>
      <div className="space-y-3">
        {syllabus.map((m) => (
          <div key={m.title}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-foreground">{m.title}</span>
              <span className="text-primary font-bold italic">{m.label}</span>
            </div>
            <Progress value={m.value} className="h-2 [&>div]:bg-primary" />
          </div>
        ))}
      </div>
      <Button className="w-full h-12 rounded-full mt-4 font-display italic">
        View Full Progress →
      </Button>
    </Card>

    <Card className="p-4 bg-surface border-border">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-14 w-14 rounded-2xl bg-success-soft flex items-center justify-center">
          <BarChart3 className="h-7 w-7 text-success" />
        </div>
        <div>
          <h3 className="text-2xl text-foreground">My Attendance</h3>
          <p className="text-sm text-muted-foreground italic">Subject-wise overview</p>
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
      <Button asChild className="w-full h-12 rounded-full mt-4 font-display italic">
        <Link to="/student/attendance">View Attendance Details →</Link>
      </Button>
    </Card>
  </RoleShell>
);

export default StudentDashboard;
