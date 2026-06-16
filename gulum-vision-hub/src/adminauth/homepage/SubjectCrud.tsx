import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Pencil, Trash2, Search, ChevronDown, Loader2, BookOpen, BookMarked
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import ExportButton from "@/components/ExportButton";
import {
  useGetDepartments,
  useGetAcademicBatchesByDepartment,
  useGetSubjectsByClassBatch,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject
} from "@/services/departmentAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  departmentId?: string;
  classId?: string;
  batchId?: string;
}

const SubjectCrud = () => {
  const { user } = useAuth();
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [search, setSearch] = useState("");

  // CRUD Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);

  // Form States
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  // Fetch Departments
  const { data: rawDepts, isLoading: deptsLoading } = useGetDepartments();
  const departments = useMemo(() => Array.isArray(rawDepts) ? rawDepts : [], [rawDepts]);
  const activeDepartment = useMemo(() => {
    return departments.find((d: any) => String(d.id ?? d.departmentId) === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  // Fetch Batches based on Department
  const { data: rawBatches, isLoading: batchesLoading } = useGetAcademicBatchesByDepartment(selectedDeptId, {
    enabled: !!selectedDeptId
  });
  const batches = useMemo(() => {
    if (!rawBatches) return [];
    return Array.isArray(rawBatches) ? rawBatches : (rawBatches.responseData ?? rawBatches.data ?? []);
  }, [rawBatches]);

  const activeBatch = useMemo(() => {
    return batches.find((b: any) => String(b.batchId ?? b.id) === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  // Extract classes from selected batch
  const classes = useMemo(() => {
    if (!activeBatch || !activeBatch.classes) return [];
    return activeBatch.classes;
  }, [activeBatch]);

  const activeClass = useMemo(() => {
    return classes.find((c: any) => String(c.id) === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Retrieve current semester from selected class
  const selectedSemester = useMemo(() => {
    return activeClass ? String(activeClass.semester) : "";
  }, [activeClass]);

  // Parameters for Subject Query and Invalidations
  const queryParams = useMemo(() => ({
    departmentId: selectedDeptId,
    batchId: selectedBatchId,
    semester: selectedSemester,
    classId: selectedClassId
  }), [selectedDeptId, selectedBatchId, selectedSemester, selectedClassId]);

  const isQueryEnabled = !!selectedDeptId && !!selectedBatchId && !!selectedSemester && !!selectedClassId;

  // Fetch Subjects
  const { data: rawSubjects, isLoading: subjectsLoading } = useGetSubjectsByClassBatch(queryParams, {
    enabled: isQueryEnabled
  });

  const subjects = useMemo((): SubjectItem[] => {
    if (!rawSubjects) return [];
    const list = Array.isArray(rawSubjects) ? rawSubjects : [];
    return list.map((s: any) => ({
      id: s.id ?? s.subjectId ?? s.code,
      name: s.name ?? s.subjectName ?? s.subject_name ?? "Unknown Subject",
      code: s.code ?? s.subjectCode ?? s.subject_code ?? "N/A"
    }));
  }, [rawSubjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [subjects, search]);

  // CRUD Mutations
  const createSubjectMutation = useCreateSubject(queryParams);
  const updateSubjectMutation = useUpdateSubject(queryParams);
  const deleteSubjectMutation = useDeleteSubject(queryParams);

  const handleOpenAdd = () => {
    setSubjectName("");
    setSubjectCode("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sub: SubjectItem) => {
    setSelectedSubject(sub);
    setSubjectName(sub.name);
    setSubjectCode(sub.code);
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) {
      toast.error("Subject Name and Subject Code are required.");
      return;
    }

    const payload = {
      name: subjectName.trim(),
      code: subjectCode.trim(),
      departmentId: selectedDeptId,
      classId: selectedClassId,
      batchId: selectedBatchId,
      semester: Number(selectedSemester),
      institutionId: user?.institutionId || ""
    };

    try {
      await createSubjectMutation.mutateAsync(payload);
      toast.success("Subject created successfully!");
      setIsAddModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to create subject.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !subjectName.trim() || !subjectCode.trim()) {
      toast.error("Subject Name and Subject Code are required.");
      return;
    }

    const payload = {
      name: subjectName.trim(),
      code: subjectCode.trim(),
      departmentId: selectedDeptId,
      classId: selectedClassId,
      batchId: selectedBatchId,
      semester: Number(selectedSemester),
      institutionId: user?.institutionId || ""
    };

    try {
      await updateSubjectMutation.mutateAsync({
        subjectId: selectedSubject.id,
        subjectData: payload
      });
      toast.success("Subject updated successfully!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to update subject.");
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    try {
      await deleteSubjectMutation.mutateAsync(subjectToDelete.id);
      toast.success("Subject deleted successfully!");
      setSubjectToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to delete subject.");
    }
  };

  return (
    <AdminShell title="Subject Management">
      <section className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subject Management</h1>
            <p className="text-sm text-muted-foreground">Manage courses and subjects under a particular class batch.</p>
          </div>
          {isQueryEnabled && (
            <Button onClick={handleOpenAdd} className="flex items-center gap-2 self-start lg:self-auto">
              <Plus className="w-4 h-4" /> Add Subject
            </Button>
          )}
        </div>

        {/* Dynamic Cascading Filters */}
        <Card className="p-6 shadow-md border-border bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Department */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Select Department
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                  disabled={deptsLoading}
                  className="w-full flex items-center justify-between gap-4 rounded-lg border border-input bg-card px-4 py-2.5 text-left hover:bg-muted/50 hover:border-primary/30 transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 shadow-sm"
                >
                  <span className="text-foreground font-medium text-sm truncate">
                    {deptsLoading ? "Loading departments..." : (activeDepartment?.name ?? activeDepartment?.departmentName ?? "Select department")}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${showDeptDropdown ? "rotate-180" : ""}`} />
                </button>

                {showDeptDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto backdrop-blur-md">
                    {departments.map((dept: any) => {
                      const deptId = String(dept.id ?? dept.departmentId);
                      const deptName = dept.name ?? dept.departmentName ?? "Unknown";
                      return (
                        <button
                          key={deptId}
                          type="button"
                          onClick={() => {
                            setSelectedDeptId(deptId);
                            setSelectedBatchId("");
                            setSelectedClassId("");
                            setShowDeptDropdown(false);
                            setSearch("");
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-accent hover:text-accent-foreground ${selectedDeptId === deptId
                            ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                            : "text-foreground"
                            }`}
                        >
                          {deptName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Batch/Year */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Select Academic Batch
              </label>
              {batchesLoading ? (
                <div className="w-full flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2.5 text-muted-foreground shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm">Loading batches...</span>
                </div>
              ) : (
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    setSelectedClassId("");
                  }}
                  disabled={!selectedDeptId}
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-foreground hover:bg-muted/50 hover:border-primary/30 transition text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select batch year</option>
                  {batches.map((b: any) => (
                    <option key={b.batchId ?? b.id} value={b.batchId ?? b.id}>
                      {b.year}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Class/Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Select Class/Section
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={!selectedBatchId || classes.length === 0}
                className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-foreground hover:bg-muted/50 hover:border-primary/30 transition text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select class section</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Sem {c.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Subjects List Panel */}
        {isQueryEnabled ? (
          <Card className="p-6 rounded-2xl admin-glass-strong border border-border shadow-md">
            <div className="flex flex-col gap-4">
              {/* List Header info */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Subject Directory</p>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-foreground">
                    {subjectsLoading ? "Loading..." : `${filteredSubjects.length} Subjects Linked`}
                  </h2>
                </div>
                {filteredSubjects.length > 0 && (
                  <ExportButton
                    data={filteredSubjects.map((s, idx) => ({
                      sno: idx + 1,
                      name: s.name,
                      code: s.code
                    }))}
                    columns={[
                      { key: "sno", label: "S.No" },
                      { key: "name", label: "Subject Name" },
                      { key: "code", label: "Subject Code" }
                    ]}
                    fileName={`subjects_${activeClass?.name ?? "class"}`}
                    title={`Subjects: ${activeDepartment?.name ?? ""} · ${activeBatch?.year ?? ""} · ${activeClass?.name ?? ""}`}
                  />
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects by name or subject code..."
                  className="pl-10 h-10 rounded-xl bg-card border-border shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Subjects Table */}
              {subjectsLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading subjects...
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                  <BookMarked className="h-10 w-10 mb-2 opacity-45" />
                  <p className="text-sm">No subjects match your criteria.</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-primary text-primary-foreground text-left text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3" style={{ width: "60px" }}>S.No</th>
                        <th className="px-4 py-3">Subject Name</th>
                        <th className="px-4 py-3">Subject Code</th>
                        <th className="px-4 py-3" style={{ width: "120px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubjects.map((sub, idx) => (
                        <tr
                          key={sub.id}
                          className={`border-b border-border/40 transition-colors duration-200 hover:bg-muted/40 ${
                            idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                          }`}
                        >
                          <td className="px-4 py-3 border-r border-border/45 font-medium text-black dark:text-[#FFF19E]">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 border-r border-border/45 font-semibold text-black dark:text-[#FFF19E]">
                            {sub.name}
                          </td>
                          <td className="px-4 py-3 border-r border-border/45 font-mono text-xs text-black dark:text-[#FFF19E] uppercase tracking-wider">
                            {sub.code}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(sub)}
                                className="rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-300"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSubjectToDelete(sub)}
                                className="rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center border-border bg-card shadow-sm">
            <p className="text-muted-foreground">
              Please select a department, batch, and class section above to load subjects.
            </p>
          </Card>
        )}
      </section>

      {/* Add Subject Dialog Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px] admin-white-modal" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Add a new course/subject under <strong>{activeClass?.name ?? ""}</strong> (Semester {selectedSemester}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name <span className="text-destructive">*</span></Label>
              <Input
                id="subject-name"
                placeholder="e.g. Advanced Operating Systems"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-code">Subject Code <span className="text-destructive">*</span></Label>
              <Input
                id="subject-code"
                placeholder="e.g. CSE302"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="cancel-gray-btn">
                Cancel
              </Button>
              <Button type="submit" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending ? "Adding..." : "Add Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] admin-white-modal" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Subject Details</DialogTitle>
            <DialogDescription>Update the subject details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject-name">Subject Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-subject-name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject-code">Subject Code <span className="text-destructive">*</span></Label>
              <Input
                id="edit-subject-code"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="cancel-gray-btn">
                Cancel
              </Button>
              <Button type="submit" disabled={updateSubjectMutation.isPending}>
                {updateSubjectMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation Modal */}
      <ConfirmModal
        isOpen={subjectToDelete !== null}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Subject"
        description={`Are you sure you want to delete the subject "${subjectToDelete?.name}" (${subjectToDelete?.code})? This action cannot be undone.`}
      />
    </AdminShell>
  );
};

export default SubjectCrud;
