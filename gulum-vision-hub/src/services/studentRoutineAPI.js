import { useQuery } from "@tanstack/react-query";
import api from "./api"; // axios instance with interceptors

/**
 * Hook to fetch student routine dynamically
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
      
      // ✅ Flatten timetable into array of objects
      return timetable.map((item) => ({
        subject: item.courseName ?? "Unknown Subject",
        teacher: item.teacherName ?? "",
        code: item.courseCode ?? "",
        time: `${item.startTime ?? ""}–${item.endTime ?? ""}`,
        day: item.day,
        slot: item.slotNumber,
        occupied: item.occupied,
      }));
    },
    enabled: !!institutionId && !!departmentId && !!classesId, // only fetch when IDs are ready
  });
}
