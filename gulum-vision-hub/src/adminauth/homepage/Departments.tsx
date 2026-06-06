import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown, Loader2 } from "lucide-react";
import { AdminShell } from "./AdminShell";
import type { Department } from "./departmentsData";
import { toast } from "sonner";
import { getDepartments, getAcademicBatchesByDepartment } from "@/services/departmentAPI";
import api from "@/services/api";

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDept, setNewDept] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"teachers" | "students" | "subjects" | null>(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const tabLoading = useMemo(() => {
    if (selectedTab === "teachers") return teachersLoading;
    if (selectedTab === "students") return studentsLoading;
    if (selectedTab === "subjects") return subjectsLoading;
    return false;
  }, [selectedTab, teachersLoading, studentsLoading, subjectsLoading]);

  const [batches, setBatches] = useState<any[]>([]);

  const [activeTeachers, setActiveTeachers] = useState<string[]>([]);
  const [activeStudents, setActiveStudents] = useState<string[]>([]);
  const [activeSubjects, setActiveSubjects] = useState<{ name: string; code: string }[]>([]);

  const navigate = useNavigate();

  const selectedDept = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  // Load departments on mount
  React.useEffect(() => {
    setDepartmentsLoading(true);
    getDepartments()
      .then((list) => {
        const mapped: Department[] = Array.isArray(list)
          ? list.map((d) => {
              const id = String(d.id ?? d.departmentId ?? d.department_id ?? "");
              const name = d.name ?? d.departmentName ?? d.department_name ?? "Unknown Department";
              return {
                id,
                name,
                years: []
              };
            })
          : [];
        setDepartments(mapped);
      })
      .catch((err) => {
        console.error("Error loading departments API:", err);
        toast.error("Failed to load departments from API.");
      })
      .finally(() => setDepartmentsLoading(false));
  }, []);

  const handleDeptChange = (deptId: string, currentDepartments = departments) => {
    setSelectedDeptId(deptId);
    setSelectedYear("");
    setSelectedClass("");
    setSelectedSemester("");
    setSelectedTab(null);
    setBatches([]);
    setActiveTeachers([]);
    setActiveStudents([]);
    setActiveSubjects([]);

    if (!deptId) return;

    setBatchesLoading(true);
    getAcademicBatchesByDepartment(deptId)
      .then((data) => {
        const rawBatches = Array.isArray(data)
          ? data
          : (data?.responseData ?? data?.data ?? []);
        setBatches(rawBatches);
      })
      .catch((err) => {
        console.error("Error loading academic batches:", err);
        toast.error("Failed to load academic batches for this department.");
      })
      .finally(() => {
        setBatchesLoading(false);
      });
  };

  const addDepartment = () => {
    if (!newDept.trim()) return;
    const dept: Department = { id: Date.now().toString(), name: newDept.trim(), years: [] };
    setDepartments((current) => [dept, ...current]);
    setNewDept("");
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
    setActiveTeachers([]);
    setActiveStudents([]);
    setActiveSubjects([]);
  };

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setSelectedSemester("");
    setSelectedTab(null);
    setActiveTeachers([]);
    setActiveStudents([]);
    setActiveSubjects([]);
  };

  // Fetch active tab data
  React.useEffect(() => {
    if (!selectedDeptId || !selectedYear || !selectedClass || !selectedSemester) {
      return;
    }

    if (!selectedClassId || !selectedBatchId) {
      return;
    }

    // Auto-select "teachers" tab if none is selected
    if (!selectedTab) {
      setSelectedTab("teachers");
    }

    setTeachersLoading(true);
    setStudentsLoading(true);
    setSubjectsLoading(true);

    // 1. Fetch Teachers
    api.get(`/teachers/department_class_batch`, {
      params: {
        departmentId: selectedDeptId,
        batchId: selectedBatchId,
        semester: selectedSemester,
        classId: selectedClassId
      }
    })
      .then((response) => {
        const responseData = response.data.responseData ?? response.data ?? [];
        const list = Array.isArray(responseData) ? responseData : [];
        const teachers = list.map((t: any) => t.fullName ?? t.full_name ?? t.name ?? String(t));
        setActiveTeachers(teachers);
      })
      .catch((error) => {
        console.error("Error loading teachers data:", error);
        toast.error("Failed to load teachers data from backend.");
        setActiveTeachers([]);
      })
      .finally(() => {
        setTeachersLoading(false);
      });

    // 2. Fetch Students
    api.get(`/api/students/department_class_batch`, {
      params: {
        departmentId: selectedDeptId,
        batchId: selectedBatchId,
        semester: selectedSemester,
        classesId: selectedClassId
      }
    })
      .then((response) => {
        const responseData = response.data.responseData ?? response.data ?? [];
        const list = Array.isArray(responseData) ? responseData : [];
        const students = list.map((s: any) => s.fullName ?? s.full_name ?? s.name ?? String(s));
        setActiveStudents(students);
      })
      .catch((error) => {
        console.error("Error loading students data:", error);
        toast.error("Failed to load students data from backend.");
        setActiveStudents([]);
      })
      .finally(() => {
        setStudentsLoading(false);
      });

    // 3. Fetch Subjects
    api.get(`/subjects/department_class_batch`, {
      params: {
        departmentId: selectedDeptId,
        batchId: selectedBatchId,
        semester: selectedSemester,
        classId: selectedClassId
      }
    })
      .then((response) => {
        const responseData = response.data.responseData ?? response.data ?? [];
        const list = Array.isArray(responseData) ? responseData : [];
        const subjects = list.map((sub: any) => ({
          name: sub.name ?? sub.subjectName ?? sub.subject_name ?? "Unknown Subject",
          code: sub.code ?? sub.subjectCode ?? sub.subject_code ?? "N/A"
        }));
        setActiveSubjects(subjects);
      })
      .catch((error) => {
        console.error("Error loading subjects data:", error);
        toast.error("Failed to load subjects data from backend.");
        setActiveSubjects([]);
      })
      .finally(() => {
        setSubjectsLoading(false);
      });
  }, [selectedDeptId, selectedYear, selectedClass, selectedSemester, selectedClassId, selectedBatchId]);

  return (
    <AdminShell title="Departments">
      <section className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Departments</h1>
            <p className="text-sm text-slate-400">Select a department, then choose year and section to view data.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
            <Button onClick={addDepartment} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Department
            </Button>
          </div>
        </div>

        {/* Department, Year, and Section Dropdowns in Single Bar */}
        <Card className="p-6 space-y-4">
          <div className="flex gap-4 items-end">
            {/* Department Dropdown */}
            <div className="flex-1">
              <label className="text-sm text-slate-400 block mb-2">Select Department</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                  disabled={departmentsLoading}
                  className="w-full flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-left hover:border-slate-600 transition disabled:opacity-50"
                >
                  <span className="text-foreground font-medium">
                    {departmentsLoading ? "Loading departments..." : (selectedDept?.name || "Select department")}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition ${showDeptDropdown ? "rotate-180" : ""}`} />
                </button>

                {showDeptDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          handleDeptChange(dept.id);
                          setShowDeptDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition ${selectedDeptId === dept.id ? "bg-rose-700/20 text-rose-300" : "text-slate-200"
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
              <label className="text-sm text-slate-400 block mb-2">Select Year</label>
              {batchesLoading ? (
                <div className="w-full flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  <span className="text-sm">Loading batches...</span>
                </div>
              ) : (
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-foreground hover:border-slate-600 transition"
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
              <label className="text-sm text-slate-400 block mb-2">Select Section</label>
              {batchesLoading ? (
                <div className="w-full flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  <span className="text-sm">Loading sections...</span>
                </div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  disabled={!selectedYear}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-foreground hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              <label className="text-sm text-slate-400 block mb-2">Select Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setSelectedTab(null);
                  setActiveTeachers([]);
                  setActiveStudents([]);
                  setActiveSubjects([]);
                }}
                disabled={!selectedClass}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-foreground hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <Card className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
              {selectedDept.name} · {selectedYear} · {selectedClass} · Semester {selectedSemester}
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                onClick={() => setSelectedTab("teachers")}
                variant={selectedTab === "teachers" ? "default" : "outline"}
                className={selectedTab === "teachers" ? "bg-rose-700 hover:bg-rose-800 text-white border-none" : ""}
              >
                Teachers ({activeTeachers.length})
              </Button>
              <Button
                onClick={() => setSelectedTab("students")}
                variant={selectedTab === "students" ? "default" : "outline"}
                className={selectedTab === "students" ? "bg-rose-700 hover:bg-rose-800 text-white border-none" : ""}
              >
                Students ({activeStudents.length})
              </Button>
              <Button
                onClick={() => setSelectedTab("subjects")}
                variant={selectedTab === "subjects" ? "default" : "outline"}
                className={selectedTab === "subjects" ? "bg-rose-700 hover:bg-rose-800 text-white border-none" : ""}
              >
                Subjects ({activeSubjects.length})
              </Button>

              {selectedTab === "teachers" && (
                <Button
                  onClick={() => navigate("/admin/TeacherCrud")}
                  variant="outline"
                  className="ml-auto border-rose-500 text-rose-300 hover:bg-rose-600/10"
                >
                  Manage Teachers
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Data Table */}
        {selectedTab && selectedDeptId && selectedYear && selectedClass && selectedSemester && (
          <Card className="p-6 overflow-x-auto">
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">
                {selectedTab === "teachers" && "Teachers List"}
                {selectedTab === "students" && "Students List"}
                {selectedTab === "subjects" && "Subjects List"}
              </p>
            </div>

            {tabLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                <span className="text-sm font-medium">Fetching {selectedTab} list...</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
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
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-950/50 transition">
                        <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                        <td className="px-4 py-3 text-slate-200">{teacher}</td>
                      </tr>
                    ))}

                  {selectedTab === "students" &&
                    activeStudents.map((student, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-950/50 transition">
                        <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                        <td className="px-4 py-3 text-slate-200">{student}</td>
                      </tr>
                    ))}

                  {selectedTab === "subjects" &&
                    activeSubjects.map((subject, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-950/50 transition">
                        <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                        <td className="px-4 py-3 text-slate-200">{subject.name}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs uppercase">{subject.code}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* Empty State */}
        {!selectedTab && (
          <Card className="p-12 text-center">
            <p className="text-slate-400">Select department, year, section, and semester above to view data.</p>
          </Card>
        )}
      </section>
    </AdminShell>
  );
};

export default Departments;
