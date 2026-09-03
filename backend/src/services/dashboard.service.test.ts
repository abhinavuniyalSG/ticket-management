import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardService } from "./dashboard.service.js";
import { DashboardRepository } from "../database/repositry/dashboard.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { roleEnum } from "../types/user.js";
import type { RequesterInfo } from "./ticket.service.js";

vi.mock("../database/repositry/dashboard.repository.js", () => ({
  DashboardPeriod: { week: "week", month: "month", year: "year" },
  DashboardRepository: {
    getStatusCounts: vi.fn(),
    getPriorityCounts: vi.fn(),
    getAverageCompletionTimeHours: vi.fn(),
    getTicketsOverTime: vi.fn(),
    getDepartmentBreakdown: vi.fn(),
  },
}));

vi.mock("../database/repositry/department.repository.js", () => ({
  DepartmentRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("../database/repositry/user.repository.js", () => ({
  UserRepository: {
    findById: vi.fn(),
  },
}));

const statusCounts = {
  total: 10,
  open: 2,
  assigned: 2,
  inProgress: 2,
  review: 2,
  completed: 1,
  closed: 1,
};

const priorityCounts = { low: 4, medium: 3, high: 2, urgent: 1 };

function requester(overrides: Partial<RequesterInfo> = {}): RequesterInfo {
  return { id: "requester-1", email: "req@example.com", role: roleEnum.superAdmin, ...overrides };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(DashboardRepository.getStatusCounts).mockResolvedValue(statusCounts);
  vi.mocked(DashboardRepository.getPriorityCounts).mockResolvedValue(priorityCounts);
  vi.mocked(DashboardRepository.getAverageCompletionTimeHours).mockResolvedValue(12.5);
  vi.mocked(DashboardRepository.getTicketsOverTime).mockResolvedValue([]);
});

describe("getDashboard scoping", () => {
  it("blocks an admin from filtering by an explicit department", async () => {
    await expect(
      DashboardService.getDashboard(requester({ role: roleEnum.admin }), { departmentId: "dept-1" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks an admin with no department assigned", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue({ id: "admin-1", departmentId: null } as any);

    await expect(
      DashboardService.getDashboard(requester({ id: "admin-1", role: roleEnum.admin }), {}),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("scopes an admin's dashboard to their own department", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue({ id: "admin-1", departmentId: "dept-1" } as any);

    await DashboardService.getDashboard(requester({ id: "admin-1", role: roleEnum.admin }), {});

    expect(DashboardRepository.getStatusCounts).toHaveBeenCalledWith("dept-1");
  });

  it("lets a super_admin view the system-wide dashboard with no department filter", async () => {
    const result = await DashboardService.getDashboard(requester(), {});

    expect(DashboardRepository.getStatusCounts).toHaveBeenCalledWith(undefined);
    expect(result.totalTickets).toBe(10);
  });

  it("throws 404 when a super_admin filters by a department that doesn't exist", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(null);

    await expect(
      DashboardService.getDashboard(requester(), { departmentId: "missing" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lets a super_admin filter by a valid department", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue({ departmentId: "dept-1" } as any);

    await DashboardService.getDashboard(requester(), { departmentId: "dept-1" });

    expect(DashboardRepository.getStatusCounts).toHaveBeenCalledWith("dept-1");
  });

  it("blocks a plain user from viewing the dashboard", async () => {
    await expect(DashboardService.getDashboard(requester({ role: roleEnum.user }), {})).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("builds the status and priority distributions from the raw counts", async () => {
    const result = await DashboardService.getDashboard(requester(), {});

    expect(result.statusDistribution).toContainEqual({ status: "open", count: 2 });
    expect(result.priorityDistribution).toContainEqual({ priority: "urgent", count: 1 });
    expect(result.productivity.averageCompletionTimeHours).toBe(12.5);
  });
});

describe("getDashboardOverview", () => {
  it("blocks anyone but super_admin", async () => {
    await expect(
      DashboardService.getDashboardOverview(requester({ role: roleEnum.admin })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("returns system-wide metrics plus a per-department breakdown", async () => {
    vi.mocked(DashboardRepository.getDepartmentBreakdown).mockResolvedValue([
      {
        departmentId: "dept-1",
        departmentName: "Support",
        statusCounts,
        priorityCounts,
        averageCompletionTimeHours: 5,
      },
    ]);

    const result = await DashboardService.getDashboardOverview(requester());

    expect(result.systemWide.totalTickets).toBe(10);
    expect(result.departments).toHaveLength(1);
    expect(result.departments[0]!.departmentName).toBe("Support");
    expect(result.departments[0]!.productivity.averageCompletionTimeHours).toBe(5);
  });
});
