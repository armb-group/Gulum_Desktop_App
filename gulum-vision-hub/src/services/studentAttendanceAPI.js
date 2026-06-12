import { useQuery } from "@tanstack/react-query";
import api from "./api";

export const useStudentAttendance = () =>
  useQuery({
    queryKey: ["student-attendance"],
    queryFn: async () => {
      const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
      const studentId = user?.id;

      const { data } = await api.get(
        `/gulum/attendance/all`,
        {
          params: { studentId },
        }
      );

      console.log("🔥 RAW ATTENDANCE API RESPONSE:", data);

      // IMPORTANT: backend returns ARRAY directly
      return Array.isArray(data) ? data : [];
    },
  });