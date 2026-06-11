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

export const useStudentMasters = () =>
  useQuery({
    queryKey: ["student-masters"],
    queryFn: async () => {
      const { data } = await api.get("/api/master");
      return data;
    },
  });

export const useStudentModules = (courseCode) =>
  useQuery({
    queryKey: ["student-modules", courseCode],
    enabled: !!courseCode,
    queryFn: async () => {
      const { data } = await api.get(`/api/module/${courseCode}`);
      return data;
    },
  });

export const useStudentTrackingStatus = (trackingId) =>
  useQuery({
    queryKey: ["student-tracking-status", trackingId],
    enabled: !!trackingId,
    queryFn: async () => {
      const { data } = await api.get(`/api/module/status/${trackingId}`);
      return data;
    },
  });

export const useStudentTrackingAll = (classId) =>
  useQuery({
    queryKey: ["student-tracking-all", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await api.get(`/api/tracking/all/${classId}`);
      return data;
    },
  });
  
export const progressApi = async (trackingId) => {
  const res = await api.get(`/api/progress/${trackingId}`);

  return res.data;
};

export const getProgress = (trackingId) => {
  return useQuery({
    queryKey: ["progress", trackingId],
    queryFn: () => progressApi(trackingId),
    enabled: !!trackingId,
    staleTime: 0,
  });
};