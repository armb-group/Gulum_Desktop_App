// src/services/studentprofileAPI.js

import api from "./api";

export const getStudentProfile = async () => {
  try {

    // Get logged in user from localStorage
    const user = JSON.parse(localStorage.getItem("gulum-user"));

    // Get student ID
    const studentId = user?.id;

    // API Call
    const response = await api.get(
      `api/students/${studentId}`
    );

    return response.data;

  } catch (error) {
    console.error(
      "Error fetching student profile:",
      error
    );

    throw error;
  }
};