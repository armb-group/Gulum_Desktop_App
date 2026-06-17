import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

/**
 * Assign Course to Class
 */
export const assignCourseToClass = async (data) => {
  const response = await api.post("/course-class", data);
  return response.data.responseData ?? response.data;
};

/**
 * Remove Course from Class
 */
export const removeCourseFromClass = async ({
  courseId,
  classesId,
}) => {
  const response = await api.delete(
    `/course-class/${courseId}/${classesId}`
  );
  return response.data.responseData ?? response.data;
};

/**
 * Get Courses by Class
 */
export const getCoursesByClass = async (classesId) => {
  const response = await api.get(
    `/course-class/class/${classesId}`
  );
  return response.data.responseData ?? response.data;
};

/**
 * Get Classes by Course
 */
export const getClassesByCourse = async (courseId) => {
  const response = await api.get(
    `/course-class/course/${courseId}`
  );
  return response.data.responseData ?? response.data;
};

export const useAssignCourseToClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignCourseToClass,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course-class"],
      });
    },
  });
};

export const useRemoveCourseFromClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCourseFromClass,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course-class"],
      });
    },
  });
};

export const useCoursesByClass = (classesId) =>
  useQuery({
    queryKey: ["course-class", classesId],
    queryFn: () => getCoursesByClass(classesId),
    enabled: !!classesId,
  });
