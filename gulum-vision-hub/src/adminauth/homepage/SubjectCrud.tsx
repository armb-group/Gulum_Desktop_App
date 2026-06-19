import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Pencil, Trash2, Search, Loader2, BookMarked
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import ExportButton from "@/components/ExportButton";
import {
  useGetSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject
} from "@/services/subjectCrudAPI";
import { useGetDepartments } from "@/services/departmentAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { subjectFormSchema } from "@/lib/validations";

interface SubjectItem {
  id: string;
  courseName: string;
  courseCode: string;
  institutionId?: string;
  description?: string;
  credits?: number;
  courseType?: string;
  isLab?: boolean;
  weeklyHours?: number;
}

const SubjectCrud = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // CRUD Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);

  // Form States
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");
  const [courseType, setCourseType] = useState("CORE");
  const [isLab, setIsLab] = useState("false");

  // Fetch Departments for Dropdown selection
  const { data: rawDepts, isLoading: deptsLoading } = useGetDepartments();
  const departmentsList = useMemo(() => {
    return Array.isArray(rawDepts)
      ? rawDepts.map((d: any) => ({
          id: String(d.id ?? d.departmentId ?? d.department_id ?? ""),
          name: d.name ?? d.departmentName ?? d.department_name ?? "Unknown Department",
        }))
      : [];
  }, [rawDepts]);

  // Fetch all Subjects
  const { data: rawSubjects = [], isLoading: subjectsLoading } = useGetSubjects();

  const subjects = useMemo((): SubjectItem[] => {
    return Array.isArray(rawSubjects) ? rawSubjects : [];
  }, [rawSubjects]);

  // console.log("subjects : ",subjects)

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => 
      s?.courseName?.toLowerCase().includes(search.toLowerCase()) || 
      s?.courseCode?.toLowerCase().includes(search.toLowerCase())
    );
  }, [subjects, search]);

  // CRUD Mutations
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const handleOpenAdd = () => {
    setSubjectName("");
    setSubjectCode("");
    setDescription("");
    setCredits("");
    setCourseType("CORE");
    setIsLab("false");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sub: SubjectItem) => {
    setSelectedSubject(sub);
    setSubjectName(sub.courseName);
    setSubjectCode(sub.courseCode);
    setDescription(sub.description || "");
    setCredits(sub.credits ? String(sub.credits) : "");
    setCourseType(sub.courseType || "CORE");
    setIsLab(sub.isLab ? "true" : "false");
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = subjectFormSchema.safeParse({ name: subjectName, code: subjectCode });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    if (!credits.trim() || isNaN(Number(credits))) {
      toast.error("Credits must be a valid number");
      return;
    }

    const payload = {
      courseName: subjectName.trim(),
      courseCode: subjectCode.trim(),
      institutionId: user?.institutionId || "",
      description: description.trim(),
      credits: Number(credits),
      courseType,
      isLab: isLab === "true"
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
    if (!selectedSubject) return;

    const result = subjectFormSchema.safeParse({ name: subjectName, code: subjectCode });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    if (!credits.trim() || isNaN(Number(credits))) {
      toast.error("Credits must be a valid number");
      return;
    }

    const payload = {
      name: subjectName.trim(),
      code: subjectCode.trim(),
      institutionId: user?.institutionId || "",
      description: description.trim(),
      credits: Number(credits),
      courseType,
      isLab: isLab === "true"
    };

    try {
      await updateSubjectMutation.mutateAsync({
        id: selectedSubject.id,
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
            <p className="text-sm text-muted-foreground">Manage courses and subjects across the institution.</p>
          </div>
          <Button onClick={handleOpenAdd} className="flex items-center gap-2 self-start lg:self-auto">
            <Plus className="w-4 h-4" /> Add Subject
          </Button>
        </div>

        {/* Subjects List Panel */}
        <Card className="p-6 rounded-2xl admin-glass-strong border border-border shadow-md">
          <div className="flex flex-col gap-4">
            {/* List Header info */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Subject Directory</p>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-foreground">
                  {subjectsLoading ? "Loading..." : `${filteredSubjects.length} Subjects Found`}
                </h2>
              </div>
              {filteredSubjects.length > 0 && (
                <ExportButton
                  data={filteredSubjects.map((s, idx) => ({
                    sno: idx + 1,
                    name: s.courseName,
                    code: s.courseCode,
                    courseType: s.courseType || "CORE",
                    isLab: s.isLab ? "Yes" : "No",
                    credits: s.credits ?? 0
                  }))}
                  columns={[
                    { key: "sno", label: "S.No" },
                    { key: "name", label: "Subject Name" },
                    { key: "code", label: "Subject Code" },
                    { key: "courseType", label: "Type" },
                    { key: "isLab", label: "Lab" },
                    { key: "credits", label: "Credits" },
                  ]}
                  fileName="subjects_list"
                  title="Subject Directory"
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
                <p className="text-sm">No subjects found.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-primary text-primary-foreground text-left text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-3" style={{ width: "60px" }}>S.No</th>
                      <th className="px-3 py-3">Subject Name</th>
                      <th className="px-3 py-3">Subject Code</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3" style={{ width: "50px" }}>Lab</th>
                      <th className="px-3 py-3" style={{ width: "60px" }}>Credits</th>
                      <th className="px-3 py-3" style={{ width: "100px" }}>Actions</th>
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
                        <td className="px-3 py-3 border-r border-border/45 font-medium text-black dark:text-[#FFF19E]">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-3 border-r border-border/45 font-semibold text-black dark:text-[#FFF19E]">
                          {sub.courseName}
                        </td>
                        <td className="px-3 py-3 border-r border-border/45 font-mono text-xs text-black dark:text-[#FFF19E] uppercase tracking-wider">
                          {sub.courseCode}
                        </td>
                        <td className="px-3 py-3 border-r border-border/45 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sub.courseType === "ELECTIVE" ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/30" : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/30"}`}>
                            {sub.courseType || "CORE"}
                          </span>
                        </td>
                        <td className="px-3 py-3 border-r border-border/45 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sub.isLab ? "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/30" : "bg-slate-100 dark:bg-zinc-800 text-muted-foreground border-slate-200 dark:border-zinc-700"}`}>
                            {sub.isLab ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-3 py-3 border-r border-border/45 text-black dark:text-[#FFF19E] text-center font-mono font-medium">
                          {sub.credits ?? 0}
                        </td>
                        <td className="px-3 py-3 align-middle">
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
      </section>

      {/* Add Subject Dialog Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[650px] admin-white-modal" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Add a new course/subject to the institution directory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
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
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credits <span className="text-destructive">*</span></Label>
                <Input
                  id="credits"
                  type="number"
                  placeholder="e.g. 4"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-type">Course Type <span className="text-destructive">*</span></Label>
                <select
                  id="course-type"
                  value={courseType}
                  onChange={(e) => setCourseType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="CORE">CORE</option>
                  <option value="ELECTIVE">ELECTIVE</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is-lab">Is Lab <span className="text-destructive">*</span></Label>
                <select
                  id="is-lab"
                  value={isLab}
                  onChange={(e) => setIsLab(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the subject"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
        <DialogContent className="sm:max-w-[650px] admin-white-modal" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Subject Details</DialogTitle>
            <DialogDescription>Update the subject details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
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
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-credits">Credits <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-credits"
                  type="number"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-course-type">Course Type <span className="text-destructive">*</span></Label>
                <select
                  id="edit-course-type"
                  value={courseType}
                  onChange={(e) => setCourseType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="CORE">CORE</option>
                  <option value="ELECTIVE">ELECTIVE</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-is-lab">Is Lab <span className="text-destructive">*</span></Label>
                <select
                  id="edit-is-lab"
                  value={isLab}
                  onChange={(e) => setIsLab(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
        description={`Are you sure you want to delete the subject "${subjectToDelete?.courseName}" (${subjectToDelete?.courseCode})? This action cannot be undone.`}
      />
    </AdminShell>
  );
};

export default SubjectCrud;
