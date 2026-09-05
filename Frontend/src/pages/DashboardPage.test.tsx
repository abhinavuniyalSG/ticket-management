import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { AuthContext } from "../app/providers/AuthContext";
import type { AuthContextValue } from "../app/providers/AuthContext";
import { dashboardService } from "../services/dashboardService";
import { departmentService } from "../services/departmentService";
import { ApiError } from "../types/api";
import type { DashboardBreakdown, DashboardOverview } from "../types/dashboard";
import type { Department } from "../types/department";
import type { SafeUser } from "../types/user";

vi.mock("../services/dashboardService");
vi.mock("../services/departmentService");

beforeEach(() => {
  vi.clearAllMocks();
  // Both admin and super_admin now fetch the department list; give every test
  // a harmless default so only the tests that care need to override it.
  vi.mocked(departmentService.list).mockResolvedValue({ message: "ok", departments: [] });
});

function makeBreakdown(overrides: Partial<DashboardBreakdown> = {}): DashboardBreakdown {
  return {
    message: "ok",
    priorityDistribution: [{ priority: "high", count: 2 }],
    ticketsOverTime: [{ date: "2026-01-01", created: 2, closed: 1 }],
    ...overrides,
  };
}

// Every count is distinct so tests can pin a value to its specific tile/entry
// without an accidental duplicate elsewhere matching the query too.
function makeOverview(overrides: Partial<DashboardOverview> = {}): DashboardOverview {
  return {
    message: "ok",
    departmentId: null,
    period: "day",
    totalTickets: 33,
    openTickets: 3,
    assignedTickets: 4,
    inProgressTickets: 5,
    reviewedTickets: 6,
    completedTickets: 7,
    closedTickets: 8,
    ...overrides,
  };
}

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeUser(overrides: Partial<SafeUser> = {}): SafeUser {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "admin",
    email: "jane@example.com",
    isVerified: true,
    departmentId: "dept-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: makeUser(),
    status: "authenticated",
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    ...overrides,
  };
}

function renderDashboard(authOverrides: Partial<AuthContextValue> = {}) {
  const authValue = makeAuthValue(authOverrides);
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { authValue };
}

function mockBothCalls() {
  vi.mocked(dashboardService.get).mockResolvedValue(makeBreakdown());
  vi.mocked(dashboardService.getOverview).mockResolvedValue(makeOverview());
}

