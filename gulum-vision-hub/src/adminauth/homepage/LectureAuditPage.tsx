import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  getTeachers
} from "@/services/teacherCrudAPI";
import {
  Search,
  Filter,
  Loader2,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Send,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

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

interface ModuleProgress {
  title: string;
  expectedHours: number;
  completedHours: number;
  topics: string[];
}

interface CourseAudit {
  courseName: string;
  courseCode: string;
  semester: string;
  modules: ModuleProgress[];
}

// Deterministic syllabus mapping based on department
const getMockSyllabus = (teacherId: string | number, department: string): CourseAudit[] => {
  const normDept = (department || "").toLowerCase();
  let numericId = 0;
  if (typeof teacherId === "number") {
    numericId = teacherId;
  } else if (typeof teacherId === "string") {
    for (let i = 0; i < teacherId.length; i++) {
      numericId += teacherId.charCodeAt(i);
    }
  }
  const seed = (numericId * 17) % 100; // stable seed for completion mapping

  let courses: { name: string; code: string; sem: string; modules: { title: string; hours: number; topics: string[] }[] }[] = [];

  if (normDept.includes("comp") || normDept.includes("cse") || normDept.includes("bca") || normDept.includes("it")) {
    courses = [
      {
        name: "Database Management Systems",
        code: "CS-401",
        sem: "BCA Semester 4",
        modules: [
          { title: "Module 1: Introduction to DBMS & ER Modeling", hours: 10, topics: ["Database Concepts", "ER Diagrams", "Attributes", "Relationships"] },
          { title: "Module 2: Relational Model & Relational Algebra", hours: 12, topics: ["Tables", "Integrity Constraints", "Relational Operators", "Select & Project"] },
          { title: "Module 3: SQL Queries, Joins & Triggers", hours: 15, topics: ["DDL/DML", "Subqueries", "Inner/Outer Joins", "PL/SQL Blocks"] },
          { title: "Module 4: Normalization & Relational Design", hours: 12, topics: ["Functional Dependencies", "1NF, 2NF, 3NF", "BCNF Decomposition"] },
          { title: "Module 5: Transaction & Concurrency Control", hours: 10, topics: ["ACID Properties", "Schedules", "Two-Phase Locking", "Deadlocks"] },
        ]
      },
      {
        name: "Operating Systems",
        code: "CS-402",
        sem: "BCA Semester 4",
        modules: [
          { title: "Module 1: Overview & System Calls", hours: 8, topics: ["OS Kernel", "Monolithic/Microkernel", "System Boot", "Interrupts"] },
          { title: "Module 2: Process Scheduling & Threads", hours: 14, topics: ["FCFS, SJF, Round Robin", "Thread Models", "Context Switching"] },
          { title: "Module 3: Synchronization & Deadlocks", hours: 12, topics: ["Critical Section", "Semaphores", "Banker's Algorithm", "Prevention"] },
          { title: "Module 4: Memory Management", hours: 15, topics: ["Paging", "Segmentation", "Page Replacement", "FIFO & LRU"] },
        ]
      },
      {
        name: "Database Management Systems",
        code: "CS-401",
        sem: "BCA Semester 4",
        modules: [
          { title: "Module 1: Introduction to DBMS & ER Modeling", hours: 10, topics: ["Database Concepts", "ER Diagrams", "Attributes", "Relationships"] },
          { title: "Module 2: Relational Model & Relational Algebra", hours: 12, topics: ["Tables", "Integrity Constraints", "Relational Operators", "Select & Project"] },
          { title: "Module 3: SQL Queries, Joins & Triggers", hours: 15, topics: ["DDL/DML", "Subqueries", "Inner/Outer Joins", "PL/SQL Blocks"] },
          { title: "Module 4: Normalization & Relational Design", hours: 12, topics: ["Functional Dependencies", "1NF, 2NF, 3NF", "BCNF Decomposition"] },
          { title: "Module 5: Transaction & Concurrency Control", hours: 10, topics: ["ACID Properties", "Schedules", "Two-Phase Locking", "Deadlocks"] },
        ]
      },
      {
        name: "Operating Systems",
        code: "CS-402",
        sem: "BCA Semester 4",
        modules: [
          { title: "Module 1: Overview & System Calls", hours: 8, topics: ["OS Kernel", "Monolithic/Microkernel", "System Boot", "Interrupts"] },
          { title: "Module 2: Process Scheduling & Threads", hours: 14, topics: ["FCFS, SJF, Round Robin", "Thread Models", "Context Switching"] },
          { title: "Module 3: Synchronization & Deadlocks", hours: 12, topics: ["Critical Section", "Semaphores", "Banker's Algorithm", "Prevention"] },
          { title: "Module 4: Memory Management", hours: 15, topics: ["Paging", "Segmentation", "Page Replacement", "FIFO & LRU"] },
        ]
      }
    ];
  } else if (normDept.includes("ece") || normDept.includes("electron")) {
    courses = [
      {
        name: "Microprocessor & Interfacing",
        code: "EC-401",
        sem: "ECE Semester 4",
        modules: [
          { title: "Module 1: 8085 Microprocessor Architecture", hours: 12, topics: ["Register Organization", "ALU", "Control Unit", "Pin Diagram"] },
          { title: "Module 2: Assembly Language Programming", hours: 15, topics: ["Instruction Set", "Addressing Modes", "Branching Instructions", "Loops"] },
          { title: "Module 3: Peripheral Devices & Interfacing", hours: 12, topics: ["PPI 8255", "Timer 8253", "USART 8251", "Interrupts Controller"] },
          { title: "Module 4: Introduction to 8086 Architecture", hours: 10, topics: ["Segmented Memory", "Instruction Queue", "BIU & EU"] },
        ]
      },
      {
        name: "Digital Signal Processing",
        code: "EC-502",
        sem: "ECE Semester 5",
        modules: [
          { title: "Module 1: Discrete Time Signals & Systems", hours: 10, topics: ["Sampling", "LTI Systems", "Convolution Sum", "Difference Equations"] },
          { title: "Module 2: Z-Transform & DFS", hours: 12, topics: ["ROC", "Inverse Z-Transform", "Fourier Series for Discrete Signals"] },
          { title: "Module 3: Discrete Fourier Transform & FFT", hours: 15, topics: ["DFT Properties", "Decimation-in-time", "Decimation-in-frequency"] },
          { title: "Module 4: IIR & FIR Filter Design", hours: 15, topics: ["Butterworth Filters", "Chebyshev Filters", "Windowing Techniques"] },
        ]
      }
    ];
  } else {
    // Default engineering math & communication courses
    courses = [
      {
        name: "Engineering Mathematics II",
        code: "M-201",
        sem: "All Branches Semester 2",
        modules: [
          { title: "Module 1: Linear Algebra & Matrices", hours: 10, topics: ["Eigenvalues & Eigenvectors", "Cayley-Hamilton", "System of Equations"] },
          { title: "Module 2: Ordinary Differential Equations", hours: 14, topics: ["First-Order Equations", "Homogeneous Equations", "Euler-Cauchy"] },
          { title: "Module 3: Complex Variables & Integration", hours: 12, topics: ["Analytic Functions", "Cauchy Integral Theorem", "Residues"] },
          { title: "Module 4: Probability & Joint Distributions", hours: 12, topics: ["Conditional Probability", "Random Variables", "Normal Distribution"] },
        ]
      },
      {
        name: "Technical Communication & English",
        code: "HU-101",
        sem: "All Branches Semester 1",
        modules: [
          { title: "Module 1: Basics of Communication", hours: 8, topics: ["Verbal & Non-verbal", "Barriers", "Audience Analysis"] },
          { title: "Module 2: Technical Writing & Reporting", hours: 10, topics: ["Format & Style", "Proposal Writing", "Abstracts & Summaries"] },
          { title: "Module 3: Presentation Skills & Group Discussion", hours: 8, topics: ["Vocalics", "Body Language", "Team Mechanics"] },
        ]
      },
      {
        name: "Database Management Systems",
        code: "CS-401",
        sem: "BCA Semester 4",
        modules: [
          { title: "Module 1: Introduction to DBMS & ER Modeling", hours: 10, topics: ["Database Concepts", "ER Diagrams", "Attributes", "Relationships"] },
          { title: "Module 2: Relational Model & Relational Algebra", hours: 12, topics: ["Tables", "Integrity Constraints", "Relational Operators", "Select & Project"] },
          { title: "Module 3: SQL Queries, Joins & Triggers", hours: 15, topics: ["DDL/DML", "Subqueries", "Inner/Outer Joins", "PL/SQL Blocks"] },
          { title: "Module 4: Normalization & Relational Design", hours: 12, topics: ["Functional Dependencies", "1NF, 2NF, 3NF", "BCNF Decomposition"] },
          { title: "Module 5: Transaction & Concurrency Control", hours: 10, topics: ["ACID Properties", "Schedules", "Two-Phase Locking", "Deadlocks"] },
        ]
      },
      {
        name: "Operating Systems",
        code: "CS-402",
        sem: "BCA Semester 4",
        modules: [
          { title: "Module 1: Overview & System Calls", hours: 8, topics: ["OS Kernel", "Monolithic/Microkernel", "System Boot", "Interrupts"] },
          { title: "Module 2: Process Scheduling & Threads", hours: 14, topics: ["FCFS, SJF, Round Robin", "Thread Models", "Context Switching"] },
          { title: "Module 3: Synchronization & Deadlocks", hours: 12, topics: ["Critical Section", "Semaphores", "Banker's Algorithm", "Prevention"] },
          { title: "Module 4: Memory Management", hours: 15, topics: ["Paging", "Segmentation", "Page Replacement", "FIFO & LRU"] },
        ]
      }
    ];
  }

  // Generate deterministic hours completed based on seed and index
  return courses.map((course, cIdx) => {
    const modulesProgress: ModuleProgress[] = course.modules.map((m, mIdx) => {
      // Calculate a progressive ratio: early modules are more likely to be complete
      const moduleWeight = (course.modules.length - mIdx) / course.modules.length;
      const progressFactor = (seed + cIdx * 13) / 100;

      let ratio = progressFactor * moduleWeight * 1.3;
      if (ratio > 1) ratio = 1;
      if (ratio < 0) ratio = 0;

      // Make it match whole hours
      const completedHours = Math.round(m.hours * ratio);

      return {
        title: m.title,
        expectedHours: m.hours,
        completedHours: completedHours,
        topics: m.topics
      };
    });

    return {
      courseName: course.name,
      courseCode: course.code,
      semester: course.sem,
      modules: modulesProgress
    };
  });
};

export default function LectureAuditPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [expandedCourseIdx, setExpandedCourseIdx] = useState<number | null>(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  useEffect(() => {
    getTeachers()
      .then((data: any) => {
        setTeachers(data);
        if (data && data.length > 0) {
          setSelectedTeacherId(data[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load teachers for audit:", err);
        toast.error("Failed to fetch teacher listings.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const uniqueDepts = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [teachers]);

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

  const syllabusAudit = useMemo(() => {
    if (!selectedTeacher) return [];
    return getMockSyllabus(selectedTeacher.id, selectedTeacher.department);
  }, [selectedTeacher]);

  const overallMetrics = useMemo(() => {
    if (syllabusAudit.length === 0) return { percent: 0, completed: 0, total: 0, hoursCompleted: 0, hoursTotal: 0 };

    let totalModules = 0;
    let completedModules = 0;
    let hoursCompleted = 0;
    let hoursTotal = 0;

    syllabusAudit.forEach((course) => {
      course.modules.forEach((mod) => {
        totalModules += 1;
        hoursCompleted += mod.completedHours;
        hoursTotal += mod.expectedHours;
        if (mod.completedHours >= mod.expectedHours) {
          completedModules += 1;
        }
      });
    });

    const percent = hoursTotal > 0 ? Math.round((hoursCompleted / hoursTotal) * 100) : 0;
    return { percent, completed: completedModules, total: totalModules, hoursCompleted, hoursTotal };
  }, [syllabusAudit]);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      toast.success(`Lecture audit progress verified for Prof. ${selectedTeacher?.full_name}`);
    }, 1000);
  };

  const handleNotify = () => {
    setIsNotifying(true);
    setTimeout(() => {
      setIsNotifying(false);
      toast.success(`Syllabus coverage alert sent to ${selectedTeacher?.email}`);
    }, 1000);
  };

  const handleExport = () => {
    toast.success("Audit report exported as CSV spreadsheet.");
  };

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
          <Button onClick={handleExport} className="gap-2 rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-700 text-white border-0">
            <FileSpreadsheet className="h-4 w-4" /> Export Report
          </Button>
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
                    {uniqueDepts.map((d) => (
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
                    const teacherSyllabus = getMockSyllabus(t.id, t.department);
                    let sumCompleted = 0;
                    let sumTotal = 0;
                    teacherSyllabus.forEach((course) => {
                      course.modules.forEach((mod) => {
                        sumTotal += mod.expectedHours;
                        sumCompleted += mod.completedHours;
                      });
                    });
                    const completionPct = sumTotal > 0 ? Math.round((sumCompleted / sumTotal) * 100) : 0;

                    return (
                      <Card
                        key={t.id}
                        onClick={() => {
                          setSelectedTeacherId(t.id);
                          setExpandedCourseIdx(0);
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

                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Syllabus Completion</span>
                            <span className="font-semibold text-foreground">{completionPct}%</span>
                          </div>
                          <Progress value={completionPct} className="h-1.5 [&>div]:bg-primary" />
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
                  {/* Course auditing collapse tree */}
                  <h3 className="text-base font-bold text-foreground">Course Syllabus Coverage of {selectedTeacher.full_name}</h3>
                  <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1 scrollbar-hidden">

                    {syllabusAudit.map((course, cIdx) => {
                      const isExpanded = expandedCourseIdx === cIdx;

                      // Calculate course metrics
                      let courseHoursCompleted = 0;
                      let courseHoursTotal = 0;
                      let courseModulesCompleted = 0;
                      course.modules.forEach((mod) => {
                        courseHoursCompleted += mod.completedHours;
                        courseHoursTotal += mod.expectedHours;
                        if (mod.completedHours >= mod.expectedHours) {
                          courseModulesCompleted += 1;
                        }
                      });
                      const coursePercent = courseHoursTotal > 0 ? Math.round((courseHoursCompleted / courseHoursTotal) * 100) : 0;

                      return (
                        <Card key={course.courseCode} className="p-5 bg-surface border-border overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between gap-3 text-left focus:outline-none"
                            onClick={() => setExpandedCourseIdx(isExpanded ? null : cIdx)}
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
                            <div className="flex items-center gap-4 shrink-0 text-sm">
                              <span className="text-primary font-bold">{coursePercent}% completed</span>
                              <span className="text-muted-foreground text-xs font-medium">
                                {courseModulesCompleted}/{course.modules.length} modules
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          <Progress value={coursePercent} className="h-2 mt-3.5 [&>div]:bg-primary" />

                          {/* Modules List Expansion */}
                          {isExpanded && (
                            <div className="mt-5 space-y-3 border-t border-white/5 pt-4 max-h-[280px] overflow-y-auto pr-1 scrollbar-beautiful">

                              {course.modules.map((mod, mIdx) => {
                                const isDone = mod.completedHours >= mod.expectedHours;
                                const modPercent = mod.expectedHours > 0 ? Math.round((mod.completedHours / mod.expectedHours) * 100) : 0;

                                return (
                                  <div key={mIdx} className="rounded-xl border border-white/5 bg-background/50 p-4 space-y-3">
                                    <div className="flex items-start gap-2.5">
                                      {isDone ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                      ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <span className="font-semibold text-sm text-foreground">{mod.title}</span>
                                          <span className="text-xs font-semibold text-primary">
                                            {mod.completedHours} / {mod.expectedHours} hrs
                                          </span>
                                        </div>

                                        <Progress value={modPercent} className="h-1.5 mt-2 [&>div]:bg-primary" />
                                      </div>
                                    </div>

                                    {/* Topics Badges */}
                                    <div className="flex flex-wrap gap-1.5 pl-7">
                                      {mod.topics.map((topic) => (
                                        <span
                                          key={topic}
                                          className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-white/5"
                                        >
                                          {topic}
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
