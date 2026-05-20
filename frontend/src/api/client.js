/**
 * Axios HTTP client: single instance, gateway base URL, JWT + refresh interceptors.
 * @see https://axios-http.com/docs/instance
 */
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("epfms_token")?.trim();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshInFlight = null;

function authPath(url) {
  const u = String(url || "");
  return (
    u.includes("auth/login") ||
    u.includes("auth/register") ||
    u.includes("auth/refresh")
  );
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err.response?.status;
    const cfg = err.config;

    if (status === 401 && cfg && !cfg._epfmsRetried && !authPath(cfg.url)) {
      cfg._epfmsRetried = true;
      const rt = localStorage.getItem("epfms_refresh")?.trim();
      if (rt) {
        try {
          if (!refreshInFlight) {
            refreshInFlight = axios
              .post(`${baseURL}/auth/refresh`, { refreshToken: rt }, { timeout: 20000 })
              .then((r) => r.data)
              .finally(() => {
                refreshInFlight = null;
              });
          }
          const data = await refreshInFlight;
          if (data?.accessToken) {
            localStorage.setItem("epfms_token", String(data.accessToken).trim());
            if (data.refreshToken) localStorage.setItem("epfms_refresh", String(data.refreshToken).trim());
            if (data.user) localStorage.setItem("epfms_user", JSON.stringify(data.user));
            cfg.headers = cfg.headers || {};
            cfg.headers.Authorization = `Bearer ${String(data.accessToken).trim()}`;
            return api(cfg);
          }
        } catch {
          /* fall through to logout */
        }
      }
      localStorage.removeItem("epfms_token");
      localStorage.removeItem("epfms_refresh");
      localStorage.removeItem("epfms_user");
      const path = `${window.location.pathname || ""}${window.location.search || ""}`;
      window.location.assign(`/login${path && path !== "/login" ? `?session=expired&next=${encodeURIComponent(path)}` : "?session=expired"}`);
      return Promise.reject(err);
    }

    let msg =
      err.response?.data?.message ||
      err.response?.data?.detail ||
      err.message ||
      "Request failed";
    if (typeof msg !== "string") msg = JSON.stringify(msg);

    const upstream =
      status === 503 ||
      /upstream|service unavailable|econnrefused|network error/i.test(String(msg));

    if (upstream) {
      msg =
        "A backend service is not reachable from the gateway. " +
        "Start the API gateway (8080) and domain Node services (performance ~8001, feedback ~8002, analytics ~8004, AI ~8005), then refresh.";
    }

    if (status === 401) {
      msg =
        msg === "Unauthorized" || /unauthoris/i.test(msg)
          ? "Session expired or not signed in. Please log in again."
          : msg;
    }

    return Promise.reject(new Error(msg));
  }
);
