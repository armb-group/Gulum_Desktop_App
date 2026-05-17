import { Link } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  Sparkles,
  Calendar,
  User,
  Users,
  Bell,
  AlertCircle,
} from "lucide-react";

const tiles = [
  { label: "My Attendance", icon: BarChart3, to: "/student/attendance" },
  { label: "AI Assistant", icon: Sparkles, to: "/student" },
  { label: "Timetable", icon: Calendar, to: "/student/dashboard" },
  { label: "Profile", icon: User, to: "/student/profile" },
];

const notifications = [
  { icon: AlertCircle, cls: "bg-destructive/10 text-destructive", title: "Your OS attendance is below 75%", time: "2h ago" },
  { icon: Calendar, cls: "bg-purple-soft text-purple", title: "PTM on 28 July, 10:00 AM — Hall B", time: "5h ago" },
];

const StudentHome = () => {
  return (
    <RoleShell role="student" title="Welcome, Student" showDate>
      <section className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className="rounded-2xl bg-brand-soft text-brand-soft-foreground p-5 flex flex-col items-center text-center gap-2 hover:opacity-90 transition"
          >
            <div className="h-12 w-12 rounded-2xl bg-background/60 flex items-center justify-center">
              <t.icon className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold text-primary">{t.label}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold tracking-widest mb-2">
          <Users className="h-4 w-4" /> UPCOMING PTM
        </div>
        <Card className="p-4 bg-surface border-border">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-purple-soft text-purple flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-display italic text-foreground">Parent-Teacher Meeting</p>
              <p className="text-sm text-muted-foreground italic">28 July 2025 · 10:00 AM</p>
              <p className="text-sm text-muted-foreground italic">Hall B</p>
            </div>
            <span className="text-xs font-semibold text-purple bg-purple-soft px-3 py-1 rounded-full">
              SOON
            </span>
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold tracking-widest mb-2">
          <Bell className="h-4 w-4" /> NOTIFICATIONS
        </div>
        <Card className="p-3 bg-surface border-border space-y-2">
          {notifications.map((n) => (
            <div key={n.title} className="flex items-start gap-3 p-2 rounded-xl">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${n.cls}`}>
                <n.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground italic">{n.time}</p>
              </div>
            </div>
          ))}
          <Link
            to="/student/notifications"
            className="block text-center text-primary text-sm font-semibold py-2"
          >
            Show All (4) →
          </Link>
        </Card>
      </section>
    </RoleShell>
  );
};

export default StudentHome;
