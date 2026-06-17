import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown, Loader2 } from "lucide-react";
import { AdminShell } from "./AdminShell";
import type { Department } from "./departmentsData";
import { toast } from "sonner";
import ExportButton from "@/components/ExportButton";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetDepartments,
  useGetAcademicBatchesByDepartment,
  useCreateDepartment,
  useGetTeachersByClassBatch,
  useGetStudentsByClassBatch,
  useGetSubjectsByClassBatch
} from "@/services/departmentAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


/*const createDefaultYears = (deptName: string, deptId: string) => {
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
};*/

const Departments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDescription, setNewDeptDescription] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"teachers" | "students" | "subjects" | null>(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // TanStack Query Hooks
  const { data: rawDepts, isLoading: departmentsLoading } = useGetDepartments();
  const departments = useMemo(() => {
    return Array.isArray(rawDepts)
      ? rawDepts.map((d: any) => {
          const id = String(d.id ?? d.departmentId ?? d.department_id ?? "");
          const name = d.name ?? d.departmentName ?? d.department_name ?? "Unknown Department";
          return {
            id,
            name,
            years: []
          };
        })
      : [];
  }, [rawDepts]);

  const { data: rawBatches, isLoading: batchesLoading } = useGetAcademicBatchesByDepartment(selectedDeptId, {
    enabled: !!selectedDeptId
  });

  const batches = useMemo(() => {
    if (!rawBatches) return [];
    return Array.isArray(rawBatches)
      ? rawBatches
      : (rawBatches.responseData ?? rawBatches.data ?? []);
  }, [rawBatches]);

  const createDeptMutation = useCreateDepartment();
  const isSubmitting = createDeptMutation.isPending;

  const selectedDept = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  // Reset helper functions when department changes
  const handleDeptChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSelectedYear("");
    setSelectedClass("");
    setSelectedSemester("");
    setSelectedTab(null);
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      toast.error("Department name is required.");
      return;
    }

    const payload = {
      institutionId: user?.institutionId || "",
      name: newDeptName.trim(),
    };

    try {
      await createDeptMutation.mutateAsync(payload);
      toast.success("Department created successfully!");
      setIsAddModalOpen(false);

      // Reset form fields
      setNewDeptName("");
      setNewDeptCode("");
      setNewDeptDescription("");
    } catch (err: any) {
      console.error("Failed to create department in backend:", err);
      toast.error("Failed to create department.");
    }
  };

  // Get available years from batches
  const availableYears = useMemo(() => {
    return batches.map((b) => b.year);
  }, [batches]);

  // Get available sections for selected year
  const availableClasses = useMemo(() => {
    const selectedBatch = batches.find((b) => b.year === selectedYear);
    if (!selectedBatch || !selectedBatch.classes) return [];
    const names = selectedBatch.classes.map((c: any) => c.name);
    return Array.from(new Set(names)) as string[];
  }, [batches, selectedYear]);

  // Get available semesters for selected year and section/class
  const availableSemesters = useMemo(() => {
    const selectedBatch = batches.find((b) => b.year === selectedYear);
    if (!selectedBatch || !selectedBatch.classes) return [];
    const matchingClasses = selectedBatch.classes.filter((c: any) => c.name === selectedClass);
    const semesters = matchingClasses.map((c: any) => String(c.semester));
    return Array.from(new Set(semesters)) as string[];
  }, [batches, selectedYear, selectedClass]);

  // Derived selected batch ID and class ID
  const selectedBatchId = useMemo(() => {
    const selectedBatch = batches.find((b) => b.year === selectedYear);
    return selectedBatch?.batchId ?? selectedBatch?.id ?? "";
  }, [batches, selectedYear]);

  const selectedClassId = useMemo(() => {
    const selectedBatch = batches.find((b) => b.year === selectedYear);
    if (!selectedBatch || !selectedBatch.classes) return "";
    const matchingClass = selectedBatch.classes.find(
      (c: any) => c.name === selectedClass && String(c.semester) === selectedSemester
    );
    return matchingClass?.id ?? "";
  }, [batches, selectedYear, selectedClass, selectedSemester]);

  // Reset dependent selections on parent selection changes
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedClass("");
    setSelectedSemester("");
    setSelectedTab(null);
  };

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setSelectedSemester("");
    setSelectedTab(null);
  };

  // Auto-select "teachers" tab if none is selected
  React.useEffect(() => {
    if (selectedDeptId && selectedYear && selectedClass && selectedSemester && !selectedTab) {
      setSelectedTab("teachers");
    }
  }, [selectedDeptId, selectedYear, selectedClass, selectedSemester, selectedTab]);

  const isTabQueryEnabled = !!selectedDeptId && !!selectedYear && !!selectedClass && !!selectedSemester && !!selectedClassId && !!selectedBatchId;

  // 1. Fetch Teachers
  const teachersParams = useMemo(() => ({
    departmentId: selectedDeptId,
    batchId: selectedBatchId,
    semester: selectedSemester,
    classId: selectedClassId
  }), [selectedDeptId, selectedBatchId, selectedSemester, selectedClassId]);

  const { data: rawTeachers, isLoading: teachersLoading } = useGetTeachersByClassBatch(teachersParams, {
    enabled: isTabQueryEnabled
  });

  const activeTeachers = useMemo(() => {
    if (!rawTeachers) return [];
    const list = Array.isArray(rawTeachers) ? rawTeachers : [];
    return list.map((t: any) => t.fullName ?? t.full_name ?? t.name ?? String(t));
  }, [rawTeachers]);

  // 2. Fetch Students
  const studentsParams = useMemo(() => ({
    departmentId: selectedDeptId,
    batchId: selectedBatchId,
    semester: selectedSemester,
    classesId: selectedClassId
  }), [selectedDeptId, selectedBatchId, selectedSemester, selectedClassId]);

  const { data: rawStudents, isLoading: studentsLoading } = useGetStudentsByClassBatch(studentsParams, {
    enabled: isTabQueryEnabled
  });

  const activeStudents = useMemo(() => {
    if (!rawStudents) return [];
    const list = Array.isArray(rawStudents) ? rawStudents : [];
    return list.map((s: any) => s.fullName ?? s.full_name ?? s.name ?? String(s));
  }, [rawStudents]);

  // 3. Fetch Subjects
  const subjectsParams = useMemo(() => ({
    departmentId: selectedDeptId,
    batchId: selectedBatchId,
    semester: selectedSemester,
    classId: selectedClassId
  }), [selectedDeptId, selectedBatchId, selectedSemester, selectedClassId]);

  const { data: rawSubjects, isLoading: subjectsLoading } = useGetSubjectsByClassBatch(subjectsParams, {
    enabled: isTabQueryEnabled
  });

  const activeSubjects = useMemo(() => {
    if (!rawSubjects) return [];
    const list = Array.isArray(rawSubjects) ? rawSubjects : [];
    return list.map((item: any) => {
      const sub = item.course ?? item.subject ?? item;
      return {
        name: sub.name ?? sub.courseName ?? sub.course_name ?? sub.subjectName ?? sub.subject_name ?? "Unknown Subject",
        code: sub.code ?? sub.courseCode ?? sub.course_code ?? sub.subjectCode ?? sub.subject_code ?? "N/A"
      };
    });
  }, [rawSubjects]);

  const tabLoading = useMemo(() => {
    if (selectedTab === "teachers") return teachersLoading;
    if (selectedTab === "students") return studentsLoading;
    if (selectedTab === "subjects") return subjectsLoading;
    return false;
  }, [selectedTab, teachersLoading, studentsLoading, subjectsLoading]);

  return (
    <AdminShell title="Departments">
      <section className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Departments</h1>
            <p className="text-sm text-muted-foreground">Select a department, then choose year and section to view data.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Department
            </Button>
          </div>
        </div>

        {/* Department, Year, and Section Dropdowns in Single Bar */}
        <Card className="p-6 space-y-4 shadow-md border-border bg-card">
          <div className="flex gap-4 items-end">
            {/* Department Dropdown */}
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Select Department</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                  disabled={departmentsLoading}
                  className="w-full flex items-center justify-between gap-4 rounded-lg border border-input bg-card px-4 py-3 text-left hover:bg-muted/50 hover:border-primary/30 transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 shadow-sm"
                >
                  <span className="text-foreground font-medium">
                    {departmentsLoading ? "Loading departments..." : (selectedDept?.name || "Select department")}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition ${showDeptDropdown ? "rotate-180" : ""}`} />
                </button>

                {showDeptDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto backdrop-blur-md">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          handleDeptChange(dept.id);
                          setShowDeptDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition hover:bg-accent hover:text-accent-foreground ${selectedDeptId === dept.id
                          ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                          : "text-foreground"
                          }`}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Year Dropdown */}
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Select Year</label>
              {batchesLoading ? (
                <div className="w-full flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-3 text-muted-foreground shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm">Loading batches...</span>
                </div>
              ) : (
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  disabled={!selectedDeptId}
                  className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground hover:bg-muted/50 hover:border-primary/30 transition focus:outline-none focus:ring-2 focus:ring-ring shadow-sm disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-card [&>option]:text-foreground"
                >
                  <option value="">Select year</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Section Dropdown */}
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Select Section</label>
              {batchesLoading ? (
                <div className="w-full flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-3 text-muted-foreground shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm">Loading sections...</span>
                </div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  disabled={!selectedYear}
                  className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground hover:bg-muted/50 hover:border-primary/30 transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-sm [&>option]:bg-card [&>option]:text-foreground"
                >
                  <option value="">Select section</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Semester Dropdown */}
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Select Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setSelectedTab(null);
                }}
                disabled={!selectedClass}
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground hover:bg-muted/50 hover:border-primary/30 transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-sm [&>option]:bg-card [&>option]:text-foreground"
              >
                <option value="">Select semester</option>
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Teacher/Student/Subject Buttons */}
        {selectedDept && selectedYear && selectedClass && selectedSemester && (
          <Card className="p-6 space-y-4 border-border bg-card shadow-sm">
            <p className="text-sm text-muted-foreground">
              {selectedDept.name} · {selectedYear} · {selectedClass} · Semester {selectedSemester}
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                onClick={() => setSelectedTab("teachers")}
                variant={selectedTab === "teachers" ? "default" : "outline"}
              >
                Teachers ({activeTeachers.length})
              </Button>
              <Button
                onClick={() => setSelectedTab("students")}
                variant={selectedTab === "students" ? "default" : "outline"}
              >
                Students ({activeStudents.length})
              </Button>
              <Button
                onClick={() => setSelectedTab("subjects")}
                variant={selectedTab === "subjects" ? "default" : "outline"}
              >
                Subjects ({activeSubjects.length})
              </Button>

              <div className="ml-auto">
                <ExportButton
                  data={
                    selectedTab === "teachers"
                      ? activeTeachers.map((name, idx) => ({ no: idx + 1, name }))
                      : selectedTab === "students"
                      ? activeStudents.map((name, idx) => ({ no: idx + 1, name }))
                      : activeSubjects.map((sub, idx) => ({ no: idx + 1, name: sub.name, code: sub.code }))
                  }
                  columns={
                    selectedTab === "subjects"
                      ? [
                          { key: "no", label: "No" },
                          { key: "name", label: "Subject Name" },
                          { key: "code", label: "Subject Code" },
                        ]
                      : [
                          { key: "no", label: "No" },
                          { key: "name", label: selectedTab === "teachers" ? "Teacher Name" : "Student Name" },
                        ]
                  }
                  fileName={`${selectedDept?.name || "department"}_${selectedTab || "data"}`}
                  title={`${selectedDept?.name} - ${selectedTab === "teachers" ? "Teachers" : selectedTab === "students" ? "Students" : "Subjects"} List`}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Data Table */}
        {selectedTab && selectedDeptId && selectedYear && selectedClass && selectedSemester && (
          <Card className="p-6 overflow-x-auto border-border bg-card shadow-sm">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                {selectedTab === "teachers" && "Teachers List"}
                {selectedTab === "students" && "Students List"}
                {selectedTab === "subjects" && "Subjects List"}
              </p>
            </div>

            {tabLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-medium">Fetching {selectedTab} list...</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">No</th>
                    {selectedTab === "teachers" && (
                      <>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Teacher Name</th>
                      </>
                    )}
                    {selectedTab === "students" && (
                      <>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Student Name</th>
                      </>
                    )}
                    {selectedTab === "subjects" && (
                      <>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Subject Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Subject Code</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedTab === "teachers" &&
                    activeTeachers.map((teacher, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 text-foreground">{teacher}</td>
                      </tr>
                    ))}

                  {selectedTab === "students" &&
                    activeStudents.map((student, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 text-foreground">{student}</td>
                      </tr>
                    ))}

                  {selectedTab === "subjects" &&
                    activeSubjects.map((subject, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 text-foreground">{subject.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs uppercase">{subject.code}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* Empty State */}
        {!selectedTab && (
          <Card className="p-12 text-center border-border bg-card shadow-sm">
            <p className="text-muted-foreground">Select department, year, section, and semester above to view data.</p>
          </Card>
        )}

        {/* Add Department Dialog Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent
            className="sm:max-w-[425px] admin-white-modal"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>
                Create a new department in the institution. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDepartment} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="institute-name">Institute Name</Label>
                <Input
                  id="institute-name"
                  value={user?.institution ?? ""}
                  readOnly
                  className="cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-name">Department Name <span className="text-destructive">*</span></Label>
                <Input
                  id="dept-name"
                  placeholder="e.g. Computer Science & Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting} className="cancel-gray-btn">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Department"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </section>
    </AdminShell>
  );
};

export default Departments;
