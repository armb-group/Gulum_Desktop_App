import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown } from "lucide-react";
import { AdminShell } from "./AdminShell";
import { initialData } from "./departmentsData";
import type { Department } from "./departmentsData";

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>(initialData);
  const [newDept, setNewDept] = useState("");
  const [selectedDept, setSelectedDept] = useState<Department | null>(departments[0] || null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"teachers" | "students" | "subjects" | null>(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const navigate = useNavigate();

  const addDepartment = () => {
    if (!newDept.trim()) return;
    const dept: Department = { id: Date.now().toString(), name: newDept.trim(), years: [] };
    setDepartments((current) => [dept, ...current]);
    setNewDept("");
  };

  // Get available years for selected department
  const availableYears = useMemo(
    () => selectedDept?.years.map((y) => y.year) || [],
    [selectedDept]
  );

  // Get available classes/sections for selected year
  const availableClasses = useMemo(
    () =>
      selectedDept?.years
        .find((y) => y.year === selectedYear)
        ?.sections.map((s) => s.name) || [],
    [selectedDept, selectedYear]
  );

  // Get the selected section data
  const selectedSection = useMemo(
    () =>
      selectedDept?.years
        .find((y) => y.year === selectedYear)
        ?.sections.find((s) => s.name === selectedClass),
    [selectedDept, selectedYear, selectedClass]
  );

  // Initialize year when department changes
  React.useEffect(() => {
    if (selectedDept && availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
      setSelectedClass("");
      setSelectedTab(null);
    }
  }, [selectedDept, availableYears, selectedYear]);

  // Initialize class when year changes
  React.useEffect(() => {
    if (selectedYear && availableClasses.length > 0 && !selectedClass) {
      setSelectedClass(availableClasses[0]);
    }
  }, [selectedYear, availableClasses, selectedClass]);

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
                  className="w-full flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-left hover:border-slate-600 transition"
                >
                  <span className="text-foreground font-medium">{selectedDept?.name || "Choose a department"}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition ${showDeptDropdown ? "rotate-180" : ""}`} />
                </button>

                {showDeptDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-10">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          setSelectedDept(dept);
                          setShowDeptDropdown(false);
                          setSelectedYear("");
                          setSelectedClass("");
                          setSelectedTab(null);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition ${
                          selectedDept?.id === dept.id ? "bg-rose-700/20 text-rose-300" : "text-slate-200"
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
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedClass("");
                  setSelectedTab(null);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-foreground hover:border-slate-600 transition"
              >
                <option value="">Choose a year</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Dropdown */}
            <div className="flex-1">
              <label className="text-sm text-slate-400 block mb-2">Select Section</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedTab(null);
                }}
                disabled={!selectedYear}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-foreground hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Choose a section</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Teacher/Student/Subject Buttons */}
        {selectedDept && selectedYear && selectedClass && (
          <Card className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
              {selectedDept.name} · {selectedYear} · {selectedClass}
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                onClick={() => setSelectedTab("teachers")}
                variant={selectedTab === "teachers" ? "default" : "outline"}
                className={selectedTab === "teachers" ? "bg-rose-700 hover:bg-rose-800" : ""}
              >
                Teachers ({selectedSection?.teachers.length || 0})
              </Button>
              <Button
                onClick={() => setSelectedTab("students")}
                variant={selectedTab === "students" ? "default" : "outline"}
                className={selectedTab === "students" ? "bg-rose-700 hover:bg-rose-800" : ""}
              >
                Students ({selectedSection?.students.length || 0})
              </Button>
              <Button
                onClick={() => setSelectedTab("subjects")}
                variant={selectedTab === "subjects" ? "default" : "outline"}
                className={selectedTab === "subjects" ? "bg-rose-700 hover:bg-rose-800" : ""}
              >
                Subjects ({selectedSection?.subjects.length || 0})
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
        {selectedTab && selectedSection && (
          <Card className="p-6 overflow-x-auto">
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">
                {selectedTab === "teachers" && "Teachers List"}
                {selectedTab === "students" && "Students List"}
                {selectedTab === "subjects" && "Subjects List"}
              </p>
            </div>

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
                  selectedSection.teachers.map((teacher, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-950/50 transition">
                      <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                      <td className="px-4 py-3 text-slate-200">{teacher}</td>
                    </tr>
                  ))}

                {selectedTab === "students" &&
                  selectedSection.students.map((student, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-950/50 transition">
                      <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                      <td className="px-4 py-3 text-slate-200">{student}</td>
                    </tr>
                  ))}

                {selectedTab === "subjects" &&
                  selectedSection.subjects.map((subject, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-950/50 transition">
                      <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                      <td className="px-4 py-3 text-slate-200">{subject.name}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs uppercase">{subject.code}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Empty State */}
        {!selectedTab && selectedDept && (
          <Card className="p-12 text-center">
            <p className="text-slate-400">Select year, section, and category above to view data.</p>
          </Card>
        )}
      </section>
    </AdminShell>
  );
};

export default Departments;
