import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const week = [
  {
    day: "Monday",
    bg: "bg-day-mon",
    classes: [
      { time: "09:00–10:00", subject: "DBMS", room: "BCA Sem 4 · Room 204" },
      { time: "11:00–12:00", subject: "OS", room: "BCA Sem 4 · Room 101" },
    ],
  },
  {
    day: "Tuesday",
    bg: "bg-day-tue",
    classes: [
      { time: "10:00–11:00", subject: "Maths", room: "BCA Sem 4 · Room 102" },
      { time: "13:00–14:00", subject: "Physics", room: "BCA Sem 4 · Room 203" },
    ],
  },
  {
    day: "Wednesday",
    bg: "bg-day-wed",
    classes: [{ time: "09:00–10:00", subject: "Web Dev", room: "BCA Sem 4 · Room 305" }],
  },
  {
    day: "Thursday",
    bg: "bg-day-thu",
    classes: [{ time: "11:00–12:00", subject: "OS", room: "BCA Sem 4 · Room 101" }],
  },
  {
    day: "Friday",
    bg: "bg-day-fri",
    classes: [{ time: "14:00–15:00", subject: "DBMS", room: "BCA Sem 4 · Room 204" }],
  },
];

const modules = [
  { title: "Module 1: Introduction", value: 60, label: "6/10 hrs" },
  { title: "Module 2: SQL Basics", value: 80, label: "8/10 hrs" },
  { title: "Module 3: Joins & Queries", value: 30, label: "3/10 hrs" },
];

const TeacherDashboard = () => {
  return (
    <RoleShell role="teacher" title="Teacher">
      <h2 className="text-xl font-bold text-foreground">Weekly Timetable</h2>

      <div className="space-y-3">
        {week.map((d) => (
          <Card key={d.day} className={`${d.bg} border-transparent p-4`}>
            <p className="font-bold text-foreground mb-3">{d.day}</p>
            <div className="space-y-3">
              {d.classes.map((c) => (
                <div key={c.subject + c.time} className="flex gap-4">
                  <span className="text-xs font-bold text-primary whitespace-nowrap pt-1 w-20">
                    {c.time}
                  </span>
                  <div>
                    <p className="font-bold text-foreground">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">{c.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Button className="w-full h-11 rounded-xl font-semibold">
        View Full Timetable
      </Button>

      <Card className="p-4 bg-surface border-border">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Lecture Auditing</h3>
            <p className="text-sm text-muted-foreground">Track lecture progress</p>
          </div>
        </div>
        <div className="space-y-3">
          {modules.map((m) => (
            <div key={m.title}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-foreground">{m.title}</span>
                <span className="text-primary font-bold">{m.label}</span>
              </div>
              <Progress value={m.value} className="h-2 [&>div]:bg-primary" />
            </div>
          ))}
        </div>
        <Button asChild className="w-full h-11 rounded-xl mt-4 font-semibold">
          <Link to="/teacher/lecture-audit">View Audit Details →</Link>
        </Button>
      </Card>
    </RoleShell>
  );
};

export default TeacherDashboard;
