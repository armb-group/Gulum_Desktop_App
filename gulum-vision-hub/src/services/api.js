import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    headers: {
        "Content-Type": "application/json"
    }
});

// Attach JWT Token Automatically
api.interceptors.request.use(
    (config) => {

        const user = JSON.parse(localStorage.getItem("gulum-user"));
        const token = user?.token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;