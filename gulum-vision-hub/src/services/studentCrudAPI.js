// src/services/studentCrudAPI.js

import api from "./api";

export const getStudents = async () => {
  const response = await api.get("/api/students");
  const raw = response.data.responseData ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((s) => ({
    id: s.id ?? s.studentId,
    institution_id: s.institutionId ?? s.institution_id,
    admission_no: s.admissionNo ?? s.admission_no,
    roll_no: s.rollNo ?? s.roll_no,
    full_name: s.fullName ?? s.full_name,
    dob: s.dob,
    gender: s.gender,
    metadata: s.metadata ?? "",
    created_at: s.createdAt ?? s.created_at ?? "",
    created_by: s.createdBy ?? s.created_by ?? "",
    email_id: s.emailId ?? s.email ?? s.email_id,
    phone_number: s.phoneNumber ?? s.phone_number,
    batch_id: s.batchId ?? s.batch_id,
    user_id: s.userId ?? s.user_id,
    classess_id: s.classesId ?? s.classessId ?? s.classess_id,
    department_id: s.departmentId ?? s.department_id,
    departmentName: s.departmentName ?? "",
    batchYear: s.batchYear ?? "",
    sectionName: s.sectionName ?? "",
    parentEmail: s.parentEmail ?? "",
    totalClassesOccurred: s.totalClassesOccurred ?? 0,
    totalClassesAttended: s.totalClassesAttended ?? 0,
    attendancePercentage: s.attendancePercentage ?? 0
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
    console.error("Error creating user:", msg);
    throw error;
  }
};

export const updateStudent = async (id, studentData) => {
  const payload = {
    studentId: id,
    id: id,
    admissionNo: studentData.admission_no,
    rollNo: studentData.roll_no,
    fullName: studentData.full_name,
    dob: studentData.dob,
    gender: studentData.gender,
    institutionId: studentData.institution_id,
    metadata: studentData.metadata,
    phoneNumber: studentData.phone_number,
    emailId: studentData.email_id,
    batchId: studentData.batch_id,
    classessId: studentData.classess_id,
    departmentId: studentData.department_id,
  };
  const response = await api.put(`/api/students/${id}`, payload);
  return response.data.responseData ?? response.data;
};

export const createStudent = async (studentData) => {
  try {
    const payload = {
      admissionNo: studentData.admission_no,
      createdAt: new Date().toISOString(),
      createdBy: studentData.created_by,
      dob: studentData.dob,
      fullName: studentData.full_name,
      gender: studentData.gender,
      institutionId: studentData.institution_id,
      metadata: studentData.metadata,
      phoneNumber: studentData.phone_number,
      email: studentData.email_id,
      emailId: studentData.email_id,
      rollNo: studentData.roll_no,
      batchId: studentData.batch_id,
      classessId: studentData.classess_id,
      departmentId: studentData.department_id,
      userId: studentData.user_id,
      password: studentData.password,
    };
    console.log("createStudent payload:", JSON.stringify(payload, null, 2));
    const response = await api.post("/api/students", payload);

    return response.data.responseData ?? response.data;
  } catch (error) {
    console.error("Error creating student - status:", error.response?.status);
    console.error("Error creating student - response:", JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

export const getStudentDetailedAttendance = async (studentId) => {
  const response = await api.get(`/attendance/all?studentId=${studentId}`);
  return response.data.responseData ?? response.data;
};

export const getStudentsByCourse = async (courseCode) => {
  const response = await api.get(`api/students/course/${courseCode}`);
  return response.data.responseData ?? response.data;
};

