import api from "./api";

export const addNotice = async (noticeData) => {
  const response = await api.post("/notice/add", noticeData);
  return response.data;
};
