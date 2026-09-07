import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DashboardService,
  DashboardOverviewPeriod,
} from "../../services/dashboard.service.js";
import {
  DashboardRepository,
  TicketTrendPeriod,
} from "../../database/repositry/dashboard.repository.js";
import { DepartmentRepository } from "../../database/repositry/department.repository.js";
import { roleEnum } from "../../types/user.js";
import type { RequesterInfo } from "../../services/ticket.service.js";

vi.mock("../../database/repositry/dashboard.repository.js", () => ({
  TicketTrendPeriod: { day: "day", week: "week", month: "month", year: "year" },
  DashboardRepository: {
    countTicketsByStatus: vi.fn(),
    countTicketsByPriority: vi.fn(),
    getTicketTrend: vi.fn(),
  },
}));

vi.mock("../../database/repositry/department.repository.js", () => ({
  DepartmentRepository: {
    findById: vi.fn(),
    findByManager: vi.fn(),
  },
}));

const statusCounts = {
  total: 10,
  open: 2,
  assigned: 2,
  inProgress: 2,
  reviewed: 2,
  completed: 1,
  closed: 1,
};

const priorityCounts = { low: 4, medium: 3, high: 2, urgent: 1 };

function requester(overrides: Partial<RequesterInfo> = {}): RequesterInfo {
  return {
    id: "requester-1",
    email: "req@example.com",
    role: roleEnum.superAdmin,
    ...overrides,
  };
}

function department(departmentId: string) {
  return { departmentId } as any;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(DashboardRepository.countTicketsByStatus).mockResolvedValue(
    statusCounts,
  );
  vi.mocked(DashboardRepository.countTicketsByPriority).mockResolvedValue(
    priorityCounts,
  );
  vi.mocked(DashboardRepository.getTicketTrend).mockResolvedValue([]);
});

describe("getDashboard: access and department scoping", () => {
  it("blocks a plain user", async () => {
    await expect(
      DashboardService.getDashboard(requester({ role: roleEnum.user }), {}),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks an admin who manages no department", async () => {
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([]);

    await expect(
      DashboardService.getDashboard(
        requester({ id: "admin-1", role: roleEnum.admin }),
        {},
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("defaults an admin to the first department the db returns for them", async () => {
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      department("dept-1"),
      department("dept-2"),
    ]);

    await DashboardService.getDashboard(
      requester({ id: "admin-1", role: roleEnum.admin }),
      {},
    );

    expect(DashboardRepository.countTicketsByPriority).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: "dept-1" }),
    );
  });

  it("lets an admin query a department they manage", async () => {
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      department("dept-1"),
      department("dept-2"),
    ]);

    await DashboardService.getDashboard(
      requester({ id: "admin-1", role: roleEnum.admin }),
      { departmentId: "dept-2" },
    );

    expect(DashboardRepository.countTicketsByPriority).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: "dept-2" }),
    );
  });

  it("blocks an admin from querying a department they don't manage", async () => {
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      department("dept-1"),
    ]);

    await expect(
      DashboardService.getDashboard(
        requester({ id: "admin-1", role: roleEnum.admin }),
        { departmentId: "dept-99" },
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("defaults a super_admin to all departments", async () => {
    await DashboardService.getDashboard(requester(), {});

    expect(DashboardRepository.countTicketsByPriority).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: undefined }),
    );
  });

  it("lets a super_admin filter by a valid department", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(
      department("dept-1"),
    );

    await DashboardService.getDashboard(requester(), {
      departmentId: "dept-1",
    });

    expect(DashboardRepository.countTicketsByPriority).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: "dept-1" }),
    );
  });

  it("throws 404 when a super_admin filters by a department that doesn't exist", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(null);

    await expect(
      DashboardService.getDashboard(requester(), { departmentId: "missing" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("getDashboard: response contents", () => {
  it("returns only priorityDistribution and ticketsOverTime - no departmentId/period/counts/statusDistribution, since those live on the overview response", async () => {
    const result = await DashboardService.getDashboard(requester(), {});

    expect(result).toEqual({
      message: "Dashboard statistics fetched successfully",
      priorityDistribution: expect.any(Array),
      ticketsOverTime: expect.any(Array),
    });
  });

  it("builds the priority distribution from the raw counts", async () => {
    const result = await DashboardService.getDashboard(requester(), {});

    expect(result.priorityDistribution).toContainEqual({
      priority: "urgent",
      count: 1,
    });
  });

  it("never queries status counts - the frontend derives statusDistribution from the overview call instead", async () => {
    await DashboardService.getDashboard(requester(), {
      period: TicketTrendPeriod.year,
    });

    expect(DashboardRepository.countTicketsByStatus).not.toHaveBeenCalled();
  });

  it("defaults the trend period to 'day'", async () => {
    await DashboardService.getDashboard(requester(), {});

    expect(DashboardRepository.getTicketTrend).toHaveBeenCalledWith(
      undefined,
      "day",
    );
  });

  it("passes an explicit period through to the trend query", async () => {
    await DashboardService.getDashboard(requester(), {
      period: TicketTrendPeriod.month,
    });

    expect(DashboardRepository.getTicketTrend).toHaveBeenCalledWith(
      undefined,
      "month",
    );
  });
});

describe("getDashboard: priorityDistribution's period window", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T15:30:00.000Z")); // a Friday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to 'day': priorities of tickets created today (UTC)", async () => {
    await DashboardService.getDashboard(requester(), {});

    expect(DashboardRepository.countTicketsByPriority).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: new Date("2026-09-04T00:00:00.000Z"),
      createdTo: undefined,
    });
  });

  it("'week': from Monday 00:00 UTC of the current week", async () => {
    await DashboardService.getDashboard(requester(), {
      period: TicketTrendPeriod.week,
    });

    expect(DashboardRepository.countTicketsByPriority).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: new Date("2026-08-31T00:00:00.000Z"), // Monday
      createdTo: undefined,
    });
  });

  it("'month': from the 1st of the current month", async () => {
    await DashboardService.getDashboard(requester(), {
      period: TicketTrendPeriod.month,
    });

    expect(DashboardRepository.countTicketsByPriority).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: new Date("2026-09-01T00:00:00.000Z"),
      createdTo: undefined,
    });
  });

  it("'year': from January 1st of the current year", async () => {
    await DashboardService.getDashboard(requester(), {
      period: TicketTrendPeriod.year,
    });

    expect(DashboardRepository.countTicketsByPriority).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: new Date("2026-01-01T00:00:00.000Z"),
      createdTo: undefined,
    });
  });
});

