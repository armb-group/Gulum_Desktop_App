import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  ArrowLeft, AlertTriangle, Loader2, BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

// ── API calls (exact endpoints per spec) ──────────────────────────────────────

// Step 1: GET /schedule/teacher/{teacherId}
const fetchTeacherSchedule = async (teacherId: string) => {
  const { data } = await api.get(`/schedule/teacher/${encodeURIComponent(teacherId)}`);
  return data?.responseData ?? data;
};

// Step 2: GET /api/module/{courseCode}
const fetchCourseModules = async (courseCode: string) => {
  const { data } = await api.get(`/api/module/${encodeURIComponent(courseCode)}`);
  return data?.responseData ?? data;
};

// Step 3: GET /api/tracking/all/{classId}
const fetchTrackingAll = async (classId: string) => {
  const { data } = await api.get(`/api/tracking/all/${encodeURIComponent(classId)}`);
  return data?.responseData ?? data;
};

// Step 4: GET /api/progress/{trackingId}
const fetchProgress = async (trackingId: string) => {
  const { data } = await api.get(`/api/progress/${encodeURIComponent(trackingId)}`);
  return data?.responseData ?? data;
};

// Step 5: GET /module/status/{trackingId}
const fetchModuleStatus = async (trackingId: string) => {
  const { data } = await api.get(`/module/status/${encodeURIComponent(trackingId)}`);
  return data?.responseData ?? data;
};

// ── Types ─────────────────────────────────────────────────────────────────────
type ClassCourse = {
  classId: string;
  courseCode: string;
  courseName: string;
  className: string;
  semester: string | number;
};

