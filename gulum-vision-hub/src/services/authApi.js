import api from "./api";

export const loginApi = async (data) => {

    const res = await api.post("/auth/login", data);

    return res.data;

};

export const forgotPasswordApi = async (email) => {

    const res = await api.post("/auth/forgot-password", { email });

    return res.data;

};

export const verifyOtpApi = async ({ email, otp, newPassword }) => {

    const res = await api.post("/auth/verify-otp", { email, otp, newPassword });

    return res.data;

};
