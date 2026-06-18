import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

/**
 * Fetch schedule routine for a specific class.
 * @param {string} instituteId
 * @param {string} departmentId
 * @param {string} classId
 * @returns {Promise<any>}
 */
export const getScheduleRoutine = async (instituteId, departmentId, classId) => {
  const response = await api.get(`/schedule/view/${encodeURIComponent(instituteId)}/${encodeURIComponent(departmentId)}/${encodeURIComponent(classId)}`);
  return response.data.responseData ?? response.data;
};

/**
 * Save schedule routine for a specific class.
 * @param {string} instituteId
 * @param {string} departmentId
 * @param {string} classId
 * @param {any} scheduleData
 * @returns {Promise<any>}
 */
export const saveScheduleRoutine = async (instituteId, departmentId, classId, scheduleData) => {
  const response = await api.post(`/schedule/save/${encodeURIComponent(instituteId)}/${encodeURIComponent(departmentId)}/${encodeURIComponent(classId)}`, scheduleData);
  return response.data.responseData ?? response.data;
};

/**
 * Swap two timeslots in schedule routine.
 * @param {string} sourceScheduleId
 * @param {string} targetScheduleId
 * @returns {Promise<any>}
 */
export const swapScheduleLayout = async (sourceScheduleId, targetScheduleId) => {
  const response = await api.post("/schedule/layout", {
    action: "SWAP",
    sourceScheduleId,
    targetScheduleId
  });
  return response.data.responseData ?? response.data;
};

/**
 * Move a timeslot in schedule routine.
 * @param {string} sourceScheduleId
 * @param {string} targetTimeSlotId
 * @returns {Promise<any>}
 */
export const moveScheduleLayout = async (sourceScheduleId, targetTimeSlotId) => {
  const response = await api.post("/schedule/layout", {
    action: "MOVE",
    sourceScheduleId,
    targetTimeSlotId
  });
  return response.data.responseData ?? response.data;
};

/**
 * Extend a timeslot in schedule routine.
 * @param {string} sourceScheduleId
 * @param {string} targetTimeSlotId
 * @returns {Promise<any>}
 */
export const extendScheduleLayout = async (sourceScheduleId, targetTimeSlotId) => {
  const response = await api.post("/schedule/layout", {
    action: "EXTEND",
    sourceScheduleId,
    targetTimeSlotId
  });
  return response.data.responseData ?? response.data;
};

/**
 * Generate a new schedule routine for a specific class.
 * @param {string} instituteId
 * @param {string} departmentId
 * @param {string} classId
 * @param {object} body - Request body containing noofgroups
 * @returns {Promise<any>}
 */
export const generateScheduleRoutine = async (instituteId, departmentId, classId, body) => {
  const response = await api.post(`/schedule/generate/${encodeURIComponent(instituteId)}/${encodeURIComponent(departmentId)}/${encodeURIComponent(classId)}`, body);
  return response.data.responseData ?? response.data;
};


// Fetch schedule routine for a specific teacher
export const getTeacherSchedule = async (teacherId) => {
  const response = await api.get(`/schedule/teacher/${encodeURIComponent(teacherId)}`);
  return response.data.responseData ?? response.data;
};

export const SCHEDULE_QUERY_KEY = ["schedule"];

export const useGetScheduleRoutine = (instituteId, departmentId, classId, options = {}) =>
  useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, "routine", instituteId ?? "", departmentId ?? "", classId ?? ""],
    queryFn: () => getScheduleRoutine(instituteId, departmentId, classId),
    enabled: !!instituteId && !!departmentId && !!classId && (options.enabled ?? true),
  });

export const useSaveScheduleRoutine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instituteId, departmentId, classId, scheduleData }) =>
      saveScheduleRoutine(instituteId, departmentId, classId, scheduleData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...SCHEDULE_QUERY_KEY, "routine", variables.instituteId ?? "", variables.departmentId ?? "", variables.classId ?? ""],
      });
    },
  });
};

export const useSwapScheduleLayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceScheduleId, targetScheduleId }) =>
      swapScheduleLayout(sourceScheduleId, targetScheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });
};

export const useMoveScheduleLayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceScheduleId, targetTimeSlotId }) =>
      moveScheduleLayout(sourceScheduleId, targetTimeSlotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });
};

export const useExtendScheduleLayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceScheduleId, targetTimeSlotId }) =>
      extendScheduleLayout(sourceScheduleId, targetTimeSlotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });
};

export const useGetTeacherSchedule = (teacherId, options = {}) =>
  useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, "teacher", teacherId ?? ""],
    queryFn: () => getTeacherSchedule(teacherId),
    enabled: !!teacherId && (options.enabled ?? true),
  });

export const useGenerateScheduleRoutine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instituteId, departmentId, classId, body }) =>
      generateScheduleRoutine(instituteId, departmentId, classId, body),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...SCHEDULE_QUERY_KEY, "routine", variables.instituteId ?? "", variables.departmentId ?? "", variables.classId ?? ""],
      });
    },
  });
};
