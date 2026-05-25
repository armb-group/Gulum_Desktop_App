import { useMemo, useState } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { noticeToNotification, useGetNoticesByLevel } from "@/services/noticeAPI";
import {
  notificationTypeStyle,
  defaultAdminNotifications,
  defaultStudentNotifications,
  sortByCreatedAt,
  SUBJECT_LIST,
  type NotificationItem,
} from "@/lib/notifications";

const StudentNotifications = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"admin" | "student">("student");
  const [studentSubjectFilter, setStudentSubjectFilter] = useState<string>("All");

  const adminNoticeQuery = useGetNoticesByLevel("ADMIN", {
    batchId: user?.batchId,
    enabled: Boolean(user?.batchId),
  });
  const studentNoticeQuery = useGetNoticesByLevel("STUDENT");

  const apiAdminNotifications = useMemo(
    () => (adminNoticeQuery.data ?? []).map((notice) => noticeToNotification(notice, "admin")),
    [adminNoticeQuery.data],
  );

  const apiStudentNotifications = useMemo(
    () => (studentNoticeQuery.data ?? []).map((notice) => noticeToNotification(notice, "student")),
    [studentNoticeQuery.data],
  );

  const adminNotes = useMemo(
    () => sortByCreatedAt([...defaultAdminNotifications, ...apiAdminNotifications]),
    [apiAdminNotifications],
  );

  const studentNotes = useMemo(
    () =>
      sortByCreatedAt(
        [...defaultStudentNotifications, ...apiStudentNotifications].filter(
          (n) => studentSubjectFilter === "All" || n.subject === studentSubjectFilter,
        ),
      ),
    [apiStudentNotifications, studentSubjectFilter],
  );

  const adminCount = adminNotes.length;
  const studentCount = studentNotes.length;

  const renderNotes = (notes: NotificationItem[]) =>
    notes.map((n) => {
      const Icon = notificationTypeStyle[n.type]?.icon ?? notificationTypeStyle.info.icon;
      const cls = notificationTypeStyle[n.type]?.cls ?? notificationTypeStyle.info.cls;

      return (
        <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cls}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground whitespace-pre-line">{n.title}</p>
              <span className="rounded-full border border-input px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {n.subject}
              </span>
            </div>
            {n.description ? (
              <p className="text-sm text-foreground/80 mt-1 whitespace-pre-line">{n.description}</p>
            ) : null}
            <p className="text-xs text-muted-foreground italic">{n.time}</p>
          </div>
        </div>
      );
    });

  return (
    <RoleShell role="student" title="Notifications" subtitle="All your updates">
      <Card className="space-y-4 p-6 bg-surface border-border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">Notifications</p>
            <p className="text-sm text-muted-foreground">Switch between admin and student alerts.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex overflow-hidden rounded-full border border-input bg-background">
              <Button
                variant={activeTab === "admin" ? "default" : "ghost"}
                className="rounded-none px-4 py-2"
                onClick={() => setActiveTab("admin")}
              >
                Admin
              </Button>
              <Button
                variant={activeTab === "student" ? "default" : "ghost"}
                className="rounded-none px-4 py-2"
                onClick={() => setActiveTab("student")}
              >
                Student
              </Button>
            </div>
              {activeTab === "student" ? (
              <select
                value={studentSubjectFilter}
                onChange={(e) => setStudentSubjectFilter(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="All">All subjects</option>
                {SUBJECT_LIST.map((subjectOption) => (
                  <option key={subjectOption} value={subjectOption}>
                    {subjectOption}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </Card>

      {activeTab === "admin" ? (
        <Card className="p-4 bg-surface border-border">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">Admin notifications</p>
              <p className="text-sm text-muted-foreground">Updates sent by the institute administration.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive-foreground shadow-sm" />
              {adminCount} in batch
            </span>
          </div>
          <div className="space-y-2">{renderNotes(adminNotes)}</div>
        </Card>
      ) : (
        <Card className="p-4 bg-surface border-border">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">Student notifications</p>
              <p className="text-sm text-muted-foreground">Subject-wise alerts and student updates.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive-foreground shadow-sm" />
              {studentCount} in batch
            </span>
          </div>
          <div className="space-y-2">{renderNotes(studentNotes)}</div>
        </Card>
      )}
    </RoleShell>
  );
};

export default StudentNotifications;
