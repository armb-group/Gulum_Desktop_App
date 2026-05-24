// src/services/teacherCrudAPI.js

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
    experience_year: t.experienceYear ?? t.experience_year ?? t.experience,
    joining_date: t.joiningDate ?? t.joining_date,
    metadata: t.metadata ?? "",
    is_active: t.isActive ?? t.is_active ?? true,
    created_at: t.createdAt ?? t.created_at ?? "",
    created_by: t.createdBy ?? t.created_by ?? "",
    email: t.email,
    phone: t.phone,
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
  };
  const response = await api.post("/teachers", payload);
  return response.data.responseData ?? response.data;
};

export const updateTeacher = async (id, teacherData) => {
  const payload = {
    institutionId: teacherData.institution_id,
    employeeCode: teacherData.employee_code,
    fullName: teacherData.full_name,
    qualification: teacherData.qualification,
    specialization: teacherData.specialization,
    experienceYear: teacherData.experience_year,
    joiningDate: teacherData.joining_date,
    metadata: teacherData.metadata,
    email: teacherData.email,
    phone: teacherData.phone,
  };
  const response = await api.patch(`/teachers/${id}`, payload);
  return response.data.responseData ?? response.data;
};
