import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

export const getSubjects = async () => {
  const response = await api.get("/courses");
  const raw = response.data.responseData ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((s) => ({
    ...s,
    id: s.id ?? s.subjectId,
    name: s.name ?? s.subjectName ?? s.subject_name ?? "Unknown Subject",
    code: s.code ?? s.subjectCode ?? s.subject_code ?? "N/A",
    institutionId: s.institutionId ?? s.institution_id,
  }));
};

export const createSubject = async (subjectData) => {
  const response = await api.post("/courses", subjectData);
  return response.data.responseData ?? response.data;
};

export const updateSubject = async (id, subjectData) => {
  const response = await api.put(`/courses/${id}`, subjectData);
  return response.data.responseData ?? response.data;
};

export const deleteSubject = async (id) => {
  const response = await api.delete(`/courses/${id}`);
  return response.data.responseData ?? response.data;
};

export const SUBJECTS_QUERY_KEY = ["courses"];

export const useGetSubjects = () =>
  useQuery({
    queryKey: SUBJECTS_QUERY_KEY,
    queryFn: getSubjects,
  });

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, id, subjectData }) => updateSubject(subjectId ?? id, subjectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
};
