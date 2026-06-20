import api from "./api";

export const getAdminProfile = async (id) => {
  try {
    const response = await api.get(`/v1/users/${id}`);
    return response.data.responseData ?? response.data;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    throw error;
  }
};
