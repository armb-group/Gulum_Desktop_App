import { useQuery } from "@tanstack/react-query";
import api from "./api";

export const useStudentAttendance = () =>
  useQuery({
    queryKey: ["student-attendance"],
    queryFn: async () => {
      const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
      const studentId = user?.id;
      const response = await api.get(`/attendance/all`, {
        params: { studentId },
        headers: {
      Authorization: `Bearer ${user.token}`,
      "gulum-institution-id": user.institutionId,
    },
      });

      

      return Array.isArray(response.data) ? response.data : [];
    },
  });