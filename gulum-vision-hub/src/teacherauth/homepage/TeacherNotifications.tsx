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
import { addNotice } from "@/services/noticeAPI";

import {
  notificationTypeStyle,
  createSharedNotification,
  defaultAdminNotifications,
  defaultStudentNotifications,
  getSharedNotifications,
  saveSharedNotifications,
  sortByCreatedAt,
  SUBJECT_LIST,
  type NotificationItem,
} from "@/lib/notifications";

const TeacherNotifications = () => {
  const [sharedNotifications, setSharedNotifications] =
    useState<NotificationItem[]>([]);

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

  // FORM STATES
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [institutionId] =
    useState("DUMMY COLG ID1");

  const [batchId, setBatchId] =
    useState("test-batch-1");

  const [courseCode, setCourseCode] =
    useState(
      selectedStudentSubject === "All"
        ? SUBJECT_LIST[0]
        : selectedStudentSubject
    );

  const [createdBy, setCreatedBy] =
    useState("Admin");

  const [subject, setSubject] =
    useState<string>("General");

  // DATE STATES
  const [startDate, setStartDate] =
    useState<Date | undefined>();

  const [endDate, setEndDate] =
    useState<Date | undefined>();

  useEffect(() => {
    setSharedNotifications(
      getSharedNotifications()
    );
  }, []);

  useEffect(() => {
    if (selectedStudentSubject !== "All") {
      setSubject(
        selectedStudentSubject
      );
    }
  }, [selectedStudentSubject]);

  useEffect(() => {
    if (selectedStudentSubject !== "All") {
      setCourseCode(
        selectedStudentSubject
      );
    }
  }, [selectedStudentSubject]);

  const adminNotes = useMemo(
    () =>
      sortByCreatedAt([
        ...defaultAdminNotifications,
        ...sharedNotifications.filter(
          (note) =>
            note.target === "admin"
        ),
      ]),
    [sharedNotifications]
  );

  const studentNotes = useMemo(
    () =>
      sortByCreatedAt(
        [
          ...defaultStudentNotifications,
          ...sharedNotifications.filter(
            (note) =>
              note.target === "student"
          ),
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
      sharedNotifications,
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

    const payload = {
      title,
      description,
      institutionId,
      level: "two",
      batchId,
      courseCode,
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
      createdBy,
    };

    let next: NotificationItem[];

    // EDIT
    if (editingId) {
      next = sharedNotifications.map(
        (note) =>
          note.id === editingId
            ? {
                ...note,
                title: `${title}\n${description}`,
                subject,
                startTime: startDate
                  ? format(
                      startDate,
                      "dd/MM/yyyy"
                    )
                  : undefined,
                endTime: endDate
                  ? format(
                      endDate,
                      "dd/MM/yyyy"
                    )
                  : undefined,
              }
            : note
      );

      toast({
        title: "Notification updated.",
      });
    }

    // CREATE
    else {
      setIsSubmitting(true);

      try {
        await addNotice(payload);
      } catch (error) {
        console.error("Error creating notice:", error);
        toast({
          title: "Failed to create notice.",
          description: "Please check the notice API and try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      next = [
        createSharedNotification(
          `${title}\n${description}`,
          "info",
          subject,
          "student",
          startDate
            ? format(
                startDate,
                "dd/MM/yyyy"
              )
            : undefined,
          endDate
            ? format(
                endDate,
                "dd/MM/yyyy"
              )
            : undefined
        ),
        ...sharedNotifications,
      ];

      toast({
        title: "Notification created successfully.",
      });
    }

    setIsSubmitting(false);
    saveSharedNotifications(next);
    setSharedNotifications(next);

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
            {allowActions && (
              <div className="flex items-center gap-2 mt-3">

                {/* EDIT */}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => {
                    setEditingId(n.id);

                    const parts =
                      n.title.split("\n");

                    setTitle(
                      parts[0] || ""
                    );

                    setDescription(
                      parts
                        .slice(1)
                        .join("\n")
                    );

                    setSubject(
                      n.subject
                    );

                    if (n.startTime) {
                      const [
                        day,
                        month,
                        year,
                      ] =
                        n.startTime.split(
                          "/"
                        );

                      setStartDate(
                        new Date(
                          Number(year),
                          Number(month) -
                            1,
                          Number(day)
                        )
                      );
                    }

                    if (n.endTime) {
                      const [
                        day,
                        month,
                        year,
                      ] =
                        n.endTime.split(
                          "/"
                        );

                      setEndDate(
                        new Date(
                          Number(year),
                          Number(month) -
                            1,
                          Number(day)
                        )
                      );
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
                  onClick={() => {
                    const next =
                      sharedNotifications.filter(
                        (note) =>
                          note.id !==
                          n.id
                      );

                    saveSharedNotifications(
                      next
                    );

                    setSharedNotifications(
                      next
                    );

                    toast({
                      title: "Notification deleted.",
                    });
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
                  <Button>
                    {editingId
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
                        <Input id="notice-institution" value={institutionId} readOnly />
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
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
