import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Pencil, Trash2, Search, ChevronDown, Loader2, BookOpen, Layers
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import ExportButton from "@/components/ExportButton";
import {
  useGetDepartments,
  useGetAcademicBatchesByDepartment,
  useCreateClass,
  useUpdateClass,
  useDeleteClass
} from "@/services/departmentAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { classFormSchema } from "@/lib/validations";

interface ClassItem {
  id: string;
  name: string;
  semester: number;
  batchId: string;
  batchYear: string;
}

const ClassCrud = () => {
  const { user } = useAuth();
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [search, setSearch] = useState("");

  // CRUD State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // Form State
  const [className, setClassName] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // TanStack Queries
  const { data: rawDepts, isLoading: deptsLoading } = useGetDepartments();
  const { data: rawBatches, isLoading: batchesLoading } = useGetAcademicBatchesByDepartment(selectedDeptId, {
    enabled: !!selectedDeptId
  });

  const departments = useMemo(() => {
    return Array.isArray(rawDepts) ? rawDepts : [];
  }, [rawDepts]);

  const activeDepartment = useMemo(() => {
    return departments.find((d: any) => String(d.id ?? d.departmentId) === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  const batches = useMemo(() => {
    if (!rawBatches) return [];
    return Array.isArray(rawBatches) ? rawBatches : (rawBatches.responseData ?? rawBatches.data ?? []);
  }, [rawBatches]);

  // Flatten batches to extract all classes
  const classesList = useMemo((): ClassItem[] => {
    const list: ClassItem[] = [];
    batches.forEach((batch: any) => {
      const batchClasses = batch.classes ?? [];
      const batchYear = batch.year ?? "N/A";
      const batchId = batch.batchId ?? batch.id ?? "";
      batchClasses.forEach((cls: any) => {
        list.push({
          id: cls.id,
          name: cls.name ?? "Unnamed Class",
          semester: Number(cls.semester ?? 1),
          batchId,
          batchYear,
        });
      });
    });
    return list;
  }, [batches]);

  const filteredClasses = useMemo(() => {
    return classesList.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
        String(c.semester).includes(search) || 
        c.batchYear.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [classesList, search]);

  // Mutations
  const createClassMutation = useCreateClass(selectedDeptId);
  const updateClassMutation = useUpdateClass(selectedDeptId);
  const deleteClassMutation = useDeleteClass(selectedDeptId);

  const handleOpenAdd = () => {
    setClassName("");
    setSemester("");
    setSelectedBatchId("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setSelectedClass(cls);
    setClassName(cls.name);
    setSemester(String(cls.semester));
    setSelectedBatchId(cls.batchId);
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    /*
    const result = classFormSchema.safeParse({
      name: className,
      semester,
      isNewBatch,
      batchId: selectedBatchId,
      batchYear: newBatchYear
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    */

    const payload: any = {
      name: className.trim(),
      semester: Number(semester),
      departmentId: selectedDeptId,
      batchId: selectedBatchId,
      institutionId: user?.institutionId || "",
      createdBy: user?.id ?? "Admin"
    };

    try {
      await createClassMutation.mutateAsync(payload);
      toast.success("Class created successfully!");
      setIsAddModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to create class.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    /*
    const result = classFormSchema.safeParse({
      name: className,
      semester,
      isNewBatch: false,
      batchId: selectedBatchId,
      batchYear: ""
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    */

    const payload = {
      id: selectedClass.id,
      name: className.trim(),
      semester: Number(semester),
      departmentId: selectedDeptId,
      batchId: selectedBatchId,
      institutionId: user?.institutionId || "",
      createdBy: user?.id ?? "Admin"
    };

    try {
      await updateClassMutation.mutateAsync({ classId: selectedClass.id, classData: payload });
      toast.success("Class updated successfully!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to update class.");
    }
  };

  const handleDelete = async () => {
    if (!classToDelete) return;
    try {
      await deleteClassMutation.mutateAsync(classToDelete.id);
      toast.success("Class deleted successfully!");
      setClassToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to delete class.");
    }
  };

  return (
    <AdminShell title="Class Management">
      <section className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Class Management</h1>
            <p className="text-sm text-muted-foreground">Manage sections and classes under your departments.</p>
          </div>
          {selectedDeptId && (
            <Button onClick={handleOpenAdd} className="flex items-center gap-2 self-start lg:self-auto">
              <Plus className="w-4 h-4" /> Add Class
            </Button>
          )}
        </div>

        {/* Selection Bar */}
        <Card className="p-6 space-y-4 shadow-md border-border bg-card">
          <div className="max-w-md">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Select Department
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                disabled={deptsLoading}
                className="w-full flex items-center justify-between gap-4 rounded-lg border border-input bg-card px-4 py-3 text-left hover:bg-muted/50 hover:border-primary/30 transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 shadow-sm"
              >
                <span className="text-foreground font-medium">
                  {deptsLoading ? "Loading departments..." : (activeDepartment?.name ?? activeDepartment?.departmentName ?? "Select department")}
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition ${showDeptDropdown ? "rotate-180" : ""}`} />
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
                          setShowDeptDropdown(false);
                          setSearch("");
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition hover:bg-accent hover:text-accent-foreground ${selectedDeptId === deptId
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
        </Card>

        {/* Classes Section */}
        {selectedDeptId ? (
          <Card className="p-6 rounded-2xl admin-glass-strong border border-border shadow-md">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Class Directory</p>
                  <h2 className="text-base font-semibold text-foreground">
                    {batchesLoading ? "Loading..." : `${filteredClasses.length} Classes Found`}
                  </h2>
                </div>
                {filteredClasses.length > 0 && (
                  <ExportButton
                    data={filteredClasses.map((c, idx) => ({
                      sno: idx + 1,
                      name: c.name,
                      semester: `Semester ${c.semester}`,
                      batch: c.batchYear
                    }))}
                    columns={[
                      { key: "sno", label: "S.No" },
                      { key: "name", label: "Class Name" },
                      { key: "semester", label: "Semester" },
                      { key: "batch", label: "Batch Year" }
                    ]}
                    fileName="classes_list"
                    title={`Classes - ${activeDepartment?.name ?? ""}`}
                  />
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes by name, section, semester, batch year..."
                  className="pl-10 h-10 rounded-xl bg-card border-border shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {batchesLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading classes and batches...
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                  <Layers className="h-10 w-10 mb-2 opacity-45" />
                  <p className="text-sm">No classes match your query.</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-primary text-primary-foreground text-left text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3" style={{ width: "60px" }}>S.No</th>
                        <th className="px-4 py-3">Class Name</th>
                        <th className="px-4 py-3">Semester</th>
                        <th className="px-4 py-3">Batch/Year</th>
                        <th className="px-4 py-3" style={{ width: "120px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClasses.map((cls, idx) => (
                        <tr
                          key={cls.id}
                          className={`border-b border-border/40 transition-colors duration-200 hover:bg-muted/40 ${
                            idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                          }`}
                        >
                          <td className="px-4 py-3 border-r border-border/45 font-medium text-black dark:text-[#FFF19E]">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 border-r border-border/45 font-semibold text-black dark:text-[#FFF19E]">
                            {cls.name}
                          </td>
                          <td className="px-4 py-3 border-r border-border/45 text-black dark:text-[#FFF19E]">
                            Semester {cls.semester}
                          </td>
                          <td className="px-4 py-3 border-r border-border/45 text-black dark:text-[#FFF19E]">
                            {cls.batchYear}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(cls)}
                                className="rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-300"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setClassToDelete(cls)}
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
            <p className="text-muted-foreground">Please select a department above to manage its classes.</p>
          </Card>
        )}
      </section>

      {/* Add Class Dialog Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px] admin-white-modal" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>
              Create a new class under <strong>{activeDepartment?.name ?? ""}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name <span className="text-destructive">*</span></Label>
              <Input
                id="class-name"
                placeholder="e.g. B.Tech CSE"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester <span className="text-destructive">*</span></Label>
              <Input
                id="semester"
                placeholder="e.g. 1"
                value={semester}
                onChange={(e) => setSemester(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="existing-batch">Select Academic Batch <span className="text-destructive">*</span></Label>
              <select
                 id="existing-batch"
                 value={selectedBatchId}
                 onChange={(e) => setSelectedBatchId(e.target.value)}
                 className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                 required
              >
                <option value="">Select a batch</option>
                {batches.map((b: any) => (
                  <option key={b.batchId ?? b.id} value={b.batchId ?? b.id}>
                    {b.year}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="cancel-gray-btn">
                Cancel
              </Button>
              <Button type="submit" disabled={createClassMutation.isPending}>
                {createClassMutation.isPending ? "Creating..." : "Create Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] admin-white-modal" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Class Details</DialogTitle>
            <DialogDescription>Modify settings for this class.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-class-name">Class Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-class-name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-semester">Semester <span className="text-destructive">*</span></Label>
              <Input
                id="edit-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-batch">Academic Batch Year</Label>
              <select
                id="edit-batch"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {batches.map((b: any) => (
                  <option key={b.batchId ?? b.id} value={b.batchId ?? b.id}>
                    {b.year}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="cancel-gray-btn">
                Cancel
              </Button>
              <Button type="submit" disabled={updateClassMutation.isPending}>
                {updateClassMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Class Confirmation Modal */}
      <ConfirmModal
        isOpen={classToDelete !== null}
        onClose={() => setClassToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        description={`Are you sure you want to delete the class "${classToDelete?.name}"? All student/teacher/subject maps for this class will be affected.`}
      />
    </AdminShell>
  );
};

export default ClassCrud;
