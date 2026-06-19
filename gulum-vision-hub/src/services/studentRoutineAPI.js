import { useQuery } from "@tanstack/react-query";
import api from "./api"; // axios instance with interceptors

/**
 * Hook to fetch student routine dynamically (OLD endpoint - timetable view)
 * @param {string} institutionId
 * @param {string} departmentId
 * @param {string} classesId
 */
export function useStudentRoutine(institutionId, departmentId, classesId) {
  return useQuery({
    queryKey: ["student-routine", institutionId, departmentId, classesId],
    queryFn: async () => {
      const res = await api.get(
        `/schedule/view/${institutionId}/${departmentId}/${classesId}`
      );

      const timetable = res.data?.responseData?.timetable ?? [];
      
      // Flatten timetable into array of objects
      return timetable.map((item) => ({
        subject: item.courseName ?? "Free Period",
        teacher: item.teacherName ?? "",
        code: item.courseCode ?? "",
        time: `${item.startTime ?? "_"}–${item.endTime ?? ""}`,
        day: item.day,
        slot: item.slotNumber,
        occupied: item.occupied,
      }));
    },
    enabled: !!institutionId && !!departmentId && !!classesId,
  });
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Hook to fetch student weekly schedule using the correct student-facing endpoint.
 * Returns data grouped by day: Array<{ day: string, periods: Array<{ time, subject, teacher, code, classroom, id }> }>
 * @param {string} studentId - The student's ID
 */
export function useStudentScheduleById(studentId) {
  return useQuery({
    queryKey: ["student-schedule-by-id", studentId],
    queryFn: async () => {
      const res = await api.get(`/schedule/student/${studentId}`);
      const weekRoutine = res.data?.responseData?.weekRoutine ?? [];

      const result = weekRoutine.map((dayEntry) => {
        const periods = (dayEntry.periods ?? []).map((p) => {
          const start = p.startTime ? p.startTime.slice(0, 5) : "";
          const end = p.endTime ? p.endTime.slice(0, 5) : "";
          return {
            id: p._id ?? Math.random().toString(),
            time: `${start}–${end}`,
            subject: p.subjectName ?? "No Subject",
            teacher: p.teacherName ?? "",
            code: p.subjectCode ?? "",
            classroom: p.classroom ?? "",
          };
        });

        // Sort periods by start time
        periods.sort((a, b) => a.time.localeCompare(b.time));

        return { day: dayEntry.day ?? "", periods };
      });

      // Sort days in week order
      return result.sort(
        (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
      );
    },
    enabled: !!studentId,
    staleTime: Infinity,
  });
}
