import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Pencil, Trash2, Search, Loader2, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import ExportButton from "@/components/ExportButton";
import {
  useGetCourses
} from "@/services/courseCrudAPI";
import {
  useGetCourseModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule
} from "@/services/moduleAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moduleFormSchema } from "@/lib/validations";

interface ModuleItem {
  id: string;
  moduleNumber: number;
  moduleTitle: string;
  description?: string;
  expectedHours: number;
  sequenceOrder?: number;
  courseCode?: string;
  institutionId?: string;
}

const ModuleCrud = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // Selection states
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCourseCode, setSelectedCourseCode] = useState("");

  // CRUD Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<ModuleItem | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);

  // Form States
  const [moduleNumber, setModuleNumber] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expectedHours, setExpectedHours] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState("");

  // Fetch all courses for selection
  const { data: rawCourses = [], isLoading: coursesLoading } = useGetCourses();
  const courses = useMemo(() => {
    return Array.isArray(rawCourses) ? rawCourses : [];
  }, [rawCourses]);

  // Fetch modules under selected course
  const { data: moduleResponse, isLoading: modulesLoading } = useGetCourseModules(selectedCourseCode);
  const modulesList = useMemo((): ModuleItem[] => {
    if (!moduleResponse) return [];
    const rawModules = moduleResponse.modules ?? moduleResponse;
    return Array.isArray(rawModules) ? rawModules : [];
  }, [moduleResponse]);

  // Filter modules based on search query
  const filteredModules = useMemo(() => {
    return modulesList.filter((m) =>
      m.moduleTitle.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [modulesList, search]);

  // CRUD Mutations
  const createModuleMutation = useCreateModule(selectedCourseCode);
  const updateModuleMutation = useUpdateModule(selectedCourseCode);
  const deleteModuleMutation = useDeleteModule(selectedCourseCode);

  const handleCourseChange = (id: string) => {
    setSelectedCourseId(id);
    const found = courses.find((c) => String(c.id ?? c.courseId) === id);
    if (found) {
      setSelectedCourseCode(String(found.courseCode ?? found.code ?? ""));
    }
    setSearch("");
  };

  const handleOpenAdd = () => {
    if (!selectedCourseId) {
      toast.error("Please select a course first.");
      return;
    }
    // Calculate next module number and sequence order
    const maxNum = modulesList.reduce((max, m) => Math.max(max, m.moduleNumber || 0), 0);
    setModuleNumber(String(maxNum + 1));
    setModuleTitle("");
    setDescription("");
    setExpectedHours("");
    setSequenceOrder(String(maxNum + 1));
    setIsAddModalOpen(true);
  };

  // Sync sequence order with module number in Add form if sequence order is not set or matches old number
  useEffect(() => {
    if (isAddModalOpen && moduleNumber) {
      setSequenceOrder(moduleNumber);
    }
  }, [moduleNumber, isAddModalOpen]);

  const handleOpenEdit = (mod: ModuleItem) => {
    setSelectedModule(mod);
    setModuleNumber(String(mod.moduleNumber));
    setModuleTitle(mod.moduleTitle);
    setDescription(mod.description || "");
    setExpectedHours(String(mod.expectedHours));
    setSequenceOrder(String(mod.sequenceOrder ?? mod.moduleNumber));
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = moduleFormSchema.safeParse({
      moduleTitle,
      moduleNumber,
      expectedHours,
      sequenceOrder,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    const payload = {
      institutionId: user?.institutionId || "",
      courseId: selectedCourseId,
      courseCode: selectedCourseCode,
      moduleNumber: Number(moduleNumber),
      moduleTitle: moduleTitle.trim(),
      description: description.trim(),
      expectedHours: Number(expectedHours),
      sequenceOrder: Number(sequenceOrder),
    };

    try {
      await createModuleMutation.mutateAsync(payload);
      toast.success("Module created successfully!");
      setIsAddModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to create module.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    const result = moduleFormSchema.safeParse({
      moduleTitle,
      moduleNumber,
      expectedHours,
      sequenceOrder,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    const payload = {
      institutionId: user?.institutionId || "",
      courseId: selectedCourseId,
      courseCode: selectedCourseCode,
      moduleNumber: Number(moduleNumber),
      moduleTitle: moduleTitle.trim(),
      description: description.trim(),
      expectedHours: Number(expectedHours),
      sequenceOrder: Number(sequenceOrder),
    };

    try {
      await updateModuleMutation.mutateAsync({
        id: selectedModule.id,
        moduleData: payload,
      });
      toast.success("Module updated successfully!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to update module.");
    }
  };

  const handleDelete = async () => {
    if (!moduleToDelete) return;
    try {
      await deleteModuleMutation.mutateAsync(moduleToDelete.id);
      toast.success("Module deleted successfully!");
      setModuleToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to delete module.");
    }
  };

  const selectedCourseText = useMemo(() => {
    const found = courses.find((c) => String(c.id ?? c.courseId) === selectedCourseId);
    if (found) {
      return `${found.courseName ?? found.name} (${found.courseCode ?? found.code})`;
    }
    return "";
  }, [courses, selectedCourseId]);

  return (
    <AdminShell title="Module Management">
      <section className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Module Management</h1>
            <p className="text-sm text-muted-foreground">Manage syllabus modules under course codes.</p>
          </div>
          <Button onClick={handleOpenAdd} className="flex items-center gap-2 self-start lg:self-auto">
            <Plus className="w-4 h-4" /> Add Module
          </Button>
        </div>

        {/* Course Selector Dropdown */}
        <Card className="p-6 rounded-2xl admin-glass-strong border border-border shadow-md">
          <div className="flex flex-col gap-4">
            <div className="max-w-md space-y-2">
              <Label htmlFor="course-select-crud" className="text-sm font-semibold">Select Course</Label>
              {coursesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-10">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading courses...
                </div>
              ) : (
                <Select value={selectedCourseId} onValueChange={handleCourseChange}>
                  <SelectTrigger id="course-select-crud" className="h-10 rounded-xl bg-card border-border shadow-sm">
                    <SelectValue placeholder="Choose a course to load modules" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={String(c.id ?? c.courseId)} value={String(c.id ?? c.courseId)}>
                        {(c.courseName ?? c.name)} ({(c.courseCode ?? c.code)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </Card>

        {/* Modules List Panel */}
        {selectedCourseId ? (
          <Card className="p-6 rounded-2xl admin-glass-strong border border-border shadow-md">
            <div className="flex flex-col gap-4">
              {/* List Header info */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Syllabus Modules</p>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-foreground">
                    {modulesLoading ? "Loading..." : `${filteredModules.length} Modules Found under ${selectedCourseText}`}
                  </h2>
                </div>
                {filteredModules.length > 0 && (
                  <ExportButton
                    data={filteredModules.map((m, idx) => ({
                      sno: idx + 1,
                      moduleNumber: m.moduleNumber,
                      moduleTitle: m.moduleTitle,
                      expectedHours: m.expectedHours,
                      sequenceOrder: m.sequenceOrder ?? m.moduleNumber,
                      description: m.description || "",
                    }))}
                    columns={[
                      { key: "sno", label: "S.No" },
                      { key: "moduleTitle", label: "Module Title" },
                      { key: "expectedHours", label: "Expected Hours" },
                      { key: "sequenceOrder", label: "Sequence Order" },
                      { key: "description", label: "Description" },
                    ]}
                    fileName={`${selectedCourseCode}_modules_list`}
                    title={`Syllabus Modules - ${selectedCourseText}`}
                  />
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search modules by title or description..."
                  className="pl-10 h-10 rounded-xl bg-card border-border shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Modules Table */}
              {modulesLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading modules...
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                  <BookOpen className="h-10 w-10 mb-2 opacity-45" />
                  <p className="text-sm">No modules found for this course.</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-primary text-primary-foreground text-left text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-3" style={{ width: "80px" }}>Sl No</th>
                        <th className="px-3 py-3">Module Title</th>
                        <th className="px-3 py-3">Description</th>
                        <th className="px-3 py-3" style={{ width: "120px" }}>Exp. Hours</th>
                        <th className="px-3 py-3" style={{ width: "120px" }}>Seq. Order</th>
                        <th className="px-3 py-3" style={{ width: "100px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModules
                        .sort((a, b) => (a.sequenceOrder ?? a.moduleNumber) - (b.sequenceOrder ?? b.moduleNumber))
                        .map((mod, idx) => (
                          <tr
                            key={mod.id}
                            className={`border-b border-border/40 transition-colors duration-200 hover:bg-muted/40 ${
                              idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                            }`}
                          >
                            <td className="px-3 py-3 border-r border-border/45 font-mono text-center font-semibold text-black dark:text-[#FFF19E]">
                              {mod.moduleNumber}
                            </td>
                            <td className="px-3 py-3 border-r border-border/45 font-semibold text-black dark:text-[#FFF19E]">
                              {mod.moduleTitle}
                            </td>
                            <td className="px-3 py-3 border-r border-border/45 text-black dark:text-[#FFF19E] max-w-xs truncate">
                              {mod.description || "N/A"}
                            </td>
                            <td className="px-3 py-3 border-r border-border/45 text-center font-mono font-medium text-black dark:text-[#FFF19E]">
                              {mod.expectedHours}
                            </td>
                            <td className="px-3 py-3 border-r border-border/45 text-center font-mono font-medium text-black dark:text-[#FFF19E]">
                              {mod.sequenceOrder ?? mod.moduleNumber}
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEdit(mod)}
                                  className="rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-300"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setModuleToDelete(mod)}
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
          <Card className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/45 shadow-sm">
            <div className="flex flex-col items-center justify-center space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">Select a course to get the modules.</p>
            </div>
          </Card>
        )}
      </section>

      {/* Add Module Dialog Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[550px] admin-white-modal" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
            <DialogDescription>
              Add a new syllabus module under {selectedCourseText}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="module-number">Module Number <span className="text-destructive">*</span></Label>
                <Input
                  id="module-number"
                  type="number"
                  placeholder="e.g. 1"
                  value={moduleNumber}
                  onChange={(e) => setModuleNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected-hours">Expected Hours <span className="text-destructive">*</span></Label>
                <Input
                  id="expected-hours"
                  type="number"
                  placeholder="e.g. 10"
                  value={expectedHours}
                  onChange={(e) => setExpectedHours(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="module-title">Module Title <span className="text-destructive">*</span></Label>
                <Input
                  id="module-title"
                  placeholder="e.g. Introduction to DBMS"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description / Syllabus Topics</Label>
                <Input
                  id="description"
                  placeholder="e.g. 1NF, 2NF, 3NF and BCNF"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sequence-order">Sequence Order <span className="text-destructive">*</span></Label>
                <Input
                  id="sequence-order"
                  type="number"
                  placeholder="e.g. 1"
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="cancel-gray-btn">
                Cancel
              </Button>
              <Button type="submit" disabled={createModuleMutation.isPending}>
                {createModuleMutation.isPending ? "Adding..." : "Add Module"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px] admin-white-modal" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Module Details</DialogTitle>
            <DialogDescription>Update the module details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-module-number">Module Number <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-module-number"
                  type="number"
                  value={moduleNumber}
                  onChange={(e) => setModuleNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expected-hours">Expected Hours <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-expected-hours"
                  type="number"
                  value={expectedHours}
                  onChange={(e) => setExpectedHours(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-module-title">Module Title <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-module-title"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-description">Description / Syllabus Topics</Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-sequence-order">Sequence Order <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-sequence-order"
                  type="number"
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="cancel-gray-btn">
                Cancel
              </Button>
              <Button type="submit" disabled={updateModuleMutation.isPending}>
                {updateModuleMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirmation Modal */}
      <ConfirmModal
        isOpen={moduleToDelete !== null}
        onClose={() => setModuleToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Module"
        description={`Are you sure you want to delete the module "${moduleToDelete?.moduleTitle}"? This action cannot be undone.`}
      />
    </AdminShell>
  );
};

export default ModuleCrud;
