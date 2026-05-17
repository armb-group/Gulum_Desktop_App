import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, ChevronDown } from "lucide-react";

const subjects = [
  { code: "CS301 · Prof. A. Sharma", name: "DBMS", value: 82, attended: 28, total: 34, color: "bg-primary text-primary-foreground" },
  { code: "CS302 · Prof. B. Roy", name: "Operating System", value: 60, attended: 21, total: 35, color: "bg-info text-info-foreground", low: true },
  { code: "CS303 · Prof. C. Das", name: "Web Development", value: 91, attended: 32, total: 35, color: "bg-success text-success-foreground" },
];

const StudentAttendance = () => {
  const navigate = useNavigate();
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
          <p className="text-xl text-foreground">Overall Attendance</p>
          <p className="text-3xl text-success font-bold italic">77%</p>
        </div>
        <Progress value={77} className="h-2 mt-2 [&>div]:bg-success" />
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div>
            <p className="text-2xl text-success font-bold">95</p>
            <p className="text-xs text-muted-foreground italic">Classes Attended</p>
          </div>
          <div>
            <p className="text-2xl text-foreground font-bold">124</p>
            <p className="text-xs text-muted-foreground italic">Total Classes</p>
          </div>
          <div>
            <p className="text-2xl text-destructive font-bold">2</p>
            <p className="text-xs text-muted-foreground italic">Low Subjects</p>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl bg-destructive/10 text-destructive p-3 flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-5 w-5" /> 2 subjects below 75% — risk of detention!
      </div>

      <div className="space-y-3">
        {subjects.map((s) => (
          <Card key={s.name} className="overflow-hidden border-transparent">
            <div className={`p-4 ${s.color}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-display italic">{s.name}</p>
                  <p className="text-sm opacity-90 italic">{s.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold italic">{s.value}%</p>
                  {s.low && (
                    <span className="inline-block text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded">
                      LOW
                    </span>
                  )}
                  <ChevronDown className="h-5 w-5 inline-block ml-1" />
                </div>
              </div>
            </div>
            <div className="bg-surface p-3">
              <Progress value={s.value} className="h-2 [&>div]:bg-success" />
              <p className="text-xs text-muted-foreground italic mt-2">
                {s.attended}/{s.total} classes attended
              </p>
            </div>
          </Card>
        ))}
      </div>
    </RoleShell>
  );
};

export default StudentAttendance;
