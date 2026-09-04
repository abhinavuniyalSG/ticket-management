import type { TicketPriority, TicketStatus } from "./ticket";

export type DashboardPeriod = "week" | "month" | "year";

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

export interface DashboardMetrics {
  message: string;
  totalTickets: number;
  openTickets: number;
  assignedTickets: number;
  inProgressTickets: number;
  reviewedTickets: number;
  completedTickets: number;
  closedTickets: number;
  statusDistribution: StatusDistributionEntry[];
  priorityDistribution: PriorityDistributionEntry[];
  ticketsOverTime: TicketsOverTimeEntry[];
}

export interface DashboardOverview {
  message: string;
  systemWide: Omit<DashboardMetrics, "message">;
}
