import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import {
  useStudentMasters,
  useStudentModules,
  useStudentTrackingStatus,
  useStudentTrackingAll,
} from "@/services/lectureAuditAPI";

type StudentSubject = {
  name?: string;
  semester?: string;
  totalCompleted?: number;
  totalHours?: number;
  completedHours?: number;
  expectedHours?: number;
  courseName?: string;
  syllabusName?: string;
  courseCode?: string;
  trackingId?: string;
  id?: string;
  modules: Array<{
    title?: string;
    moduleTitle?: string;
    completed?: number;
    total?: number;
    completedHours?: number;
    totalHours?: number;
    expectedHours?: number;
    topics?: string[];
  }>;
};

const STATIC_SUBJECTS = [
  {
    name: "DBMS", semester: "BCA Sem 4", totalCompleted: 28, totalHours: 48,
    modules: [
      { title: "Module 1: Introduction to DBMS", completed: 5, total: 5, topics: ["Database Concepts", "ER Model", "Relational Model"] },
      { title: "Module 2: SQL Basics", completed: 8, total: 8, topics: ["DDL Commands", "DML Commands", "Constraints"] },
      { title: "Module 3: Joins & Queries", completed: 4, total: 6, topics: ["Inner Join", "Outer Join", "Subqueries"] },
      { title: "Module 4: Normalization", completed: 3, total: 7, topics: ["1NF, 2NF", "3NF, BCNF"] },
    ],
  },
  {
    name: "Operating System", semester: "BCA Sem 4", totalCompleted: 20, totalHours: 40,
    modules: [
      { title: "Module 1: OS Basics", completed: 8, total: 10, topics: ["Process", "Threads", "CPU Scheduling"] },
      { title: "Module 2: Memory Management", completed: 12, total: 15, topics: ["Paging", "Segmentation", "Virtual Memory"] },
    ],
  },
  {
    name: "Web Development", semester: "BCA Sem 4", totalCompleted: 20, totalHours: 45,
    modules: [
      { title: "Module 1: HTML & CSS", completed: 6, total: 8, topics: ["HTML5", "CSS3", "Flexbox"] },
      { title: "Module 2: JavaScript", completed: 5, total: 10, topics: ["ES6+", "DOM", "Events"] },
      { title: "Module 3: React Basics", completed: 3, total: 10, topics: ["Components", "Props", "State"] },
    ],
  },
];

export default function StudentLectureAudit() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [selectedTrackingId, setSelectedTrackingId] = useState("");
  const { data: apiSubjects, isLoading: isMastersLoading } = useStudentMasters();
  const { data: moduleData } = useStudentModules(selectedCourseCode);
  const { data: trackingStatus } = useStudentTrackingStatus(selectedTrackingId);
  const { data: trackingAll } = useStudentTrackingAll(selectedTrackingId);
  const navigate = useNavigate();

  const subjects: StudentSubject[] = apiSubjects ?? STATIC_SUBJECTS;

  useEffect(() => {
    if (apiSubjects?.length > 0) {
      const firstSubject = apiSubjects[0];
      setSelectedCourseCode(firstSubject.courseCode ?? "");
      setSelectedTrackingId(firstSubject.trackingId ?? firstSubject.id ?? "");
    }
  }, [apiSubjects]);

  return (
    <RoleShell role="student" title="Lecture Progress" subtitle="Your syllabus coverage">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2 gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      {isMastersLoading && (
        <p className="text-muted-foreground text-sm mb-4">Loading subjects…</p>
      )}
      {/* Mini summary cards */}
      <div className="flex gap-3 mb-6">
        {subjects.map((s: StudentSubject, i: number) => {
          const completed = s.totalCompleted ?? s.completedHours ?? 0;
          const hours = s.totalHours ?? s.expectedHours ?? 1;
          const pct = Math.round((completed / hours) * 100);
          return (
            <div key={i} className="flex-1 rounded-2xl border border-border bg-surface p-3 flex flex-col items-center">
              <span className="text-primary font-extrabold text-xl">{pct}%</span>
              <span className="text-muted-foreground text-xs mt-1 text-center">{s.name ?? s.courseName ?? s.syllabusName}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {subjects.map((subject: StudentSubject, si: number) => {
          const isOpen = expandedIdx === si;
          const completed = subject.totalCompleted ?? subject.completedHours ?? 0;
          const hours = subject.totalHours ?? subject.expectedHours ?? 1;
          const pct = Math.round((completed / hours) * 100);
          const subjectModules = moduleData?.modules ?? moduleData ?? subject.modules;
          const subjectTrackingId = subject.trackingId ?? subject.id ?? selectedTrackingId;
          const trackedItems = trackingAll?.items ?? trackingAll?.modules ?? [];
          const trackingStatusLabel = trackingStatus?.status ?? trackingAll?.status;

          return (
            <Card key={si} className="p-5 bg-surface border-border">
              <button
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => setExpandedIdx(isOpen ? null : si)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-lg truncate">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">{subject.semester}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-primary font-bold text-sm">{subject.totalCompleted}/{subject.totalHours} hrs</span>
                  {trackingStatusLabel ? <span className="text-muted-foreground text-xs">{trackingStatusLabel}</span> : null}
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              <Progress value={pct} className="h-2 mt-3 [&>div]:bg-primary" />

              {isOpen && (
                <div className="mt-4 space-y-3">
                  {subjectTrackingId && trackingStatusLabel ? (
                    <div className="rounded-xl border border-border bg-background p-4 mb-3">
                      <p className="text-sm font-semibold text-foreground mb-2">Tracking Info</p>
                      <p className="text-sm text-muted-foreground">Status: {trackingStatusLabel}</p>
                      <p className="text-sm text-muted-foreground">Total tracked items: {Array.isArray(trackedItems) ? trackedItems.length : "-"}</p>
                    </div>
                  ) : null}
                  {(subjectModules ?? []).map((mod, mi) => {
                    const modCompleted = mod.completed ?? mod.completedHours ?? 0;
                    const modTotal = mod.total ?? mod.totalHours ?? mod.expectedHours ?? 1;
                    const modPct = Math.round((modCompleted / modTotal) * 100);
                    const done = modCompleted >= modTotal;
                    return (
                      <div key={mi} className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {done
                            ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                          }
                          <span className="font-semibold text-foreground flex-1">{mod.title ?? mod.moduleTitle}</span>
                        </div>
                        <p className="text-primary font-semibold text-sm mb-2">{modCompleted}/{modTotal} hrs completed</p>
                        <Progress value={modPct} className="h-1.5 [&>div]:bg-primary" />
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(mod.topics ?? []).map((t, ti) => (
                            <span key={ti} className="bg-brand-soft text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-lg">
                              {t}
                            </span>
                          ))}
                        </div>
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
