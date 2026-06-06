import api from "./api";

/**
 * Fetch all roles from the backend.
 * @returns {Promise<Array>} List of roles.
 */
export const getRoles = async () => {
  const response = await api.get("/v1/roles");
  return response.data.responseData ?? response.data;
};
