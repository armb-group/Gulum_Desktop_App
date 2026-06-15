import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useGetTeachers, getTeachers } from "@/services/teacherCrudAPI";
import { useGetDepartments, getDepartments } from "@/services/departmentAPI";
import { getTeacherSchedule } from "@/services/scheduleAPI";
import { getCourseModules, getTrackingAll, getModuleStatus } from "@/services/lectureAuditAPI";
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle
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
}



export default function LectureAuditPage() {
  const queryClient = useQueryClient();

  const { data: rawTeachers = [], isLoading: teachersLoading } = useGetTeachers();
  const teachers = useMemo(() => Array.isArray(rawTeachers) ? rawTeachers : [], [rawTeachers]);

  const { data: rawDepts } = useGetDepartments();
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
    setExpandedCourseIdx(0);
    setTeacherCourses([]);

    if (!selectedTeacherId) {
      setLoadingSchedule(false);
      return;
    }

    setLoadingSchedule(true);

    let active = true;

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
        if (!active) return;

        // The API /schedule/teacher/{id} already returns only this teacher's data.
        // Each class record contains only the selected teacher's timeslots.
        const classes = data?.classes || data?.responseData?.classes || [];

        // Gather all unique class IDs
        const classIds = Array.from(
          new Set(
            classes
              .map((c: any) => c.classesId || c.classId)
              .filter(Boolean)
          )
        );

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

        if (!active) return;

        const trackingMap = new Map();
        trackingResults.forEach(({ classId, list }) => {
          trackingMap.set(classId, list);
        });

        const fetchPromises: Promise<CourseAudit>[] = [];

        classes.forEach((cls: any) => {
          const className = cls.className ?? "Class";
          const semesterNum = cls.semester ?? "N/A";
          const classId = cls.classesId || cls.classId;

          // Collect unique courses from timeslots
          const uniqueSubjectsMap = new Map();
          cls.timeslot?.forEach((slot: any) => {
            if (slot.courseCode) {
              uniqueSubjectsMap.set(slot.courseCode, slot.courseName || "Unknown Subject");
            }
          });

          uniqueSubjectsMap.forEach((courseName, courseCode) => {
            fetchPromises.push((async () => {
              const trackingList = classId ? (trackingMap.get(classId) || []) : [];
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

              try {
                const [modulesRes, statusRes] = await Promise.all([
                  queryClient.fetchQuery({
                    queryKey: ["lecture-audit", "modules", String(courseCode)],
                    queryFn: () => getCourseModules(courseCode),
                  }),
                  trackingId ? queryClient.fetchQuery({
                    queryKey: ["lecture-audit", "module-status", String(trackingId)],
                    queryFn: () => getModuleStatus(trackingId),
                  }) : Promise.resolve(null)
                ]);

                const modulesData = modulesRes?.modules ?? modulesRes ?? [];
                modules = Array.isArray(modulesData) ? modulesData : [];

                if (statusRes) {
                  const statusData = statusRes?.statuses || statusRes?.responseData || statusRes || [];
                  moduleStatuses = Array.isArray(statusData) ? statusData : [];
                }
              } catch (e) {
                console.warn(`Failed parallel fetch for course ${courseCode}:`, e);
              }

              const enrichedModules = modules.map((mod: any) => {
                const statusItem = moduleStatuses.find(
                  (s: any) => s.moduleId === mod.id || s.moduleId === mod.moduleId
                );
                return {
                  ...mod,
                  status: statusItem?.status || "PENDING",
                  completed: statusItem?.status === "COMPLETED"
                };
              });

              return {
                courseName,
                courseCode,
                semester: `${className} · Semester ${semesterNum}`,
                modules: enrichedModules
              };
            })());
          });
        });

        const courseAudits = await Promise.all(fetchPromises);
        if (!active) return;
        setTeacherCourses(courseAudits);
      } catch (err) {
        console.error("Failed to load teacher schedule for audit:", err);
        if (active) {
          setTeacherCourses([]);
        }
      } finally {
        if (active) {
          setLoadingSchedule(false);
        }
      }
    };

    loadSchedule();

    return () => {
      active = false;
    };
  }, [selectedTeacherId, queryClient]);

  const syllabusAudit = useMemo(() => {
    return teacherCourses;
  }, [teacherCourses]);

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
                            setSelectedTeacherId(t.id);
                            setTeacherCourses([]);
                            setLoadingSchedule(true);
                            setExpandedCourseIdx(0);
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
                        console.log("\naudit = ", syllabusAudit)
                        const isExpanded = expandedCourseIdx === idx;
                        const completedModulesCount = course.modules?.filter((m: any) => m.status === "COMPLETED" || m.completed === true).length ?? 0;
                        const totalModulesCount = course.modules?.length ?? 0;
                        const progressPct = totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;

                        return (
                          <Card key={course.semester} className="p-5 bg-surface border-border overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between gap-3 text-left focus:outline-none"
                              onClick={() => setExpandedCourseIdx(isExpanded ? null : idx)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-foreground text-base truncate">{course.courseName}</p>
                                  <span className="bg-primary/10 text-primary border-0 rounded text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                                    {course.courseCode}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{course.semester}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {progressPct}% completed ({completedModulesCount}/{totalModulesCount})
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
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

                                      return (
                                        <div key={mIdx} className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                                          <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-start gap-2">
                                              {isCompleted ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                              ) : (
                                                <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                              )}
                                              <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                                                {title}
                                              </h4>
                                            </div>
                                            {hours > 0 && (
                                              <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary hover:bg-primary/10 border-0 rounded-full font-semibold text-[10px]">
                                                {hours} hrs
                                              </Badge>
                                            )}
                                          </div>
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
