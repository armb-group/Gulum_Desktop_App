import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

export const getCourseModules = async (courseCode) => {
  if (!courseCode) return { subjectName: "", modules: [] };
  const response = await api.get(`/api/module/${encodeURIComponent(courseCode)}`);
  return response.data?.responseData ?? response.data;
};

export const createModule = async (moduleData) => {
  const response = await api.post("/api/module", moduleData);
  return response.data?.responseData ?? response.data;
};

export const updateModule = async ({ id, moduleData }) => {
  const response = await api.put(`/api/module/${id}`, moduleData);
  return response.data?.responseData ?? response.data;
};

export const deleteModule = async (id) => {
  const response = await api.delete(`/api/module/${id}`);
  return response.data?.responseData ?? response.data;
};

export const MODULES_QUERY_KEY = ["modules"];

export const useGetCourseModules = (courseCode) =>
  useQuery({
    queryKey: [MODULES_QUERY_KEY, courseCode],
    queryFn: () => getCourseModules(courseCode),
    enabled: !!courseCode,
  });

export const useCreateModule = (courseCode) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODULES_QUERY_KEY, courseCode] });
    },
  });
};

export const useUpdateModule = (courseCode) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODULES_QUERY_KEY, courseCode] });
    },
  });
};

export const useDeleteModule = (courseCode) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODULES_QUERY_KEY, courseCode] });
    },
  });
};
