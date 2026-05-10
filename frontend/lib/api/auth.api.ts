import apiClient from "./client";
import type {
  ApiResponse,
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  OTPVerificationRequest,
  ResetPasswordRequest,
  SignupRequest,
  UpdateProfileRequest,
  User,
} from "@/types/auth.types";

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  signup: (data: SignupRequest) =>
    apiClient.post<ApiResponse>("/auth/signup", data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>("/auth/login", data),

  verifyOtp: (data: OTPVerificationRequest) =>
    apiClient.post<ApiResponse>("/auth/verify-otp", data),

  resendOtp: (email: string) =>
    apiClient.post<ApiResponse>(`/auth/resend-otp?email=${encodeURIComponent(email)}`),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse>("/auth/forgot-password", { email }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<ApiResponse>("/auth/reset-password", data),

  /**
   * Exchange the HttpOnly refresh token cookie for a new access token.
   * No body needed — the browser sends the cookie automatically.
   */
  refreshToken: () =>
    apiClient.post<AuthResponse>("/auth/refresh-token"),

  logout: () =>
    apiClient.post<ApiResponse>("/auth/logout"),
};

// ─── User Endpoints ───────────────────────────────────────────────────────────

export const userApi = {
  getMe: () =>
    apiClient.get<ApiResponse<User>>("/user/me"),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.patch<ApiResponse<User>>("/user/me", data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<ApiResponse>("/user/me/change-password", data),

  logoutAllDevices: () =>
    apiClient.delete<ApiResponse>("/user/me/sessions"),
};
