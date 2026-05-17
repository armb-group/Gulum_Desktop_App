import { useState } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Status = "present" | "late" | "absent" | null;

const initial = [
  { name: "Aarav Sharma", roll: "BCA001" },
  { name: "Priya Patel", roll: "BCA002" },
  { name: "Rahul Verma", roll: "BCA003" },
  { name: "Sneha Singh", roll: "BCA004" },
  { name: "Vikram Joshi", roll: "BCA005" },
  { name: "Kavita Rao", roll: "BCA006" },
  { name: "Rohit Mehta", roll: "BCA007" },
  { name: "Anjali Gupta", roll: "BCA008" },
  { name: "Suresh Nair", roll: "BCA009" },
];

const TeacherAttendance = () => {
  const [marks, setMarks] = useState<Record<string, Status>>({});

  const setStatus = (roll: string, status: Status) =>
    setMarks((m) => ({ ...m, [roll]: status }));

  const submit = () => {
    const filled = Object.values(marks).filter(Boolean).length;
    toast.success(`Attendance saved for ${filled}/${initial.length} students`);
  };

  return (
    <RoleShell role="teacher" title="Mark Attendance" subtitle="DBMS · BCA Sem 4 · Room 204">
      <div className="space-y-3">
        {initial.map((s) => {
          const status = marks[s.roll] ?? null;
          return (
            <Card key={s.roll} className="p-4 bg-surface border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground truncate">{s.name}</p>
                  <p className="text-sm text-muted-foreground">Roll: {s.roll}</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-xs mb-1",
                      status === "present" && "text-success",
                      status === "late" && "text-warning",
                      status === "absent" && "text-destructive",
                      !status && "text-muted-foreground"
                    )}
                  >
                    {status ? status[0].toUpperCase() + status.slice(1) : "Not Marked"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(s.roll, "present")}
                      aria-label="Present"
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-white transition",
                        status === "present"
                          ? "bg-success ring-2 ring-success/40"
                          : "bg-success/80 hover:bg-success"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setStatus(s.roll, "late")}
                      aria-label="Late"
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-white transition",
                        status === "late"
                          ? "bg-warning ring-2 ring-warning/40"
                          : "bg-warning/80 hover:bg-warning"
                      )}
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setStatus(s.roll, "absent")}
                      aria-label="Absent"
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-white transition",
                        status === "absent"
                          ? "bg-destructive ring-2 ring-destructive/40"
                          : "bg-destructive/80 hover:bg-destructive"
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Button onClick={submit} className="w-full h-14 rounded-full text-lg font-display">
        Submit Attendance
      </Button>
    </RoleShell>
  );
};

export default TeacherAttendance;
