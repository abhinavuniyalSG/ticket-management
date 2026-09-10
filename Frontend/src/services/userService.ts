import { apiRequest } from "./apiClient";
import type { User, UserRole, UpdateUserPayload } from "../types/user";
import type { PaginationMeta } from "../types/api";

interface UserListResponse {
  message: string;
  users: User[];
  pagination: PaginationMeta;
}

export interface UserQueryParams {
  department?: string;
  firstName?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

interface UserResponse {
  message: string;
  user: User;
}

interface MessageResponse {
  message: string;
}

export const userService = {
  list: (params: UserQueryParams = {}) =>
    apiRequest<UserListResponse>("/users", {
      query: {
        department: params.department,
        firstName: params.firstName,
        role: params.role,
        page: params.page?.toString(),
        limit: params.limit?.toString(),
      },
    }),

  getById: (id: string) => apiRequest<UserResponse>(`/users/${id}`),

  update: (id: string, payload: UpdateUserPayload) =>
    apiRequest<UserResponse>(`/users/${id}`, { method: "PATCH", body: payload }),

  remove: (id: string) =>
    apiRequest<MessageResponse>(`/users/${id}`, { method: "DELETE" }),
};
