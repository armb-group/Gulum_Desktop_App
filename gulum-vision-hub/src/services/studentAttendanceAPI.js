import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

// ── Student: own attendance ───────────────────────────────────────────────────
export const useStudentAttendance = () =>
  useQuery({
    queryKey: ["student-attendance"],
    queryFn: async () => {
      const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
      if (!user) return [];
      const response = await api.get(`/attendance/all`, { params: { studentId: user.id } });
      return Array.isArray(response.data) ? response.data : [];
    },
  });

// ── GET students by course ────────────────────────────────────────────────────
// Response: array of student objects
export const getStudentsByCourse = async (course) => {
  const response = await api.get(`/api/students/course/${encodeURIComponent(course)}`);
  const raw = response.data.responseData ?? response.data;
  return Array.isArray(raw) ? raw : [];
};

export const useGetStudentsByCourse = (course, options = {}) =>
  useQuery({
    queryKey: ["students-by-course", course ?? ""],
    queryFn: () => getStudentsByCourse(course),
    enabled: !!course && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  });

// ── POST start attendance session ─────────────────────────────────────────────
export const startAttendanceSession = async (payload) => {
  const response = await api.post("attendance/session/start", payload);
  return response.data.responseData ?? response.data;
};

export const useStartAttendanceSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startAttendanceSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-sessions"] }),
  });
};

// ── PUT complete/update attendance session ────────────────────────────────────
export const completeAttendanceSession = async (sessionId, payload = {}) => {
  const response = await api.put(`attendance/session/complete/${encodeURIComponent(sessionId)}`, payload);
  return response.data.responseData ?? response.data;
};

export const useCompleteAttendanceSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }) => completeAttendanceSession(sessionId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-sessions"] }),
  });
};

// ── POST mark individual attendance record ────────────────────────────────────
export const markAttendance = async (payload) => {
  const response = await api.post("attendance", payload);
  return response.data.responseData ?? response.data;
};

export const useMarkAttendance = () =>
  useMutation({ mutationFn: markAttendance });

// ── GET attendance percentage
// Response: array of { studentId, courseName, courseCode, courseId,
//   totalClasses, presentCount, lateCount, absentCount, attendancePercentage,
//   "Attendance History": [{ status, date }] }
export const getAttendancePercentage = async (studentId, courseId) => {
  const response = await api.get("attendance/percentage", {
    params: { studentId, courseId },
  });
  const raw = response.data.responseData ?? response.data;
  // API returns array — find the record matching studentId+courseId
  if (Array.isArray(raw)) {
    return raw.find(r => r.studentId === studentId && (r.courseId === courseId || r.courseCode === courseId))
      ?? raw[0]
      ?? null;
  }
  return raw ?? null;
};

// Fetch percentage for ALL students in a course at once
// Returns a map: studentId → percentage record
export const getAttendancePercentageForCourse = async (studentIds, courseId) => {
  const results = await Promise.allSettled(
    studentIds.map((sid) => getAttendancePercentage(sid, courseId))
  );
  const map = {};
  studentIds.forEach((sid, i) => {
    const r = results[i];
    if (r.status === "fulfilled" && r.value) map[sid] = r.value;
  });
  return map;
};

export const useGetAttendancePercentage = (studentId, courseId, options = {}) =>
  useQuery({
    queryKey: ["attendance-percentage", studentId ?? "", courseId ?? ""],
    queryFn: () => getAttendancePercentage(studentId, courseId),
    enabled: !!studentId && !!courseId && (options.enabled ?? true),
  });
