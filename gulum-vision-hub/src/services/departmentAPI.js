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

export const getDepartmentsCount = async (institutionId) => {
  const response = await api.get(`/departments/count/institution/${encodeURIComponent(institutionId)}`);
  return response.data.responseData ?? response.data;
};

export const DEPARTMENTS_QUERY_KEY = ["departments"];

export const useGetDepartments = () =>
  useQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: getDepartments,
  });

export const useGetDepartmentsCount = (institutionId) =>
  useQuery({
    queryKey: [...DEPARTMENTS_QUERY_KEY, "count", institutionId],
    queryFn: () => getDepartmentsCount(institutionId),
    enabled: !!institutionId,
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

export const getTeachersByClass = async (classId) => {
  const response = await api.get(`/course-offerings/class/${encodeURIComponent(classId)}/teacher-subjects`);
  return response.data.responseData ?? response.data;
};

export const getStudentsByClassesId = async (classesId) => {
  const response = await api.get(`/api/students/classes/${classesId}`);
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

export const useGetTeachersByClass = (classId, options = {}) =>
  useQuery({
    queryKey: ["teachers-class", classId],
    queryFn: () => getTeachersByClass(classId),
    enabled: !!classId && (options.enabled ?? true),
  });

export const useStudentsByClassesId = (classesId) => {
  return useQuery({
    queryKey: ["students", classesId],
    queryFn: () => getStudentsByClassesId(classesId),
    enabled: !!classesId,
  });
};

export const useGetSubjectsByClassBatch = (params, options = {}) =>
  useQuery({
    queryKey: ["subjects-class-batch", params],
    queryFn: () => getSubjectsByClassBatch(params),
    enabled: !!params.departmentId && !!params.batchId && !!params.semester && !!params.classId && (options.enabled ?? true),
  });

// Class CRUD APIs
export const createClass = async (classData) => {
  const response = await api.post("/classes", classData);
  return response.data.responseData ?? response.data;
};

export const updateClass = async (classId, classData) => {
  const response = await api.put(`/classes/${classId}`, classData);
  return response.data.responseData ?? response.data;
};

export const deleteClass = async (classId) => {
  const response = await api.delete(`/classes/${classId}`);
  return response.data.responseData ?? response.data;
};

export const useCreateClass = (departmentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-batches", departmentId] });
    },
  });
};

export const useUpdateClass = (departmentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, classData }) => updateClass(classId, classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-batches", departmentId] });
    },
  });
};

export const useDeleteClass = (departmentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-batches", departmentId] });
    },
  });
};

// Subject CRUD APIs
export const createSubject = async (subjectData) => {
  const response = await api.post("/subjects", subjectData);
  return response.data.responseData ?? response.data;
};

export const updateSubject = async (subjectId, subjectData) => {
  const response = await api.put(`/subjects/${subjectId}`, subjectData);
  return response.data.responseData ?? response.data;
};

export const deleteSubject = async (subjectId) => {
  const response = await api.delete(`/subjects/${subjectId}`);
  return response.data.responseData ?? response.data;
};

export const useCreateSubject = (queryParams) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects-class-batch", queryParams] });
    },
  });
};

export const useUpdateSubject = (queryParams) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, subjectData }) => updateSubject(subjectId, subjectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects-class-batch", queryParams] });
    },
  });
};

export const useDeleteSubject = (queryParams) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects-class-batch", queryParams] });
    },
  });
};

// Academic Batch Creation APIs
export const createAcademicBatch = async (batchData) => {
  const response = await api.post("/academic-batches", batchData);
  return response.data.responseData ?? response.data;
};

export const useCreateAcademicBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAcademicBatch,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["academic-batches", variables.departmentId] });
    },
  });
};