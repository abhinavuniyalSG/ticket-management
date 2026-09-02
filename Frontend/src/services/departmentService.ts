import { apiRequest } from "./apiClient";
import type {
  CreateDepartmentPayload,
  Department,
  UpdateDepartmentPayload,
} from "../types/department";

interface DepartmentListResponse {
  message: string;
  departments: Department[];
}

interface DepartmentResponse {
  message: string;
  department: Department;
}

interface MessageResponse {
  message: string;
}

export const departmentService = {
  list: () => apiRequest<DepartmentListResponse>("/departments"),

  getById: (id: string) => apiRequest<DepartmentResponse>(`/departments/${id}`),

  create: (payload: CreateDepartmentPayload) =>
    apiRequest<DepartmentResponse>("/departments", { method: "POST", body: payload }),

  update: (id: string, payload: UpdateDepartmentPayload) =>
    apiRequest<DepartmentResponse>(`/departments/${id}`, { method: "PATCH", body: payload }),

  remove: (id: string) =>
    apiRequest<MessageResponse>(`/departments/${id}`, { method: "DELETE" }),
};
