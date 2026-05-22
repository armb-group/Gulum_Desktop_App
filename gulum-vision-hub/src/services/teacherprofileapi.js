// src/services/teacherprofileapi.js

import api from "./api";

export const getTeacherProfile = async () => {
  try {

    // Get logged in user from localStorage
    const user = JSON.parse(
      localStorage.getItem("gulum-user")
    );

    // Get teacher ID
    const teacherId = user?.id;

    // API Call
    const response = await api.get(
      `teachers/${teacherId}`
    );

    // Return responseData
    return response.data.responseData;

  } catch (error) {

    console.error(
      "Error fetching teacher profile:",
      error
    );

    throw error;
  }
};