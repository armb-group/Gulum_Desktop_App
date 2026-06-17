import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

export const getTeachers = async () => {
  const response = await api.get("/teachers");
  const raw = response.data.responseData ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((t) => ({
    id: t.id ?? t.teacherId,
    user_id: t.userId ?? t.user_id,
    institution_id: t.institutionId ?? t.institution_id,
    employee_code: t.employeeCode ?? t.employee_code,
    full_name: t.fullName ?? t.full_name,
    qualification: t.qualification,
    specialization: t.specialization,
    experience_year: t.experienceYears ?? t.experience_year ?? t.experience,
    joining_date: t.joiningDate ?? t.joining_date,
    metadata: t.metadata ?? "",
    is_active: t.isActive ?? t.is_active ?? true,
    created_at: t.createdAt ?? t.created_at ?? "",
    created_by: t.createdBy ?? t.created_by ?? "",
    email: t.email ?? t.emailId ?? "",
    phone: t.phone ?? t.phoneNumber ?? "",
    department: t.departmentName ?? "",
  }));
};

export const createUser = async (userData) => {
  try {
    const response = await api.post("/v1/Users", {
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: userData.createdBy ?? "Admin",
    });
    return response.data.responseData ?? response.data;
  } catch (error) {
    const msg = error.response?.data?.message ?? error.response?.data ?? "";
    const isDuplicate =
      typeof msg === "string" && msg.toLowerCase().includes("duplicate key");
    if (isDuplicate) {
      const err = new Error("This email is already registered. Please use a different email.");
      err.isDuplicate = true;
      throw err;
    }
    throw error;
  }
};

export const assignTeacherRole = async (userId) => {
  const response = await api.post("/v1/userroles", {
    userId,
    roleId: "0c586b10-fe21-4cac-93dd-e18858815d84",
    createdAt: new Date().toISOString(),
    createdBy: "Admin",
  });
  return response.data.responseData ?? response.data;
};

export const createTeacher = async (teacherData) => {
  const payload = {
    userId: teacherData.user_id,
    institutionId: teacherData.institution_id,
    employeeCode: teacherData.employee_code,
    fullName: teacherData.full_name,
    qualification: teacherData.qualification,
    specialization: teacherData.specialization,
    experienceYear: teacherData.experience_year,
    joiningDate: teacherData.joining_date,
    metadata: teacherData.metadata,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: teacherData.created_by ?? "Admin",
    email: teacherData.email,
    phone: teacherData.phone,
    password: teacherData.password,
    department: teacherData.department,
  };
  const response = await api.post("/teachers", payload);
  return response.data.responseData ?? response.data;
};

export const updateTeacher = async (id, teacherData) => {
  const payload = {
    id: id,
    teacherId: id,
    userId: teacherData.user_id ?? teacherData.userId ?? null,
    institutionId: teacherData.institution_id ?? teacherData.institutionId,
    employeeCode: teacherData.employee_code ?? teacherData.employeeCode,
    fullName: teacherData.full_name ?? teacherData.fullName,
    qualification: teacherData.qualification,
    specialization: teacherData.specialization,
    experienceYear: Number(teacherData.experience_year ?? teacherData.experienceYears ?? 0),
    experienceYears: Number(teacherData.experience_year ?? teacherData.experienceYears ?? 0),
    joiningDate: teacherData.joining_date ?? teacherData.joiningDate,
    metadata: teacherData.metadata,
    isActive: teacherData.is_active ?? teacherData.isActive ?? true,
    email: teacherData.email,
    emailId: teacherData.email ?? teacherData.emailId,
    phone: teacherData.phone,
    phoneNumber: teacherData.phone ?? teacherData.phoneNumber,
    department: teacherData.department ?? teacherData.departmentName ?? "",
    departmentName: teacherData.department ?? teacherData.departmentName ?? "",
  };
  // console.log("updateTeacher payload being sent to backend:", JSON.stringify(payload, null, 2));
  const response = await api.put(`/teachers/${id}`, payload);
  return response.data.responseData ?? response.data;
};

export const assignTeachersBulk = async (batchId, departmentId, classId, teacherIds, subject = {}) => {
  const params = new URLSearchParams({
    batchId: String(batchId),
    departmentId: String(departmentId),
    classId: String(classId),
  });
  const courseCode = subject.courseCode ?? subject.subjectCode ?? subject.code;
  const courseId = subject.courseId ?? subject.subjectId ?? subject.id;
  if (courseCode) params.set("courseCode", String(courseCode));
  if (courseId) params.set("courseId", String(courseId));

  const response = await api.post(
    `/teachers/assign-bulk?${params.toString()}`,
    teacherIds
  );
  return response.data.responseData ?? response.data;
};

export const getTeachersCount = async (institutionId) => {
  const response = await api.get(`/teachers/count/institution/${encodeURIComponent(institutionId)}`);
  return response.data.responseData ?? response.data;
};

export const TEACHERS_QUERY_KEY = ["teachers"];

export const useGetTeachers = () =>
  useQuery({
    queryKey: TEACHERS_QUERY_KEY,
    queryFn: getTeachers,
  });

export const useGetTeachersCount = (institutionId) =>
  useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, "count", institutionId],
    queryFn: () => getTeachersCount(institutionId),
    enabled: !!institutionId,
  });

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teacherData }) => updateTeacher(id, teacherData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
};

export const useAssignTeachersBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, departmentId, classId, teacherIds, subject }) =>
      assignTeachersBulk(batchId, departmentId, classId, teacherIds, subject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
};

export const getCourseOfferings = async (teacherId) => {
  const response = await api.get(`/course-offerings/${encodeURIComponent(teacherId)}`);
  return response.data.responseData ?? response.data;
};

export const useGetCourseOfferings = (teacherId, options = {}) =>
  useQuery({
    queryKey: ["course-offerings", teacherId],
    queryFn: () => getCourseOfferings(teacherId),
    enabled: !!teacherId && (options.enabled ?? true),
  });

export const createCourseOffering = async (data) => {
  const response = await api.post("/course-offerings", data);
  return response.data.responseData ?? response.data;
};

export const useCreateCourseOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourseOffering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-offerings"] });
    },
  });
};

