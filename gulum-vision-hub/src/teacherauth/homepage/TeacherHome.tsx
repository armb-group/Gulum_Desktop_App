import { Link } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertCircle,
  CalendarDays,
  Search,
  ChevronRight,
  Users,
  Sparkles,
  Play,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const notifications = [
  {
    icon: AlertCircle,
    iconCls: "bg-destructive/10 text-destructive",
    title: "3 students below 75% attendance in DBMS",
    time: "2h ago",
  },
  {
    icon: CalendarDays,
    iconCls: "bg-purple-soft text-purple",
    title: "PTM scheduled for 28 July — Hall B",
    time: "5h ago",
  },
];

const todaysClasses = [
  { time: "09:00–10:00", subject: "DBMS", details: "BCA Sem 4 · Room 204", count: 42 },
  { time: "11:00–12:00", subject: "OS", details: "BCA Sem 4 · Room 101", count: 38 },
  { time: "14:00–15:00", subject: "Web Dev", details: "BCA Sem 6 · Room 305", count: 35 },
];

const TeacherHome = () => {
  return (
    <RoleShell role="teacher" title="Welcome, Teacher" showDate>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search classes, subjects, students..."
          className="h-12 pl-11 rounded-2xl bg-muted/60 border-transparent"
        />
      </div>

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold tracking-widest mb-2">
          <Bell className="h-4 w-4" /> NOTIFICATIONS
        </div>
        <Card className="p-3 bg-surface border-border space-y-2">
          {notifications.map((n) => (
            <div key={n.title} className="flex items-start gap-3 p-2 rounded-xl">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${n.iconCls}`}>
                <n.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.time}</p>
              </div>
            </div>
          ))}
          <button className="w-full text-center text-primary text-sm font-semibold py-2">
            Show All (4) →
          </button>
        </Card>
      </section>

      {/* Today's Classes */}
      <section>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold tracking-widest mb-2">
          <CalendarDays className="h-4 w-4" /> TODAY'S CLASSES
        </div>
        <Card className="p-3 bg-surface border-border space-y-2">
          {todaysClasses.map((c) => (
            <Link
              to="/teacher/attendance"
              key={c.subject}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40"
            >
              <span className="text-xs font-bold text-primary bg-brand-soft rounded-xl px-3 py-2 whitespace-nowrap">
                {c.time}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground">{c.subject}</p>
                <p className="text-xs text-muted-foreground">{c.details}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-brand-soft rounded-xl px-2.5 py-1.5">
                <Users className="h-3 w-3" /> {c.count}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
          <Link
            to="/teacher/dashboard"
            className="block text-center text-primary text-sm font-semibold py-2"
          >
            View Full Timetable →
          </Link>
        </Card>
      </section>

      {/* Attendance Summary */}
      <section>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold tracking-widest mb-2">
          ATTENDANCE SUMMARY
        </div>
        <Card className="p-4 bg-surface border-border">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">Today's Overall</p>
            <p className="text-success font-bold text-2xl">78%</p>
          </div>
          <Progress value={78} className="h-2 mt-2 [&>div]:bg-success" />
          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            <div className="rounded-xl bg-success-soft py-3">
              <p className="font-bold text-success text-xl">32</p>
              <p className="text-xs text-success">Present</p>
            </div>
            <div className="rounded-xl bg-destructive/10 py-3">
              <p className="font-bold text-destructive text-xl">9</p>
              <p className="text-xs text-destructive">Absent</p>
            </div>
            <div className="rounded-xl bg-warning-soft py-3">
              <p className="font-bold text-warning text-xl">3</p>
              <p className="text-xs text-warning">Late</p>
            </div>
            <div className="rounded-xl bg-muted py-3">
              <p className="font-bold text-foreground text-xl">44</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          <Link
            to="/teacher/dashboard"
            className="block text-center text-primary text-sm font-semibold py-2 mt-2"
          >
            View Detailed Insights →
          </Link>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="text-primary text-xs font-semibold tracking-widest mb-2">⚡ QUICK ACTIONS</div>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="h-20 rounded-2xl flex-col gap-1">
            <Link to="/teacher/attendance">
              <Play className="h-5 w-5" />
            <span className="font-semibold">Start Attendance</span>
            </Link>
          </Button>
          <Button
            variant="secondary"
            className="h-20 rounded-2xl flex-col gap-1 bg-purple-soft text-purple hover:bg-purple-soft/80"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">AI Assistant</span>
          </Button>
        </div>
      </section>
    </RoleShell>
  );
};

export default TeacherHome;
