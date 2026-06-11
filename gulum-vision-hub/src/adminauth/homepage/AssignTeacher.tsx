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
import { getTeachers, assignTeachersBulk } from "@/services/teacherCrudAPI";
import { getDepartments, getAcademicBatchesByDepartment } from "@/services/departmentAPI";
import { initialData as deptData, getDepartmentsInMemory, setDepartmentsInMemory, type Department } from "./departmentsData";
import { Users, UserCheck, Trash2, BookOpen, Layers, ShieldAlert, GraduationCap, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeacherData {
  id: number;
  full_name: string;
  employee_code: string;
  specialization: string;
  qualification: string;
  email: string;
}

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
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [departments, setDepartments] = useState<Department[]>(() => getDepartmentsInMemory());
  const [departmentsLoading, setDepartmentsLoading] = useState<boolean>(true);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSectionName, setSelectedSectionName] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [teachersLoading, setTeachersLoading] = useState<boolean>(true);
  const [teacherSearch, setTeacherSearch] = useState<string>("");
  const [batchesLoading, setBatchesLoading] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [removeTargetTeacherName, setRemoveTargetTeacherName] = useState<string | null>(null);

  const handleConfirmAssignment = () => {
    if (!selectedSection) {
      toast.error("No section selected.");
      return;
    }

    const batchId = (selectedSection as any).batchId;
    const classId = (selectedSection as any).classId;
    const departmentId = selectedDeptId;

    if (!batchId || !classId || !departmentId) {
      toast.error("Missing batch, class, or department ID.");
      return;
    }

    // Get selected teacher IDs
    const teacherIds = selectedSection.teachers
      .map((name) => {
        const found = teachers.find((t) => t.full_name === name);
        return found ? found.id : null;
      })
      .filter((id): id is number => id !== null);

    setConfirming(true);
    assignTeachersBulk(batchId, departmentId, classId, teacherIds)
      .then(() => {
        toast.success("Teacher assignments confirmed and saved successfully!");
      })
      .catch((err: any) => {
        console.error("Error confirming teacher assignments:", err);
        const errMsg = err.response?.data?.message ?? err.message ?? "Failed to save teacher assignments.";
        toast.error(errMsg);
      })
      .finally(() => {
        setConfirming(false);
      });
  };

  useEffect(() => {
    getTeachers()
      .then((list) => {
        const mapped = Array.isArray(list)
          ? list.map((t) => ({
              id: t.id,
              full_name: t.full_name || `Teacher ${t.id}`,
              employee_code: t.employee_code || "N/A",
              specialization: t.specialization || "N/A",
              qualification: t.qualification || "N/A",
              email: t.email || ""
            }))
          : [];
        setTeachers(mapped);
      })
      .catch(() => toast.error("Unable to load teachers list."))
      .finally(() => setTeachersLoading(false));

    setDepartmentsLoading(true);
    getDepartments()
      .then((list) => {
        const localDepts = getDepartmentsInMemory();
        const mapped = Array.isArray(list)
          ? list.map((d) => {
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
      })
      .catch((err) => {
        console.error("Error loading departments API:", err);
        setDepartments(getDepartmentsInMemory());
      })
      .finally(() => setDepartmentsLoading(false));
  }, []);

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
  }, [selectedSection?.teachers?.length]);

  const filteredTeachersForSelect = useMemo(() => {
    return teachers.filter((t) =>
      t.full_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.employee_code.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [teachers, teacherSearch]);

  const handleAssign = () => {
    if (!selectedTeacherId || !selectedDeptId || !selectedYear || !selectedSectionName || !selectedSemester) {
      toast.error("Please select a teacher, department, year, section, and semester.");
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

              // Check if teacher is already assigned
              if (sect.teachers.includes(teacher.full_name)) {
                toast.warning(`${teacher.full_name} is already assigned to this section.`);
                return sect;
              }

              toast.success(`Successfully assigned ${teacher.full_name} to ${dept.name} (${yr.year} - ${sect.name} - Sem ${selectedSemester})`);
              return {
                ...sect,
                teachers: [...sect.teachers, teacher.full_name],
              };
            }),
          };
        }),
      };
    });

    saveDepartments(updatedDepartments);
  };

  const handleRemove = (teacherName: string) => {
    setRemoveTargetTeacherName(teacherName);
  };

  const confirmRemove = () => {
    if (!removeTargetTeacherName) return;
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

              toast.info(`Removed ${removeTargetTeacherName} from section.`);
              return {
                ...sect,
                teachers: sect.teachers.filter((t) => t !== removeTargetTeacherName),
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

    if (!value) return;

    setBatchesLoading(true);
    getAcademicBatchesByDepartment(value)
      .then((data) => {
        const rawBatches = Array.isArray(data)
          ? data
          : (data?.responseData ?? data?.data ?? []);

        const yearsMap: { [yearName: string]: { name: string; id: string; classId?: string; semester?: string }[] } = {};
        rawBatches.forEach((batch: any) => {
          const yearName = batch.year ?? "Unknown Year";
          const batchId = String(batch.batchId ?? batch.id ?? "");
          
          if (batch.classes && Array.isArray(batch.classes)) {
            batch.classes.forEach((c: any) => {
              const classId = String(c.id ?? "");
              const className = c.name ?? "Unknown Section";
              const semester = String(c.semester ?? "");

              if (!yearsMap[yearName]) {
                yearsMap[yearName] = [];
              }
              yearsMap[yearName].push({ name: className, id: batchId, classId, semester });
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
                teachers: existingSec?.teachers ?? [],
                students: existingSec?.students ?? [],
                subjects: existingSec?.subjects ?? [],
              };
            }),
          };
        });

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
  };

  const handleSectionChange = (value: string) => {
    setSelectedSectionName(value);
    setSelectedSemester("");
  };

  return (
    <AdminShell title="Teacher Department Assignment">
      <section className="container py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-rose-600 to-indigo-600 bg-clip-text text-transparent">
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
                  onValueChange={setSelectedSemester}
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
            </div>

            <Button
              onClick={handleAssign}
              disabled={loading || !selectedTeacherId || !selectedDeptId || !selectedYear || !selectedSectionName || !selectedSemester}
              className="w-full mt-6 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl h-12 font-medium transition duration-200 transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-2"
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
                  {selectedSection.teachers.length} Active
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
                  {(!selectedSection || selectedSection.teachers.length === 0) ? (
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
                            <th className="px-4 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {selectedSection.teachers.map((teacherName, idx) => (
                            <tr key={idx} className="hover:bg-muted/10 transition">
                              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-foreground">{teacherName}</td>
                              <td className="px-4 py-3 text-right">
                                 <CustomTooltip content="Unassign Teacher">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => handleRemove(teacherName)}
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

                {selectedSection && selectedSection.teachers.length > 0 && (
                  <Button
                    onClick={handleConfirmAssignment}
                    disabled={confirming}
                    className="w-full mt-6 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl h-12 font-medium transition duration-200 transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-2"
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
        isOpen={removeTargetTeacherName !== null}
        onClose={() => setRemoveTargetTeacherName(null)}
        onConfirm={confirmRemove}
        title="Remove Teacher Assignment"
        description={`Are you sure you want to remove ${removeTargetTeacherName} from this section assignment?`}
      />
    </AdminShell>
  );
};

export default AssignTeacher;
