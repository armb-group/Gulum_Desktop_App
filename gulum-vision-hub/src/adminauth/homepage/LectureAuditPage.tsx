import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getCourseModules, getTrackingAll, getModuleStatus, progressApi, createProgressApi, deleteProgressApi, createTrackingApi, useSyllabusMasters } from "@/services/lectureAuditAPI";
import { useAuth } from "@/contexts/AuthContext";
import { useGetTeachers, getCourseOfferings } from "@/services/teacherCrudAPI";
import { useGetDepartments } from "@/services/departmentAPI";
import { getTeacherSchedule } from "@/services/scheduleAPI";
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Pencil,
  X
} from "lucide-react";
import ExportButton from "@/components/ExportButton";

interface TeacherData {
  id: number;
  full_name: string;
  employee_code: string;
  email: string;
  phone: string;
  department: string;
  qualification: string;
  specialization: string;
}

interface CourseAudit {
  courseName: string;
  courseCode: string;
  semester: string;
  modules: any[];
  trackingId?: string;
  classId?: string;
  institutionId?: string;
}



export default function LectureAuditPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  // Ref to track the currently-selected teacher; prevents stale async data from older selections
  const currentTeacherIdRef = useRef<number | string | null>(null);

  const { data: rawTeachers = [], isLoading: teachersLoading } = useGetTeachers();
  const teachers = useMemo(() => Array.isArray(rawTeachers) ? rawTeachers : [], [rawTeachers]);

  const { data: rawDepts } = useGetDepartments();
  const { data: rawSyllabusMasters } = useSyllabusMasters();

  const syllabusMasters = useMemo(() => {
    const list = Array.isArray(rawSyllabusMasters)
      ? rawSyllabusMasters
      : (rawSyllabusMasters?.responseData ?? rawSyllabusMasters ?? []);
    return Array.isArray(list) ? list : [];
  }, [rawSyllabusMasters]);
  const departments = useMemo(() => {
    return Array.isArray(rawDepts)
      ? Array.from(
        new Set(
          rawDepts
            .map((d: any) => d.name ?? d.departmentName ?? d.department_name ?? "")
            .filter((name: string) => name.trim() !== "")
        )
      )
      : [];
  }, [rawDepts]);

  const loading = teachersLoading;
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | string | null>(null);
  const [teacherCourses, setTeacherCourses] = useState<CourseAudit[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [expandedCourseIdx, setExpandedCourseIdx] = useState<number | null>(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  
  const [isEditingAudit, setIsEditingAudit] = useState<number | null>(null);
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
  const [deliveryModes, setDeliveryModes] = useState<Record<string, string>>({});
  const [savingAudit, setSavingAudit] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const uniqueDepts = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [teachers]);

  const displayDepts = useMemo(() => {
    return departments.length > 0 ? departments : uniqueDepts;
  }, [departments, uniqueDepts]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.employee_code?.toLowerCase().includes(search.toLowerCase());
      const matchesDept =
        deptFilter === "all" ||
        t.department?.toLowerCase() === deptFilter.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [teachers, search, deptFilter]);

  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

  useEffect(() => {
    // Immediately update ref so we can discard stale async results
    currentTeacherIdRef.current = selectedTeacherId;

    // Immediately clear ALL old state before loading new teacher data
    setTeacherCourses([]);
    setExpandedCourseIdx(0);
    setIsEditingAudit(null);
    setSelectedModules({});
    setDeliveryModes({});
    setHasChanges(false);
    setLoadingSchedule(!!selectedTeacherId);

    if (!selectedTeacherId) {
      return;
    }

    // Capture the teacher ID for this particular effect run
    const effectTeacherId = selectedTeacherId;

    const loadCourses = async () => {
      try {
        // Double-check ref hasn't changed before starting network calls
        if (currentTeacherIdRef.current !== effectTeacherId) return;

        await queryClient.invalidateQueries({
          queryKey: ["course-offerings", String(effectTeacherId)],
        });

        const data = await queryClient.fetchQuery({
          queryKey: ["course-offerings", String(effectTeacherId)],
          queryFn: () => getCourseOfferings(effectTeacherId),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
        if (currentTeacherIdRef.current !== effectTeacherId) return;

        const offerings = Array.isArray(data)
          ? data
          : (data?.responseData ?? data?.data ?? []);

        // Gather all unique class IDs (supporting classesId, classId, id, and classessId)
        const classIds = Array.from(
          new Set(
            offerings
              .map((o: any) => o.classesId || o.classId || o.id || o.classessId)
              .filter(Boolean)
          )
        );

        console.log("Teacher offerings raw response data:", data);
        console.log("Extracted offerings list:", offerings);
        console.log("Resolved class IDs list:", classIds);

        // Fetch all class tracking lists in parallel
        const trackingResults = await Promise.all(
          classIds.map(async (cid: any) => {
            try {
              const res = await queryClient.fetchQuery({
                queryKey: ["lecture-audit", "tracking-all", String(cid)],
                queryFn: () => getTrackingAll(cid),
              });
              const dataList = Array.isArray(res)
                ? res
                : (res?.responseData
                  ? (Array.isArray(res.responseData) ? res.responseData : [res.responseData])
                  : (res ? [res] : []));
              return { classId: cid, list: dataList };
            } catch (e) {
              console.warn(`Failed to fetch tracking for class ${cid}:`, e);
              return { classId: cid, list: [] };
            }
          })
        );

        if (currentTeacherIdRef.current !== effectTeacherId) return;

        const trackingMap = new Map();
        trackingResults.forEach(({ classId, list }) => {
          trackingMap.set(String(classId), list);
        });

        const fetchPromises: Promise<CourseAudit>[] = [];

        offerings.forEach((offering: any) => {
          const className = offering.className ?? "Class";
          const semesterNum = offering.semester ?? "N/A";
          const classId = offering.classesId || offering.classId;
          const courseCode = offering.courseCode;
          const courseName = offering.courseName ?? "Unknown Subject";

          if (courseCode) {
            fetchPromises.push((async () => {
              const trackingList = classId ? (trackingMap.get(String(classId)) || []) : [];
              const trackingRecord = trackingList.find(
                (item: any) =>
                  item?.courseCode === courseCode ||
                  item?.course?.courseCode === courseCode ||
                  item?.syllabusMasterId === courseCode ||
                  item?.syllabusMaster?.courseCode === courseCode ||
                  item?.subjectName?.toLowerCase() === courseName?.toLowerCase()
              );

              const trackingId = trackingRecord?.id || trackingRecord?.trackingId;

              let modules: any[] = [];
              let moduleStatuses: any[] = [];
              let progressRes: any = null;

              try {
                const [modulesRes, statusRes, trackingProgressRes] = await Promise.all([
                  queryClient.fetchQuery({
                    queryKey: ["lecture-audit", "modules", String(courseCode)],
                    queryFn: () => getCourseModules(courseCode),
                  }).catch(err => {
                    console.warn(`Failed to fetch modules for ${courseCode}:`, err);
                    return null;
                  }),
                  trackingId ? queryClient.fetchQuery({
                    queryKey: ["lecture-audit", "module-status", String(trackingId)],
                    queryFn: () => getModuleStatus(trackingId),
                  }).catch(err => {
                    console.warn(`Failed to fetch module statuses for tracking ${trackingId}:`, err);
                    return null;
                  }) : Promise.resolve(null),
                  trackingId ? queryClient.fetchQuery({
                    queryKey: ["lecture-audit", "progress", String(trackingId)],
                    queryFn: () => progressApi(trackingId),
                  }).catch(err => {
                    console.warn(`Failed to fetch progress for tracking ${trackingId}:`, err);
                    return null;
                  }) : Promise.resolve(null)
                ]);

                const modulesData = modulesRes?.modules ?? modulesRes ?? [];
                modules = Array.isArray(modulesData) ? modulesData : [];

                if (statusRes) {
                  const statusData = statusRes?.statuses || statusRes?.responseData || statusRes || [];
                  moduleStatuses = Array.isArray(statusData) ? statusData : [];
                }
                progressRes = trackingProgressRes;
              } catch (e) {
                console.warn(`Failed parallel fetch for course ${courseCode}:`, e);
              }

              const enrichedModules = modules.map((mod: any) => {
                const statusItem = moduleStatuses.find(
                  (s: any) => s.moduleId === mod.id || s.moduleId === mod.moduleId
                );
                const progressRecord = progressRes?.progress?.find(
                  (p: any) => p.moduleId === mod.id || p.moduleId === mod.moduleId
                );
                return {
                  ...mod,
                  status: statusItem?.status || "PENDING",
                  completed: statusItem?.status === "COMPLETED",
                  deliveryMode: progressRecord?.deliveryMode ?? progressRecord?.delivery_mode
                };
              });

              return {
                courseName,
                courseCode,
                semester: `${className} · Semester ${semesterNum}`,
                modules: enrichedModules,
                trackingId,
                classId,
                institutionId: offering.institutionId
              };
            })());
          }
        });

        const courseAudits = await Promise.all(fetchPromises);
        // Final guard: only update state if this teacher is still selected
        if (currentTeacherIdRef.current !== effectTeacherId) return;
        setTeacherCourses(courseAudits);
      } catch (err) {
        console.error("Failed to load teacher offerings for audit:", err);
        if (currentTeacherIdRef.current === effectTeacherId) {
          setTeacherCourses([]);
        }
      } finally {
        if (currentTeacherIdRef.current === effectTeacherId) {
          setLoadingSchedule(false);
        }
      }
    };

    /*
    const loadSchedule = async () => {
      try {
        await queryClient.invalidateQueries({
          queryKey: ["schedule", "teacher", String(selectedTeacherId)],
        });

        const data = await queryClient.fetchQuery({
          queryKey: ["schedule", "teacher", String(selectedTeacherId)],
          queryFn: () => getTeacherSchedule(selectedTeacherId),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
        if (currentTeacherIdRef.current !== effectTeacherId) return;

        const classes = data?.classes ?? data?.responseData?.classes ?? [];
        const offerings: any[] = [];
        const seen = new Set<string>();

        classes.forEach((cls: any) => {
          const classId = String(cls.classesId ?? cls.classId ?? "");
          const className = cls.className ?? "Class";
          const semester = cls.semester ?? "N/A";
          (cls.timeslot ?? cls.timeslots ?? []).forEach((slot: any) => {
            if (!slot.courseCode) return;
            const key = `${classId}::${slot.courseCode}`;
            if (!seen.has(key)) {
              seen.add(key);
              offerings.push({
                classesId: classId,
                classId: classId,
                className,
                semester,
                courseCode: slot.courseCode,
                courseName: slot.courseName ?? slot.courseCode,
              });
            }
          });
        });

        // Gather all unique class IDs (supporting classesId, classId, id, and classessId)
        const classIds = Array.from(
          new Set(
            offerings
              .map((o: any) => o.classesId || o.classId || o.id || o.classessId)
              .filter(Boolean)
          )
        );

        console.log("Teacher schedule raw response data:", data);
        console.log("Extracted offerings list from schedule:", offerings);
        console.log("Resolved class IDs list:", classIds);

        // Fetch all class tracking lists in parallel
        const trackingResults = await Promise.all(
          classIds.map(async (cid: any) => {
            try {
              const res = await queryClient.fetchQuery({
                queryKey: ["lecture-audit", "tracking-all", String(cid)],
                queryFn: () => getTrackingAll(cid),
              });
              const dataList = Array.isArray(res)
                ? res
                : (res?.responseData
                  ? (Array.isArray(res.responseData) ? res.responseData : [res.responseData])
                  : (res ? [res] : []));
              return { classId: cid, list: dataList };
            } catch (e) {
              console.warn(`Failed to fetch tracking for class ${cid}:`, e);
              return { classId: cid, list: [] };
            }
          })
        );

        if (currentTeacherIdRef.current !== effectTeacherId) return;

        const trackingMap = new Map();
        trackingResults.forEach(({ classId, list }) => {
          trackingMap.set(String(classId), list);
        });

        const fetchPromises: Promise<CourseAudit>[] = [];

        offerings.forEach((offering: any) => {
          const className = offering.className ?? "Class";
          const semesterNum = offering.semester ?? "N/A";
          const classId = offering.classesId || offering.classId;
          const courseCode = offering.courseCode;
          const courseName = offering.courseName ?? "Unknown Subject";

          if (courseCode) {
            fetchPromises.push((async () => {
              const trackingList = classId ? (trackingMap.get(String(classId)) || []) : [];
              const trackingRecord = trackingList.find(
                (item: any) =>
                  item?.courseCode === courseCode ||
                  item?.course?.courseCode === courseCode ||
                  item?.syllabusMasterId === courseCode ||
                  item?.syllabusMaster?.courseCode === courseCode ||
                  item?.subjectName?.toLowerCase() === courseName?.toLowerCase()
              );

              const trackingId = trackingRecord?.id || trackingRecord?.trackingId;

              let modules: any[] = [];
              let moduleStatuses: any[] = [];
              let progressRes: any = null;

              try {
                const [modulesRes, statusRes, trackingProgressRes] = await Promise.all([
                  queryClient.fetchQuery({
                    queryKey: ["lecture-audit", "modules", String(courseCode)],
                    queryFn: () => getCourseModules(courseCode),
                  }).catch(err => {
                    console.warn(`Failed to fetch modules for ${courseCode}:`, err);
                    return null;
                  }),
                  trackingId ? queryClient.fetchQuery({
                    queryKey: ["lecture-audit", "module-status", String(trackingId)],
                    queryFn: () => getModuleStatus(trackingId),
                  }).catch(err => {
                    console.warn(`Failed to fetch module statuses for tracking ${trackingId}:`, err);
                    return null;
                  }) : Promise.resolve(null),
                  trackingId ? queryClient.fetchQuery({
                    queryKey: ["lecture-audit", "progress", String(trackingId)],
                    queryFn: () => progressApi(trackingId),
                  }).catch(err => {
                    console.warn(`Failed to fetch progress for tracking ${trackingId}:`, err);
                    return null;
                  }) : Promise.resolve(null)
                ]);

                const modulesData = modulesRes?.modules ?? modulesRes ?? [];
                modules = Array.isArray(modulesData) ? modulesData : [];

                if (statusRes) {
                  const statusData = statusRes?.statuses || statusRes?.responseData || statusRes || [];
                  moduleStatuses = Array.isArray(statusData) ? statusData : [];
                }
                progressRes = trackingProgressRes;
              } catch (e) {
                console.warn(`Failed parallel fetch for course ${courseCode}:`, e);
              }

              const enrichedModules = modules.map((mod: any) => {
                const statusItem = moduleStatuses.find(
                  (s: any) => s.moduleId === mod.id || s.moduleId === mod.moduleId
                );
                const progressRecord = progressRes?.progress?.find(
                  (p: any) => p.moduleId === mod.id || p.moduleId === mod.moduleId
                );
                return {
                  ...mod,
                  status: statusItem?.status || "PENDING",
                  completed: statusItem?.status === "COMPLETED",
                  deliveryMode: progressRecord?.deliveryMode ?? progressRecord?.delivery_mode
                };
              });

              return {
                courseName,
                courseCode,
                semester: `${className} · Semester ${semesterNum}`,
                modules: enrichedModules,
                trackingId,
                classId
              };
            })());
          }
        });

        const courseAudits = await Promise.all(fetchPromises);
        if (currentTeacherIdRef.current !== effectTeacherId) return;
        setTeacherCourses(courseAudits);
      } catch (err) {
        console.error("Failed to load teacher schedule for audit:", err);
        if (currentTeacherIdRef.current === effectTeacherId) {
          setTeacherCourses([]);
        }
      } finally {
        if (currentTeacherIdRef.current === effectTeacherId) {
          setLoadingSchedule(false);
        }
      }
    };
    */

    loadCourses();

    // No cleanup needed - ref-based guard handles stale results
  }, [selectedTeacherId, queryClient, refreshKey]);

  const handleStartEdit = async (idx: number, course: CourseAudit) => {
    let trackingId = course.trackingId;
    
    if (!trackingId) {
      setSavingAudit(true);
      try {
        const trackingRes = await createTrackingApi({
          classId: course.classId,
          courseCode: course.courseCode,
          institutionId: course.institutionId || user?.institutionId || "bf271762-fbdf-47b9-87f4-f28987fe8d70"
        });
        
        trackingId = trackingRes?.id || trackingRes?.trackingId;
        if (!trackingId) {
          throw new Error("Tracking ID was not returned from backend");
        }
        
        setTeacherCourses((prev) =>
          prev.map((c, i) => (i === idx ? { ...c, trackingId } : c))
        );
        toast.info("Initialized tracking record for auditing.");
      } catch (err: any) {
        console.error("Failed to initialize tracking record:", err);
        toast.error("Failed to start audit mode: tracking record could not be initialized.");
        setSavingAudit(false);
        return;
      } finally {
        setSavingAudit(false);
      }
    }

    setIsEditingAudit(idx);
    const initialChecked: Record<string, boolean> = {};
    const initialModes: Record<string, string> = {};
    course.modules.forEach((mod: any) => {
      const isCompleted = mod.status === "COMPLETED" || mod.completed === true;
      initialChecked[mod.id] = isCompleted;
      if (mod.deliveryMode) {
        initialModes[mod.id] = mod.deliveryMode;
      }
    });
    setSelectedModules(initialChecked);
    setDeliveryModes(initialModes);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setIsEditingAudit(null);
    setSelectedModules({});
    setDeliveryModes({});
    setHasChanges(false);
  };

  const handleSaveAudit = async (course: CourseAudit, trackingId: string) => {
    setSavingAudit(true);
    try {
      for (const mod of course.modules) {
        const originalStatus = mod.status === "COMPLETED" || mod.completed === true;
        const newStatus = selectedModules[mod.id] !== undefined ? selectedModules[mod.id] : originalStatus;

        if (originalStatus !== newStatus) {
          if (newStatus) {
            const mode = deliveryModes[mod.id];
            if (!mode) {
              toast.error(`Please select delivery mode for ${mod.moduleTitle || mod.title}`);
              setSavingAudit(false);
              return;
            }
            await createProgressApi({
              trackingId,
              moduleId: mod.id,
              lectureTopic: mod.moduleTitle || mod.title || "",
              deliveryMode: mode,
              hoursCompleted: mod.expectedHours ?? mod.totalHours ?? 0,
            });
          } else {
            await deleteProgressApi(trackingId, mod.id);
          }
        } else if (newStatus && deliveryModes[mod.id] !== mod.deliveryMode) {
          const mode = deliveryModes[mod.id];
          if (!mode) {
            toast.error(`Please select delivery mode for ${mod.moduleTitle || mod.title}`);
            setSavingAudit(false);
            return;
          }
          await createProgressApi({
            trackingId,
            moduleId: mod.id,
            lectureTopic: mod.moduleTitle || mod.title || "",
            deliveryMode: mode,
            hoursCompleted: mod.expectedHours ?? mod.totalHours ?? 0,
          });
        }
      }

      toast.success("Progress saved successfully!");
      setIsEditingAudit(null);
      setRefreshKey((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["lecture-audit"] });
      if (selectedTeacherId) {
        queryClient.invalidateQueries({
          queryKey: ["course-offerings", String(selectedTeacherId)],
        });
      }
    } catch (err: any) {
      console.error("Failed to save progress:", err);
      toast.error("Failed to save progress.");
    } finally {
      setSavingAudit(false);
    }
  };

  // When loading, always treat courses as empty to prevent stale data from flashing
  const syllabusAudit = useMemo(() => {
    return loadingSchedule ? [] : teacherCourses;
  }, [teacherCourses, loadingSchedule]);

  return (
    <AdminShell title="Lecture Auditing">
      <section className="container pt-5 space-y-6 h-[90vh]">

        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lecture Auditing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Audit lecture progress, syllabus coverage, and module completion rates for teaching faculty.
            </p>
          </div>
          <ExportButton
            data={syllabusAudit.flatMap((course) =>
              course.modules.length > 0
                ? course.modules.map((mod: any, mIdx: number) => ({
                  courseName: course.courseName,
                  courseCode: course.courseCode,
                  semester: course.semester,
                  module: mod.moduleTitle || mod.title || `Module ${mIdx + 1}`,
                  status: mod.status === "COMPLETED" || mod.completed ? "Completed" : "Pending",
                  hours: mod.expectedHours ?? mod.totalHours ?? 0,
                }))
                : [{
                  courseName: course.courseName,
                  courseCode: course.courseCode,
                  semester: course.semester,
                  module: "No modules",
                  status: "—",
                  hours: "—",
                }]
            )}
            columns={[
              { key: "courseName", label: "Course Name" },
              { key: "courseCode", label: "Course Code" },
              { key: "semester", label: "Semester" },
              { key: "module", label: "Module" },
              { key: "status", label: "Status" },
              { key: "hours", label: "Hours" },
            ]}
            fileName={`lecture_audit_${selectedTeacher?.full_name || "report"}`}
            title={`Lecture Audit Report${selectedTeacher ? ` - ${selectedTeacher.full_name}` : ""}`}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading auditing catalog...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-muted-foreground/20 rounded-2xl">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-bold text-foreground">No Teachers Found</h3>
            <p className="text-sm text-muted-foreground mt-1">Please register teachers before accessing the audit panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Faculty Directory & Selector */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-4 rounded-2xl admin-glass border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Faculty</h3>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 rounded-full font-bold">
                    {filteredTeachers.length} Tutors
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name or code..."
                    className="pl-9 h-10 rounded-xl bg-white dark:bg-zinc-950 border-primary/20 dark:border-white/10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <select
                    className="flex w-full h-10 rounded-xl border border-primary/20 dark:border-white/10 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer [&>option]:bg-white [&>option]:text-foreground [&>option]:dark:bg-zinc-950"
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {displayDepts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

              </Card>

              {/* Faculty Scroll List */}
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 pt-1 scrollbar-beautiful">
                {filteredTeachers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No matching faculty found.</p>
                ) : (
                  filteredTeachers.map((t) => {
                    const isSelected = t.id === selectedTeacherId;
                    return (
                      <Card
                        key={t.id}
                        onClick={() => {
                          if (t.id !== selectedTeacherId) {
                            // Update ref FIRST to immediately invalidate any in-flight async work
                            currentTeacherIdRef.current = t.id;
                            setSelectedTeacherId(t.id);
                            setTeacherCourses([]);
                            setLoadingSchedule(true);
                            setExpandedCourseIdx(0);
                            setIsEditingAudit(null);
                            setSelectedModules({});
                            setDeliveryModes({});
                            setHasChanges(false);
                          }
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between ${isSelected
                          ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                          : "border-white/10 bg-surface hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30"
                          }`}

                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-foreground truncate">{t.full_name}</h4>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                              {t.employee_code}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{t.department}</p>
                        </div>


                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Selection Audit Details */}
            <div className="lg:col-span-8 space-y-6 ">
              {selectedTeacher ? (
                <>
                  {/* Course auditing list */}
                  <h3 className="text-base font-bold text-foreground">Courses Taught by {selectedTeacher.full_name}</h3>

                  {loadingSchedule ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm font-medium">Loading courses schedule...</span>
                    </div>
                  ) : syllabusAudit.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground bg-muted/20">
                      No courses schedule found for this faculty member.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1 scrollbar-hidden">
                      {syllabusAudit.map((course, idx) => {
                        const isExpanded = expandedCourseIdx === idx;
                        const completedModulesCount = course.modules?.filter((m: any) => m.status === "COMPLETED" || m.completed === true).length ?? 0;
                        const totalModulesCount = course.modules?.length ?? 0;
                        const progressPct = totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;

                        return (
                          <Card key={`${course.courseCode}-${course.classId}-${course.trackingId || idx}`} className="p-5 bg-surface border-border overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between gap-3 text-left focus:outline-none"
                              onClick={() => {
                                // console.log("Clicked course details:", course);
                                setExpandedCourseIdx(isExpanded ? null : idx);
                                setIsEditingAudit(null);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-foreground text-base truncate">{course.courseName}</p>
                                  <span className="bg-primary/10 text-primary border-0 rounded text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0">
                                    {course.courseCode}
                                  </span>
                                  <span className="text-xs font-semibold shrink-0">
                                    {progressPct}% completed ({completedModulesCount}/{totalModulesCount})
                                  </span>
                                </div>
                                {/* <p className="text-xs text-muted-foreground mt-0.5">{course.semester}</p> */}
                              </div>
                              <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {isExpanded && isEditingAudit !== idx && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartEdit(idx, course)}
                                    className="h-8 gap-1 rounded-xl text-xs hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                                  >
                                    <Pencil className="h-3 w-3" /> Edit Audit
                                  </Button>
                                )}
                                {isExpanded && isEditingAudit === idx && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      disabled={savingAudit}
                                      className="h-8 rounded-xl text-xs hover:bg-muted"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveAudit(course, course.trackingId!)}
                                      disabled={savingAudit || !hasChanges}
                                      className="h-8 rounded-xl text-xs gap-1.5"
                                    >
                                      {savingAudit ? (
                                        <>
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        "Save"
                                      )}
                                    </Button>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedCourseIdx(isExpanded ? null : idx);
                                    setIsEditingAudit(null);
                                  }}
                                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-border space-y-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                    <span>Syllabus Completion</span>
                                    <span>{progressPct}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5 dark:bg-zinc-800 overflow-hidden">
                                    <div
                                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${progressPct}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {(!course.modules || course.modules.length === 0) ? (
                                  <p className="text-xs text-muted-foreground text-center py-4">
                                    No modules found for this course.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {course.modules.map((mod: any, mIdx: number) => {
                                      const title = mod.moduleTitle || mod.title || `Module ${mIdx + 1}`;
                                      const hours = mod.expectedHours ?? mod.totalHours ?? 0;
                                      const topics = Array.isArray(mod.topics) ? mod.topics : [];
                                      const isCompleted = mod.status === "COMPLETED" || mod.completed === true;

                                      const isEditingThisCourse = isEditingAudit === idx;
                                      const currentChecked = selectedModules[mod.id] !== undefined ? selectedModules[mod.id] : isCompleted;
                                      const currentMode = deliveryModes[mod.id] ?? mod.deliveryMode ?? "";

                                      return (
                                        <div key={mIdx} className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                                          <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-start gap-2 flex-1">
                                              {isEditingThisCourse ? (
                                                <input
                                                  type="checkbox"
                                                  checked={currentChecked}
                                                  onChange={(e) => {
                                                    setSelectedModules((prev) => ({
                                                      ...prev,
                                                      [mod.id]: e.target.checked
                                                    }));
                                                    setHasChanges(true);
                                                  }}
                                                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0 mt-1 cursor-pointer"
                                                />
                                              ) : isCompleted ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                              ) : (
                                                <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                              )}
                                              <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                                                {title}
                                              </h4>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {!isEditingThisCourse && mod.deliveryMode && (
                                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 font-semibold text-[10px] rounded-full">
                                                  {mod.deliveryMode}
                                                </Badge>
                                              )}
                                              {hours > 0 && (
                                                <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary hover:bg-primary/10 border-0 rounded-full font-semibold text-[10px]">
                                                  {hours} hrs
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {isEditingThisCourse && currentChecked && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                              {["ONLINE", "OFFLINE", "HYBRID"].map((mode) => {
                                                const isSelected = currentMode === mode;
                                                return (
                                                  <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => {
                                                      setDeliveryModes((prev) => ({
                                                        ...prev,
                                                        [mod.id]: mode
                                                      }));
                                                      setHasChanges(true);
                                                    }}
                                                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                                                      isSelected
                                                        ? "bg-primary/15 text-primary border-primary"
                                                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                                                    }`}
                                                  >
                                                    {mode}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          )}
                                          {topics.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                              {topics.map((topic: any, tIdx: number) => {
                                                const topicName = typeof topic === "object" ? (topic.name || topic.title || "") : String(topic);
                                                if (!topicName) return null;
                                                return (
                                                  <Badge
                                                    key={tIdx}
                                                    variant="outline"
                                                    className="text-[10px] py-0 px-2 font-normal text-muted-foreground border-muted-foreground/20 rounded-md"
                                                  >
                                                    {topicName}
                                                  </Badge>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-muted-foreground/20 rounded-2xl p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/35 mb-2" />
                  <p className="text-sm text-muted-foreground">Please select a faculty member from the directory list.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </section>
    </AdminShell>
  );
}
