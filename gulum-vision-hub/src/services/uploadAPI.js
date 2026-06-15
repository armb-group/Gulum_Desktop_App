import { useMutation } from "@tanstack/react-query";
import api from "./api";

/**
 * Upload bulk records for a specific role.
 * @param {string} role - The lowercase role name (e.g., student, teacher, user).
 * @param {File} file - The CSV file to upload.
 * @param {object} params - Optional parameters (institutionId, batchId, departmentId, classId, classesId, createdBy).
 * @returns {Promise<any>} The response from the server.
 */
export const uploadBulkFile = async (role, file, params = {}) => {
  const formData = new FormData();
  formData.append("file", file);

  const normRole = role.toLowerCase();
  const isStudent = normRole === "student" || normRole === "user";
  const isTeacher = normRole === "teacher";
  const endpoint = isStudent ? "student" : (isTeacher ? "teachers" : role);

  const queryParams = new URLSearchParams();
  if (params.institutionId) queryParams.append("institutionId", params.institutionId);
  if (params.batchId) queryParams.append("batchId", params.batchId);
  if (params.departmentId) queryParams.append("departmentId", params.departmentId);

  if (isStudent) {
    if (params.createdBy) queryParams.append("createdBy", params.createdBy);
    if (params.classesId) queryParams.append("classesId", params.classesId);
  } else if (isTeacher) {
    if (params.classId) queryParams.append("classId", params.classId);
  }

  const response = await api.post(`/upload/${endpoint}?${queryParams.toString()}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.responseData ?? response.data;
};

export const useUploadBulkFile = () => {
  return useMutation({
    mutationFn: ({ role, file, params }) => uploadBulkFile(role, file, params),
  });
};
