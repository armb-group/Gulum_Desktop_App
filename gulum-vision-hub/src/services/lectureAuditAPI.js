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

// export const useStudentSyllabus = () =>
//   useQuery({
//     queryKey: ["student-syllabus"],
//     queryFn: async () => {
//       const { data } = await api.get("/syllabus/student");
//       return data;
//     },
//   });

export const useStudentMasters = () => {
  const user = JSON.parse(
    localStorage.getItem("gulum-user") || "null"
  );

  const classId = user?.classId;

  return useQuery({
    queryKey: ["student-masters", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await api.get(
        `/api/master/class/${classId}`
      );
      return data;
    },
  });
};

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

export const createProgressApi = async (data) => {
  const res = await api.post("/api/progress", data);
  return res.data;
};

export const deleteProgressApi = async (trackingId, moduleId) => {
  const res = await api.delete(`/api/progress/${trackingId}/${moduleId}`);
  return res.data;
};

export const createTrackingApi = async (data) => {
  const res = await api.post("/api/tracking", data);
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

export const getCourseModules = async (courseCode) => {
  const { data } = await api.get(`/api/module/${encodeURIComponent(courseCode)}`);
  return data?.responseData ?? data;
};

export const getTrackingAll = async (classId) => {
  const { data } = await api.get(`/api/tracking/all/${encodeURIComponent(classId)}`);
  return data?.responseData ?? data;
};

export const getModuleStatus = async (trackingId) => {
  const { data } = await api.get(`/api/module/status/${encodeURIComponent(trackingId)}`);
  return data?.responseData ?? data;
};

export const LECTURE_AUDIT_QUERY_KEY = ["lecture-audit"];

export const useGetCourseModules = (courseCode, options = {}) =>
  useQuery({
    queryKey: [...LECTURE_AUDIT_QUERY_KEY, "modules", courseCode ?? ""],
    queryFn: () => getCourseModules(courseCode),
    enabled: !!courseCode && (options.enabled ?? true),
  });

export const useGetTrackingAll = (classId, options = {}) =>
  useQuery({
    queryKey: [...LECTURE_AUDIT_QUERY_KEY, "tracking-all", classId ?? ""],
    queryFn: () => getTrackingAll(classId),
    enabled: !!classId && (options.enabled ?? true),
  });

export const useGetModuleStatus = (trackingId, options = {}) =>
  useQuery({
    queryKey: [...LECTURE_AUDIT_QUERY_KEY, "module-status", trackingId ?? ""],
    queryFn: () => getModuleStatus(trackingId),
    enabled: !!trackingId && (options.enabled ?? true),
  });
