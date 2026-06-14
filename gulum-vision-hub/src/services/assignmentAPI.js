import { useMutation } from "@tanstack/react-query";
import api from "./api";

export const createAssignment = async (assignmentData) => {
  const response = await api.post("/assignments", assignmentData);
  return response.data.responseData ?? response.data;
};

export const useCreateAssignment = () => {
  return useMutation({
    mutationFn: createAssignment,
  });
};