// ── Sub-component: renders one expanded subject card ─────────────────────────
const SubjectDetail = ({ cc }: { cc: ClassCourse }) => {
  // Step 2: modules
  const { data: modulesRaw } = useQuery({
    queryKey: ["teacher-modules", cc.courseCode],
    queryFn:  () => fetchCourseModules(cc.courseCode),
    enabled:  !!cc.courseCode,
    staleTime: 5 * 60 * 1000,
  });

  // Step 3: tracking
  const { data: trackingRaw } = useQuery({
    queryKey: ["teacher-tracking", cc.classId],
    queryFn:  () => fetchTrackingAll(cc.classId),
    enabled:  !!cc.classId,
    staleTime: 5 * 60 * 1000,
  });

  const trackingList = Array.isArray(trackingRaw) ? trackingRaw
    : Array.isArray(trackingRaw?.responseData) ? trackingRaw.responseData
    : Array.isArray(trackingRaw?.data) ? trackingRaw.data
    : [];

  const trackingRecord = trackingList.find((t: any) =>
    t.courseCode === cc.courseCode ||
    t.course?.courseCode === cc.courseCode ||
    t.syllabusMasterId === cc.courseCode
  ) ?? null;

  const trackingId = String(trackingRecord?.id ?? trackingRecord?.trackingId ?? "");

  // Step 4: progress
  const { data: progressRaw } = useQuery({
    queryKey: ["teacher-progress", trackingId],
    queryFn:  () => fetchProgress(trackingId),
    enabled:  !!trackingId,
    staleTime: 5 * 60 * 1000,
  });

  // Step 5: module status
  const { data: statusRaw } = useQuery({
    queryKey: ["teacher-module-status", trackingId],
    queryFn:  () => fetchModuleStatus(trackingId),
    enabled:  !!trackingId,
    staleTime: 5 * 60 * 1000,
  });

  const modules: any[] = Array.isArray(modulesRaw) ? modulesRaw
    : Array.isArray(modulesRaw?.modules) ? modulesRaw.modules
    : Array.isArray(modulesRaw?.responseData) ? modulesRaw.responseData
    : [];

  const progressList: any[] = Array.isArray(progressRaw) ? progressRaw
    : Array.isArray(progressRaw?.progress) ? progressRaw.progress
    : Array.isArray(progressRaw?.responseData) ? progressRaw.responseData
    : [];

  const statusList: any[] = Array.isArray(statusRaw) ? statusRaw
    : Array.isArray(statusRaw?.statuses) ? statusRaw.statuses
    : Array.isArray(statusRaw?.responseData) ? statusRaw.responseData
    : [];

  if (modules.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No module data available for this course.</p>;
  }

  return (
    <div className="space-y-3 mt-4">
      {modules.map((mod: any, mi: number) => {
        const progressRecord = progressList.find((p: any) => p.moduleId === mod.id || p.moduleId === mod.moduleId);
        const modCompleted = progressRecord?.hoursCompleted ?? progressRecord?.completedHours ?? 0;
        const modTotal     = mod.expectedHours ?? mod.totalHours ?? 0;
        const done         = statusList.find((s: any) => s.moduleId === mod.id || s.moduleId === mod.moduleId)?.status === "COMPLETED";
        const modPct       = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;
        const topics: any[] = Array.isArray(mod.topics) ? mod.topics : [];

        return (
          <div key={mod.id ?? mi} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              {done
                ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              }
              <span className="font-semibold text-foreground flex-1">
                {mod.moduleTitle ?? mod.title ?? `Module ${mi + 1}`}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${done ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                {done ? "Completed" : "In Progress"}
              </span>
            </div>
            <p className="text-primary font-semibold text-sm mb-2">
              {modCompleted}/{modTotal} hrs delivered · {modPct}% covered
            </p>
            <Progress value={modPct} className="h-1.5 [&>div]:bg-primary" />
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {topics.map((t: any, ti: number) => {
                  const label = typeof t === "object" ? (t.name ?? t.title ?? "") : String(t);
                  if (!label) return null;
                  return (
                    <span key={ti} className="bg-brand-soft text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-lg">
                      {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Sub-component: one subject card with progress summary ─────────────────────
const SubjectCard = ({ cc, index, expandedIdx, setExpandedIdx }: {
  cc: ClassCourse;
  index: number;
  expandedIdx: number | null;
  setExpandedIdx: (i: number | null) => void;
}) => {
  const isOpen = expandedIdx === index;

  const { data: trackingRaw } = useQuery({
    queryKey: ["teacher-tracking", cc.classId],
    queryFn:  () => fetchTrackingAll(cc.classId),
    enabled:  !!cc.classId,
    staleTime: 5 * 60 * 1000,
  });

  const trackingList = Array.isArray(trackingRaw) ? trackingRaw
    : Array.isArray(trackingRaw?.responseData) ? trackingRaw.responseData
    : Array.isArray(trackingRaw?.data) ? trackingRaw.data
    : [];

  const trackingRecord = trackingList.find((t: any) =>
    t.courseCode === cc.courseCode ||
    t.course?.courseCode === cc.courseCode ||
    t.syllabusMasterId === cc.courseCode
  ) ?? null;

  const pct       = trackingRecord?.progressPercentage  ?? 0;
  const completed = trackingRecord?.completedModules     ?? 0;
  const total     = trackingRecord?.totalModules         ?? 0;
  const status    = trackingRecord?.trackingStatus       ?? "";
  const low       = pct > 0 && pct < 60;

  return (
    <Card className="p-5 bg-surface border-border rounded-3xl">
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setExpandedIdx(isOpen ? null : index)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-lg truncate">{cc.courseName}</p>
          <p className="text-sm text-muted-foreground">
            {cc.courseCode} · {cc.className}{cc.semester ? ` · Sem ${cc.semester}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {low && <AlertTriangle className="h-4 w-4 text-warning" />}
          <span className="text-primary font-bold text-sm">{pct}%</span>
          <span className="text-muted-foreground font-semibold text-sm">{completed}/{total} modules</span>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <Progress value={pct} className="h-2 mt-3 [&>div]:bg-primary" />

      {status ? <p className="text-xs text-muted-foreground mt-1">{status}</p> : null}

      {low && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive px-3 py-2 text-xs font-semibold mt-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Syllabus coverage below 60% — needs attention!
        </div>
      )}

      {isOpen && <SubjectDetail cc={cc} />}
    </Card>
  );
};

// ── Mini summary card ─────────────────────────────────────────────────────────
const SummaryCard = ({ cc, isSelected, onClick }: { cc: ClassCourse; isSelected: boolean; onClick: () => void }) => {
  const { data: trackingRaw } = useQuery({
    queryKey: ["teacher-tracking", cc.classId],
    queryFn:  () => fetchTrackingAll(cc.classId),
    enabled:  !!cc.classId,
    staleTime: 5 * 60 * 1000,
  });

  const trackingList = Array.isArray(trackingRaw) ? trackingRaw
    : Array.isArray(trackingRaw?.responseData) ? trackingRaw.responseData
    : Array.isArray(trackingRaw?.data) ? trackingRaw.data
    : [];

  const trackingRecord = trackingList.find((t: any) =>
    t.courseCode === cc.courseCode ||
    t.course?.courseCode === cc.courseCode ||
    t.syllabusMasterId === cc.courseCode
  ) ?? null;

  const pct = trackingRecord?.progressPercentage ?? 0;

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 min-w-[110px] rounded-2xl border p-3 flex flex-col items-center transition-all ${
        isSelected
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-surface border-border hover:border-primary/40"
      }`}
    >
      <span className={`font-extrabold text-xl ${isSelected ? "text-primary-foreground" : "text-primary"}`}>
        {pct}%
      </span>
      <span className={`text-xs mt-1 text-center leading-tight ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {cc.courseName}
      </span>
      <span className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
        {cc.className}
      </span>
    </button>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TeacherLectureAudit() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const teacherId = user?.id ?? "";

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Step 1: GET /schedule/teacher/{teacherId}
  const { data: scheduleData, isLoading, isError } = useQuery({
    queryKey: ["teacher-schedule", teacherId],
    queryFn:  () => fetchTeacherSchedule(teacherId),
    enabled:  !!teacherId,
    staleTime: 5 * 60 * 1000,
  });

  // Extract unique classId+courseCode pairs
  const classCourses: ClassCourse[] = (() => {
    const classes = scheduleData?.classes ?? scheduleData?.responseData?.classes ?? [];
    const pairs: ClassCourse[] = [];
    const seen = new Set<string>();
    classes.forEach((cls: any) => {
      const classId   = String(cls.classesId ?? cls.classId ?? "");
      const className = cls.className ?? "Class";
      const semester  = cls.semester ?? "";
      (cls.timeslot ?? cls.timeslots ?? []).forEach((slot: any) => {
        if (!slot.courseCode) return;
        const key = `${classId}::${slot.courseCode}`;
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ classId, courseCode: slot.courseCode, courseName: slot.courseName ?? slot.courseCode, className, semester });
        }
      });
    });
    return pairs;
  })();

  return (
    <RoleShell role="teacher" title="Lecture Audit" subtitle="Your teaching progress & syllabus coverage">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2 gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {isLoading && (
        <div className="flex items-center gap-3 py-16 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading your assigned classes…</span>
        </div>
      )}

      {!isLoading && (isError || classCourses.length === 0) && (
        <Card className="p-10 rounded-3xl border-dashed border-border flex flex-col items-center justify-center text-center gap-3">
          <BookOpen className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">No assigned classes found.</p>
          <p className="text-xs text-muted-foreground">Your schedule may not be configured yet. Contact the admin.</p>
        </Card>
      )}

      {!isLoading && classCourses.length > 0 && (
        <>
          {/* Mini summary cards */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
            {classCourses.map((cc, i) => (
              <SummaryCard
                key={`${cc.classId}::${cc.courseCode}`}
                cc={cc}
                isSelected={selectedIdx === i}
                onClick={() => { setSelectedIdx(i); setExpandedIdx(null); }}
              />
            ))}
          </div>

          {/* Subject cards */}
          <div className="space-y-4">
            {classCourses.map((cc, i) => (
              <SubjectCard
                key={`${cc.classId}::${cc.courseCode}`}
                cc={cc}
                index={i}
                expandedIdx={expandedIdx}
                setExpandedIdx={setExpandedIdx}
              />
            ))}
          </div>
        </>
      )}
    </RoleShell>
  );
}
