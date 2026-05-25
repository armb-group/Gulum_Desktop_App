import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import {
  CalendarIcon,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "@/hooks/use-toast";
import {
  noticeToNotification,
  useAddNotice,
  useDeleteNotice,
  useEditNotice,
  useGetNoticesByLevel,
} from "@/services/noticeAPI";
import { getTeacherProfile } from "@/services/teacherprofileapi";

import {
  notificationTypeStyle,
  defaultAdminNotifications,
  defaultStudentNotifications,
  sortByCreatedAt,
  SUBJECT_LIST,
  type NotificationItem,
} from "@/lib/notifications";

const firstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
};

const TeacherNotifications = () => {
  const { user } = useAuth();
  const addNoticeMutation = useAddNotice();
  const editNoticeMutation = useEditNotice();
  const deleteNoticeMutation = useDeleteNotice();

  const [activeTab, setActiveTab] =
    useState<"admin" | "student">(
      "student"
    );

  const [selectedStudentSubject, setSelectedStudentSubject] =
    useState<string>("All");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isNoticeContextLoading, setIsNoticeContextLoading] =
    useState(false);

  // FORM STATES
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [institutionId, setInstitutionId] =
    useState(user?.institutionId ?? "");

  const [batchId, setBatchId] =
    useState(user?.batchId ?? "");

  const [courseCode, setCourseCode] =
    useState("");

  const [createdBy, setCreatedBy] =
    useState(user?.name ?? "Admin");

  const [subject, setSubject] =
    useState<string>("General");

  // DATE STATES
  const [startDate, setStartDate] =
    useState<Date | undefined>();

  const [endDate, setEndDate] =
    useState<Date | undefined>();

  useEffect(() => {
    let cancelled = false;

    const loadNoticeContext = async () => {
      setIsNoticeContextLoading(true);

      try {
        const profile = await getTeacherProfile();

        if (cancelled || !profile) {
          return;
        }

        const institutionFromProfile = firstString(
          profile.institutionId,
          profile.institution_id,
          profile.institution?.id,
          profile.institution?.institutionId
        );

        const batchFromProfile = firstString(
          profile.batchId,
          profile.batch_id,
          profile.batch?.id,
          profile.batch?.batchId,
          profile.batches?.[0]?.id,
          profile.batches?.[0]?.batchId,
          profile.classBatchId,
          profile.assignedBatchId
        );

        const courseFromProfile = firstString(
          profile.courseCode,
          profile.course_code,
          profile.course?.code,
          profile.course?.courseCode,
          profile.courses?.[0]?.code,
          profile.courses?.[0]?.courseCode,
          profile.subjectCode,
          profile.subject_code
        );

        const createdByFromProfile = firstString(
          profile.fullName,
          profile.full_name,
          profile.name,
          user?.name
        );

        if (institutionFromProfile) {
          setInstitutionId((current) => current || institutionFromProfile);
        }

        if (batchFromProfile) {
          setBatchId((current) => current || batchFromProfile);
        }

        if (courseFromProfile) {
          setCourseCode((current) => current || courseFromProfile);
        }

        if (createdByFromProfile) {
          setCreatedBy((current) => current || createdByFromProfile);
        }
      } catch (error) {
        console.error("Error loading notice context:", error);
        toast({
          title: "Could not load teacher notice details.",
          description: "You can still enter the notice fields manually.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setIsNoticeContextLoading(false);
        }
      }
    };

    loadNoticeContext();

    return () => {
      cancelled = true;
    };
  }, [user?.name]);

  useEffect(() => {
    if (user?.name) {
      setCreatedBy(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (user?.institutionId && !institutionId) {
      setInstitutionId(user.institutionId);
    }
  }, [institutionId, user?.institutionId]);

  useEffect(() => {
    if (user?.batchId && !batchId) {
      setBatchId(user.batchId);
    }
  }, [batchId, user?.batchId]);

  useEffect(() => {
    if (selectedStudentSubject !== "All") {
      setSubject(
        selectedStudentSubject
      );
    }
  }, [selectedStudentSubject]);

  const adminNoticeQuery = useGetNoticesByLevel("ADMIN", {
    batchId,
    enabled: Boolean(batchId),
  });

  const studentNoticeQuery = useGetNoticesByLevel("STUDENT");

  const apiAdminNotifications = useMemo(
    () =>
      (adminNoticeQuery.data ?? []).map((notice) =>
        noticeToNotification(notice, "admin")
      ),
    [adminNoticeQuery.data]
  );

  const apiStudentNotifications = useMemo(
    () =>
      (studentNoticeQuery.data ?? []).map((notice) =>
        noticeToNotification(notice, "student")
      ),
    [studentNoticeQuery.data]
  );

  const adminNotes = useMemo(
    () =>
      sortByCreatedAt([
        ...defaultAdminNotifications,
        ...apiAdminNotifications,
      ]),
    [apiAdminNotifications]
  );

  const studentNotes = useMemo(
    () =>
      sortByCreatedAt(
        [
          ...defaultStudentNotifications,
          ...apiStudentNotifications,
        ].filter(
          (note) =>
            selectedStudentSubject ===
              "All" ||
            note.subject ===
              selectedStudentSubject
        )
      ),
    [
      selectedStudentSubject,
      apiStudentNotifications,
    ]
  );

  const adminCount = adminNotes.length;
  const studentCount =
    studentNotes.length;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Please enter title.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Please enter description.",
        variant: "destructive",
      });
      return;
    }

    if (!institutionId.trim()) {
      toast({
        title: "Please enter institution ID.",
        variant: "destructive",
      });
      return;
    }

    if (!batchId.trim()) {
      toast({
        title: "Please enter batch ID.",
        variant: "destructive",
      });
      return;
    }

    if (!courseCode.trim()) {
      toast({
        title: "Please enter course code.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      institutionId: institutionId.trim(),
      level: "two",
      batchId: batchId.trim(),
      courseCode: courseCode.trim(),
      startDate: startDate
        ? format(
            startDate,
            "yyyy-MM-dd"
          )
        : null,
      endDate: endDate
        ? format(
            endDate,
            "yyyy-MM-dd"
          )
        : null,
      createdBy: createdBy.trim() || user?.name || "Admin",
    };

    setIsSubmitting(true);

    // EDIT
    if (editingId) {
      try {
        await editNoticeMutation.mutateAsync({
          id: editingId,
          notice: payload,
        });
      } catch (error: any) {
        console.error("Error updating notice:", error);
        toast({
          title: "Failed to update notice.",
          description: error?.message ?? "Please check the notice API and try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Notification updated.",
      });
    }

    // CREATE
    else {
      try {
        await addNoticeMutation.mutateAsync(payload);
      } catch (error: any) {
        console.error("Error creating notice:", error);
        toast({
          title: "Failed to create notice.",
          description: error?.message ?? "Please check the notice API and try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Notification created successfully.",
      });
    }

    setIsSubmitting(false);

    // RESET
    setTitle("");
    setDescription("");
    setStartDate(undefined);
    setEndDate(undefined);
    setEditingId(null);

    setDialogOpen(false);
  };

  const renderNotes = (
    notes: NotificationItem[],
    allowActions: boolean
  ) =>
    notes.map((n) => {
      const Icon =
        notificationTypeStyle[n.type]
          ?.icon ??
        notificationTypeStyle.info
          .icon;

      const cls =
        notificationTypeStyle[n.type]
          ?.cls ??
        notificationTypeStyle.info
          .cls;
      const rawNotice = (n as any).raw;
      const apiNoticeId =
        rawNotice?.id ??
        rawNotice?.noticeId ??
        rawNotice?._id ??
        n.id;

      return (
        <div
          key={n.id}
          className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 border border-border"
        >
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${cls}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground whitespace-pre-line">
                {n.title}
              </p>

              <span className="rounded-full border border-input px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {n.subject}
              </span>
            </div>

            {n.description ? (
              <p className="text-sm text-foreground/80 mt-1 whitespace-pre-line">
                {n.description}
              </p>
            ) : null}

            <p className="text-xs text-muted-foreground mt-1">
              {n.time}
            </p>

            {(n.startTime ||
              n.endTime) && (
              <p className="text-xs text-muted-foreground mt-1">
                {n.startTime
                  ? `Start Date: ${n.startTime}`
                  : ""}

                {n.startTime &&
                n.endTime
                  ? " · "
                  : ""}

                {n.endTime
                  ? `End Date: ${n.endTime}`
                  : ""}
              </p>
            )}

            {/* ACTION BUTTONS ONLY FOR STUDENT */}
            {allowActions && rawNotice && (
              <div className="flex items-center gap-2 mt-3">

                {/* EDIT */}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => {
                    setEditingId(String(apiNoticeId));

                    setTitle(
                      n.title || ""
                    );

                    setDescription(
                      n.description ??
                        rawNotice.description ??
                        ""
                    );

                    setSubject(
                      n.subject
                    );

                    setCourseCode(
                      rawNotice.courseCode ??
                        rawNotice.course_code ??
                        n.subject
                    );

                    if (n.startTime) {
                      setStartDate(new Date(`${n.startTime}T00:00:00`));
                    }

                    if (n.endTime) {
                      setEndDate(new Date(`${n.endTime}T00:00:00`));
                    }

                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>

                {/* DELETE */}
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex items-center gap-1"
                  onClick={async () => {
                    try {
                      await deleteNoticeMutation.mutateAsync(String(apiNoticeId));
                      toast({
                        title: "Notification deleted.",
                      });
                    } catch (error: any) {
                      console.error("Error deleting notice:", error);
                      toast({
                        title: "Failed to delete notice.",
                        description: error?.message ?? "Please check the notice API and try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    });

  return (
    <RoleShell
      role="teacher"
      title="Notifications"
      subtitle="Admin and student updates in one place"
    >
      <Card className="space-y-4 p-6 bg-surface border-border">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          {/* HEADER */}
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">
              Notifications dashboard
            </p>

            <p className="text-sm text-muted-foreground">
              Switch between admin and student notifications.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* TAB SWITCH */}
            <div className="inline-flex overflow-hidden rounded-full border border-input bg-background">

              <Button
                variant={
                  activeTab === "admin"
                    ? "default"
                    : "ghost"
                }
                className="rounded-none px-4 py-2"
                onClick={() =>
                  setActiveTab(
                    "admin"
                  )
                }
              >
                Admin
              </Button>

              <Button
                variant={
                  activeTab ===
                  "student"
                    ? "default"
                    : "ghost"
                }
                className="rounded-none px-4 py-2"
                onClick={() =>
                  setActiveTab(
                    "student"
                  )
                }
              >
                Student
              </Button>
            </div>

            {/* SUBJECT FILTER */}
            {activeTab ===
            "student" ? (
              <select
                value={
                  selectedStudentSubject
                }
                onChange={(e) =>
                  setSelectedStudentSubject(
                    e.target.value
                  )
                }
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="All">
                  All subjects
                </option>

                {SUBJECT_LIST.map(
                  (
                    subjectOption
                  ) => (
                    <option
                      key={
                        subjectOption
                      }
                      value={
                        subjectOption
                      }
                    >
                      {
                        subjectOption
                      }
                    </option>
                  )
                )}
              </select>
            ) : null}

            {/* CREATE NOTICE */}
            {activeTab ===
            "student" ? (
              <Dialog
                open={dialogOpen}
                onOpenChange={(
                  open
                ) => {
                  if (open) {
                    setSubject(
                      selectedStudentSubject ===
                        "All"
                        ? "General"
                        : selectedStudentSubject
                    );
                  }

                  setDialogOpen(
                    open
                  );
                }}
              >
                <DialogTrigger asChild>
                  <Button disabled={isNoticeContextLoading}>
                    {isNoticeContextLoading
                      ? "Loading details..."
                      : editingId
                        ? "Update notification"
                        : "Create notification"}
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">

                  <DialogHeader>
                    <DialogTitle>
                      Create Notice
                    </DialogTitle>

                    <DialogDescription>
                      Fill all fields
                      to create a
                      detailed notice.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="notice-title">Title</Label>
                      <Input
                        id="notice-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Notice title"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="notice-description">Description</Label>
                      <Textarea
                        id="notice-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write the notice details"
                        className="min-h-28"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="notice-institution">Institution ID</Label>
                        <Input
                          id="notice-institution"
                          value={institutionId}
                          onChange={(e) => setInstitutionId(e.target.value)}
                          placeholder="Institution ID"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notice-batch">Batch ID</Label>
                        <Input
                          id="notice-batch"
                          value={batchId}
                          onChange={(e) => setBatchId(e.target.value)}
                          placeholder="Batch ID"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="notice-subject">Subject</Label>
                        <select
                          id="notice-subject"
                          value={subject}
                          onChange={(e) => {
                            setSubject(e.target.value);
                            setCourseCode(e.target.value);
                          }}
                          className="flex h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                        >
                          {SUBJECT_LIST.map((subjectOption) => (
                            <option key={subjectOption} value={subjectOption}>
                              {subjectOption}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notice-course">Course Code</Label>
                        <Input
                          id="notice-course"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value)}
                          placeholder="Course code"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="notice-start">Start Date</Label>
                        <div className="relative">
                          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="notice-start"
                            type="date"
                            className="pl-9"
                            value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                            onChange={(e) =>
                              setStartDate(e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notice-end">End Date</Label>
                        <div className="relative">
                          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="notice-end"
                            type="date"
                            className="pl-9"
                            value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                            onChange={(e) =>
                              setEndDate(e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="notice-created-by">Created By</Label>
                      <Input
                        id="notice-created-by"
                        value={createdBy}
                        onChange={(e) => setCreatedBy(e.target.value)}
                        placeholder="Created by"
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button
                      onClick={
                        handleSubmit
                      }
                      disabled={
                        isSubmitting ||
                        addNoticeMutation.isPending ||
                        editNoticeMutation.isPending
                      }
                    >
                      {isSubmitting || addNoticeMutation.isPending || editNoticeMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {editingId
                        ? "Update Notice"
                        : "Create Notice"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </div>
      </Card>

      {/* ADMIN TAB */}
      {activeTab ===
      "admin" ? (
        <Card className="p-4 bg-surface border-border">

          <div className="mb-4 flex items-center justify-between gap-4">

            <div>
              <p className="text-base font-semibold text-foreground">
                Admin
                notifications
              </p>

              <p className="text-sm text-muted-foreground">
                Only message
                view for admin
                alerts.
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive-foreground shadow-sm" />
              {adminCount} in
              batch
            </span>
          </div>

          <div className="space-y-2">
            {renderNotes(
              adminNotes,
              false
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-surface border-border">

          <div className="mb-4 flex items-center justify-between gap-4">

            <div>
              <p className="text-base font-semibold text-foreground">
                Student
                notifications
              </p>

              <p className="text-sm text-muted-foreground">
                Create and
                sync
                subject-wise
                notifications
                for students.
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive-foreground shadow-sm" />
              {
                studentCount
              }{" "}
              in batch
            </span>
          </div>

          <div className="space-y-2">
            {renderNotes(
              studentNotes,
              true
            )}
          </div>
        </Card>
      )}
    </RoleShell>
  );
};

export default TeacherNotifications;
