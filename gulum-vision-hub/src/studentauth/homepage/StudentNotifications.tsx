import { useMemo, useState } from "react";
import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { noticeToNotification, useGetNoticesByLevel } from "@/services/noticeAPI";
import { useStudentMasters } from "@/services/lectureAuditAPI";
import {
  notificationTypeStyle,
  defaultAdminNotifications,
  defaultStudentNotifications,
  sortByCreatedAt,
  type NotificationItem,
} from "@/lib/notifications";
import { BookOpen, ChevronDown } from "lucide-react";

// ── Notification Card ─────────────────────────────────────────────────────────

const NotifCard = ({ n }: { n: NotificationItem }) => {
  const Icon = notificationTypeStyle[n.type]?.icon ?? notificationTypeStyle.info.icon;
  const cls  = notificationTypeStyle[n.type]?.cls  ?? notificationTypeStyle.info.cls;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/30 transition">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground">{n.title}</p>
          {n.subject && n.subject.toLowerCase() !== "general" && (
            <span className="rounded-full border border-input px-2 py-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
              {n.subject}
            </span>
          )}
        </div>
        {n.description && (
          <p className="text-xs text-foreground/75 mt-0.5 leading-5">{n.description}</p>
        )}
        {(n.startTime || n.endTime) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Time: {n.startTime ?? "--:--"} – {n.endTime ?? "--:--"}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const StudentNotifications = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"admin" | "student">("student");
  const [subjectFilter, setSubjectFilter] = useState("All");

  // ── Live subject list from enrolled courses ──
  const { data: syllabusData } = useStudentMasters();

  const subjectList = useMemo<string[]>(() => {
    if (!syllabusData?.length) return [];
    return syllabusData.map((s: any) => s.name ?? s.syllabusName ?? s.courseName).filter(Boolean);
  }, [syllabusData]);

  // ── Notice API ──
  const adminQuery   = useGetNoticesByLevel("ADMIN",   { batchId: user?.batchId, enabled: Boolean(user?.batchId) });
  const studentQuery = useGetNoticesByLevel("STUDENT");

  const apiAdmin   = useMemo(() => (adminQuery.data   ?? []).map((n: any) => noticeToNotification(n, "admin")),   [adminQuery.data]);
  const apiStudent = useMemo(() => (studentQuery.data ?? []).map((n: any) => noticeToNotification(n, "student")), [studentQuery.data]);

  const adminNotes = useMemo(
    () => sortByCreatedAt([...defaultAdminNotifications, ...apiAdmin]),
    [apiAdmin],
  );

  const studentNotes = useMemo(() => {
    const all = [...defaultStudentNotifications, ...apiStudent];
    if (subjectFilter === "All") return sortByCreatedAt(all);
    return sortByCreatedAt(
      all.filter((n) => n.subject?.toLowerCase() === subjectFilter.toLowerCase()),
    );
  }, [apiStudent, subjectFilter]);

  const activeNotes = activeTab === "admin" ? adminNotes : studentNotes;
  const isLoading   = activeTab === "admin" ? adminQuery.isLoading : studentQuery.isLoading;

  return (
    <RoleShell role="student" title="Notifications" subtitle="All your updates">

      {/* ── Dashboard card ── */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div>
          <p className="text-base font-bold text-foreground">Notifications dashboard</p>
          <p className="text-sm text-muted-foreground mt-0.5">Switch between admin and student notifications.</p>
        </div>

        {/* Tab toggle */}
        <div className="inline-flex rounded-full border border-input bg-background overflow-hidden">
          {(["admin", "student"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSubjectFilter("All"); }}
              className={`px-6 py-2 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Subject filter — student tab only, built from API subjects */}
        {activeTab === "student" && (
          <div className="relative w-fit">
            <div className="flex items-center gap-2 h-10 rounded-xl border border-input bg-background px-3">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="appearance-none bg-transparent text-sm font-semibold text-foreground pr-6 focus:outline-none cursor-pointer"
              >
                <option value="All">All Subjects</option>
                {subjectList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-3 pointer-events-none" />
            </div>
          </div>
        )}
      </Card>

      {/* ── Notification list ── */}
      <Card className="p-5 bg-surface border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-base font-bold text-foreground">
              {activeTab === "admin" ? "Admin notifications" : "Student notifications"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeTab === "admin"
                ? "Updates sent by the institute administration."
                : "Subject-wise alerts and student updates."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground shrink-0">
            <span className="h-2 w-2 rounded-full bg-destructive-foreground" />
            {activeNotes.length} in batch
          </span>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : activeNotes.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No notifications found.</div>
        ) : (
          <div className="space-y-2">
            {activeNotes.map((n) => <NotifCard key={n.id} n={n} />)}
          </div>
        )}
      </Card>

    </RoleShell>
  );
};

export default StudentNotifications;
