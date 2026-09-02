import type { User } from "./user";

export interface Department {
  departmentId: string;
  departmentName: string;
  departmentEmail: string;
  managedBy: string | null;
  manager?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentPayload {
  departmentName: string;
  departmentEmail: string;
  managedBy?: string | null;
}

export interface UpdateDepartmentPayload {
  departmentName?: string;
  departmentEmail?: string;
  managedBy?: string | null;
}
