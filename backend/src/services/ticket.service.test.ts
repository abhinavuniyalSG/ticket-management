import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketService } from "./ticket.service.js";
import { TicketRepository } from "../database/repositry/ticket.repository.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { NotificationService } from "./notification.service.js";
import { roleEnum } from "../types/user.js";
import { TicketPriority, TicketStatus } from "../types/ticket.js";
import type { Ticket } from "../database/models/ticket.model.js";
import type { RequesterInfo } from "./ticket.service.js";

vi.mock("../database/repositry/ticket.repository.js", () => ({
  TicketRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    createTicket: vi.fn(),
    updateTicket: vi.fn(),
    deleteTicket: vi.fn(),
  },
}));

vi.mock("../database/repositry/user.repository.js", () => ({
  UserRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("../database/repositry/department.repository.js", () => ({
  DepartmentRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("./notification.service.js", () => ({
  NotificationService: {
    ticketAssigned: vi.fn(),
    ticketReadyForReview: vi.fn(),
    notifyPriorityTicket: vi.fn(),
  },
}));

vi.mock("../core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const DEPT_A = "dept-a";
const DEPT_B = "dept-b";

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    email: "user@example.com",
    role: roleEnum.user,
    departmentId: DEPT_A,
    ...overrides,
  } as any;
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    ticketId: "ticket-1",
    title: "Broken keyboard",
    description: "Keys are stuck",
    status: TicketStatus.open,
    priority: TicketPriority.low,
    departmentId: DEPT_A,
    assignedToId: null,
    assignedTo: null,
    createdById: "creator-1",
    createdBy: makeUser({ id: "creator-1" }),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    closedAt: null,
    ...overrides,
  } as Ticket;
}

function requester(overrides: Partial<RequesterInfo> = {}): RequesterInfo {
  return { id: "user-1", email: "user@example.com", role: roleEnum.user, ...overrides };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getTicketById permissions", () => {
  it("throws 404 when the ticket does not exist", async () => {
    vi.mocked(TicketRepository.findById).mockResolvedValue(null);

    await expect(
      TicketService.getTicketById("missing", requester()),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lets a super_admin view any ticket", async () => {
    const ticket = makeTicket({ departmentId: DEPT_B, createdById: "someone-else" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);

    const result = await TicketService.getTicketById(
      "ticket-1",
      requester({ id: "super-1", role: roleEnum.superAdmin }),
    );

    expect(result.ticket.ticketId).toBe("ticket-1");
  });

  it("lets an admin view a ticket created in their own department", async () => {
    const ticket = makeTicket({ departmentId: DEPT_A, createdById: "someone-else" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );

    const result = await TicketService.getTicketById(
      "ticket-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.ticket.ticketId).toBe("ticket-1");
  });

  it("lets an admin view a ticket they created even if it's outside their department", async () => {
    const ticket = makeTicket({ departmentId: DEPT_B, createdById: "admin-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );

    const result = await TicketService.getTicketById(
      "ticket-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.ticket.ticketId).toBe("ticket-1");
  });

  it("lets an admin view a ticket assigned to them even if it's outside their department", async () => {
    const ticket = makeTicket({ departmentId: DEPT_B, createdById: "other", assignedToId: "admin-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );

    const result = await TicketService.getTicketById(
      "ticket-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.ticket.ticketId).toBe("ticket-1");
  });

  it("blocks an admin from viewing a ticket outside their department that they neither created nor are assigned to", async () => {
    const ticket = makeTicket({ departmentId: DEPT_B, createdById: "other" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );

    await expect(
      TicketService.getTicketById("ticket-1", requester({ id: "admin-1", role: roleEnum.admin })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets a regular user view a ticket they created", async () => {
    const ticket = makeTicket({ createdById: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);

    const result = await TicketService.getTicketById("ticket-1", requester({ id: "user-1" }));

    expect(result.ticket.ticketId).toBe("ticket-1");
  });

  it("lets a regular user view a ticket assigned to them", async () => {
    const ticket = makeTicket({ createdById: "other", assignedToId: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);

    const result = await TicketService.getTicketById("ticket-1", requester({ id: "user-1" }));

    expect(result.ticket.ticketId).toBe("ticket-1");
  });

  it("blocks a regular user from viewing a ticket they neither created nor are assigned to", async () => {
    const ticket = makeTicket({ createdById: "other", assignedToId: "someone-else" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);

    await expect(
      TicketService.getTicketById("ticket-1", requester({ id: "user-1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("strips password and refreshToken from the createdBy and assignedTo relations", async () => {
    const ticket = makeTicket({
      createdById: "user-1",
      createdBy: makeUser({ id: "user-1", password: "secret", refreshToken: "rt" }) as any,
      assignedToId: "assignee-1",
      assignedTo: makeUser({ id: "assignee-1", password: "secret2", refreshToken: "rt2" }) as any,
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);

    const result = await TicketService.getTicketById("ticket-1", requester({ id: "user-1" }));

    expect(result.ticket.createdBy).not.toHaveProperty("password");
    expect(result.ticket.createdBy).not.toHaveProperty("refreshToken");
    expect(result.ticket.assignedTo).not.toHaveProperty("password");
    expect(result.ticket.assignedTo).not.toHaveProperty("refreshToken");
  });
});

describe("createTicket", () => {
  it("throws 404 when the department does not exist", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(null);

    await expect(
      TicketService.createTicket(requester(), {
        title: "t",
        description: "d",
        departmentId: DEPT_A,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("creates an unassigned ticket with open status by default", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: DEPT_A } as any);
    vi.mocked(TicketRepository.createTicket).mockResolvedValue(makeTicket({ status: TicketStatus.open }));
    vi.mocked(TicketRepository.findById).mockResolvedValue(makeTicket({ status: TicketStatus.open }));

    await TicketService.createTicket(requester(), {
      title: "t",
      description: "d",
      departmentId: DEPT_A,
    });

    expect(TicketRepository.createTicket).toHaveBeenCalledWith(
      expect.objectContaining({ status: TicketStatus.open, assignedToId: null }),
    );
  });

  it("blocks a regular user from assigning a ticket upon creation", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: DEPT_A } as any);

    await expect(
      TicketService.createTicket(requester({ role: roleEnum.user }), {
        title: "t",
        description: "d",
        departmentId: DEPT_A,
        assignedToId: "assignee-1",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks an admin from assigning a ticket to a different department than their own", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: DEPT_A } as any);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_B }),
    );

    await expect(
      TicketService.createTicket(requester({ id: "admin-1", role: roleEnum.admin }), {
        title: "t",
        description: "d",
        departmentId: DEPT_A,
        assignedToId: "assignee-1",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks assignment when the assignee is not found", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: DEPT_A } as any);
    vi.mocked(UserRepository.findById).mockImplementation(async (id: string) => {
      if (id === "admin-1") return makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A });
      return null;
    });

    await expect(
      TicketService.createTicket(requester({ id: "admin-1", role: roleEnum.admin }), {
        title: "t",
        description: "d",
        departmentId: DEPT_A,
        assignedToId: "missing-assignee",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("blocks assignment when the assignee is in a different department", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: DEPT_A } as any);
    vi.mocked(UserRepository.findById).mockImplementation(async (id: string) => {
      if (id === "admin-1") return makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A });
      return makeUser({ id: "assignee-1", departmentId: DEPT_B });
    });

    await expect(
      TicketService.createTicket(requester({ id: "admin-1", role: roleEnum.admin }), {
        title: "t",
        description: "d",
        departmentId: DEPT_A,
        assignedToId: "assignee-1",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("creates a ticket with assigned status when a valid same-department assignee is given", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: DEPT_A } as any);
    vi.mocked(UserRepository.findById).mockImplementation(async (id: string) => {
      if (id === "admin-1") return makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A });
      return makeUser({ id: "assignee-1", departmentId: DEPT_A });
    });
    const created = makeTicket({ status: TicketStatus.assigned, assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.createTicket).mockResolvedValue(created);
    vi.mocked(TicketRepository.findById).mockResolvedValue(created);

    await TicketService.createTicket(requester({ id: "admin-1", role: roleEnum.admin }), {
      title: "t",
      description: "d",
      departmentId: DEPT_A,
      assignedToId: "assignee-1",
    });

    expect(TicketRepository.createTicket).toHaveBeenCalledWith(
      expect.objectContaining({ status: TicketStatus.assigned, assignedToId: "assignee-1" }),
    );
    expect(NotificationService.ticketAssigned).toHaveBeenCalledWith(created);
  });

  it("notifies about high/urgent priority tickets after creation", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: DEPT_A } as any);
    const created = makeTicket({ priority: TicketPriority.urgent });
    vi.mocked(TicketRepository.createTicket).mockResolvedValue(created);
    vi.mocked(TicketRepository.findById).mockResolvedValue(created);

    await TicketService.createTicket(requester(), {
      title: "t",
      description: "d",
      departmentId: DEPT_A,
      priority: TicketPriority.urgent,
    });

    expect(NotificationService.notifyPriorityTicket).toHaveBeenCalledWith(created);
  });
});

describe("updateTicket status transitions", () => {
  it("throws 404 when the ticket does not exist", async () => {
    vi.mocked(TicketRepository.findById).mockResolvedValue(null);

    await expect(
      TicketService.updateTicket("missing", { status: TicketStatus.assigned }, requester()),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 401 when the requester cannot be found", async () => {
    vi.mocked(TicketRepository.findById).mockResolvedValue(makeTicket());
    vi.mocked(UserRepository.findById).mockResolvedValue(null);

    await expect(
      TicketService.updateTicket("ticket-1", { status: TicketStatus.assigned }, requester()),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("blocks the creator from manually moving an open ticket to assigned without an assignee change", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, createdById: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));

    await expect(
      TicketService.updateTicket("ticket-1", { status: TicketStatus.assigned }, requester({ id: "user-1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets the assignee move a ticket from assigned to in_progress", async () => {
    const ticket = makeTicket({ status: TicketStatus.assigned, assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "assignee-1" }));
    const updated = { ...ticket, status: TicketStatus.inProgress };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { status: TicketStatus.inProgress },
      requester({ id: "assignee-1" }),
    );

    expect(TicketRepository.updateTicket).toHaveBeenCalledWith(
      "ticket-1",
      expect.objectContaining({ status: TicketStatus.inProgress }),
    );
    expect(result.ticket.status).toBe(TicketStatus.inProgress);
  });

  it("blocks the assignee from skipping straight from assigned to completed", async () => {
    const ticket = makeTicket({ status: TicketStatus.assigned, assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "assignee-1" }));

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { status: TicketStatus.completed },
        requester({ id: "assignee-1" }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets the assignee move a ticket from in_progress to completed", async () => {
    const ticket = makeTicket({ status: TicketStatus.inProgress, assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "assignee-1" }));
    const updated = { ...ticket, status: TicketStatus.completed };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    await TicketService.updateTicket(
      "ticket-1",
      { status: TicketStatus.completed },
      requester({ id: "assignee-1" }),
    );

    expect(NotificationService.ticketReadyForReview).toHaveBeenCalledWith(updated);
  });

  it("lets the assignee reopen work by moving completed back to in_progress", async () => {
    const ticket = makeTicket({ status: TicketStatus.completed, assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "assignee-1" }));
    const updated = { ...ticket, status: TicketStatus.inProgress };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { status: TicketStatus.inProgress },
      requester({ id: "assignee-1" }),
    );

    expect(result.ticket.status).toBe(TicketStatus.inProgress);
  });

  it("lets the creator send a completed ticket to reviewed", async () => {
    const ticket = makeTicket({ status: TicketStatus.completed, createdById: "user-1", assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));
    const updated = { ...ticket, status: TicketStatus.reviewed };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { status: TicketStatus.reviewed },
      requester({ id: "user-1" }),
    );

    expect(result.ticket.status).toBe(TicketStatus.reviewed);
  });

  it("lets the creator reopen a completed ticket", async () => {
    const ticket = makeTicket({ status: TicketStatus.completed, createdById: "user-1", assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));
    const updated = { ...ticket, status: TicketStatus.open, assignedToId: null };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { status: TicketStatus.open },
      requester({ id: "user-1" }),
    );

    expect(result.ticket.status).toBe(TicketStatus.open);
  });

  it("blocks a bystander (not creator, not assignee) from transitioning status", async () => {
    const ticket = makeTicket({ status: TicketStatus.assigned, createdById: "creator-1", assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "bystander-1" }));

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { status: TicketStatus.inProgress },
        requester({ id: "bystander-1" }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets a same-department admin close a ticket that is in reviewed", async () => {
    const ticket = makeTicket({
      status: TicketStatus.reviewed,
      departmentId: DEPT_A,
      createdById: "creator-1",
      assignedToId: "assignee-1",
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );
    const updated = { ...ticket, status: TicketStatus.closed, closedAt: new Date() };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { status: TicketStatus.closed },
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.ticket.status).toBe(TicketStatus.closed);
    expect(TicketRepository.updateTicket).toHaveBeenCalledWith(
      "ticket-1",
      expect.objectContaining({ status: TicketStatus.closed, closedAt: expect.any(Date) }),
    );
  });

  it("blocks a same-department admin from closing a ticket that isn't in reviewed", async () => {
    const ticket = makeTicket({
      status: TicketStatus.inProgress,
      departmentId: DEPT_A,
      createdById: "creator-1",
      assignedToId: "assignee-1",
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { status: TicketStatus.closed },
        requester({ id: "admin-1", role: roleEnum.admin }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("blocks a same-department admin from manually moving an open ticket to any other status", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, departmentId: DEPT_A, createdById: "creator-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { status: TicketStatus.inProgress },
        requester({ id: "admin-1", role: roleEnum.admin }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lets a same-department admin move a ticket between any two non-open, non-closed-from-non-reviewed states", async () => {
    const ticket = makeTicket({
      status: TicketStatus.assigned,
      departmentId: DEPT_A,
      createdById: "creator-1",
      assignedToId: "assignee-1",
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );
    const updated = { ...ticket, status: TicketStatus.inProgress };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { status: TicketStatus.inProgress },
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.ticket.status).toBe(TicketStatus.inProgress);
  });

  it("blocks a different-department admin from transitioning status like a bystander", async () => {
    const ticket = makeTicket({
      status: TicketStatus.assigned,
      departmentId: DEPT_A,
      createdById: "creator-1",
      assignedToId: "assignee-1",
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-2", role: roleEnum.admin, departmentId: DEPT_B }),
    );

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { status: TicketStatus.inProgress },
        requester({ id: "admin-2", role: roleEnum.admin }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets a super_admin make any status transition, though the target state's own invariants still apply", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, createdById: "creator-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "super-1", role: roleEnum.superAdmin }),
    );

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { status: TicketStatus.closed },
        requester({ id: "super-1", role: roleEnum.superAdmin }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 }); // closed without assignee still needs an assignee
  });

  it("returns 'No changes detected' when the requested status equals the current status", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, createdById: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));

    const result = await TicketService.updateTicket(
      "ticket-1",
      { status: TicketStatus.open },
      requester({ id: "user-1" }),
    );

    expect(result.message).toBe("No changes detected");
    expect(TicketRepository.updateTicket).not.toHaveBeenCalled();
  });
});

describe("updateTicket assignment", () => {
  it("blocks a regular user (not same-dept admin, not super_admin) from assigning a ticket", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, createdById: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { assignedToId: "assignee-1" },
        requester({ id: "user-1" }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks assigning to a user outside the ticket's department", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, departmentId: DEPT_A, createdById: "creator-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockImplementation(async (id: string) => {
      if (id === "admin-1") return makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A });
      return makeUser({ id: "assignee-1", departmentId: DEPT_B });
    });

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { assignedToId: "assignee-1" },
        requester({ id: "admin-1", role: roleEnum.admin }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("assigns a same-department admin's ticket and moves it to assigned status, notifying the new assignee", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, departmentId: DEPT_A, createdById: "creator-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockImplementation(async (id: string) => {
      if (id === "admin-1") return makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A });
      return makeUser({ id: "assignee-1", departmentId: DEPT_A });
    });
    const updated = { ...ticket, status: TicketStatus.assigned, assignedToId: "assignee-1" };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { assignedToId: "assignee-1" },
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.ticket.status).toBe(TicketStatus.assigned);
    expect(NotificationService.ticketAssigned).toHaveBeenCalledWith(updated);
  });

  it("clearing the assignee (null) reverts the ticket to open status", async () => {
    const ticket = makeTicket({
      status: TicketStatus.assigned,
      departmentId: DEPT_A,
      createdById: "creator-1",
      assignedToId: "assignee-1",
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );
    const updated = { ...ticket, status: TicketStatus.open, assignedToId: null };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { assignedToId: null },
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.ticket.status).toBe(TicketStatus.open);
    expect(result.ticket.assignedTo).toBeNull();
  });

  it("rejects an explicit status alongside a new assignee that isn't 'assigned'", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, departmentId: DEPT_A, createdById: "creator-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockImplementation(async (id: string) => {
      if (id === "admin-1") return makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A });
      return makeUser({ id: "assignee-1", departmentId: DEPT_A });
    });

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { assignedToId: "assignee-1", status: TicketStatus.inProgress },
        requester({ id: "admin-1", role: roleEnum.admin }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an explicit status alongside clearing the assignee that isn't 'open'", async () => {
    const ticket = makeTicket({
      status: TicketStatus.assigned,
      departmentId: DEPT_A,
      createdById: "creator-1",
      assignedToId: "assignee-1",
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { assignedToId: null, status: TicketStatus.inProgress },
        requester({ id: "admin-1", role: roleEnum.admin }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("updateTicket content edits", () => {
  it("blocks a non-creator from editing title, description, or priority", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, createdById: "creator-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "someone-else" }));

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { title: "New title" },
        requester({ id: "someone-else" }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets the creator edit content while the ticket is open", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, createdById: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));
    const updated = { ...ticket, title: "New title" };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { title: "New title" },
      requester({ id: "user-1" }),
    );

    expect(result.ticket.title).toBe("New title");
  });

  it("blocks the creator from editing content while the ticket isn't open", async () => {
    const ticket = makeTicket({ status: TicketStatus.assigned, createdById: "user-1", assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));

    await expect(
      TicketService.updateTicket(
        "ticket-1",
        { title: "New title" },
        requester({ id: "user-1" }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("allows the creator to edit content while reopening a completed ticket", async () => {
    const ticket = makeTicket({ status: TicketStatus.completed, createdById: "user-1", assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));
    const updated = { ...ticket, title: "New title", status: TicketStatus.open, assignedToId: null };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    const result = await TicketService.updateTicket(
      "ticket-1",
      { title: "New title", status: TicketStatus.open },
      requester({ id: "user-1" }),
    );

    expect(result.ticket.title).toBe("New title");
    expect(result.ticket.status).toBe(TicketStatus.open);
  });

  it("notifies department recipients when priority is raised to high or urgent", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, createdById: "user-1", priority: TicketPriority.low });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));
    const updated = { ...ticket, priority: TicketPriority.high };
    vi.mocked(TicketRepository.updateTicket).mockResolvedValue(updated);

    await TicketService.updateTicket(
      "ticket-1",
      { priority: TicketPriority.high },
      requester({ id: "user-1" }),
    );

    expect(NotificationService.notifyPriorityTicket).toHaveBeenCalledWith(updated);
  });
});

describe("deleteTicket", () => {
  it("throws 404 when the ticket does not exist", async () => {
    vi.mocked(TicketRepository.findById).mockResolvedValue(null);

    await expect(TicketService.deleteTicket("missing", requester())).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("lets a super_admin delete any ticket regardless of status or assignment", async () => {
    const ticket = makeTicket({ status: TicketStatus.inProgress, assignedToId: "assignee-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(TicketRepository.deleteTicket).mockResolvedValue(true);

    const result = await TicketService.deleteTicket(
      "ticket-1",
      requester({ id: "super-1", role: roleEnum.superAdmin }),
    );

    expect(result.message).toBe("Ticket deleted successfully");
    expect(TicketRepository.deleteTicket).toHaveBeenCalledWith("ticket-1");
  });

  it("lets the creator delete their own ticket while it's unassigned and open", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, assignedToId: null, createdById: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));
    vi.mocked(TicketRepository.deleteTicket).mockResolvedValue(true);

    const result = await TicketService.deleteTicket("ticket-1", requester({ id: "user-1" }));

    expect(result.message).toBe("Ticket deleted successfully");
  });

  it("blocks the creator from deleting a ticket that is already assigned", async () => {
    const ticket = makeTicket({ status: TicketStatus.assigned, assignedToId: "assignee-1", createdById: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));

    await expect(TicketService.deleteTicket("ticket-1", requester({ id: "user-1" }))).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("blocks the creator from deleting a ticket that isn't open (even if unassigned)", async () => {
    const ticket = makeTicket({ status: TicketStatus.reviewed, assignedToId: null, createdById: "user-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));

    await expect(TicketService.deleteTicket("ticket-1", requester({ id: "user-1" }))).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("lets a same-department admin delete an unassigned, open ticket", async () => {
    const ticket = makeTicket({
      status: TicketStatus.open,
      assignedToId: null,
      departmentId: DEPT_A,
      createdById: "creator-1",
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );
    vi.mocked(TicketRepository.deleteTicket).mockResolvedValue(true);

    const result = await TicketService.deleteTicket(
      "ticket-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.message).toBe("Ticket deleted successfully");
  });

  it("blocks a bystander user from deleting a ticket they didn't create", async () => {
    const ticket = makeTicket({ status: TicketStatus.open, assignedToId: null, createdById: "creator-1" });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "bystander-1" }));

    await expect(
      TicketService.deleteTicket("ticket-1", requester({ id: "bystander-1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks a different-department admin from deleting a ticket outside their department", async () => {
    const ticket = makeTicket({
      status: TicketStatus.open,
      assignedToId: null,
      departmentId: DEPT_A,
      createdById: "creator-1",
    });
    vi.mocked(TicketRepository.findById).mockResolvedValue(ticket);
    vi.mocked(UserRepository.findById).mockResolvedValue(
      makeUser({ id: "admin-2", role: roleEnum.admin, departmentId: DEPT_B }),
    );

    await expect(
      TicketService.deleteTicket("ticket-1", requester({ id: "admin-2", role: roleEnum.admin })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("getAllTickets", () => {
  it("passes the requester's department and normalized sort order through to the repository", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "admin-1", departmentId: DEPT_A }));
    vi.mocked(TicketRepository.findAll).mockResolvedValue([]);

    await TicketService.getAllTickets(requester({ id: "admin-1", role: roleEnum.admin }), {
      sortOrder: "asc" as any,
    });

    expect(TicketRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterDepartmentId: DEPT_A,
        sortOrder: "ASC",
      }),
    );
  });
});
