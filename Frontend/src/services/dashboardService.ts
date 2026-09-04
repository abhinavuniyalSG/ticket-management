import { apiRequest } from "./apiClient";
import type { DashboardMetrics, DashboardOverview, DashboardPeriod } from "../types/dashboard";

export const dashboardService = {
  get: (departmentId?: string, period?: DashboardPeriod) =>
    apiRequest<DashboardMetrics>("/dashboard", { query: { departmentId, period } }),

  getOverview: (period?: DashboardPeriod) =>
    apiRequest<DashboardOverview>("/dashboard/overview", { query: { period } }),
};