describe("getDashboardOverview: access and department scoping", () => {
  it("blocks a plain user", async () => {
    await expect(
      DashboardService.getDashboardOverview(
        requester({ role: roleEnum.user }),
        {},
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks an admin who manages no department", async () => {
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([]);

    await expect(
      DashboardService.getDashboardOverview(
        requester({ id: "admin-1", role: roleEnum.admin }),
        {},
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("defaults an admin to the first department the db returns for them", async () => {
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      department("dept-1"),
      department("dept-2"),
    ]);

    const result = await DashboardService.getDashboardOverview(
      requester({ id: "admin-1", role: roleEnum.admin }),
      {},
    );

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: "dept-1" }),
    );
    expect(result.departmentId).toBe("dept-1");
  });

  it("lets an admin query a department they manage", async () => {
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      department("dept-1"),
      department("dept-2"),
    ]);

    await DashboardService.getDashboardOverview(
      requester({ id: "admin-1", role: roleEnum.admin }),
      { departmentId: "dept-2" },
    );

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: "dept-2" }),
    );
  });

  it("blocks an admin from querying a department they don't manage", async () => {
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      department("dept-1"),
    ]);

    await expect(
      DashboardService.getDashboardOverview(
        requester({ id: "admin-1", role: roleEnum.admin }),
        { departmentId: "dept-99" },
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("defaults a super_admin to all departments", async () => {
    const result = await DashboardService.getDashboardOverview(requester(), {});

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: undefined }),
    );
    expect(result.departmentId).toBeNull();
  });

  it("lets a super_admin query any existing department", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(
      department("dept-1"),
    );

    const result = await DashboardService.getDashboardOverview(requester(), {
      departmentId: "dept-1",
    });

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: "dept-1" }),
    );
    expect(result.departmentId).toBe("dept-1");
  });

  it("throws 404 when a super_admin queries a department that doesn't exist", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(null);

    await expect(
      DashboardService.getDashboardOverview(requester(), {
        departmentId: "missing",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns only the count fields, with no distribution or trend data", async () => {
    const result = await DashboardService.getDashboardOverview(requester(), {});

    expect(result).toEqual({
      message: "Dashboard overview fetched successfully",
      departmentId: null,
      period: DashboardOverviewPeriod.day,
      totalTickets: 10,
      openTickets: 2,
      assignedTickets: 2,
      inProgressTickets: 2,
      reviewedTickets: 2,
      completedTickets: 1,
      closedTickets: 1,
    });
  });
});

describe("getDashboardOverview: period date ranges", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T15:30:00.000Z")); // a Friday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to 'day': everything created today (UTC)", async () => {
    await DashboardService.getDashboardOverview(requester(), {});

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: new Date("2026-09-04T00:00:00.000Z"),
      createdTo: undefined,
    });
  });

  it("'week': from Monday 00:00 UTC of the current week", async () => {
    await DashboardService.getDashboardOverview(requester(), {
      period: DashboardOverviewPeriod.week,
    });

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: new Date("2026-08-31T00:00:00.000Z"), // Monday
      createdTo: undefined,
    });
  });

  it("'month': from the 1st of the current month", async () => {
    await DashboardService.getDashboardOverview(requester(), {
      period: DashboardOverviewPeriod.month,
    });

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: new Date("2026-09-01T00:00:00.000Z"),
      createdTo: undefined,
    });
  });

  it("'year': from January 1st of the current year", async () => {
    await DashboardService.getDashboardOverview(requester(), {
      period: DashboardOverviewPeriod.year,
    });

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: new Date("2026-01-01T00:00:00.000Z"),
      createdTo: undefined,
    });
  });

  it("'all': no date filter at all", async () => {
    await DashboardService.getDashboardOverview(requester(), {
      period: DashboardOverviewPeriod.all,
    });

    expect(DashboardRepository.countTicketsByStatus).toHaveBeenCalledWith({
      departmentId: undefined,
      createdFrom: undefined,
      createdTo: undefined,
    });
  });
});
