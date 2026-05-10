import apiClient from "./client";
import type { ApiResponse, AssignRolesRequest, User } from "@/types/auth.types";
import type { AxiosResponse } from "axios";

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-indexed)
  size: number;
}

export const adminApi = {
  getAllUsers: (
    page = 0,
    size = 20,
    sort = "createdAt,desc"
  ): Promise<AxiosResponse<PageResponse<User>>> =>
    apiClient.get("/admin/users", { params: { page, size, sort } }),

  getUserById: (id: string): Promise<AxiosResponse<ApiResponse<User>>> =>
    apiClient.get(`/admin/users/${id}`),

  assignRoles: (
    id: string,
    data: AssignRolesRequest
  ): Promise<AxiosResponse<ApiResponse<User>>> =>
    apiClient.patch(`/admin/users/${id}/roles`, data),

  setUserStatus: (
    id: string,
    enabled: boolean
  ): Promise<AxiosResponse<ApiResponse<User>>> =>
    apiClient.patch(`/admin/users/${id}/status`, null, { params: { enabled } }),

  deleteUser: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    apiClient.delete(`/admin/users/${id}`),

  getStats: (): Promise<AxiosResponse<ApiResponse>> =>
    apiClient.get("/admin/stats"),
};
