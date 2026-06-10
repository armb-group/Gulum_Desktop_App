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

