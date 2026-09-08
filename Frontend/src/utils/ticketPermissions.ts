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

/** True when `user` is an admin set as the manager of the ticket's department (Department.managedBy). */
function managesTicketDepartment(ticket: Ticket, user: User): boolean {
  return user.role === "admin" && ticket.department.managedBy === user.id;
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
  // A department manager gets the same status-transition rights as a
  // same-department admin.
  const isDeptAdmin = isSameDeptAdmin || managesTicketDepartment(ticket, user);
  const current = ticket.status;

  if (isSuperAdmin) {
    return ALL_STATUSES.filter((status) => {
      if (status === current) return false;
      if (status !== "open" && !ticket.assignedToId) return false;
      return true;
    });
  }

  // A department admin (own department or one they manage) may only close a
  // ticket once it has been reviewed. Every other status change for them -
  // including moving a ticket out of 'open' - happens through the dedicated
  // assign/unassign action instead, not a manual status change.
  if (isDeptAdmin) {
    return current === "reviewed" ? ["closed"] : [];
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

/**
 * Department admins (own department, or a department they've been set as
 * the manager of via Department.managedBy) may only assign a ticket while
 * it is 'open'; super admins may assign regardless of status. Mirrors the
 * backend guard in TicketService.updateTicket.
 */
export function canAssignTicket(ticket: Ticket, user: User): boolean {
  const { isSameDeptAdmin, isSuperAdmin } = getRoleFlags(ticket, user);
  if (isSuperAdmin) return true;
  const isDeptAdmin = isSameDeptAdmin || managesTicketDepartment(ticket, user);
  return isDeptAdmin && ticket.status === "open";
}

/**
 * Department admins may only unassign a ticket while it is 'assigned' -
 * once it has moved further along the workflow they can no longer
 * force-unassign it. Super admins may unassign regardless of status.
 * Mirrors the backend guard in TicketService.updateTicket.
 */
export function canUnassignTicket(ticket: Ticket, user: User): boolean {
  const { isSameDeptAdmin, isSuperAdmin } = getRoleFlags(ticket, user);
  if (isSuperAdmin) return true;
  const isDeptAdmin = isSameDeptAdmin || managesTicketDepartment(ticket, user);
  return isDeptAdmin && ticket.status === "assigned";
}

/** Whether the assignment section (assign or unassign) should be shown at all. */
export function canManageAssignment(ticket: Ticket, user: User): boolean {
  return canAssignTicket(ticket, user) || canUnassignTicket(ticket, user);
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
