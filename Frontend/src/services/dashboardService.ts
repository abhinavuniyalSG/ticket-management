import { apiRequest } from "./apiClient";
import type { DashboardMetrics, DashboardOverview } from "../types/dashboard";

export const dashboardService = {
  get: (departmentId?: string) =>
    apiRequest<DashboardMetrics>("/dashboard", { query: { departmentId } }),

  getOverview: () => apiRequest<DashboardOverview>("/dashboard/overview"),
};
