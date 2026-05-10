import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

/**
 * Singleton Axios instance for all API calls.
 *
 * Features:
 * - Automatic `Authorization: Bearer` header injection from in-memory token
 * - 401 → silent refresh via HttpOnly cookie → retry original request
 * - Queues concurrent 401s to prevent multiple simultaneous refresh calls
 */
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly refresh token cookie automatically
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ─── In-memory token store ────────────────────────────────────────────────────
// Deliberately NOT stored in localStorage (XSS attack surface).
// Set by AuthContext after login/refresh, read by the request interceptor.
let inMemoryToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export function setAccessToken(token: string | null): void {
  inMemoryToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryToken;
}

// ─── Request interceptor — inject Bearer token ───────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — silent token refresh on 401 ──────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401s on non-auth endpoints (avoid infinite loops)
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh-token") ||
      originalRequest?.url?.includes("/auth/signup");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Cookie is sent automatically (withCredentials: true)
        const response = await apiClient.post<{ accessToken: string }>(
          "/auth/refresh-token"
        );
        const newToken = response.data.accessToken;
        setAccessToken(newToken);

        // Flush the queue
        refreshQueue.forEach((callback) => callback(newToken));
        refreshQueue = [];

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear token and flush queue with null
        setAccessToken(null);
        refreshQueue.forEach((callback) => callback(null));
        refreshQueue = [];

        // Redirect to login (works in both browser and middleware contexts)
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
