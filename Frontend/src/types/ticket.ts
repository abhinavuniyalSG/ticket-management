import type { Department } from "./department";
import type { User } from "./user";

export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "reviewed"
  | "completed"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  ticketId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  departmentId: string;
  department: Department;
  assignedToId: string | null;
  assignedTo: User | null;
  createdById: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  departmentId: string;
  priority?: TicketPriority;
  assignedToId?: string | null;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToId?: string | null;
}

export type TicketSortBy = "createdAt" | "updatedAt" | "priority" | "status";
export type SortOrder = "asc" | "desc";

export interface TicketQueryParams {
  title?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  departmentId?: string;
  assignedToId?: string;
  createdById?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: TicketSortBy;
  sortOrder?: SortOrder;
}
