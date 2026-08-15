import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL: BASE_URL });

const ACCESS = "pp_admin_access";
const REFRESH = "pp_admin_refresh";

export const tokenStore = {
  get access() { return localStorage.getItem(ACCESS); },
  get refresh() { return localStorage.getItem(REFRESH); },
  set({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem(ACCESS, access_token);
    if (refresh_token) localStorage.setItem(REFRESH, refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes("/auth/");
    if (status === 401 && !original._retry && !isAuthCall && tokenStore.refresh) {
      original._retry = true;
      try {
        refreshing = refreshing || api.post("/auth/refresh", { refresh_token: tokenStore.refresh });
        const { data } = await refreshing;
        refreshing = null;
        tokenStore.set(data);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(err, fallback = "Something went wrong. Please try again.") {
  if (!err?.response) {
    return "Cannot reach backend server. Please ensure the backend is running on http://localhost:8000.";
  }
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}
