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
export const swapScheduleRoutine = async (sourceScheduleId, targetScheduleId) => {
  const response = await api.post("/schedule/swap", {
    sourceScheduleId,
    targetScheduleId
  });
  return response.data.responseData ?? response.data;
};

