import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { AlertCircle, CalendarDays, Users, FileCheck, Bell } from "lucide-react";

const notes = [
  { icon: AlertCircle, cls: "bg-destructive/10 text-destructive", title: "3 students below 75% attendance in DBMS", time: "2h ago" },
  { icon: CalendarDays, cls: "bg-purple-soft text-purple", title: "PTM scheduled for 28 July — Hall B", time: "5h ago" },
  { icon: Users, cls: "bg-info-soft text-info", title: "New enrollment: 4 students added to OS", time: "1d ago" },
  { icon: FileCheck, cls: "bg-success-soft text-success", title: "12 assignments submitted in Data Structures", time: "1d ago" },
];

const TeacherNotifications = () => (
  <RoleShell role="teacher" title="Notifications" subtitle="All updates from your institution">
    <Card className="p-3 bg-surface border-border space-y-1">
      {notes.map((n, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${n.cls}`}>
            <n.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{n.title}</p>
            <p className="text-xs text-muted-foreground">{n.time}</p>
          </div>
        </div>
      ))}
    </Card>
  </RoleShell>
);

export default TeacherNotifications;
