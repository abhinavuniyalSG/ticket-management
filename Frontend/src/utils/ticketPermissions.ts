import type { Ticket, TicketStatus } from "../types/ticket";
import type { User } from "../types/user";

interface RoleFlags {
  isCreator: boolean;
  isAssignee: boolean;
  isSameDeptAdmin: boolean;
  isSuperAdmin: boolean;
}

function getRoleFlags(ticket: Ticket, user: User): RoleFlags {
  return {
    isCreator: ticket.createdById === user.id,
    isAssignee: ticket.assignedToId === user.id,
    isSameDeptAdmin: user.role === "admin" && user.departmentId === ticket.departmentId,
    isSuperAdmin: user.role === "super_admin",
  };
}

const ALL_STATUSES: TicketStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "reviewed",
  "completed",
  "closed",
];

/**
 * Enumerates status-only transitions the backend would accept for this
 * requester, mirroring TicketService.validateStatusTransition exactly so the
 * UI never offers an action the API will reject with a 403/400.
 */
export function getAllowedStatusTransitions(ticket: Ticket, user: User): TicketStatus[] {
  const { isCreator, isAssignee, isSameDeptAdmin, isSuperAdmin } = getRoleFlags(ticket, user);
  const current = ticket.status;

  if (isSuperAdmin) {
    return ALL_STATUSES.filter((status) => {
      if (status === current) return false;
      if (status !== "open" && !ticket.assignedToId) return false;
      return true;
    });
  }

  if (isSameDeptAdmin) {
    return ALL_STATUSES.filter((status) => {
      if (status === current) return false;
      if (status === "closed" && current !== "reviewed") return false;
      if (current === "open" && status !== "open") return false;
      if (status !== "open" && !ticket.assignedToId) return false;
      return true;
    });
  }

  const allowed = new Set<TicketStatus>();
  if (isCreator && current === "completed") {
    allowed.add("reviewed");
    allowed.add("open");
  }
  if (isAssignee) {
    if (current === "assigned") allowed.add("in_progress");
    if (current === "in_progress") allowed.add("completed");
    if (current === "completed") allowed.add("in_progress");
  }
  return Array.from(allowed);
}

/** Only the creator, and only while the ticket is still open. */
export function canEditTicketContent(ticket: Ticket, user: User): boolean {
  return ticket.createdById === user.id && ticket.status === "open";
}

/** Department admins (own department) and super admins may assign/unassign. */
export function canManageAssignment(ticket: Ticket, user: User): boolean {
  const { isSameDeptAdmin, isSuperAdmin } = getRoleFlags(ticket, user);
  return isSameDeptAdmin || isSuperAdmin;
}

export function canDeleteTicket(ticket: Ticket, user: User): boolean {
  const { isCreator, isSameDeptAdmin, isSuperAdmin } = getRoleFlags(ticket, user);
  if (isSuperAdmin) return true;
  if (isCreator || isSameDeptAdmin) {
    return ticket.assignedToId === null && ticket.status === "open";
  }
  return false;
}

export function canAssignOnCreate(user: User): boolean {
  return user.role === "admin" || user.role === "super_admin";
}
