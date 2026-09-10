import type { TicketPriority, TicketStatus } from "../types/ticket";
import type { UserRole } from "../types/user";
import type { DashboardPeriod } from "../types/dashboard";

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "reviewed",
  "completed",
  "closed",
];

export const TICKET_PRIORITIES: TicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const USER_ROLES: UserRole[] = ["user", "admin", "super_admin"];

/**
 * The list pages' page size. The backend no longer applies a default limit
 * itself (omitting `limit` now means "return everything, unpaginated"), so
 * paginated views must send this explicitly to keep working as pages.
 */
export const DEFAULT_PAGE_SIZE = 20;

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  reviewed: "Reviewed",
  completed: "Completed",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const DASHBOARD_PERIODS: DashboardPeriod[] = [
  "day",
  "week",
  "month",
  "year",
];

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

/** Window `ticketsOverTime` covers for each period - see DashboardCharts. */
export const DASHBOARD_PERIOD_WINDOW_LABELS: Record<DashboardPeriod, string> = {
  day: "7 days",
  week: "4 weeks",
  month: "12 months",
  year: "yearly",
};

export const SORT_BY_LABELS: Record<string, string> = {
  createdAt: "Created date",
  updatedAt: "Updated date",
  priority: "Priority",
  status: "Status",
};
