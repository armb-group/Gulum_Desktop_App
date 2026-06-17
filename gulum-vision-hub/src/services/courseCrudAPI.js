import { useQuery } from "@tanstack/react-query";
import api from "./api";

export const getCourses = async () => {
  const response = await api.get("/courses");

  const raw = response.data.responseData ?? response.data;

  return Array.isArray(raw) ? raw : [];
};

export const useGetCourses = () =>
  useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });
