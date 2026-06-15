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
  getProgress,

} from "@/services/lectureAuditAPI";

type StudentSubject = {
  classId?: string;
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
     id?: string;
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

type TrackingRecord = {
  id?: string;
  syllabusMasterId?: string;
  progressPercentage?: number;
  trackingStatus?: string;
};

type ModuleTrackingStatus = {
  moduleId?: string;
  status?: string;
};

type ProgressRecord = {
  moduleId?: string;
  hoursCompleted?: number;
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
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [selectedTrackingId, setSelectedTrackingId] = useState("");
  const { data: apiSubjects, isLoading: isMastersLoading } = useStudentMasters();
  const { data: moduleData } = useStudentModules(selectedCourseCode);
  const { data: trackingStatus } = useStudentTrackingStatus(selectedTrackingId);
  const { data: progressData } = getProgress(selectedTrackingId);
  const [selectedClassId, setSelectedClassId] = useState("");
  const { data: trackingAll } = useStudentTrackingAll(selectedClassId);

  const navigate = useNavigate();

  const subjects = apiSubjects ?? [];

  useEffect(() => {
    if (apiSubjects?.length > 0 && !selectedClassId) {
      const firstSubject = apiSubjects[0];

      setSelectedClassId(firstSubject.classId ?? "");
    }
  }, [apiSubjects, selectedClassId]);
  useEffect(() => {
    console.log("selectedCourseCode changed:", selectedCourseCode);
  }, [selectedCourseCode]);

  useEffect(() => {
    console.log("moduleData changed:", moduleData);
  }, [moduleData]);

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
        {(subjects ?? []).map((t: StudentSubject, i: number) => {
          const trackingRecord = trackingAll?.find(
            (item: TrackingRecord) => item.syllabusMasterId === t.id
          );


          const pct = trackingRecord?.progressPercentage ?? 0;

          return (
            <div key={i} className="flex-1 rounded-2xl border border-border bg-surface p-3 flex flex-col items-center">
              <span className="text-primary font-extrabold text-xl">{pct}%</span>
              <span className="text-muted-foreground text-xs mt-1 text-center">{t.name ?? t.courseName ?? t.syllabusName}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {subjects.map((subject: StudentSubject, si: number) => {
          const isOpen = expandedIdx === si;

          const trackingRecord = trackingAll?.find(
            (item: TrackingRecord) => item.syllabusMasterId === subject.id
          );

          const pct = trackingRecord?.progressPercentage ?? 0;

          const subjectModules =
            isOpen && selectedCourseCode === subject.courseCode
              ? (moduleData?.modules ?? moduleData ?? [])
              : [];
          
          const trackingStatusLabel =
            trackingRecord?.trackingStatus ?? "";
          return (
            <Card key={si} className="p-5 bg-surface border-border">
              <button
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => {
                  const opening = expandedIdx !== si;

                  setExpandedIdx(opening ? si : null);

                  if (opening) {
                    const trackingRecord = trackingAll?.find(
                      (item: TrackingRecord) => item.syllabusMasterId === subject.id
                    );
                    setSelectedCourseCode(subject.courseCode ?? "");
                    setSelectedTrackingId(trackingRecord?.id ?? "");
                    setSelectedClassId(subject.classId ?? "");
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-lg truncate">{subject.name ?? subject.syllabusName ?? subject.courseName}</p>
                  <p className="text-sm text-muted-foreground">{subject.courseCode}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-primary font-bold text-sm">{pct}% completed</span>
                  {trackingStatusLabel ? <span className="text-muted-foreground text-xs">{trackingStatusLabel}</span> : null}
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              <Progress value={pct} className="h-2 mt-3 [&>div]:bg-primary" />

              {isOpen && (
                <div className="mt-4 space-y-3">

                  {(subjectModules ?? []).map((mod, mi) => {
                  
const progressRecord = progressData?.progress?.find(
  (p: ProgressRecord) => p.moduleId === mod.id
);

const modCompleted = progressRecord?.hoursCompleted ?? 0;

const modTotal = mod.expectedHours ?? mod.totalHours ?? 0;
console.log("mod.id", mod.id);
console.log("progressData", progressData);
const done =
  trackingStatus?.find(
    (s: ModuleTrackingStatus) => s.moduleId === mod.id
  )?.status === "COMPLETED";
const modPct =
  modTotal > 0
    ? Math.round((modCompleted / modTotal) * 100)
    : 0;


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
