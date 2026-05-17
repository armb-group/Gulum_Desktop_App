import { useState } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  FileText,
  Paperclip,
  RotateCw,
  Star,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const subjects = [
  {
    name: "Data Structures",
    code: "CS301 · Prof. A. Sharma",
    color: "bg-primary text-primary-foreground",
    badge: "bg-primary-foreground/20",
    due: 1,
    open: true,
    items: [
      {
        id: "1",
        title: "Linked List Implementation",
        due: "Dec 20, 2024",
        pts: 20,
        status: "Submitted" as const,
        file: "linked_list.pdf",
      },
      {
        id: "2",
        title: "Binary Tree Traversal",
        due: "Dec 28, 2024",
        pts: 25,
        status: "Pending" as const,
      },
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

const StudentAssignments = () => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(
    Object.fromEntries(subjects.map((s) => [s.name, s.open]))
  );

  return (
    <RoleShell role="student" title="My Assignments" subtitle="3/7 submitted">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center bg-surface border-border">
          <Clock className="h-5 w-5 text-destructive mx-auto" />
          <p className="text-3xl font-bold text-foreground mt-1">4</p>
          <p className="text-xs text-muted-foreground italic">Pending</p>
        </Card>
        <Card className="p-3 text-center bg-surface border-border">
          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
          <p className="text-3xl font-bold text-foreground mt-1">2</p>
          <p className="text-xs text-muted-foreground italic">Submitted</p>
        </Card>
        <Card className="p-3 text-center bg-surface border-border">
          <Award className="h-5 w-5 text-info mx-auto" />
          <p className="text-3xl font-bold text-foreground mt-1">1</p>
          <p className="text-xs text-muted-foreground italic">Graded</p>
        </Card>
      </div>

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
                  <Card key={a.id} className="p-3 bg-muted/30 border-l-4 border-l-primary">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-soft text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground">{a.title}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground italic">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Due {a.due}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3" /> {a.pts} pts
                          </span>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-semibold mt-2 italic",
                            a.status === "Submitted" && "text-success",
                            a.status === "Pending" && "text-destructive"
                          )}
                        >
                          <Circle className="h-2 w-2 fill-current" /> {a.status}
                        </span>
                        {a.file && (
                          <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1 italic">
                            <Paperclip className="h-3 w-3" /> {a.file}
                          </p>
                        )}
                        <div className="mt-3">
                          {a.status === "Submitted" ? (
                            <Button
                              variant="outline"
                              className="rounded-full text-primary border-primary/30"
                              onClick={() => toast.success("Resubmission ready")}
                            >
                              <RotateCw className="h-4 w-4" /> Resubmit
                            </Button>
                          ) : (
                            <Button
                              className="rounded-full"
                              onClick={() => toast.success("Upload simulated")}
                            >
                              <Upload className="h-4 w-4" /> Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </RoleShell>
  );
};

export default StudentAssignments;
