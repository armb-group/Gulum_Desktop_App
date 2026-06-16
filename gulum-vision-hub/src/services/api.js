import axios from "axios";

const api = axios.create({
    baseURL: "/gulum",
    headers: {
        "Content-Type": "application/json"
    }
});

// Attach JWT Token Automatically
api.interceptors.request.use(
    (config) => {

        const isAuthRoute = config.url?.startsWith("/auth/");
        if (!isAuthRoute) {
            const user = JSON.parse(localStorage.getItem("gulum-user") || "null");
            const token = user?.token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            if (user?.institutionId) {
                config.headers["gulum-institution-id"] = user.institutionId;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auto logout on 401 yexx
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("gulum-user");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;