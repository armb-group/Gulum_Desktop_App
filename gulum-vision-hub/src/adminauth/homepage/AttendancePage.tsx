import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetStudentDetailedAttendance,
  useGetStudentsByCourse,
  getStudentDetailedAttendance,
  getStudentsByCourse
} from "@/services/studentCrudAPI";
import {
  useGetDepartments,
  useGetAcademicBatchesByDepartment,
  useGetCoursesByClass,
  getDepartments,
  getAcademicBatchesByDepartment,
  getCoursesByClass
} from "@/services/departmentAPI";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { initialData as deptData } from "./departmentsData";
import {
  Search,
  Loader2,
  Users,
  Percent,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Calendar,
  Layers,
  BookMarked
} from "lucide-react";
import ExportButton from "@/components/ExportButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Student {
  id: string | number;
  roll_no: string;
  full_name: string;
  email_id: string;
  batch_id: string | number;
  classess_id: string | number;
  department_id: string | number;
  departmentName?: string;
  sectionName?: string | null;
  batchYear?: string | number;
  parentEmail?: string;
  totalClassesOccurred?: number;
  totalClassesAttended?: number;
  attendancePercentage?: number;
}

const AttendancePage = () => {
  const queryClient = useQueryClient();

  // Navigation Flow State
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Student list & loading states
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [attendanceRangeFilter, setAttendanceRangeFilter] = useState(""); // "low" (<75) or "good" (>=75)

  // Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<(Student & { percent: number }) | null>(null);
  const [detailedAttendance, setDetailedAttendance] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 1. TanStack Query for departments
  const { data: rawDepts, isLoading: loadingDepts } = useGetDepartments();
  const departments = useMemo(() => {
    const list = Array.isArray(rawDepts) ? rawDepts.map((d: any) => ({
      id: String(d.id ?? d.departmentId ?? d.department_id ?? ""),
      name: d.name ?? d.departmentName ?? d.department_name ?? "Unknown Department",
    })) : [];
    return list.length > 0 ? list : deptData;
  }, [rawDepts]);

  // 2. TanStack Query for batches
  const { data: rawBatches, isLoading: loadingBatches } = useGetAcademicBatchesByDepartment(selectedDeptId, {
    enabled: !!selectedDeptId
  });
  const batches = useMemo(() => {
    if (!rawBatches) return [];
    return Array.isArray(rawBatches) ? rawBatches : (rawBatches.responseData ?? rawBatches.data ?? []);
  }, [rawBatches]);

  // Load batches reset when department changes
  useEffect(() => {
    setSelectedYear("");
    setSelectedSection("");
    setSelectedSemester("");
    setSelectedCourse(null);
    setStudents([]);
  }, [selectedDeptId]);

  // Handle dropdown selection changes
  const handleDeptChange = (val: string) => {
    setSelectedDeptId(val);
  };

  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    setSelectedSection("");
    setSelectedSemester("");
    setSelectedCourse(null);
    setStudents([]);
  };

  const handleSectionChange = (val: string) => {
    setSelectedSection(val);
    setSelectedSemester("");
    setSelectedCourse(null);
    setStudents([]);
  };

  // Derived available Years and Sections
  const availableYears = useMemo(() => {
    if (batches.length > 0) {
      const list = Array.from(new Set(batches.map((b: any) => b.year).filter(Boolean))) as string[];
      return [...list].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } else {
      const dept = deptData.find(d => d.id === selectedDeptId);
      return dept?.years.map(y => y.year) || [];
    }
  }, [batches, selectedDeptId]);

  const availableSections = useMemo(() => {
    if (batches.length > 0) {
      const matchingBatches = batches.filter((b: any) => b.year === selectedYear);
      const sections: string[] = [];
      matchingBatches.forEach((b: any) => {
        if (b.classes && Array.isArray(b.classes)) {
          b.classes.forEach((c: any) => {
            if (c.name) sections.push(c.name);
          });
        }
      });
      return Array.from(new Set(sections));
    } else {
      const dept = deptData.find(d => d.id === selectedDeptId);
      const yearObj = dept?.years.find(y => y.year === selectedYear);
      return yearObj?.sections.map(s => s.name) || [];
    }
  }, [batches, selectedDeptId, selectedYear]);

  const availableSemesters = useMemo(() => {
    const matchingBatches = batches.filter((b: any) => b.year === selectedYear);
    const semesters: string[] = [];
    matchingBatches.forEach((b: any) => {
      if (b.classes && Array.isArray(b.classes)) {
        b.classes.forEach((c: any) => {
          if (c.name === selectedSection && c.semester) {
            semesters.push(String(c.semester));
          }
        });
      }
    });
    return Array.from(new Set(semesters));
  }, [batches, selectedYear, selectedSection]);

  // Auto-default semester when availableSemesters changes in API mode
  useEffect(() => {
    if (availableSemesters.length > 0) {
      setSelectedSemester(availableSemesters[0]);
    }
  }, [availableSemesters]);

  const classId = useMemo(() => {
    if (!selectedDeptId || !selectedYear || !selectedSection) return "";
    
    // Wait for the semester to default if semesters are available but none selected yet
    if (availableSemesters.length > 0 && !selectedSemester) {
      return "";
    }
    
    const selectedBatch = batches.find((b) => b.year === selectedYear);
    const matchingClass = selectedBatch?.classes?.find(
      (c: any) => c.name === selectedSection && (!selectedSemester || String(c.semester) === selectedSemester)
    );
    return matchingClass?.id ?? "";
  }, [batches, selectedDeptId, selectedYear, selectedSection, selectedSemester, availableSemesters]);

  // 3. TanStack Query for Courses
  const { data: rawCourses, isLoading: loadingCourses } = useGetCoursesByClass(classId, {
    enabled: !!classId
  });
  const courses = useMemo(() => {
    if (!rawCourses) {
      if (!selectedDeptId || !selectedYear || !selectedSection) return [];
      // Fallback to mock data
      const dept = deptData.find(d => d.id === selectedDeptId);
      const yearObj = dept?.years.find(y => y.year === selectedYear);
      const sectionObj = yearObj?.sections.find(s => s.name === selectedSection);
      return sectionObj?.subjects ?? [];
    }
    const list = Array.isArray(rawCourses) ? rawCourses : [];
    return list.map((item: any) => {
      const c = item.course ?? item.subject ?? item;
      return {
        name: c.name ?? c.courseName ?? c.subjectName ?? c.subject_name ?? "Unknown Subject",
        code: c.code ?? c.courseCode ?? c.subjectCode ?? c.subject_code ?? "N/A"
      };
    });
  }, [rawCourses, selectedDeptId, selectedYear, selectedSection]);

  // Fetch and map student list + detailed attendance
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      return;
    }

    const loadStudentsAttendance = async () => {
      setLoading(true);
      setStudents([]);

      const selectedBatch = batches.find((b) => b.year === selectedYear);
      const batchId = selectedBatch?.batchId ?? selectedBatch?.id ?? "";
      const matchingClass = selectedBatch?.classes?.find(
        (c: any) => c.name === selectedSection && (!selectedSemester || String(c.semester) === selectedSemester)
      );
      const classId = matchingClass?.id ?? "";

      try {
        const responseData = await queryClient.fetchQuery({
          queryKey: ["students-course", selectedCourse.code],
          queryFn: () => getStudentsByCourse(selectedCourse.code),
        });
        const studentsList = Array.isArray(responseData) ? responseData : [];

        const promises = studentsList.map(async (s: any) => {
          const studentId = s.id ?? s.studentId;
          let total = s.totalClassesOccurred ?? 0;
          let attended = s.totalClassesAttended ?? 0;
          let percent = s.attendancePercentage ?? 0;

          try {
            const detailedRes = await queryClient.fetchQuery({
              queryKey: ["student-detailed-attendance", studentId],
              queryFn: () => getStudentDetailedAttendance(studentId),
            });
            const rawList = detailedRes?.responseData ?? detailedRes?.data ?? detailedRes;
            if (Array.isArray(rawList)) {
              const courseRecord = rawList.find((item: any) => {
                const code = item.courseCode ?? item.course_code ?? item.code ?? "";
                return code.toLowerCase() === selectedCourse.code.toLowerCase();
              });
              if (courseRecord) {
                total = courseRecord.totalClasses ?? courseRecord.total ?? 0;
                attended = courseRecord.presentCount ?? courseRecord.attended ?? courseRecord.classesAttended ?? 0;
                percent = courseRecord.attendancePercentage ?? courseRecord.percent ?? courseRecord.percentage ?? 0;
              }
            }
          } catch (err) {
            console.error(`Failed to load course attendance for student ${studentId}:`, err);
          }

          return {
            id: studentId,
            roll_no: s.rollNo ?? s.roll_no ?? "N/A",
            full_name: s.fullName ?? s.full_name ?? "Unknown",
            email_id: s.emailId ?? s.email ?? s.email_id ?? "N/A",
            batch_id: batchId || selectedYear,
            classess_id: classId || selectedSection,
            department_id: selectedDeptId,
            departmentName: selectedDeptId.toUpperCase(),
            sectionName: selectedSection,
            batchYear: selectedYear,
            totalClassesOccurred: total,
            totalClassesAttended: attended,
            attendancePercentage: percent
          };
        });

        const resolvedStudents = await Promise.all(promises);
        if (resolvedStudents.length > 0) {
          setStudents(resolvedStudents);
        } else {
          loadMockStudents(selectedCourse, batchId, classId);
        }
      } catch (err) {
        console.error("Failed to load students/attendance from API, falling back to mock:", err);
        loadMockStudents(selectedCourse, batchId, classId);
      } finally {
        setLoading(false);
      }
    };

    loadStudentsAttendance();
  }, [selectedCourse, selectedDeptId, selectedYear, selectedSection, selectedSemester, batches, queryClient]);

  const handleCourseClick = (course: any) => {
    setSelectedCourse(course);
  };

  const loadMockStudents = (course: any, batchId: string, classId: string) => {
    const dept = deptData.find(d => d.id === selectedDeptId);
    const yearObj = dept?.years.find(y => y.year === selectedYear);
    const sectionObj = yearObj?.sections.find(s => s.name === selectedSection);
    const studentNames = sectionObj?.students ?? [];

    const resolvedStudents = studentNames.map((name, idx) => {
      const roll = `${selectedDeptId.toUpperCase()}${(idx + 1).toString().padStart(3, '0')}`;
      const id = `MOCK-STUDENT-${roll}`;
      const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;

      let seed = 0;
      for (let i = 0; i < roll.length; i++) seed += roll.charCodeAt(i);
      for (let i = 0; i < course.code.length; i++) seed += course.code.charCodeAt(i);
      const percent = 55 + (seed % 42);
      const total = 12 + (seed % 15);
      const attended = Math.round((total * percent) / 100);

      return {
        id,
        roll_no: roll,
        full_name: name,
        email_id: email,
        batch_id: batchId || selectedYear,
        classess_id: classId || selectedSection,
        department_id: selectedDeptId,
        departmentName: selectedDeptId.toUpperCase(),
        sectionName: selectedSection,
        batchYear: selectedYear,
        totalClassesOccurred: total,
        totalClassesAttended: attended,
        attendancePercentage: Math.round((attended / total) * 100)
      };
    });

    setStudents(resolvedStudents);
  };

  const generateMockDetailedAttendance = (student: Student & { percent: number }) => {
    const subjects = [
      { name: "Database Management Systems", code: "CS-301" },
      { name: "Operating Systems", code: "CS-302" },
      { name: "Web Development", code: "CS-303" },
      { name: "Computer Networks", code: "CS-304" }
    ];
    return subjects.map((sub, idx) => {
      const total = 20 + (idx * 5);
      let percent = student.percent + (idx === 0 ? 5 : idx === 1 ? -10 : idx === 2 ? 8 : -3);
      percent = Math.max(30, Math.min(100, percent));
      const attended = Math.round((total * percent) / 100);
      return {
        subjectName: sub.name,
        courseCode: sub.code,
        attended: attended,
        total: total,
        percent: Math.round((attended / total) * 100)
      };
    });
  };

  const handleViewDetailedAttendance = async (student: Student & { percent: number }) => {
    setSelectedStudentForDetails(student);
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const response = await queryClient.fetchQuery({
        queryKey: ["student-detailed-attendance", student.id],
        queryFn: () => getStudentDetailedAttendance(student.id),
      });
      const rawList = response?.responseData ?? response?.data ?? response;
      if (Array.isArray(rawList) && rawList.length > 0) {
        const mapped = rawList.map((item: any) => ({
          subjectName: item.courseName ?? item.subjectName ?? item.subject_name ?? item.subject ?? "Unknown Subject",
          courseCode: item.courseCode ?? item.course_code ?? item.code ?? "N/A",
          attended: item.presentCount ?? item.attended ?? item.classesAttended ?? 0,
          total: item.totalClasses ?? item.total ?? 0,
          percent: item.attendancePercentage ?? item.percent ?? item.percentage ?? 0
        }));
        setDetailedAttendance(mapped);
      } else {
        setDetailedAttendance(generateMockDetailedAttendance(student));
      }
    } catch (error) {
      console.error("Failed to fetch detailed attendance", error);
      setDetailedAttendance(generateMockDetailedAttendance(student));
    } finally {
      setLoadingDetails(false);
    }
  };

  // Compute student attendance and apply filter & search
  const studentsWithAttendance = useMemo(() => {
    return students.map((s) => {
      const attended = s.totalClassesAttended ?? 0;
      const total = s.totalClassesOccurred ?? 0;
      const percent = s.attendancePercentage ?? 0;
      return {
        ...s,
        attended,
        total,
        percent,
      };
    });
  }, [students]);

  const filteredStudents = useMemo(() => {
    return studentsWithAttendance.filter((s) => {
      const matchesSearch =
        (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.roll_no || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.email_id || "").toLowerCase().includes(search.toLowerCase());

      const matchesRange =
        !attendanceRangeFilter ||
        (attendanceRangeFilter === "low" && s.percent < 75) ||
        (attendanceRangeFilter === "good" && s.percent >= 75);

      return matchesSearch && matchesRange;
    });
  }, [studentsWithAttendance, search, attendanceRangeFilter]);

  const stats = useMemo(() => {
    if (filteredStudents.length === 0) return { avg: 0, lowCount: 0 };
    const totalPercent = filteredStudents.reduce((sum, s) => sum + s.percent, 0);
    const lowCount = filteredStudents.filter((s) => s.percent < 75).length;
    return {
      avg: Math.round(totalPercent / filteredStudents.length),
      lowCount,
    };
  }, [filteredStudents]);

  const handleExport = () => {
    toast.success("Attendance report downloaded successfully!");
  };

  const getDeptColor = (deptId: string) => {
    switch (deptId.toLowerCase()) {
      case "cse":
        return "from-indigo-600/10 to-blue-600/10 border-indigo-200/50 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-500/5";
      case "ece":
        return "from-purple-600/10 to-pink-600/10 border-purple-200/50 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-500/5";
      case "ee":
        return "from-amber-600/10 to-orange-600/10 border-amber-200/50 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-500/5";
      default:
        return "from-teal-600/10 to-emerald-600/10 border-teal-200/50 dark:border-teal-800/40 text-teal-600 dark:text-teal-400 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-500/5";
    }
  };

  return (
    <AdminShell title="Student Attendance Records">
      <section className="container py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance Audits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select department, year, and section parameters to view courses and student logs.
            </p>
          </div>
        </div>

        {!selectedCourse && (
          <>
            {/* 1. THREE DROPDOWN SELECTORS BAR */}
        <Card className="p-6 rounded-2xl border border-border/80 shadow-md bg-card print-hide">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Department Selector */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Select Department</label>
              {loadingDepts ? (
                <div className="h-11 w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                  Loading departments...
                </div>
              ) : (
                <select
                  value={selectedDeptId}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm cursor-pointer [&>option]:bg-card [&>option]:text-foreground"
                >
                  <option value="">Choose Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Year Selector */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Select Year</label>
              {loadingBatches ? (
                <div className="h-11 w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                  Loading years...
                </div>
              ) : (
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  disabled={!selectedDeptId}
                  className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer [&>option]:bg-card [&>option]:text-foreground"
                >
                  <option value="">Choose Year</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Section Selector */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Select Section</label>
              <select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                disabled={!selectedYear}
                className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer [&>option]:bg-card [&>option]:text-foreground"
              >
                <option value="">Choose Section</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* 2. COURSES DISPLAY */}
        {selectedDeptId && selectedYear && selectedSection && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-foreground">Available Courses</h2>
            </div>

            {loadingCourses ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading courses list...
              </div>
            ) : courses.length === 0 ? (
              <div className="p-8 text-center border rounded-xl border-dashed text-muted-foreground bg-muted/20">
                No courses found for the selected academic group.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <Card
                    key={course.code}
                    onClick={() => handleCourseClick(course)}
                    className={`p-5 border cursor-pointer rounded-2xl shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md flex items-center gap-4 group ${
                      selectedCourse?.code === course.code
                        ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/40"
                        : "border-border/80 hover:border-indigo-400 dark:hover:border-indigo-600 bg-card hover:bg-indigo-500/5"
                    }`}
                  >
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                        {course.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 uppercase tracking-wide">
                        {course.code}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {(!selectedDeptId || !selectedYear || !selectedSection) && (
          <Card className="p-12 text-center border border-dashed border-border/80 rounded-2xl bg-card shadow-sm flex flex-col items-center justify-center space-y-3">
            <BookMarked className="h-8 w-8 text-indigo-500/60 animate-pulse" />
            <h3 className="text-base font-bold text-foreground">Start Auditing Attendance</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Select department, year, and section to get attendance records.
            </p>
          </Card>
        )}
          </>
        )}

        {/* 3. STUDENTS ATTENDANCE DISPLAY */}
        {selectedCourse && (
          <div className="space-y-6">
            
            {/* Back Button */}
            <div className="flex items-center gap-3 print-hide">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCourse(null)}
                className="gap-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Courses
              </Button>
            </div>
            
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 flex items-center gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40">
                <div className="p-3 bg-indigo-500 text-white rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Enrolled Students</p>
                  <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">{filteredStudents.length}</p>
                </div>
              </Card>
              
              <Card className="p-5 flex items-center gap-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40">
                <div className="p-3 bg-emerald-500 text-white rounded-xl">
                  <Percent className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Class Average</p>
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    {loading ? "..." : `${stats.avg}%`}
                  </p>
                </div>
              </Card>
              
              <Card className="p-5 flex items-center gap-4 bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40">
                <div className="p-3 bg-rose-500 text-white rounded-xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Defaulters (&lt;75%)</p>
                  <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
                    {loading ? "..." : stats.lowCount}
                  </p>
                </div>
              </Card>
            </div>

            {/* Filters & Students Table */}
            <Card className="overflow-x-auto rounded-2xl border border-border/80 shadow-md bg-card">
              <div className="flex flex-col gap-4 p-4 lg:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Student Logs for <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{selectedCourse.name}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">List of students and their logs for this course</p>
                  </div>
                  <ExportButton
                    data={filteredStudents.map((s, idx) => ({
                      sno: idx + 1,
                      name: s.full_name,
                      email: s.email_id,
                      roll_no: s.roll_no,
                      attended: s.attended,
                      total: s.total,
                      percentage: `${s.percent}%`,
                    }))}
                    columns={[
                      { key: "sno", label: "S.No" },
                      { key: "name", label: "Student Name" },
                      { key: "email", label: "Email" },
                      { key: "roll_no", label: "Roll No" },
                      { key: "attended", label: "Attended" },
                      { key: "total", label: "Total" },
                      { key: "percentage", label: "Percentage" },
                    ]}
                    fileName={`attendance_${selectedCourse?.name || "report"}`}
                    title={`Attendance Report - ${selectedCourse?.name || "Course"}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                  <div className="relative w-full sm:col-span-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student name, roll number, email..."
                      className="pl-10 h-10 rounded-xl bg-card border-border shadow-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  
                  <select
                    value={attendanceRangeFilter}
                    onChange={(e) => setAttendanceRangeFilter(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm cursor-pointer [&>option]:bg-card [&>option]:text-foreground"
                  >
                    <option value="">All Attendance Levels</option>
                    <option value="good">Good Attendance (&ge;75%)</option>
                    <option value="low">Low Attendance (&lt;75%)</option>
                  </select>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <span className="text-sm font-medium">Fetching class attendance data...</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <p className="text-sm">No students match current search filters.</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto rounded-xl border border-border/60">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-primary text-primary-foreground text-left text-xs font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-3 border-b border-border/80" style={{ width: "60px" }}>S.No</th>
                          <th className="px-3 py-3 border-b border-border/80">Student Info</th>
                          <th className="px-3 py-3 border-b border-border/80" style={{ width: "120px" }}>Roll No</th>
                          <th className="px-3 py-3 border-b border-border/80">Classes Attended</th>
                          <th className="px-3 py-3 border-b border-border/80" style={{ width: "120px" }}>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, index) => {
                          const isLow = student.percent < 75;
                          return (
                            <tr
                              key={student.id}
                              className={`border-b border-border/40 transition-colors duration-200 hover:bg-muted/40 ${
                                index % 2 === 0 ? "bg-card" : "bg-muted/20"
                              }`}
                            >
                              <td className="px-3 py-3 align-middle border-r border-border/45 text-black dark:text-[#FFF19E] text-xs font-medium">
                                {index + 1}
                              </td>
                              <td className="px-3 py-3 align-middle border-r border-border/45">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-black dark:text-[#FFF19E]">{student.full_name}</span>
                                  <span className="text-[10px] text-black dark:text-[#FFF19E]">{student.email_id}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 align-middle border-r border-border/45 font-mono text-xs text-black dark:text-[#FFF19E]">
                                {student.roll_no}
                              </td>
                              <td className="px-3 py-3 align-middle border-r border-border/45 text-black dark:text-[#FFF19E] font-medium text-xs">
                                {student.attended} / {student.total} classes
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <Badge
                                  className={`text-xs font-semibold py-0.5 px-2.5 rounded-full border text-black dark:text-[#FFF19E] ${
                                    isLow
                                      ? "bg-rose-100 dark:bg-rose-950/35 border-rose-200/50 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-950/50"
                                      : "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                  }`}
                                >
                                  {student.percent}%
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* Subject-wise Detailed Attendance Modal */}
      <Dialog open={detailsModalOpen && !!selectedStudentForDetails} onOpenChange={(open) => !open && setDetailsModalOpen(false)}>
        <DialogContent className="sm:max-w-[650px] rounded-2xl border border-white/20 dark:border-white/10 admin-glass-modal p-0 overflow-hidden flex flex-col shadow-2xl">
          {selectedStudentForDetails && (
            <>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <DialogTitle className="text-xl font-bold text-primary">Attendance Breakdown</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedStudentForDetails.full_name} ({selectedStudentForDetails.roll_no})
                </p>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 overflow-y-auto max-h-[60vh] scrollbar-beautiful bg-background">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium">Fetching subject-wise attendance...</span>
                  </div>
                ) : detailedAttendance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <p className="text-sm">No detailed attendance records found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary info */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground block text-xs">Department</span>
                        <span className="font-semibold text-foreground animate-pulse">
                          {selectedStudentForDetails.departmentName || selectedStudentForDetails.department_id || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Section / Year</span>
                        <span className="font-semibold text-foreground">
                          Sec: {selectedStudentForDetails.sectionName || selectedStudentForDetails.classess_id || "N/A"} · Year: {selectedStudentForDetails.batchYear || selectedStudentForDetails.batch_id || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto rounded-lg border border-border/60">
                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-primary text-primary-foreground text-left text-xs font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2 border-b border-border/80">Subject</th>
                            <th className="px-3 py-2 border-b border-border/80" style={{ width: "80px" }}>Code</th>
                            <th className="px-3 py-2 border-b border-border/80" style={{ width: "120px" }}>Ratio</th>
                            <th className="px-3 py-2 border-b border-border/80" style={{ width: "100px" }}>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedAttendance.map((item, index) => {
                            const isLow = item.percent < 75;
                            return (
                              <tr
                                key={index}
                                className={`border-b border-border/40 transition-colors duration-200 hover:bg-muted/40 ${
                                  index % 2 === 0 ? "bg-card" : "bg-muted/20"
                                }`}
                              >
                                <td className="px-3 py-3 align-middle border-r border-border/45 font-semibold text-black dark:text-[#FFF19E]">
                                  {item.subjectName}
                                </td>
                                <td className="px-3 py-3 align-middle border-r border-border/45 font-mono text-xs text-black dark:text-[#FFF19E]">
                                  {item.courseCode}
                                </td>
                                <td className="px-3 py-3 align-middle border-r border-border/45 text-black dark:text-[#FFF19E] font-medium text-xs">
                                  {item.attended} / {item.total} classes
                                </td>
                                <td className="px-3 py-3 align-middle">
                                  <Badge
                                    className={`text-xs font-semibold py-0.5 px-2 rounded-full border text-black dark:text-[#FFF19E] ${
                                      isLow
                                        ? "bg-rose-100 dark:bg-rose-950/35 border-rose-200/50 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/50"
                                        : "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                    }`}
                                  >
                                    {item.percent}%
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </AdminShell>
  );
};

export default AttendancePage;

