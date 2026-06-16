import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

/**
 * Fetch all departments from the backend.
 * @returns {Promise<Array>} List of departments.
 */
export const getDepartments = async () => {
  const response = await api.get("/departments");
  return response.data.responseData ?? response.data;
};

/**
 * Fetch all academic batches for a specific department from the backend.
 * @param {string} departmentId
 * @returns {Promise<Array>} List of academic batches.
 */
export const getAcademicBatchesByDepartment = async (departmentId) => {
  const response = await api.get(`/academic-batches/class/department/${encodeURIComponent(departmentId)}`);
  return response.data.responseData ?? response.data;
};

/**
 * Create a new department in the backend.
 * @param {object} departmentData
 * @returns {Promise<object>} The created department data.
 */
export const createDepartment = async (departmentData) => {
  const response = await api.post("/departments", departmentData);
  return response.data.responseData ?? response.data;
};

export const getCoursesByClass = async (classId) => {
  const response = await api.get(`/course-class/class/${encodeURIComponent(classId)}`);
  return response.data.responseData ?? response.data;
};

export const getDepartmentsCount = async () => {
  const response = await api.get("/departments/count");
  return response.data.responseData ?? response.data;
};

export const DEPARTMENTS_QUERY_KEY = ["departments"];

export const useGetDepartments = () =>
  useQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: getDepartments,
  });

export const useGetDepartmentsCount = () =>
  useQuery({
    queryKey: [...DEPARTMENTS_QUERY_KEY, "count"],
    queryFn: getDepartmentsCount,
  });

export const useGetAcademicBatchesByDepartment = (departmentId, options = {}) =>
  useQuery({
    queryKey: ["academic-batches", departmentId],
    queryFn: () => getAcademicBatchesByDepartment(departmentId),
    enabled: !!departmentId && (options.enabled ?? true),
  });

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });
    },
  });
};

export const useGetCoursesByClass = (classId, options = {}) =>
  useQuery({
    queryKey: ["courses-class", classId],
    queryFn: () => getCoursesByClass(classId),
    enabled: !!classId && (options.enabled ?? true),
  });

export const getTeachersByClassBatch = async (params) => {
  const response = await api.get(`/teachers/department_class_batch`, { params });
  return response.data.responseData ?? response.data;
};

export const getStudentsByClassBatch = async (params) => {
  const response = await api.get(`/api/students/department_class_batch`, { params });
  return response.data.responseData ?? response.data;
};

export const getSubjectsByClassBatch = async (params) => {
  const response = await api.get(`/subjects/department_class_batch`, { params });
  return response.data.responseData ?? response.data;
};

export const useGetTeachersByClassBatch = (params, options = {}) =>
  useQuery({
    queryKey: ["teachers-class-batch", params],
    queryFn: () => getTeachersByClassBatch(params),
    enabled: !!params.departmentId && !!params.batchId && !!params.semester && !!params.classId && (options.enabled ?? true),
  });

export const useGetStudentsByClassBatch = (params, options = {}) =>
  useQuery({
    queryKey: ["students-class-batch", params],
    queryFn: () => getStudentsByClassBatch(params),
    enabled: !!params.departmentId && !!params.batchId && !!params.semester && !!params.classesId && (options.enabled ?? true),
  });

export const useGetSubjectsByClassBatch = (params, options = {}) =>
  useQuery({
    queryKey: ["subjects-class-batch", params],
    queryFn: () => getSubjectsByClassBatch(params),
    enabled: !!params.departmentId && !!params.batchId && !!params.semester && !!params.classId && (options.enabled ?? true),
  });



