import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useGetTeachers, getTeachers, useCreateCourseOffering } from "@/services/teacherCrudAPI";
import { useGetDepartments, getDepartments, getAcademicBatchesByDepartment } from "@/services/departmentAPI";
import { useCoursesByClass } from "@/services/courseclassAPI";
import { initialData as deptData, getDepartmentsInMemory, setDepartmentsInMemory, type Department, type Subject } from "./departmentsData";
import { Users, UserCheck, Trash2, BookOpen, Layers, ShieldAlert, GraduationCap, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeacherData {
  id: string | number;
  full_name: string;
  employee_code: string;
  specialization: string;
  qualification: string;
  email: string;
}

type TeacherSubjectAssignment = {
  teacherId: string | number;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  maxCapacity: number;
};

const createDefaultYears = (deptName: string, deptId: string) => {
  const code = (deptId || deptName || "DEPT").substring(0, 3).toUpperCase();
  return [
    {
      year: "1st Year",
      sections: [
        { name: `${code} 1`, teachers: [], students: [], subjects: [] },
        { name: `${code} 2`, teachers: [], students: [], subjects: [] }
      ]
    },
    {
      year: "2nd Year",
      sections: [
        { name: `${code} 1`, teachers: [], students: [], subjects: [] },
        { name: `${code} 2`, teachers: [], students: [], subjects: [] }
      ]
    },
    {
      year: "3rd Year",
      sections: [
        { name: `${code} 1`, teachers: [], students: [], subjects: [] },
        { name: `${code} 2`, teachers: [], students: [], subjects: [] }
      ]
    },
    {
      year: "4th Year",
      sections: [
        { name: `${code} 1`, teachers: [], students: [], subjects: [] },
        { name: `${code} 2`, teachers: [], students: [], subjects: [] }
      ]
    }
  ];
};

const AssignTeacher = () => {
  const queryClient = useQueryClient();

  const [departments, setDepartments] = useState<Department[]>(() => getDepartmentsInMemory());
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSectionName, setSelectedSectionName] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [teacherSearch, setTeacherSearch] = useState<string>("");
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>("");
  const [maxCapacity, setMaxCapacity] = useState<number | "">(60);
  const [batchesLoading, setBatchesLoading] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [removeTargetAssignment, setRemoveTargetAssignment] = useState<TeacherSubjectAssignment | null>(null);

  // TanStack Query for Teachers
  const { data: rawTeachers = [], isLoading: teachersLoading } = useGetTeachers();
  const teachers = useMemo(() => {
    const list = Array.isArray(rawTeachers) ? rawTeachers : [];
    return list.map((t) => ({
      id: t.id,
      full_name: t.full_name || `Teacher ${t.id}`,
      employee_code: t.employee_code || "N/A",
      specialization: t.specialization || "N/A",
      qualification: t.qualification || "N/A",
      email: t.email || ""
    }));
  }, [rawTeachers]);

  // TanStack Query for Departments
  const { data: rawDepts, isLoading: rawDeptsLoading } = useGetDepartments();
  const departmentsLoading = rawDeptsLoading && departments.length === 0;

  useEffect(() => {
    if (rawDepts) {
      const localDepts = getDepartmentsInMemory();
      const mapped = Array.isArray(rawDepts)
        ? rawDepts.map((d) => {
            const id = String(d.id ?? d.departmentId ?? d.department_id ?? "");
            const name = d.name ?? d.departmentName ?? d.department_name ?? "Unknown Department";
            const match = localDepts.find(
              (ld) => String(ld.id) === id || ld.name.toLowerCase() === name.toLowerCase()
            );
            return {
              id,
              name,
              years: d.years ?? match?.years ?? createDefaultYears(name, id)
            };
          })
        : [];
      setDepartments(mapped);
    }
  }, [rawDepts]);

  const assignMutation = useCreateCourseOffering();
  const confirming = assignMutation.isPending;

  const handleConfirmAssignment = async () => {
    if (!selectedSection) {
      toast.error("No section selected.");
      return;
    }

    const classId = (selectedSection as any).classId;

    if (!classId) {
      toast.error("Missing class ID.");
      return;
    }

    if (selectedAssignments.length === 0) {
      toast.error("Add at least one teacher with a subject before confirming.");
      return;
    }

    try {
      await Promise.all(
        selectedAssignments.map((assignment) =>
          assignMutation.mutateAsync({
            academicTermId: (selectedSection as any).academicTermId || "2025-26",
            courseId: assignment.subjectId,
            instructorId: String(assignment.teacherId),
            maxCapacity: assignment.maxCapacity || 60,
            classid: classId
          })
        )
      );
      toast.success("Teacher subject assignments saved successfully!");
    } catch (err: any) {
      console.error("Error confirming teacher subject assignments:", err);
      const errMsg = err.response?.data?.message ?? err.message ?? "Failed to save teacher subject assignments.";
      toast.error(errMsg);
    }
  };

  // Save departments back to in-memory store whenever state changes
  const saveDepartments = (updated: Department[]) => {
    setDepartments(updated);
    setDepartmentsInMemory(updated);
  };

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  const availableYears = useMemo(() => {
    return selectedDepartment?.years || [];
  }, [selectedDepartment]);

  const selectedYearObj = useMemo(() => {
    return availableYears.find((y) => y.year === selectedYear) || null;
  }, [availableYears, selectedYear]);

  const availableSections = useMemo(() => {
    const sections = selectedYearObj?.sections || [];
    const names = sections.map((s) => s.name);
    return Array.from(new Set(names)) as string[];
  }, [selectedYearObj]);

  const availableSemesters = useMemo(() => {
    const sections = selectedYearObj?.sections || [];
    const matching = sections.filter((s) => s.name === selectedSectionName);
    const semesters = matching.map((s) => String((s as any).semester || ""));
    return Array.from(new Set(semesters.filter(Boolean))) as string[];
  }, [selectedYearObj, selectedSectionName]);

  const selectedSection = useMemo(() => {
    const sections = selectedYearObj?.sections || [];
    return sections.find(
      (s) => s.name === selectedSectionName && String((s as any).semester || "") === selectedSemester
    ) || null;
  }, [selectedYearObj, selectedSectionName, selectedSemester]);

  const selectedSubject = useMemo(() => {
    return availableSubjects.find((subject: any) => String(subject.id) === selectedSubjectCode) || null;
  }, [availableSubjects, selectedSubjectCode]);

  const selectedAssignments = useMemo<TeacherSubjectAssignment[]>(() => {
    const assignments = (selectedSection as any)?.teacherAssignments;
    if (Array.isArray(assignments)) return assignments;
    return [];
  }, [selectedSection]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const viewport = scrollContainerRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [selectedAssignments.length]);

  const filteredTeachersForSelect = useMemo(() => {
    return teachers.filter((t) =>
      t.full_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.employee_code.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [teachers, teacherSearch]);

  const handleAssign = () => {
    if (!selectedTeacherId || !selectedDeptId || !selectedYear || !selectedSectionName || !selectedSemester || !selectedSubject) {
      toast.error("Please select a teacher, department, year, section, semester, and subject.");
      return;
    }

    if (maxCapacity !== "" && (isNaN(Number(maxCapacity)) || Number(maxCapacity) <= 0)) {
      toast.error("Max capacity must be a positive number.");
      return;
    }

    const teacher = teachers.find((t) => String(t.id) === selectedTeacherId);
    if (!teacher) {
      toast.error("Teacher not found.");
      return;
    }

    const updatedDepartments = departments.map((dept) => {
      if (dept.id !== selectedDeptId) return dept;

      return {
        ...dept,
        years: dept.years.map((yr) => {
          if (yr.year !== selectedYear) return yr;

          return {
            ...yr,
            sections: yr.sections.map((sect) => {
              if (sect.name !== selectedSectionName || String((sect as any).semester || "") !== selectedSemester) return sect;

              const subjectCode = selectedSubject.code;
              const currentAssignments = Array.isArray((sect as any).teacherAssignments)
                ? (sect as any).teacherAssignments
                : [];

              if (currentAssignments.some((item: TeacherSubjectAssignment) => item.teacherId === teacher.id && item.subjectCode === subjectCode)) {
                toast.warning(`${teacher.full_name} is already assigned to ${selectedSubject.name}.`);
                return sect;
              }

              const nextAssignment: TeacherSubjectAssignment = {
                teacherId: teacher.id,
                teacherName: teacher.full_name,
                subjectId: selectedSubject.id,
                subjectName: selectedSubject.name,
                subjectCode,
                maxCapacity: Number(maxCapacity) || 60,
              };

              toast.success(`Added ${teacher.full_name} for ${selectedSubject.name}.`);
              return {
                ...sect,
                teachers: sect.teachers.includes(teacher.full_name)
                  ? sect.teachers
                  : [...sect.teachers, teacher.full_name],
                teacherAssignments: [...currentAssignments, nextAssignment],
              };
            }),
          };
        }),
      };
    });

    saveDepartments(updatedDepartments);
  };

  // subjects are fetched automatically from backend and saved into departments state

  const handleRemove = (assignment: TeacherSubjectAssignment) => {
    setRemoveTargetAssignment(assignment);
  };

  const confirmRemove = () => {
    if (!removeTargetAssignment) return;
    if (!selectedDeptId || !selectedYear || !selectedSectionName || !selectedSemester) return;

    const updatedDepartments = departments.map((dept) => {
      if (dept.id !== selectedDeptId) return dept;

      return {
        ...dept,
        years: dept.years.map((yr) => {
          if (yr.year !== selectedYear) return yr;

          return {
            ...yr,
            sections: yr.sections.map((sect) => {
              if (sect.name !== selectedSectionName || String((sect as any).semester || "") !== selectedSemester) return sect;

              const nextAssignments = ((sect as any).teacherAssignments ?? []).filter(
                (item: TeacherSubjectAssignment) =>
                  !(item.teacherId === removeTargetAssignment.teacherId && item.subjectCode === removeTargetAssignment.subjectCode)
              );
              const remainingTeacherNames = new Set(nextAssignments.map((item: TeacherSubjectAssignment) => item.teacherName));

              toast.info(`Removed ${removeTargetAssignment.teacherName} from ${removeTargetAssignment.subjectName}.`);
              return {
                ...sect,
                teachers: sect.teachers.filter((t) => remainingTeacherNames.has(t)),
                teacherAssignments: nextAssignments,
              };
            }),
          };
        }),
      };
    });

    saveDepartments(updatedDepartments);
  };

  // Reset dependent fields on parent change and fetch batches
  const handleDeptChange = (value: string) => {
    setSelectedDeptId(value);
    setSelectedYear("");
    setSelectedSectionName("");
    setSelectedSemester("");
    setSelectedSubjectCode("");
    setAvailableSubjects([]);

    if (!value) return;

    setBatchesLoading(true);
    queryClient.fetchQuery({
      queryKey: ["academic-batches", value],
      queryFn: () => getAcademicBatchesByDepartment(value),
    })
      .then((data) => {
        const rawBatches = Array.isArray(data)
          ? data
          : (data?.responseData ?? data?.data ?? []);

        console.debug("[AssignTeacher] rawBatches for dept ", value, rawBatches);

        const yearsMap: { [yearName: string]: { name: string; id: string; classId?: string; semester?: string; academicTermId?: string }[] } = {};
        rawBatches.forEach((batch: any) => {
          const yearName = batch.year ?? "Unknown Year";
          const batchId = String(batch.batchId ?? batch.id ?? "");
          const academicTermId = batch.academicTermId ?? batch.academicTerm ?? batch.academic_term_id ?? batch.academic_term ?? batch.year ?? "";
          
          if (batch.classes && Array.isArray(batch.classes)) {
            batch.classes.forEach((c: any) => {
              const classId = String(c.id ?? "");
              const className = c.name ?? "Unknown Section";
              const semester = String(c.semester ?? "");

              if (!yearsMap[yearName]) {
                yearsMap[yearName] = [];
              }
              yearsMap[yearName].push({ name: className, id: batchId, classId, semester, academicTermId });
            });
          }
        });

        const mappedYears = Object.entries(yearsMap).map(([yearName, sectionsList]) => {
          return {
            year: yearName,
            sections: sectionsList.map((sec) => {
              const existingDept = departments.find((d) => d.id === value);
              const existingYear = existingDept?.years?.find((y) => y.year === yearName);
              const existingSec = existingYear?.sections?.find((s) => s.name === sec.name && String((s as any).semester || "") === sec.semester);

              return {
                name: sec.name,
                semester: sec.semester,
                batchId: sec.id,
                classId: sec.classId,
                academicTermId: sec.academicTermId,
                teachers: existingSec?.teachers ?? [],
                students: existingSec?.students ?? [],
                subjects: existingSec?.subjects ?? [],
                teacherAssignments: (existingSec as any)?.teacherAssignments ?? [],
              };
            }),
          };
        });

        console.debug("[AssignTeacher] mappedYears for dept ", value, mappedYears);

        const updatedDepartments = departments.map((dept) => {
          if (dept.id === value) {
            return {
              ...dept,
              years: mappedYears,
            };
          }
          return dept;
        });

        saveDepartments(updatedDepartments);
      })
      .catch((err) => {
        console.error("Error loading academic batches:", err);
        toast.error("Failed to load academic batches for this department.");
      })
      .finally(() => {
        setBatchesLoading(false);
      });
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSelectedSectionName("");
    setSelectedSemester("");
    setSelectedSubjectCode("");
    setAvailableSubjects([]);
  };

  const handleSectionChange = (value: string) => {
    setSelectedSectionName(value);
    setSelectedSemester("");
    setSelectedSubjectCode("");
    setAvailableSubjects([]);
  };

  // Load subjects for the selected class using useCoursesByClass query from courseclassAPI
  const isQueryEnabled = !!selectedDeptId && !!(selectedSection as any)?.batchId && !!selectedSemester && !!(selectedSection as any)?.classId;
  const { data: rawSubjects, isLoading: subjectsQueryLoading } = useCoursesByClass(
    isQueryEnabled ? (selectedSection as any)?.classId : ""
  );

  const subjectsLoading = subjectsQueryLoading;

  useEffect(() => {
    if (!rawSubjects) {
      setAvailableSubjects([]);
      setSelectedSubjectCode("");
      return;
    }

    const subjects = (Array.isArray(rawSubjects) ? rawSubjects : []).map((item: any) => {
      const sub = item.course ?? item.subject ?? item;
      const name = sub.name ?? sub.subjectName ?? sub.subject_name ?? sub.courseName ?? sub.course_name ?? "Unknown Subject";
      const code = sub.code ?? sub.subjectCode ?? sub.subject_code ?? sub.courseCode ?? sub.course_code ?? "";
      const id = sub.id ?? sub.subjectId ?? sub.subject_id ?? (code && code !== "N/A" ? code : name);
      return {
        ...sub,
        name,
        code: code || "N/A",
        id: id || "N/A"
      };
    });

    setAvailableSubjects(subjects);
    setSelectedSubjectCode("");

    // update the departments in-memory with fetched subjects for this section
    if (!selectedDeptId || !selectedYear || !selectedSectionName || !selectedSemester) return;
    const updated = departments.map((dept) => {
      if (dept.id !== selectedDeptId) return dept;
      return {
        ...dept,
        years: dept.years.map((yr) => {
          if (yr.year !== selectedYear) return yr;
          return {
            ...yr,
            sections: yr.sections.map((sect) => {
              if (sect.name !== selectedSectionName || String((sect as any).semester || "") !== selectedSemester) return sect;
              return {
                ...sect,
                subjects: subjects,
              };
            }),
          };
        }),
      };
    });

    saveDepartments(updated);
  }, [rawSubjects, selectedDeptId, selectedYear, selectedSectionName, selectedSemester]);

  return (
    <AdminShell title="Teacher Department Assignment">
      <section className="container py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Teacher Assignment Console
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Associate qualified educators with specific department sections, class cohorts, and study programs.
            </p>
          </div>
          <div className="flex gap-2">
            <Card className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 shadow-sm rounded-xl">
              <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Teachers</p>
                <p className="text-lg font-bold text-foreground">{teachers.length}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 shadow-sm rounded-xl">
              <Layers className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Departments</p>
                <p className="text-lg font-bold text-foreground">{departments.length}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Assignment Form Card */}
          <Card className="lg:col-span-2 p-6 bg-card shadow-lg border border-border rounded-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-3">
                <UserCheck className="h-5 w-5 text-rose-600" />
                <h2 className="text-lg font-semibold text-foreground">Assign Teachers</h2>
              </div>

              {/* Select Teacher */}
              <div className="space-y-2">
                <Label htmlFor="teacher-select">Select Teacher</Label>
                {teachersLoading ? (
                  <div className="h-10 w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                    Loading instructors...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Search bar inside teacher select */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search teacher by name/code..."
                        className="pl-8 h-9 text-xs rounded-lg"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                      />
                    </div>
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                      <SelectTrigger id="teacher-select" className="h-11 rounded-lg">
                        <SelectValue placeholder="Choose a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTeachersForSelect.length === 0 ? (
                          <div className="p-3 text-center text-xs text-muted-foreground">
                            No teachers found
                          </div>
                        ) : (
                          filteredTeachersForSelect.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.full_name} ({t.employee_code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Select Department */}
              <div className="space-y-2">
                <Label htmlFor="department-select">Department</Label>
                {departmentsLoading ? (
                  <div className="h-11 w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                    Loading departments...
                  </div>
                ) : (
                  <Select value={selectedDeptId} onValueChange={handleDeptChange}>
                    <SelectTrigger id="department-select" className="h-11 rounded-lg">
                      <SelectValue placeholder="Choose department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Select Year */}
              <div className="space-y-2">
                <Label htmlFor="year-select">Academic Year</Label>
                {batchesLoading ? (
                  <div className="h-11 w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                    Loading academic years...
                  </div>
                ) : (
                  <Select
                    value={selectedYear}
                    onValueChange={handleYearChange}
                    disabled={!selectedDeptId}
                  >
                    <SelectTrigger id="year-select" className="h-11 rounded-lg disabled:opacity-50">
                      <SelectValue placeholder={selectedDeptId ? "Choose year" : "Select department first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((yr) => (
                        <SelectItem key={yr.year} value={yr.year}>
                          {yr.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Select Section */}
              <div className="space-y-2">
                <Label htmlFor="section-select">Section / Class</Label>
                {batchesLoading ? (
                  <div className="h-11 w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                    Loading sections...
                  </div>
                ) : (
                  <Select
                    value={selectedSectionName}
                    onValueChange={handleSectionChange}
                    disabled={!selectedYear}
                  >
                    <SelectTrigger id="section-select" className="h-11 rounded-lg disabled:opacity-50">
                      <SelectValue placeholder={selectedYear ? "Choose section" : "Select year first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map((sect) => (
                        <SelectItem key={sect} value={sect}>
                          {sect}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Select Semester */}
              <div className="space-y-2">
                <Label htmlFor="semester-select">Semester</Label>
                <Select
                  value={selectedSemester}
                  onValueChange={(value) => {
                    setSelectedSemester(value);
                    setSelectedSubjectCode("");
                    setAvailableSubjects([]);
                  }}
                  disabled={!selectedSectionName}
                >
                  <SelectTrigger id="semester-select" className="h-11 rounded-lg disabled:opacity-50">
                    <SelectValue placeholder={selectedSectionName ? "Choose semester" : "Select section first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject (auto-loaded) */}
              <div className="space-y-2">
                <Label htmlFor="subject-select">Subject</Label>
                {subjectsLoading ? (
                  <div className="h-11 w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                    Loading subjects...
                  </div>
                ) : (
                  <Select value={selectedSubjectCode} onValueChange={setSelectedSubjectCode} disabled={!selectedSemester || subjectsLoading || availableSubjects.length === 0}>
                    <SelectTrigger id="subject-select" className="h-11 rounded-lg">
                      <SelectValue placeholder={availableSubjects.length ? "Choose subject" : "No subjects available"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">No subjects available</div>
                      ) : (
                        availableSubjects.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Max Capacity Input */}
              <div className="space-y-2">
                <Label htmlFor="max-capacity">Max Capacity</Label>
                <Input
                  id="max-capacity"
                  type="number"
                  placeholder="e.g. 60"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value ? Number(e.target.value) : "")}
                  className="h-11 rounded-lg"
                />
              </div>
            </div>

            <Button
              onClick={handleAssign}
              disabled={loading || !selectedTeacherId || !selectedDeptId || !selectedYear || !selectedSectionName || !selectedSemester || !selectedSubject}
              className="w-full mt-6 rounded-xl h-12 font-medium transition duration-200 transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add to List
            </Button>
          </Card>

          {/* Current Assignments Display Card */}
          <Card className="lg:col-span-3 p-6 bg-card shadow-lg border border-border rounded-2xl flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-foreground">Preview</h2>
              </div>
              {selectedSection && (
                <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/50">
                  {selectedAssignments.length} Active
                </span>
              )}
            </div>

            {selectedDeptId && selectedYear && selectedSectionName && selectedSemester ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-4 bg-muted/30 p-4 rounded-xl border border-border/50 text-sm">
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <span className="text-muted-foreground block text-xs">Department</span>
                        <span className="font-semibold text-foreground">{selectedDepartment?.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Program Year</span>
                        <span className="font-semibold text-foreground">{selectedYear}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Class Section</span>
                        <span className="font-semibold text-rose-700 dark:text-rose-400">{selectedSectionName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Semester</span>
                        <span className="font-semibold text-rose-700 dark:text-rose-400">Semester {selectedSemester}</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Assigned Faculty Members</h3>
                  {(!selectedSection || selectedAssignments.length === 0) ? (
                    <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl flex flex-col items-center justify-center p-4">
                      <ShieldAlert className="h-8 w-8 text-amber-500 mb-2" />
                      <p className="text-sm font-medium text-foreground">No teachers assigned</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                        There are currently no teachers assigned to this department section. Use the panel on the left to make an assignment.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea ref={scrollContainerRef} className="h-[270px] border border-border/80 rounded-xl">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted border-b border-border/80 text-xs text-muted-foreground font-semibold sticky top-0 bg-card z-10">
                          <tr>
                            <th className="px-4 py-2">No</th>
                            <th className="px-4 py-2">Faculty Name</th>
                            <th className="px-4 py-2">Subject</th>
                            <th className="px-4 py-2">Max Capacity</th>
                            <th className="px-4 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {selectedAssignments.map((assignment, idx) => (
                            <tr key={`${assignment.teacherId}-${assignment.subjectCode}`} className="hover:bg-muted/10 transition">
                              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-foreground">{assignment.teacherName}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">{assignment.subjectName}</span>
                                  <span className="text-[10px] uppercase font-mono text-muted-foreground">{assignment.subjectCode}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground font-medium">{assignment.maxCapacity ?? 60}</td>
                              <td className="px-4 py-3 text-right">
                                 <CustomTooltip content="Unassign Teacher">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => handleRemove(assignment)}
                                     className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg h-8 w-8"
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </CustomTooltip>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  )}
                </div>

                {selectedSection && selectedAssignments.length > 0 && (
                  <Button
                    onClick={handleConfirmAssignment}
                    disabled={confirming}
                    className="w-full mt-6 rounded-xl h-12 font-medium transition duration-200 transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    {confirming ? "Saving assignments..." : "Confirm Assignment"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/80 rounded-2xl p-8 text-center bg-muted/5">
                <Users className="h-12 w-12 text-muted-foreground/60 mb-3 animate-pulse" />
                <h3 className="text-base font-semibold text-foreground">Select Department & Section</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[320px]">
                  Please specify a department, year, section, and semester to view or manage assigned teachers.
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>
      <ConfirmModal
        isOpen={removeTargetAssignment !== null}
        onClose={() => setRemoveTargetAssignment(null)}
        onConfirm={confirmRemove}
        title="Remove Teacher Assignment"
        description={`Are you sure you want to remove ${removeTargetAssignment?.teacherName ?? "this teacher"} from ${removeTargetAssignment?.subjectName ?? "this subject"}?`}
      />
    </AdminShell>
  );
};

export default AssignTeacher;
