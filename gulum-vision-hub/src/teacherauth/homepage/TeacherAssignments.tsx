import { useState } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText, Plus, Trash2, Calendar, Star, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  due: string;
  pts: number;
  status: "Submitted" | "Pending" | "Graded";
}

const subjects = [
  {
    name: "Data Structures",
    code: "CS301 · Prof. A. Sharma",
    color: "bg-primary text-primary-foreground",
    badge: "bg-primary-foreground/20",
    due: 1,
    open: true,
    items: [
      { id: "1", title: "Linked List Implementation", due: "Dec 20, 2024", pts: 20, status: "Submitted" as const },
      { id: "2", title: "Binary Tree Traversal", due: "Dec 28, 2024", pts: 25, status: "Pending" as const },
    ],
  },
  {
    name: "Operating Systems",
    code: "CS302 · Prof. B. Roy",
    color: "bg-info text-info-foreground",
    badge: "bg-black/30",
    due: 1,
    open: false,
    items: [],
  },
  {
    name: "Database Management",
    code: "CS303 · Prof. C. Das",
    color: "bg-success text-success-foreground",
    badge: "bg-black/30",
    due: 2,
    open: false,
    items: [],
  },
  {
    name: "Computer Networks",
    code: "CS304 · Prof. D. Ghosh",
    color: "bg-purple text-white",
    badge: "bg-black/30",
    due: 0,
    open: false,
    items: [],
  },
];

const TeacherAssignments = () => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(
    Object.fromEntries(subjects.map((s) => [s.name, s.open]))
  );

  return (
    <RoleShell role="teacher" title="Assignments" subtitle="Manage course assignments">
      {subjects.map((s) => {
        const open = openIds[s.name];
        return (
          <Card key={s.name} className="overflow-hidden border-transparent">
            <button
              onClick={() => setOpenIds((o) => ({ ...o, [s.name]: !o[s.name] }))}
              className={`w-full flex items-center justify-between p-4 ${s.color}`}
            >
              <div className="text-left">
                <p className="text-xl font-display italic">{s.name}</p>
                <p className="text-sm opacity-90 italic">{s.code}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.due > 0 && (
                  <span className={`${s.badge} text-xs font-semibold px-3 py-1 rounded-full italic`}>
                    {s.due} due
                  </span>
                )}
                <ChevronDown
                  className={cn("h-5 w-5 transition-transform", open && "rotate-180")}
                />
              </div>
            </button>

            {open && s.items.length > 0 && (
              <div className="p-3 space-y-3 bg-surface">
                {s.items.map((a) => (
                  <Card key={a.id} className="p-3 bg-muted/30 border-border relative">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-soft text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground">{a.title}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1 italic">
                            <Calendar className="h-3 w-3" /> Due {a.due}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1 italic">
                            <Star className="h-3 w-3" /> {a.pts} pts
                          </span>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-semibold mt-2 px-2.5 py-1 rounded-full italic",
                            a.status === "Submitted" && "text-success bg-success-soft",
                            a.status === "Pending" && "text-destructive bg-destructive/10"
                          )}
                        >
                          <Circle className="h-2 w-2 fill-current" /> {a.status}
                        </span>
                      </div>
                      <button
                        aria-label="Delete"
                        className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
                <button className="w-full border-2 border-dashed border-primary/50 text-primary rounded-xl py-3 font-semibold flex items-center justify-center gap-2 italic">
                  <Plus className="h-4 w-4" /> Add Assignment
                </button>
              </div>
            )}
          </Card>
        );
      })}
    </RoleShell>
  );
};

export default TeacherAssignments;
