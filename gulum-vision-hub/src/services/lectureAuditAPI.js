import { useQuery } from "@tanstack/react-query";
import api from "./api";

export const useSyllabusMasters = () =>
  useQuery({
    queryKey: ["syllabus-masters"],
    queryFn: async () => {
      const { data } = await api.get("/syllabus/masters");
      return data;
    },
  });

export const useSyllabusModules = (masterId) =>
  useQuery({
    queryKey: ["syllabus-modules", masterId],
    enabled: !!masterId,
    queryFn: async () => {
      const { data } = await api.get(`/syllabus/modules/${masterId}`);
      return data;
    },
  });

export const useTracking = ({ classId, courseCode }) =>
  useQuery({
    queryKey: ["tracking", classId, courseCode],
    enabled: !!classId && !!courseCode,
    queryFn: async () => {
      const { data } = await api.get("/syllabus/tracking", {
        params: { classId, courseCode },
      });
      return data;
    },
  });

export const useStudentSyllabus = () =>
  useQuery({
    queryKey: ["student-syllabus"],
    queryFn: async () => {
      const { data } = await api.get("/syllabus/student");
      return data;
    },
  });
