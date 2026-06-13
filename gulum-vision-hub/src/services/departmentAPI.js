import api from "./api";

/**
 * Fetch all departments from the backend.
 * @returns {Promise<Array>} List of departments.
 */
export const getDepartments = async () => {
  const response = await api.get("/departments");
  return response.data.responseData ?? response.data;
};

/**
 * Fetch all academic batches for a specific department from the backend.
 * @param {string} departmentId
 * @returns {Promise<Array>} List of academic batches.
 */
export const getAcademicBatchesByDepartment = async (departmentId) => {
  const response = await api.get(`/academic-batches/class/department/${encodeURIComponent(departmentId)}`);
  return response.data.responseData ?? response.data;
};

/**
 * Create a new department in the backend.
 * @param {object} departmentData
 * @returns {Promise<object>} The created department data.
 */
export const createDepartment = async (departmentData) => {
  const response = await api.post("/departments", departmentData);
  return response.data.responseData ?? response.data;
};

export const getCoursesByClass = async (classId) => {
  const response = await api.get(`/course-class/class/${encodeURIComponent(classId)}`);
  return response.data.responseData ?? response.data;
};



