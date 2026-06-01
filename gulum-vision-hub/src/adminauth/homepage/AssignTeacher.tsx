import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
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
import { getTeachers } from "@/services/teacherCrudAPI";
import { initialData as deptData, getDepartmentsInMemory, setDepartmentsInMemory, type Department } from "./departmentsData";
import { Users, UserCheck, Trash2, BookOpen, Layers, ShieldAlert, GraduationCap, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TeacherData {
  id: number;
  full_name: string;
  employee_code: string;
  specialization: string;
  qualification: string;
  email: string;
}

const AssignTeacher = () => {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [departments, setDepartments] = useState<Department[]>(() => getDepartmentsInMemory());
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSectionName, setSelectedSectionName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [teachersLoading, setTeachersLoading] = useState<boolean>(true);
  const [teacherSearch, setTeacherSearch] = useState<string>("");

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
    return selectedYearObj?.sections || [];
  }, [selectedYearObj]);

  const selectedSection = useMemo(() => {
    return availableSections.find((s) => s.name === selectedSectionName) || null;
  }, [availableSections, selectedSectionName]);

  const filteredTeachersForSelect = useMemo(() => {
    return teachers.filter((t) =>
      t.full_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.employee_code.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [teachers, teacherSearch]);

  const handleAssign = () => {
    if (!selectedTeacherId || !selectedDeptId || !selectedYear || !selectedSectionName) {
      toast.error("Please select a teacher, department, year, and section.");
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
              if (sect.name !== selectedSectionName) return sect;

              // Check if teacher is already assigned
              if (sect.teachers.includes(teacher.full_name)) {
                toast.warning(`${teacher.full_name} is already assigned to this section.`);
                return sect;
              }

              toast.success(`Successfully assigned ${teacher.full_name} to ${dept.name} (${yr.year} - ${sect.name})`);
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
    if (!selectedDeptId || !selectedYear || !selectedSectionName) return;

    const updatedDepartments = departments.map((dept) => {
      if (dept.id !== selectedDeptId) return dept;

      return {
        ...dept,
        years: dept.years.map((yr) => {
          if (yr.year !== selectedYear) return yr;

          return {
            ...yr,
            sections: yr.sections.map((sect) => {
              if (sect.name !== selectedSectionName) return sect;

              toast.info(`Removed ${teacherName} from section.`);
              return {
                ...sect,
                teachers: sect.teachers.filter((t) => t !== teacherName),
              };
            }),
          };
        }),
      };
    });

    saveDepartments(updatedDepartments);
  };

  // Reset dependent fields on parent change
  const handleDeptChange = (value: string) => {
    setSelectedDeptId(value);
    setSelectedYear("");
    setSelectedSectionName("");
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSelectedSectionName("");
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
                              {t.full_name} ({t.employee_code}) - {t.specialization}
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
              </div>

              {/* Select Year */}
              <div className="space-y-2">
                <Label htmlFor="year-select">Academic Year</Label>
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
              </div>

              {/* Select Section */}
              <div className="space-y-2">
                <Label htmlFor="section-select">Section / Class</Label>
                <Select
                  value={selectedSectionName}
                  onValueChange={setSelectedSectionName}
                  disabled={!selectedYear}
                >
                  <SelectTrigger id="section-select" className="h-11 rounded-lg disabled:opacity-50">
                    <SelectValue placeholder={selectedYear ? "Choose section" : "Select year first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((sect) => (
                      <SelectItem key={sect.name} value={sect.name}>
                        {sect.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleAssign}
              disabled={loading || !selectedTeacherId || !selectedDeptId || !selectedYear || !selectedSectionName}
              className="w-full mt-6 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl h-12 font-medium transition duration-200 transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Assign Teacher
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

            {selectedDeptId && selectedYear && selectedSectionName ? (
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
                      <div className="col-span-2">
                        <span className="text-muted-foreground block text-xs">Class Section</span>
                        <span className="font-semibold text-rose-700 dark:text-rose-400">{selectedSectionName}</span>
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
                    <div className="overflow-hidden border border-border/80 rounded-xl">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b border-border/80 text-xs text-muted-foreground font-semibold">
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemove(teacherName)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg h-8 w-8"
                                  title="Unassign Teacher"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/80 rounded-2xl p-8 text-center bg-muted/5">
                <Users className="h-12 w-12 text-muted-foreground/60 mb-3 animate-pulse" />
                <h3 className="text-base font-semibold text-foreground">Select Department & Section</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[320px]">
                  Please specify a department, year, and section to view or manage assigned teachers.
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>
    </AdminShell>
  );
};

export default AssignTeacher;
