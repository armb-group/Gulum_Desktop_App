import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

// ── GET students enrolled in a course ─────────────────────────────────────────
// Endpoint: GET /api/students/course/{course}
export const getStudentsByCourse = async (courseCode) => {
  const res = await api.get(`api/students/course/${encodeURIComponent(courseCode)}`);
  const raw = res.data?.responseData ?? res.data;
  // API may return { students: [] } or [] directly
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.students)) return raw.students;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

export const useGetStudentsByCourse = (courseCode, options = {}) =>
  useQuery({
    queryKey: ["teacher-students-by-course", courseCode ?? ""],
    queryFn: () => getStudentsByCourse(courseCode),
    enabled: !!courseCode && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  });

// ── POST start an attendance session ─────────────────────────────────────────
// Endpoint: POST /attendance/session/start
// payload: { courseCode, courseId?, classId, teacherId, date, startTime, endTime, slotNumber }
export const startAttendanceSession = async (payload) => {
  const res = await api.post("attendance/session/start", payload);
  return res.data?.responseData ?? res.data;
};

export const useStartAttendanceSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startAttendanceSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-attendance-sessions"] }),
  });
};

// ── PUT complete/update an attendance session ─────────────────────────────────
// Endpoint: PUT /attendance/session/complete/{id}
// payload: { presentCount, lateCount, absentCount }
export const completeAttendanceSession = async (sessionId, payload = {}) => {
  const res = await api.put(
    `attendance/session/complete/${encodeURIComponent(sessionId)}`,
    payload
  );
  return res.data?.responseData ?? res.data;
};

export const useCompleteAttendanceSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }) => completeAttendanceSession(sessionId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-attendance-sessions"] }),
  });
};

// ── POST mark a single student's attendance record ────────────────────────────
// Endpoint: POST /attendance
// payload: { studentId, courseCode, courseId?, classesId, sessionId?, date, status }
export const markAttendance = async (payload) => {
  const res = await api.post("attendance", payload);
  return res.data?.responseData ?? res.data;
};

export const useMarkAttendance = () =>
  useMutation({ mutationFn: markAttendance });

// ── GET attendance percentage for one student + course ────────────────────────
// Endpoint: GET /attendance/percentage?studentId=&courseId=
export const getAttendancePercentage = async (studentId, courseId) => {
  const res = await api.get("attendance/percentage", {
    params: { studentId, courseId },
  });
  const raw = res.data?.responseData ?? res.data;
  // API may return a single object or an array — handle both
  if (Array.isArray(raw)) {
    return (
      raw.find(
        (r) =>
          r.studentId === studentId &&
          (r.courseId === courseId || r.courseCode === courseId)
      ) ??
      raw[0] ??
      null
    );
  }
  return raw ?? null;
};

export const useGetAttendancePercentage = (studentId, courseId, options = {}) =>
  useQuery({
    queryKey: ["teacher-attendance-pct", studentId ?? "", courseId ?? ""],
    queryFn: () => getAttendancePercentage(studentId, courseId),
    enabled: !!studentId && !!courseId && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  });

// ── GET all sessions logged by a teacher ─────────────────────────────────────
export const getTeacherSessions = async (teacherId) => {
  const res = await api.get("attendance/session/teacher", {
    params: { teacherId },
  });
  const raw = res.data?.responseData ?? res.data;
  return Array.isArray(raw) ? raw : [];
};

export const useGetTeacherSessions = (teacherId, options = {}) =>
  useQuery({
    queryKey: ["teacher-attendance-sessions", teacherId ?? ""],
    queryFn: () => getTeacherSessions(teacherId),
    enabled: !!teacherId && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  });
