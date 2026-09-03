import { describe, it, expect } from "vitest";
import {
  canAssignOnCreate,
  canDeleteTicket,
  canEditTicketContent,
  canManageAssignment,
  getAllowedStatusTransitions,
} from "./ticketPermissions";
import type { Ticket, TicketStatus } from "../types/ticket";
import type { User } from "../types/user";

// Small fixture builders so each test only has to spell out the fields it
// actually cares about.
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firstName: "Test",
    lastName: "User",
    role: "user",
    email: "test.user@example.com",
    isVerified: true,
    departmentId: "dept-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  const creator = makeUser({ id: "creator-1" });
  return {
    ticketId: "ticket-1",
    title: "Printer is on fire",
    description: "Smoke coming from the third floor printer.",
    status: "open",
    priority: "medium",
    departmentId: "dept-1",
    department: {
      departmentId: "dept-1",
      departmentName: "Facilities",
      departmentEmail: "facilities@example.com",
      managedBy: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    assignedToId: null,
    assignedTo: null,
    createdById: creator.id,
    createdBy: creator,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    closedAt: null,
    ...overrides,
  };
}

describe("canEditTicketContent", () => {
  it("allows the creator to edit while the ticket is open", () => {
    const user = makeUser({ id: "creator-1" });
    const ticket = makeTicket({ createdById: "creator-1", status: "open" });
    expect(canEditTicketContent(ticket, user)).toBe(true);
  });

  it("blocks the creator once the ticket has moved past open", () => {
    const user = makeUser({ id: "creator-1" });
    const ticket = makeTicket({ createdById: "creator-1", status: "assigned" });
    expect(canEditTicketContent(ticket, user)).toBe(false);
  });

  it("blocks anyone who isn't the creator, even a super admin", () => {
    const user = makeUser({ id: "someone-else", role: "super_admin" });
    const ticket = makeTicket({ createdById: "creator-1", status: "open" });
    expect(canEditTicketContent(ticket, user)).toBe(false);
  });
});

describe("canManageAssignment", () => {
  it("allows an admin from the same department", () => {
    const user = makeUser({ role: "admin", departmentId: "dept-1" });
    const ticket = makeTicket({ departmentId: "dept-1" });
    expect(canManageAssignment(ticket, user)).toBe(true);
  });

  it("blocks an admin from a different department", () => {
    const user = makeUser({ role: "admin", departmentId: "dept-2" });
    const ticket = makeTicket({ departmentId: "dept-1" });
    expect(canManageAssignment(ticket, user)).toBe(false);
  });

  it("always allows a super admin", () => {
    const user = makeUser({ role: "super_admin", departmentId: "dept-2" });
    const ticket = makeTicket({ departmentId: "dept-1" });
    expect(canManageAssignment(ticket, user)).toBe(true);
  });

  it("blocks a regular user", () => {
    const user = makeUser({ role: "user", departmentId: "dept-1" });
    const ticket = makeTicket({ departmentId: "dept-1" });
    expect(canManageAssignment(ticket, user)).toBe(false);
  });
});

describe("canDeleteTicket", () => {
  it("always allows a super admin", () => {
    const user = makeUser({ role: "super_admin" });
    const ticket = makeTicket({ status: "in_progress", assignedToId: "someone" });
    expect(canDeleteTicket(ticket, user)).toBe(true);
  });

  it("allows the creator when the ticket is unassigned and open", () => {
    const user = makeUser({ id: "creator-1" });
    const ticket = makeTicket({ createdById: "creator-1", status: "open", assignedToId: null });
    expect(canDeleteTicket(ticket, user)).toBe(true);
  });

  it("blocks the creator once someone is assigned", () => {
    const user = makeUser({ id: "creator-1" });
    const ticket = makeTicket({
      createdById: "creator-1",
      status: "open",
      assignedToId: "someone",
    });
    expect(canDeleteTicket(ticket, user)).toBe(false);
  });

  it("blocks a regular user who neither created nor owns the ticket", () => {
    const user = makeUser({ id: "bystander" });
    const ticket = makeTicket({ createdById: "creator-1", status: "open", assignedToId: null });
    expect(canDeleteTicket(ticket, user)).toBe(false);
  });
});

describe("canAssignOnCreate", () => {
  it.each(["admin", "super_admin"] as const)("allows a %s", (role) => {
    expect(canAssignOnCreate(makeUser({ role }))).toBe(true);
  });

  it("blocks a regular user", () => {
    expect(canAssignOnCreate(makeUser({ role: "user" }))).toBe(false);
  });
});

describe("getAllowedStatusTransitions", () => {
  it("lets the creator send a completed ticket back to reviewed or reopen it", () => {
    const user = makeUser({ id: "creator-1" });
    const ticket = makeTicket({
      createdById: "creator-1",
      status: "completed",
      assignedToId: "assignee-1",
    });
    const transitions = getAllowedStatusTransitions(ticket, user);
    expect(transitions).toEqual(expect.arrayContaining(["reviewed", "open"]));
  });

  it("lets the assignee move an assigned ticket into progress", () => {
    const user = makeUser({ id: "assignee-1" });
    const ticket = makeTicket({ assignedToId: "assignee-1", status: "assigned" });
    expect(getAllowedStatusTransitions(ticket, user)).toEqual(["in_progress"]);
  });

  it("gives a bystander with no relation to the ticket no transitions", () => {
    const user = makeUser({ id: "bystander" });
    const ticket = makeTicket({ status: "assigned", assignedToId: "assignee-1" });
    expect(getAllowedStatusTransitions(ticket, user)).toEqual([]);
  });

  it("never offers a same-department admin a status other than 'open' while the ticket is still open", () => {
    const user = makeUser({ role: "admin", departmentId: "dept-1" });
    const ticket = makeTicket({ departmentId: "dept-1", status: "open" });
    expect(getAllowedStatusTransitions(ticket, user)).toEqual([]);
  });

  it("only lets a same-department admin close a ticket that is in reviewed", () => {
    const user = makeUser({ role: "admin", departmentId: "dept-1" });
    const ticket = makeTicket({
      departmentId: "dept-1",
      status: "reviewed",
      assignedToId: "assignee-1",
    });
    expect(getAllowedStatusTransitions(ticket, user)).toContain("closed");
  });

  it("never offers a super admin a non-open status while the ticket is unassigned", () => {
    const user = makeUser({ role: "super_admin" });
    const ticket = makeTicket({ status: "open", assignedToId: null });
    const transitions = getAllowedStatusTransitions(ticket, user);
    const nonOpen = transitions.filter((status: TicketStatus) => status !== "open");
    expect(nonOpen).toEqual([]);
  });
});
