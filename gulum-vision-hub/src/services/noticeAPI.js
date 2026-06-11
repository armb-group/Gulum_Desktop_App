import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./api";

const NOTICE_QUERY_KEY = ["notices"];

const unwrapNoticeResponse = (data) => {
  const raw = data?.responseData ?? data?.data ?? data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.notices)) return raw.notices;
  if (Array.isArray(raw?.noticeList)) return raw.noticeList;
  return [];
};

const getNoticeId = (notice) =>
  notice?.id ?? notice?.noticeId ?? notice?._id ?? notice?.uuid ?? "";

const getNoticeMessage = (error, fallback) => {
  const message =
    error.response?.data?.message ??
    error.response?.data?.error ??
    error.response?.data ??
    error.message ??
    fallback;

  return typeof message === "string" ? message : fallback;
};

const cleanNoticePayload = (noticeData) => {
  const payload = {
    title: noticeData.title?.trim(),
    description: noticeData.description?.trim(),
    institutionId: noticeData.institutionId?.trim?.() ?? noticeData.institutionId,
    level: noticeData.level,
    batchId: noticeData.batchId?.trim?.() ?? noticeData.batchId,
    courseCode: noticeData.courseCode?.trim?.() ?? noticeData.courseCode,
    startDate: noticeData.startDate || undefined,
    endDate: noticeData.endDate || undefined,
    createdBy: noticeData.createdBy?.trim?.() ?? noticeData.createdBy,
    createdAt: noticeData.createdAt ?? new Date().toISOString(),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")
  );
};

export const noticeToNotification = (notice, target = "STUDENT") => {
  const title = notice.title ?? "";
  const description = notice.description ?? "";
  const createdAt = notice.createdAt ?? notice.created_at ?? new Date().toISOString();
  const startDate = notice.startDate ?? notice.start_date;
  const endDate = notice.endDate ?? notice.end_date;
  const subject = notice.courseCode ?? notice.course_code ?? "General";

  return {
    id: String(getNoticeId(notice) || `${title}-${createdAt}`),
    title,
    description,
    time: createdAt ? new Date(createdAt).toLocaleString() : "just now",
    type: "info",
    target,
    subject,
    startTime: startDate,
    endTime: endDate,
    createdAt,
    raw: notice,
  };
};

export const getNoticesByLevelApi = async (level, options = {}) => {
  const endpoint =
    level === "ADMIN" && options.batchId
      ? `/notice/batch/${encodeURIComponent(options.batchId)}`
      : `/notice/level/${encodeURIComponent(level)}`;

  const response = await api.get(endpoint);
  return unwrapNoticeResponse(response.data);
};

export const useGetNoticesByLevel = (level, options = {}) =>
  useQuery({
    queryKey: [...NOTICE_QUERY_KEY, level, options.batchId ?? ""],
    queryFn: () => getNoticesByLevelApi(level, options),
    enabled: options.enabled ?? (level !== "ADMIN" || Boolean(options.batchId)),
  });

export const addNoticeApi = async (noticeData) => {
  // Ensure teachers cannot create admin-level notices
  if (noticeData.level && noticeData.level !== "STUDENT" && !noticeData.isAdmin) {
    throw new Error("Teachers are only allowed to send student notifications.");
  }
  try {
    const response = await api.post("/notice/add", cleanNoticePayload(noticeData));
    return response.data.responseData ?? response.data;
  } catch (error) {
    const normalizedError = new Error(getNoticeMessage(error, "Failed to create notice."));
    normalizedError.response = error.response;
    normalizedError.cause = error;
    throw normalizedError;
  }
};

export const addNotice = addNoticeApi;

export const useAddNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["addNotice"],
    mutationFn: addNoticeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICE_QUERY_KEY });
    },
  });
};

export const editNoticeApi = async ({ id, notice }) => {
  try {
    const response = await api.put(`/notice/edit/${id}`, cleanNoticePayload(notice));
    return response.data.responseData ?? response.data;
  } catch (error) {
    const normalizedError = new Error(getNoticeMessage(error, "Failed to update notice."));
    normalizedError.response = error.response;
    normalizedError.cause = error;
    throw normalizedError;
  }
};

export const useEditNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["editNotice"],
    mutationFn: editNoticeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICE_QUERY_KEY });
    },
  });
};

export const deleteNoticeApi = async (id) => {
  try {
    const response = await api.delete(`/notice/delete/${id}`);
    return response.data.responseData ?? response.data;
  } catch (error) {
    const normalizedError = new Error(getNoticeMessage(error, "Failed to delete notice."));
    normalizedError.response = error.response;
    normalizedError.cause = error;
    throw normalizedError;
  }
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteNotice"],
    mutationFn: deleteNoticeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICE_QUERY_KEY });
    },
  });
};

export const getNoticesByInstitution = async (institutionId) => {
  const response = await api.get(`/notice/institution/${encodeURIComponent(institutionId)}`);
  return response.data.responseData ?? response.data;
};

