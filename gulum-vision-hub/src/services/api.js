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
            const user = JSON.parse(localStorage.getItem("gulum-user"));
            const token = user?.token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;