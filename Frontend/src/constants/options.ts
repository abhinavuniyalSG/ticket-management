import type { TicketPriority, TicketStatus } from "../types/ticket";
import type { UserRole } from "../types/user";
import type { ContactType } from "../types/contact";

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "review",
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

export const CONTACT_TYPES: ContactType[] = ["phone", "whatsapp", "linkedin"];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  review: "Review",
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

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  phone: "Phone",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
};

export const SORT_BY_LABELS: Record<string, string> = {
  createdAt: "Created date",
  updatedAt: "Updated date",
  priority: "Priority",
  status: "Status",
};
