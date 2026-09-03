import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "./notification.service.js";
import { EmailService } from "./email.service.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { TicketRepository } from "../database/repositry/ticket.repository.js";
import { roleEnum } from "../types/user.js";
import { TicketPriority, TicketStatus } from "../types/ticket.js";
import type { Ticket } from "../database/models/ticket.model.js";

vi.mock("./email.service.js", () => ({
  EmailService: { send: vi.fn() },
}));

vi.mock("../database/repositry/user.repository.js", () => ({
  UserRepository: {
    findById: vi.fn(),
    findByRoleAndDepartment: vi.fn(),
    findByRole: vi.fn(),
  },
}));

vi.mock("../database/repositry/department.repository.js", () => ({
  DepartmentRepository: {
    findById: vi.fn(),
    findAll: vi.fn(),
  },
}));

vi.mock("../database/repositry/ticket.repository.js", () => ({
  TicketRepository: {
    findByDepartmentStatuses: vi.fn(),
    getSummary: vi.fn(),
  },
}));

vi.mock("../core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    ticketId: "ticket-1",
    title: "Broken keyboard",
    description: "Keys are stuck",
    status: TicketStatus.assigned,
    priority: TicketPriority.low,
    departmentId: "dept-1",
    assignedToId: "assignee-1",
    createdById: "creator-1",
    ...overrides,
  } as Ticket;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ticketAssigned", () => {
  it("emails the assignee when they have an email address", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue({ email: "assignee@example.com" } as any);

    await NotificationService.ticketAssigned(makeTicket());

    expect(EmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "assignee@example.com", subject: expect.stringContaining("assigned") }),
    );
  });

  it("skips sending when the ticket has no assignee", async () => {
    await NotificationService.ticketAssigned(makeTicket({ assignedToId: null }));

    expect(UserRepository.findById).not.toHaveBeenCalled();
    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("skips sending when the assignee has no email on file", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue({ email: "" } as any);

    await NotificationService.ticketAssigned(makeTicket());

    expect(EmailService.send).not.toHaveBeenCalled();
  });
});

describe("ticketReadyForReview", () => {
  it("emails the ticket creator", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue({ email: "creator@example.com" } as any);

    await NotificationService.ticketReadyForReview(makeTicket());

    expect(EmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "creator@example.com", subject: expect.stringContaining("review") }),
    );
  });

  it("skips sending when the creator has no email on file", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(null);

    await NotificationService.ticketReadyForReview(makeTicket());

    expect(EmailService.send).not.toHaveBeenCalled();
  });
});

describe("notifyPriorityTicket", () => {
  it("does nothing for low or medium priority tickets", async () => {
    await NotificationService.notifyPriorityTicket(makeTicket({ priority: TicketPriority.medium }));

    expect(DepartmentRepository.findById).not.toHaveBeenCalled();
    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("does nothing when the department can't be found", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(null);

    await NotificationService.notifyPriorityTicket(makeTicket({ priority: TicketPriority.high }));

    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("emails department admins and the manager for a high priority ticket", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({
      departmentId: "dept-1",
      manager: { email: "manager@example.com" },
    } as any);
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([
      { email: "admin1@example.com" } as any,
      { email: "admin2@example.com" } as any,
    ]);

    await NotificationService.notifyPriorityTicket(makeTicket({ priority: TicketPriority.urgent }));

    expect(EmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.arrayContaining(["admin1@example.com", "admin2@example.com", "manager@example.com"]),
      }),
    );
  });

  it("deduplicates recipients when the manager is also an admin", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({
      departmentId: "dept-1",
      manager: { email: "admin1@example.com" },
    } as any);
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([
      { email: "admin1@example.com" } as any,
    ]);

    await NotificationService.notifyPriorityTicket(makeTicket({ priority: TicketPriority.high }));

    const call = vi.mocked(EmailService.send).mock.calls[0]![0];
    expect(call.to).toEqual(["admin1@example.com"]);
  });

  it("skips sending when there are no recipients", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: "dept-1", manager: null } as any);
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([]);

    await NotificationService.notifyPriorityTicket(makeTicket({ priority: TicketPriority.high }));

    expect(EmailService.send).not.toHaveBeenCalled();
  });
});

describe("sendDepartmentReminders", () => {
  it("skips a department with no open or review tickets", async () => {
    vi.mocked(DepartmentRepository.findAll).mockResolvedValue([{ departmentId: "dept-1" } as any]);
    vi.mocked(TicketRepository.findByDepartmentStatuses).mockResolvedValue([]);

    await NotificationService.sendDepartmentReminders();

    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("skips a department with tickets but no admin recipients", async () => {
    vi.mocked(DepartmentRepository.findAll).mockResolvedValue([
      { departmentId: "dept-1", manager: null } as any,
    ]);
    vi.mocked(TicketRepository.findByDepartmentStatuses).mockResolvedValue([makeTicket()]);
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([]);

    await NotificationService.sendDepartmentReminders();

    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("emails recipients with open/review counts for a department that has both", async () => {
    vi.mocked(DepartmentRepository.findAll).mockResolvedValue([
      { departmentId: "dept-1", departmentName: "Support", manager: null } as any,
    ]);
    vi.mocked(TicketRepository.findByDepartmentStatuses).mockResolvedValue([
      makeTicket({ status: TicketStatus.open }),
      makeTicket({ status: TicketStatus.review }),
      makeTicket({ status: TicketStatus.open }),
    ]);
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([{ email: "admin@example.com" } as any]);

    await NotificationService.sendDepartmentReminders();

    expect(EmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["admin@example.com"],
        text: expect.stringContaining("Open: 2"),
      }),
    );
  });
});

describe("sendSuperAdminSummary", () => {
  it("skips sending when there are no super_admin recipients", async () => {
    vi.mocked(UserRepository.findByRole).mockResolvedValue([]);

    await NotificationService.sendSuperAdminSummary();

    expect(EmailService.send).not.toHaveBeenCalled();
    expect(TicketRepository.getSummary).not.toHaveBeenCalled();
  });

  it("emails all super_admins the daily summary", async () => {
    vi.mocked(UserRepository.findByRole).mockResolvedValue([
      { email: "super1@example.com", role: roleEnum.superAdmin } as any,
    ]);
    vi.mocked(TicketRepository.getSummary).mockResolvedValue({
      live: 5,
      createdToday: 2,
      closedToday: 1,
      openHighOrUrgent: 3,
    });

    await NotificationService.sendSuperAdminSummary();

    expect(EmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["super1@example.com"], text: expect.stringContaining("Live tickets: 5") }),
    );
  });
});
