import { useQuery } from "@tanstack/react-query";
import api from "./api";

/**
 * Fetch all roles from the backend.
 * @returns {Promise<Array>} List of roles.
 */
export const getRoles = async () => {
  const response = await api.get("/v1/roles");
  return response.data.responseData ?? response.data;
};

export const ROLES_QUERY_KEY = ["roles"];

export const useGetRoles = () =>
  useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: getRoles,
  });
