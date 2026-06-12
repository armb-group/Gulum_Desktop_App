import { useEffect, useState } from "react";
import { AdminShell } from "./AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, CalendarDays, User, Plus, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getNoticesByInstitution, 
  addNoticeApi, 
  editNoticeApi, 
  deleteNoticeApi 
} from "@/services/noticeAPI";
import { toast } from "sonner";
import { CustomTooltip } from "@/components/CustomTooltip";
import { ConfirmModal } from "@/components/ConfirmModal";
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

interface Notice {
  id: string | number;
  title: string;
  description: string;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  created_at?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

const NoticePage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for Add/Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLevel, setFormLevel] = useState<"ADMIN" | "STUDENT">("ADMIN");
  const [formCourseCode, setFormCourseCode] = useState("");
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNotices = () => {
    if (!user?.institutionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getNoticesByInstitution(user.institutionId)
      .then((data: any) => {
        const list = data?.responseData ?? data?.data ?? data;
        if (Array.isArray(list)) {
          setNotices(list);
        } else if (Array.isArray(list?.content)) {
          setNotices(list.content);
        } else if (Array.isArray(data)) {
          setNotices(data);
        } else {
          setNotices([]);
        }
        setError(null);
      })
      .catch((err: any) => {
        console.error("Failed to load notices:", err);
        setError("Failed to load notices. Please try again later.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchNotices();
  }, [user?.institutionId]);

  const handleOpenCreate = () => {
    setEditingNotice(null);
    setFormTitle("");
    setFormDescription("");
    setFormLevel("ADMIN");
    setFormCourseCode("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormTitle(notice.title || "");
    setFormDescription(notice.description || "");
    setFormLevel((notice as any).level === "STUDENT" ? "STUDENT" : "ADMIN");
    setFormCourseCode((notice as any).courseCode ?? (notice as any).course_code ?? "");
    setSelectedNotice(null); // Close details modal
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string | number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteNoticeApi(deleteTargetId);
      toast.success("Notice deleted successfully");
      setSelectedNotice(null); // Close details modal
      fetchNotices(); // Refresh list
    } catch (err: any) {
      console.error("Failed to delete notice:", err);
      toast.error(err?.message ?? "Failed to delete notice");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formDescription.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      level: formLevel,
      courseCode: formCourseCode.trim() || undefined,
      institutionId: user?.institutionId,
      createdBy: user?.name ?? "Admin",
      isAdmin: true, // bypass teacher restriction in noticeAPI.js
    };

    try {
      if (editingNotice) {
        await editNoticeApi({ id: editingNotice.id, notice: payload });
        toast.success("Notice updated successfully");
      } else {
        await addNoticeApi(payload);
        toast.success("Notice created successfully");
      }
      setIsFormOpen(false);
      fetchNotices();
    } catch (err: any) {
      console.error("Failed to save notice:", err);
      toast.error(err?.message ?? "Failed to save notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAndSorted = [...notices]
    .filter(
      (n) =>
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
      return dateB - dateA;
    });

  return (
    <AdminShell title="Notice Board">
      <section className="container py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notice Board</h1>
            <p className="text-sm text-muted-foreground mt-1">View all important announcements and notices.</p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> Create Notice
          </Button>
        </div>

        {/* Search */}
        <Card className="p-5 rounded-2xl admin-glass">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notices..."
              className="pl-10 h-12 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {/* Notice Cards or Loading/Error State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading notices...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20 text-center">
            {error}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-muted-foreground/20 text-center space-y-3">
            <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">No Notices Found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              There are no notices published for your institution yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSorted.map((notice) => (
              <Card
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="p-6 rounded-2xl admin-glass transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between h-full border border-white/10"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="p-3 rounded-2xl bg-primary/10 shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <CustomTooltip content="Edit Notice">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(notice);
                          }}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </CustomTooltip>
                      <CustomTooltip content="Delete Notice">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(notice.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </CustomTooltip>

                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-foreground line-clamp-1">{notice.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {notice.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 truncate">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    {notice.createdBy ?? notice.created_by ?? "Unknown"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    {formatDate(notice.createdAt ?? notice.created_at)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
          <DialogContent className="sm:max-w-[650px] rounded-2xl border border-white/20 dark:border-white/10 admin-glass-modal p-0 overflow-hidden flex flex-col shadow-2xl">
            {selectedNotice && (
              <>
                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground pr-8 leading-snug">
                      {selectedNotice.title}
                    </DialogTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-background dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">{selectedNotice.createdBy ?? selectedNotice.created_by ?? "Unknown"}</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-background dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">{formatDate(selectedNotice.createdAt ?? selectedNotice.created_at)}</span>
                    </span>
                    {(selectedNotice as any).courseCode && (
                      <span className="flex items-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {(selectedNotice as any).courseCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 max-h-[50vh] overflow-y-auto scrollbar-beautiful bg-background">
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                      Announcement Details
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line bg-zinc-50/50 dark:bg-zinc-900/10 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
                      {selectedNotice.description}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <Button variant="outline" onClick={() => handleOpenEdit(selectedNotice)} className="gap-2 rounded-xl">
                    <Pencil className="h-4 w-4" /> Edit Notice
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteClick(selectedNotice.id)} className="gap-2 rounded-xl">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>

                </div>
              </>
            )}
          </DialogContent>
        </Dialog>


        {/* Add/Edit Notice Dialog Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[550px] rounded-2xl border border-white/20 dark:border-white/10 admin-glass-modal">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingNotice ? "Edit Notice" : "Create Notice"}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingNotice ? "Update the details of the notice below." : "Fill in the details below to publish a new notice to the board."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="notice-title" className="text-sm font-semibold">Title <span className="text-destructive">*</span></Label>
                <Input 
                  id="notice-title" 
                  placeholder="Enter notice title" 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  required 
                  className="rounded-xl h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notice-desc" className="text-sm font-semibold">Description <span className="text-destructive">*</span></Label>
                <Textarea 
                  id="notice-desc" 
                  placeholder="Enter notice description details..." 
                  value={formDescription} 
                  onChange={(e) => setFormDescription(e.target.value)} 
                  required
                  className="min-h-32 rounded-xl leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notice-level" className="text-sm font-semibold">Target Audience / Level</Label>
                  <select
                    id="notice-level"
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as "ADMIN" | "STUDENT")}
                    className="flex w-full h-11 rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring [&>option]:bg-card [&>option]:text-foreground"
                  >
                    <option value="ADMIN">Admin / Teacher</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notice-course" className="text-sm font-semibold">Course Code (Optional)</Label>
                  <Input 
                    id="notice-course" 
                    placeholder="e.g. CSE-302" 
                    value={formCourseCode} 
                    onChange={(e) => setFormCourseCode(e.target.value)} 
                    className="rounded-xl h-11 uppercase"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingNotice ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingNotice ? "Update Notice" : "Create Notice"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmModal
          isOpen={deleteTargetId !== null}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={confirmDelete}
          title="Delete Notice"
          description="Are you sure you want to delete this notice? This action cannot be undone."
          isLoading={isDeleting}
        />

      </section>

    </AdminShell>
  );
};

export default NoticePage;
