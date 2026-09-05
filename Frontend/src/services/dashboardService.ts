import { apiRequest } from "./apiClient";
import type { DashboardBreakdown, DashboardOverview, DashboardPeriod } from "../types/dashboard";

export const dashboardService = {
  get: (departmentId?: string, period?: DashboardPeriod) =>
    apiRequest<DashboardBreakdown>("/dashboard", { query: { departmentId, period } }),

  getOverview: (departmentId?: string, period?: DashboardPeriod) =>
    apiRequest<DashboardOverview>("/dashboard/overview", { query: { departmentId, period } }),
};
