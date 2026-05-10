// ─── User & Auth Types ───────────────────────────────────────────────────────

export type RoleType = "ROLE_USER" | "ROLE_ADMIN" | "ROLE_VENDOR";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  enabled: boolean;
  provider: "local" | "google" | "github";
  profileImageUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  roles: RoleType[];
}

// ─── Request Types ────────────────────────────────────────────────────────────

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OTPVerificationRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export interface AssignRolesRequest {
  roles: RoleType[];
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number; // seconds
  user: User;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface ValidationErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  fieldErrors: Record<string, string>;
  path: string;
}

// ─── Auth State ───────────────────────────────────────────────────────────────

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
}

export type AuthAction =
  | { type: "AUTH_SUCCESS"; payload: { user: User; accessToken: string } }
  | { type: "AUTH_LOADING" }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "SET_TOKEN"; payload: string };
