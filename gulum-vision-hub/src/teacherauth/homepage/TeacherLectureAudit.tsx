import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import {
  useSyllabusMasters,
  useSyllabusModules,
  useTracking,
} from "@/services/lectureAuditAPI";

const STATIC_MODULES = [
  { moduleTitle: "Module 1: Introduction", expectedHours: 10, completedHours: 10, totalHours: 10 },
  { moduleTitle: "Module 2: SQL Basics", expectedHours: 10, completedHours: 8, totalHours: 10 },
  { moduleTitle: "Module 3: Joins & Queries", expectedHours: 10, completedHours: 3, totalHours: 10 },
];

export default function TeacherLectureAudit() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [selectedMasterId, setSelectedMasterId] = useState("");

  const { data: subjects, isLoading } = useSyllabusMasters();
  const { data: trackingData } = useTracking({ classId: selectedClassId, courseCode: selectedCourseCode });
  const { data: moduleData } = useSyllabusModules(selectedMasterId);

  useEffect(() => {
    if (subjects?.length > 0) {
      setSelectedClassId(subjects[0].classId);
      setSelectedCourseCode(subjects[0].courseCode);
      setSelectedMasterId(subjects[0].courseCode);
    }
  }, [subjects]);

  const modules = moduleData?.modules ?? STATIC_MODULES;

  const navigate = useNavigate();

  return (
    <RoleShell role="teacher" title="Lecture Audit" subtitle="Track lecture progress">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2 gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      {isLoading && (
        <p className="text-muted-foreground text-sm">Loading subjects…</p>
      )}

      <div className="space-y-4">
        {(subjects ?? []).map((subject: any, si: number) => {
          const isOpen = expandedIdx === si;
          const pct = trackingData?.progressPercentage ?? 0;
          const completed = trackingData?.completedModules ?? 0;
          const total = trackingData?.totalModules ?? 0;

          return (
            <Card key={si} className="p-5 bg-surface border-border">
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => {
                  setExpandedIdx(isOpen ? null : si);
                  setSelectedClassId(subject.classId);
                  setSelectedCourseCode(subject.courseCode);
                  setSelectedMasterId(subject.courseCode);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-lg truncate">{subject.syllabusName}</p>
                  <p className="text-sm text-muted-foreground">{subject.semester}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-primary font-bold text-sm">{pct}%</span>
                  <span className="text-primary font-semibold text-sm">{completed}/{total} modules</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              <Progress value={pct} className="h-2 mt-3 [&>div]:bg-primary" />

              {/* Expanded modules */}
              {isOpen && (
                <div className="mt-4 space-y-3">
                  {modules.map((mod: any, mi: number) => {
                    const modPct = mod.totalHours > 0 ? Math.round((mod.completedHours / mod.totalHours) * 100) : 100;
                    const done = mod.completedHours >= mod.totalHours;
                    return (
                      <div key={mi} className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {done
                            ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                          }
                          <span className="font-semibold text-foreground flex-1">{mod.moduleTitle}</span>
                        </div>
                        <p className="text-primary font-semibold text-sm mb-2">{mod.expectedHours} hrs</p>
                        <Progress value={modPct} className="h-1.5 [&>div]:bg-primary" />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </RoleShell>
  );
}
