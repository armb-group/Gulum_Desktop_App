import api from "./api";

/**
 * Upload bulk records for a specific role.
 * @param {string} role - The lowercase role name (e.g., student, teacher, user).
 * @param {File} file - The CSV file to upload.
 * @returns {Promise<any>} The response from the server.
 */
export const uploadBulkFile = async (role, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/upload/${encodeURIComponent(role)}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.responseData ?? response.data;
};
