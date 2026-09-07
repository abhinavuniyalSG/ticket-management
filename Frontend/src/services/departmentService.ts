import { apiRequest } from "./apiClient";
import type {
  CreateDepartmentPayload,
  Department,
  UpdateDepartmentPayload,
} from "../types/department";
import type { PaginationMeta } from "../types/api";

interface DepartmentListResponse {
  message: string;
  departments: Department[];
  pagination: PaginationMeta;
}

interface DepartmentResponse {
  message: string;
  department: Department;
}

interface MessageResponse {
  message: string;
}

export interface DepartmentQueryParams {
  departmentName?: string;
  page?: number;
  limit?: number;
}

export const departmentService = {
  list: (params: DepartmentQueryParams = {}) =>
    apiRequest<DepartmentListResponse>("/departments", {
      query: {
        departmentName: params.departmentName,
        page: params.page?.toString(),
        limit: params.limit?.toString(),
      },
    }),

  getById: (id: string) => apiRequest<DepartmentResponse>(`/departments/${id}`),

  create: (payload: CreateDepartmentPayload) =>
    apiRequest<DepartmentResponse>("/departments", { method: "POST", body: payload }),

  update: (id: string, payload: UpdateDepartmentPayload) =>
    apiRequest<DepartmentResponse>(`/departments/${id}`, { method: "PATCH", body: payload }),

  remove: (id: string) =>
    apiRequest<MessageResponse>(`/departments/${id}`, { method: "DELETE" }),
};
