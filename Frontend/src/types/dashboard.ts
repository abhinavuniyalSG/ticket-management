import type { TicketPriority, TicketStatus } from "./ticket";

export type DashboardPeriod = "day" | "week" | "month" | "year";

export interface StatusDistributionEntry {
  status: TicketStatus;
  count: number;
}

export interface PriorityDistributionEntry {
  priority: TicketPriority;
  count: number;
}

export interface TicketsOverTimeEntry {
  date: string;
  created: number;
  closed: number;
}

/**
 * What `GET /dashboard` actually returns. No departmentId/period/counts/
 * statusDistribution here - those live on DashboardOverview instead (status
 * distribution is derived from its per-status counts), since the two are
 * always fetched together and shouldn't repeat each other's data.
 */
export interface DashboardBreakdown {
  message: string;
  priorityDistribution: PriorityDistributionEntry[];
  ticketsOverTime: TicketsOverTimeEntry[];
}

export interface DashboardOverview {
  message: string;
  departmentId: string | null;
  period: DashboardPeriod;
  totalTicketsCreated: number;
  openTickets: number;
  assignedTickets: number;
  inProgressTickets: number;
  reviewedTickets: number;
  completedTickets: number;
  closedTickets: number;
}

/** The combined view-model DashboardPage builds from one overview call + one breakdown call. */
export interface DashboardMetrics extends DashboardOverview {
  statusDistribution: StatusDistributionEntry[];
  priorityDistribution: PriorityDistributionEntry[];
  ticketsOverTime: TicketsOverTimeEntry[];
}
