"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import type {
  AuthAction,
  AuthState,
  LoginRequest,
  User,
} from "@/types/auth.types";
import { authApi, userApi } from "@/lib/api/auth.api";
import { setAccessToken } from "@/lib/api/client";

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  status: "loading",
  user: null,
  accessToken: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, status: "loading" };
    case "AUTH_SUCCESS":
      return {
        status: "authenticated",
        user: action.payload.user,
        accessToken: action.payload.accessToken,
      };
    case "LOGOUT":
      return { status: "unauthenticated", user: null, accessToken: null };
    case "UPDATE_USER":
      return { ...state, user: action.payload };
    case "SET_TOKEN":
      return { ...state, accessToken: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * On mount: try to restore session silently.
   * - Calls GET /user/me with the access token (if in memory)
   * - If 401, the Axios interceptor fires POST /auth/refresh-token (cookie sent automatically)
   * - On success: auth state is populated without any user action
   * - On failure: status → "unauthenticated"
   */
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        // First attempt: try refresh to get a fresh access token
        const refreshRes = await authApi.refreshToken();
        if (cancelled) return;

        const { accessToken, user } = refreshRes.data;
        setAccessToken(accessToken);
        dispatch({ type: "AUTH_SUCCESS", payload: { user, accessToken } });
      } catch {
        if (cancelled) return;
        // No valid refresh token cookie → unauthenticated
        setAccessToken(null);
        dispatch({ type: "LOGOUT" });
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    const { accessToken, user } = response.data;
    setAccessToken(accessToken);
    dispatch({ type: "AUTH_SUCCESS", payload: { user, accessToken } });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logout(); // also clears the current cookie
    } finally {
      setAccessToken(null);
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await userApi.getMe();
    const user = response.data.data as User;
    dispatch({ type: "UPDATE_USER", payload: user });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, logoutAll, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
