import { AlertCircle, Award, Bell, CalendarDays, FileCheck, FileText, Users } from "lucide-react";

export type NotificationType = "info" | "success" | "warning" | "danger";
export type NotificationTarget = "student" | "admin";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  type: NotificationType;
  target: NotificationTarget;
  subject: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

const STORAGE_KEY = "gulum-shared-notifications";

export const SUBJECT_LIST = ["General", "DBMS", "OS", "Data Structures", "Mathematics", "Physics"] as const;

export const notificationTypeStyle = {
  info: {
    cls: "bg-info-soft text-info",
    icon: CalendarDays,
  },
  success: {
    cls: "bg-success-soft text-success",
    icon: Award,
  },
  warning: {
    cls: "bg-purple-soft text-purple",
    icon: Bell,
  },
  danger: {
    cls: "bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
} as const;

export const defaultAdminNotifications: NotificationItem[] = [
  {
    id: "admin-1",
    title: "System maintenance scheduled for midnight",
    time: "2h ago",
    type: "warning",
    target: "admin",
    subject: "General",
    createdAt: "2025-01-01T12:00:00.000Z",
  },
  {
    id: "admin-2",
    title: "New policy update published by administration",
    time: "5h ago",
    type: "info",
    target: "admin",
    subject: "General",
    createdAt: "2025-01-01T08:00:00.000Z",
  },
  {
    id: "admin-3",
    title: "Campus access hours changed for exam week",
    time: "1d ago",
    type: "info",
    target: "admin",
    subject: "General",
    createdAt: "2024-12-31T14:00:00.000Z",
  },
];

export const defaultStudentNotifications: NotificationItem[] = [
  {
    id: "student-1",
    title: "Your OS attendance is below 75%",
    time: "2h ago",
    type: "danger",
    target: "student",
    subject: "OS",
    createdAt: "2025-01-01T12:00:00.000Z",
  },
  {
    id: "student-2",
    title: "PTM on 28 July, 10:00 AM — Hall B",
    time: "5h ago",
    type: "info",
    target: "student",
    subject: "General",
    createdAt: "2025-01-01T08:00:00.000Z",
  },
  {
    id: "student-3",
    title: "You scored 18/20 in Linked List Assignment",
    time: "1d ago",
    type: "success",
    target: "student",
    subject: "Data Structures",
    createdAt: "2024-12-31T14:00:00.000Z",
  },
  {
    id: "student-4",
    title: "New assignment posted: Binary Tree Traversal",
    time: "2d ago",
    type: "info",
    target: "student",
    subject: "Data Structures",
    createdAt: "2024-12-30T09:00:00.000Z",
  },
];

export function getSharedNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as NotificationItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveSharedNotifications(notes: NotificationItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  window.dispatchEvent(new Event("gulum-shared-notifications-updated"));
}

export function getNotificationCountForRole(role: "student" | "teacher") {
  const shared = getSharedNotifications();
  const baseCount = defaultAdminNotifications.length + defaultStudentNotifications.length;
  return baseCount + shared.length;
}

export function createSharedNotification(
  title: string,
  type: NotificationType,
  subject: string,
  target: NotificationTarget,
  startTime?: string,
  endTime?: string,
): NotificationItem {
  const createdAt = new Date().toISOString();
  const time = "just now";

  return {
    id: crypto?.randomUUID?.() ?? `${Date.now()}`,
    title,
    type,
    target,
    subject,
    startTime,
    endTime,
    time,
    createdAt,
  };
}

export function sortByCreatedAt(notes: NotificationItem[]) {
  return [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
