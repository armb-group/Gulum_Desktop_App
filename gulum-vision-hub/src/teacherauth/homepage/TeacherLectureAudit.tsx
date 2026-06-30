import { useState, useEffect, useRef } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import {
  getCourseModules,
  getTrackingAll,
  getModuleStatus,
  progressApi,
} from "@/services/lectureAuditAPI";
import { getCourseOfferings } from "@/services/teacherCrudAPI";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CourseAudit {
  courseName: string;
  courseCode: string;
  className: string;
  semester: string | number;
  classId: string;
  trackingId?: string;
  progressPct: number;
  completedModules: number;
  totalModules: number;
  trackingStatus: string;
  modules: any[];
}

// ── Sub-component: expanded module list ───────────────────────────────────────
const SubjectDetail = ({ course }: { course: CourseAudit }) => {
  if (course.modules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No module data available for this course.
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {course.modules.map((mod: any, mi: number) => {
        // ── Completion flag (case-insensitive) ────────────────────────────
        const statusStr: string = String(mod.status ?? "").toUpperCase();
        const done = statusStr === "COMPLETED" || mod.completed === true;

        // ── Hours: try every field variant the backend might use ──────────
        const modCompleted: number =
          mod.hoursCompleted ??
          mod.completedHours ??
          mod.hoursDelivered ??
          mod.deliveredHours ??
          mod.lecturesDelivered ??
          mod.hours_completed ??
          // If status is COMPLETED but no hours recorded, synthesise full coverage
          (done ? (mod.expectedHours ?? mod.totalHours ?? mod.hours ?? mod.duration ?? mod.plannedHours ?? mod.lectureHours ?? 0) : 0);

        const modTotal: number =
          mod.expectedHours ??
          mod.totalHours ??
          mod.hours ??
          mod.duration ??
          mod.plannedHours ??
          mod.lectureHours ??
          mod.total_hours ??
          0;

        const modPct = modTotal > 0
          ? Math.min(100, Math.round((modCompleted / modTotal) * 100))
          : done ? 100 : 0;

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
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
              }`}>
                {done ? "Completed" : "In Progress"}
              </span>
            </div>

            {/* Hours row — always show when status is known */}
            <p className="text-primary font-semibold text-sm mb-2">
              {modTotal > 0
                ? `${modCompleted}/${modTotal} hrs delivered · ${modPct}% covered`
                : done
                ? "All hours delivered · 100% covered"
                : "Hours data not available"}
            </p>
            <Progress
              value={modPct}
              className="h-1.5 [&>div]:bg-primary"
            />

            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {topics.map((t: any, ti: number) => {
                  const label = typeof t === "object" ? (t.name ?? t.title ?? "") : String(t);
                  if (!label) return null;
                  return (
                    <span key={ti} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-lg">
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

// ── Sub-component: one course card ────────────────────────────────────────────
const SubjectCard = ({ course, index, expandedIdx, setExpandedIdx }: {
  course: CourseAudit;
  index: number;
  expandedIdx: number | null;
  setExpandedIdx: (i: number | null) => void;
}) => {
  const isOpen = expandedIdx === index;
  const low = course.progressPct > 0 && course.progressPct < 60;

  return (
    <Card className="p-5 bg-surface border-border rounded-3xl">
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setExpandedIdx(isOpen ? null : index)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-lg truncate">{course.courseName}</p>
          <p className="text-sm text-muted-foreground">
            {course.courseCode} · {course.className}
            {course.semester ? ` · Sem ${course.semester}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {low && <AlertTriangle className="h-4 w-4 text-warning" />}
          <span className="text-primary font-bold text-sm">{course.progressPct}%</span>
          <span className="text-muted-foreground font-semibold text-sm">
            {course.completedModules}/{course.totalModules} modules
          </span>
          {isOpen
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      <Progress value={course.progressPct} className="h-2 mt-3 [&>div]:bg-primary" />

      {course.trackingStatus
        ? <p className="text-xs text-muted-foreground mt-1">{course.trackingStatus}</p>
        : null
      }

      {low && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive px-3 py-2 text-xs font-semibold mt-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Syllabus coverage below 60% — needs attention!
        </div>
      )}

      {isOpen && <SubjectDetail course={course} />}
    </Card>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TeacherLectureAudit() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const teacherId = user?.id ?? "";
  const queryClient = useQueryClient();

  const [courses, setCourses] = useState<CourseAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!teacherId) return;

    abortRef.current = false;
    setIsLoading(true);
    setCourses([]);

    const load = async () => {
      try {
        // Step 1: GET /course-offerings/teacher/{teacherId}
        // Returns the courses this teacher is assigned to teach
        const offeringsRaw = await queryClient.fetchQuery({
          queryKey: ["course-offerings", teacherId],
          queryFn: () => getCourseOfferings(teacherId),
          staleTime: 5 * 60 * 1000,
        });
        if (abortRef.current) return;

        const offerings: any[] = Array.isArray(offeringsRaw)
          ? offeringsRaw
          : Array.isArray(offeringsRaw?.responseData) ? offeringsRaw.responseData
          : Array.isArray(offeringsRaw?.data) ? offeringsRaw.data
          : [];

        if (offerings.length === 0) {
          setCourses([]);
          return;
        }

        // Collect unique class IDs for batch tracking fetch
        const classIds = [...new Set(
          offerings.map((o: any) => String(o.classesId ?? o.classId ?? "")).filter(Boolean)
        )];

        // Step 2: GET /api/tracking/all/{classId} — fetch for all classes in parallel
        const trackingByClass = new Map<string, any[]>();
        await Promise.all(classIds.map(async (cid) => {
          try {
            const res = await queryClient.fetchQuery({
              queryKey: ["lecture-audit", "tracking-all", cid],
              queryFn: () => getTrackingAll(cid),
              staleTime: 5 * 60 * 1000,
            });
            const list: any[] = Array.isArray(res) ? res
              : Array.isArray(res?.responseData) ? res.responseData
              : Array.isArray(res?.data) ? res.data
              : res ? [res] : [];
            trackingByClass.set(cid, list);
          } catch {
            trackingByClass.set(cid, []);
          }
        }));

        if (abortRef.current) return;

        // Step 3–5: For each offering, fetch modules + status + progress
        const courseAudits = await Promise.all(offerings.map(async (offering: any) => {
          const classId     = String(offering.classesId ?? offering.classId ?? "");
          const courseCode  = offering.courseCode ?? "";
          const courseName  = offering.courseName ?? offering.subjectName ?? courseCode;
          const className   = offering.className ?? "";
          const semester    = offering.semester ?? "";

          const trackingList = trackingByClass.get(classId) ?? [];
          const trackingRecord = trackingList.find((t: any) =>
            t.courseCode === courseCode ||
            t.course?.courseCode === courseCode ||
            t.syllabusMasterId === courseCode
          ) ?? null;

          const trackingId    = String(trackingRecord?.id ?? trackingRecord?.trackingId ?? "");
          const progressPct   = trackingRecord?.progressPercentage  ?? 0;
          const completedMods = trackingRecord?.completedModules     ?? 0;
          const totalMods     = trackingRecord?.totalModules         ?? 0;
          const trackingStatus = trackingRecord?.trackingStatus      ?? "";

          let modules: any[] = [];
          let moduleStatuses: any[] = [];
          let progressItems: any[] = [];

          try {
            // Step 3: GET /api/module/{courseCode}
            const modulesRes = await queryClient.fetchQuery({
              queryKey: ["lecture-audit", "modules", courseCode],
              queryFn: () => getCourseModules(courseCode),
              staleTime: 5 * 60 * 1000,
            }).catch(() => null);

            const rawMods = modulesRes?.modules ?? modulesRes?.responseData ?? modulesRes ?? [];
            modules = Array.isArray(rawMods) ? rawMods : [];

            if (trackingId) {
              // Step 4: GET /module/status/{trackingId}
              const statusRes = await queryClient.fetchQuery({
                queryKey: ["lecture-audit", "module-status", trackingId],
                queryFn: () => getModuleStatus(trackingId),
                staleTime: 5 * 60 * 1000,
              }).catch(() => null);

              const rawStatus = statusRes?.statuses ?? statusRes?.responseData ?? statusRes ?? [];
              moduleStatuses = Array.isArray(rawStatus) ? rawStatus : [];

              // Step 5: GET /api/progress/{trackingId}
              const progressRes = await queryClient.fetchQuery({
                queryKey: ["lecture-audit", "progress", trackingId],
                queryFn: () => progressApi(trackingId),
                staleTime: 5 * 60 * 1000,
              }).catch(() => null);

              const rawProgress = progressRes?.progress ?? progressRes?.responseData ?? progressRes ?? [];
              progressItems = Array.isArray(rawProgress) ? rawProgress : [];
            }
          } catch {
            // ignore — show course with whatever data we have
          }

          // Enrich modules with their completion status and progress
          const enrichedModules = modules.map((mod: any) => {
            const modId = mod.id ?? mod.moduleId;
            const statusItem   = moduleStatuses.find((s: any) =>
              s.moduleId === modId || s.moduleId === mod.id || s.moduleId === mod.moduleId
            );
            const progressItem = progressItems.find((p: any) =>
              p.moduleId === modId || p.moduleId === mod.id || p.moduleId === mod.moduleId
            );

            const statusStr = String(statusItem?.status ?? mod.status ?? "").toUpperCase();
            const isCompleted = statusStr === "COMPLETED" || statusItem?.completed === true;

            // Completed hours: prefer progress record, then status record, then module itself
            const hoursCompleted: number =
              progressItem?.hoursCompleted ??
              progressItem?.completedHours ??
              progressItem?.hoursDelivered ??
              statusItem?.hoursCompleted ??
              statusItem?.completedHours ??
              mod.hoursCompleted ??
              mod.completedHours ??
              mod.hoursDelivered ??
              0;

            return {
              ...mod,
              status:         isCompleted ? "COMPLETED" : (statusItem?.status ?? mod.status ?? "PENDING"),
              completed:      isCompleted,
              hoursCompleted,
            };
          });

          return {
            courseName,
            courseCode,
            className,
            semester,
            classId,
            trackingId: trackingId || undefined,
            progressPct,
            completedModules: completedMods,
            totalModules: totalMods,
            trackingStatus,
            modules: enrichedModules,
          } as CourseAudit;
        }));

        if (!abortRef.current) {
          setCourses(courseAudits);
        }
      } catch (err) {
        console.error("TeacherLectureAudit load error:", err);
        if (!abortRef.current) setCourses([]);
      } finally {
        if (!abortRef.current) setIsLoading(false);
      }
    };

    load();
    return () => { abortRef.current = true; };
  }, [teacherId, queryClient]);

  return (
    <RoleShell role="teacher" title="Lecture Audit" subtitle="Your teaching progress & syllabus coverage">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4 -ml-2 gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {isLoading && (
        <div className="flex items-center gap-3 py-16 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading your assigned classes…</span>
        </div>
      )}

      {!isLoading && courses.length === 0 && (
        <Card className="p-10 rounded-3xl border-dashed border-border flex flex-col items-center justify-center text-center gap-3">
          <BookOpen className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">No assigned courses found.</p>
          <p className="text-xs text-muted-foreground">
            Your courses will appear here once assigned by the admin.
          </p>
        </Card>
      )}

      {!isLoading && courses.length > 0 && (
        <>
          {/* Mini summary strip */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
            {courses.map((course, i) => (
              <button
                key={`${course.classId}::${course.courseCode}`}
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className={`flex-shrink-0 min-w-[110px] rounded-2xl border p-3 flex flex-col items-center transition-all ${
                  expandedIdx === i
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-surface border-border hover:border-primary/40"
                }`}
              >
                <span className={`font-extrabold text-xl ${expandedIdx === i ? "text-primary-foreground" : "text-primary"}`}>
                  {course.progressPct}%
                </span>
                <span className={`text-xs mt-1 text-center leading-tight ${expandedIdx === i ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {course.courseName}
                </span>
                <span className={`text-[10px] mt-0.5 ${expandedIdx === i ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                  {course.className}
                </span>
              </button>
            ))}
          </div>

          {/* Course cards */}
          <div className="space-y-4">
            {courses.map((course, i) => (
              <SubjectCard
                key={`${course.classId}::${course.courseCode}`}
                course={course}
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
