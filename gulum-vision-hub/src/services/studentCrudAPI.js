// src/services/studentCrudAPI.js

import api from "./api";

export const createUser = async (userData) => {
  try {

    // API Call
    const response = await api.post(
      "v1/Users",
      userData
    );

    return response.data;

  } catch (error) {
    console.error(
      "Error creating user:",
      error
    );

    throw error;
  }
};

export const assignStudentRole = async (userId) => {
  try {

    // Assign hardcoded STUDENT role
    const response = await api.post(
      "v1/userroles",
      {
        user_id: userId,
        role_id: "e45a9877-1f06-41f2-a9a4-99f38026c158",
      }
    );

    return response.data;

  } catch (error) {
    console.error(
      "Error assigning student role:",
      error
    );

    throw error;
  }
};

export const createStudent = async (studentData) => {
  try {

    // API Call
    const response = await api.post(
      "api/students",
      studentData
    );

    return response.data;

  } catch (error) {
    console.error(
      "Error creating student:",
      error
    );

    throw error;
  }
};
