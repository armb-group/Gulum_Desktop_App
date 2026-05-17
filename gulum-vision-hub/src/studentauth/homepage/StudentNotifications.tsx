import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { AlertCircle, CalendarDays, Award, FileText } from "lucide-react";

const notes = [
  { icon: AlertCircle, cls: "bg-destructive/10 text-destructive", title: "Your OS attendance is below 75%", time: "2h ago" },
  { icon: CalendarDays, cls: "bg-purple-soft text-purple", title: "PTM on 28 July, 10:00 AM — Hall B", time: "5h ago" },
  { icon: Award, cls: "bg-success-soft text-success", title: "You scored 18/20 in Linked List Assignment", time: "1d ago" },
  { icon: FileText, cls: "bg-info-soft text-info", title: "New assignment posted: Binary Tree Traversal", time: "2d ago" },
];

const StudentNotifications = () => (
  <RoleShell role="student" title="Notifications" subtitle="All your updates">
    <Card className="p-3 bg-surface border-border space-y-1">
      {notes.map((n, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${n.cls}`}>
            <n.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{n.title}</p>
            <p className="text-xs text-muted-foreground italic">{n.time}</p>
          </div>
        </div>
      ))}
    </Card>
  </RoleShell>
);

export default StudentNotifications;