describe("DashboardPage", () => {
  it("shows a spinner while metrics are loading", () => {
    vi.mocked(dashboardService.get).mockReturnValue(new Promise(() => {}));
    vi.mocked(dashboardService.getOverview).mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an error state, without a retry button, when either call fails", async () => {
    vi.mocked(dashboardService.get).mockRejectedValue(new ApiError(500, "Unable to load dashboard data."));
    vi.mocked(dashboardService.getOverview).mockResolvedValue(makeOverview());
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load dashboard data.");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("always calls both /dashboard and /dashboard/overview, for any role", async () => {
    mockBothCalls();
    renderDashboard({ user: makeUser({ role: "admin" }) });

    expect(await screen.findByText("Total tickets")).toBeInTheDocument();
    expect(screen.getByText("Your department's ticket overview.")).toBeInTheDocument();
    expect(dashboardService.getOverview).toHaveBeenCalledWith(undefined, "day");
    expect(dashboardService.get).toHaveBeenCalledWith(undefined, "day");
  });

  it("shows the system-wide description for a super_admin", async () => {
    mockBothCalls();
    renderDashboard({ user: makeUser({ role: "super_admin" }) });

    expect(await screen.findByText("System-wide ticket overview.")).toBeInTheDocument();
  });

  it("renders KPI tiles from the overview call, not the scoped dashboard call", async () => {
    mockBothCalls();
    renderDashboard({ user: makeUser({ role: "admin" }) });

    expect(await screen.findByText("Total tickets")).toBeInTheDocument();
    expect(screen.getByText("33")).toBeInTheDocument();
  });

  it("builds status distribution from the overview call's per-status counts", async () => {
    mockBothCalls();
    renderDashboard({ user: makeUser({ role: "admin" }) });

    await screen.findByText("Total tickets");

    const section = screen.getByText("Status distribution").closest("div") as HTMLElement;
    expect(within(section).getByText("Open")).toBeInTheDocument();
    expect(within(section).getByText("3")).toBeInTheDocument();
    expect(within(section).getByText("Closed")).toBeInTheDocument();
    expect(within(section).getByText("8")).toBeInTheDocument();
  });

  it("takes priorityDistribution and ticketsOverTime from the scoped dashboard call", async () => {
    mockBothCalls();
    renderDashboard({ user: makeUser({ role: "admin" }) });

    await screen.findByText("Total tickets");

    const section = screen.getByText("Priority distribution").closest("div") as HTMLElement;
    expect(within(section).getByText("High")).toBeInTheDocument();
    expect(within(section).getByText("2")).toBeInTheDocument();
  });

  it("shows a department picker scoped to the departments an admin manages", async () => {
    mockBothCalls();
    vi.mocked(departmentService.list).mockResolvedValue({
      message: "ok",
      departments: [
        makeDepartment({ departmentId: "dept-1", departmentName: "Support", managedBy: "user-1" }),
        makeDepartment({ departmentId: "dept-2", departmentName: "Sales", managedBy: "someone-else" }),
      ],
    });

    renderDashboard({ user: makeUser({ role: "admin", id: "user-1" }) });

    const picker = await screen.findByLabelText("Filter dashboard by department");
    expect(within(picker).getByText("Support")).toBeInTheDocument();
    expect(within(picker).queryByText("Sales")).not.toBeInTheDocument();
  });

  it("shows every department in a super_admin's picker", async () => {
    mockBothCalls();
    vi.mocked(departmentService.list).mockResolvedValue({
      message: "ok",
      departments: [
        makeDepartment({ departmentId: "dept-1", departmentName: "Support", managedBy: "someone-else" }),
        makeDepartment({ departmentId: "dept-2", departmentName: "Sales", managedBy: null }),
      ],
    });

    renderDashboard({ user: makeUser({ role: "super_admin" }) });

    const picker = await screen.findByLabelText("Filter dashboard by department");
    expect(within(picker).getByText("Support")).toBeInTheDocument();
    expect(within(picker).getByText("Sales")).toBeInTheDocument();
  });

  it("passes the picked department to both calls", async () => {
    const user = userEvent.setup();
    mockBothCalls();
    vi.mocked(departmentService.list).mockResolvedValue({
      message: "ok",
      departments: [makeDepartment({ departmentId: "dept-1", managedBy: "user-1" })],
    });

    renderDashboard({ user: makeUser({ role: "admin", id: "user-1" }) });
    await screen.findByText("Total tickets");
    vi.mocked(dashboardService.get).mockClear();
    vi.mocked(dashboardService.getOverview).mockClear();

    await user.selectOptions(screen.getByLabelText("Filter dashboard by department"), "dept-1");

    await waitFor(() => {
      expect(dashboardService.get).toHaveBeenCalledWith("dept-1", "day");
      expect(dashboardService.getOverview).toHaveBeenCalledWith("dept-1", "day");
    });
  });

  it("reloads both calls with the selected period", async () => {
    const user = userEvent.setup();
    mockBothCalls();
    renderDashboard({ user: makeUser({ role: "admin" }) });

    await screen.findByText("Total tickets");
    vi.mocked(dashboardService.get).mockClear();
    vi.mocked(dashboardService.getOverview).mockClear();

    await user.click(screen.getByRole("button", { name: "Month" }));

    await waitFor(() => {
      expect(dashboardService.get).toHaveBeenCalledWith(undefined, "month");
      expect(dashboardService.getOverview).toHaveBeenCalledWith(undefined, "month");
    });
  });

  it("does not filter by department for a role that can't (defensive; the route already 403s)", async () => {
    mockBothCalls();
    renderDashboard({ user: makeUser({ role: "user" }) });

    await screen.findByText("Total tickets");

    expect(screen.queryByLabelText("Filter dashboard by department")).not.toBeInTheDocument();
    expect(departmentService.list).not.toHaveBeenCalled();
    expect(dashboardService.get).toHaveBeenCalledWith(undefined, "day");
    expect(dashboardService.getOverview).toHaveBeenCalledWith(undefined, "day");
  });
});
