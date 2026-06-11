// src/services/studentprofileAPI.js

import api from "./api";

export const getStudentProfile = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("gulum-user"));

    const studentId = user?.id;

    const response = await api.get(
      `api/students/${studentId}`
    );

    return response.data.responseData;

  } catch (error) {
    console.error(
      "Error fetching student profile:",
      error
    );

    throw error;
  }
};