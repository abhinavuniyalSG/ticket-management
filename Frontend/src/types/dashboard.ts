import type { TicketPriority, TicketStatus } from "./ticket";

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
  reviewTickets: number;
  completedTickets: number;
  closedTickets: number;
  statusDistribution: StatusDistributionEntry[];
  priorityDistribution: PriorityDistributionEntry[];
  productivity: { averageCompletionTimeHours: number };
  ticketsOverTime: TicketsOverTimeEntry[];
}

export interface DepartmentBreakdown {
  departmentId: string;
  departmentName: string;
  totalTickets: number;
  statusDistribution: StatusDistributionEntry[];
  priorityDistribution: PriorityDistributionEntry[];
  productivity: { averageCompletionTimeHours: number };
}

export interface DashboardOverview {
  message: string;
  systemWide: Omit<DashboardMetrics, "message">;
  departments: DepartmentBreakdown[];
}
