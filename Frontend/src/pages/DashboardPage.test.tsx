import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { AuthContext } from "../app/providers/AuthContext";
import type { AuthContextValue } from "../app/providers/AuthContext";
import { dashboardService } from "../services/dashboardService";
import { departmentService } from "../services/departmentService";
import { ApiError } from "../types/api";
import type { DashboardMetrics, DashboardOverview } from "../types/dashboard";
import type { Department } from "../types/department";
import type { SafeUser } from "../types/user";

vi.mock("../services/dashboardService");
vi.mock("../services/departmentService");

beforeEach(() => {
  vi.clearAllMocks();
});

function makeMetrics(overrides: Partial<DashboardMetrics> = {}): DashboardMetrics {
  return {
    message: "ok",
    totalTickets: 10,
    openTickets: 3,
    assignedTickets: 2,
    inProgressTickets: 2,
    reviewedTickets: 1,
    completedTickets: 1,
    closedTickets: 1,
    statusDistribution: [{ status: "open", count: 3 }],
    priorityDistribution: [{ priority: "high", count: 2 }],
    ticketsOverTime: [{ date: "2026-01-01", created: 2, closed: 1 }],
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

function makeOverview(overrides: Partial<DashboardOverview> = {}): DashboardOverview {
  const { message: _message, ...metrics } = makeMetrics();
  return {
    message: "ok",
    systemWide: metrics,
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

describe("DashboardPage", () => {
  it("shows a spinner while metrics are loading", () => {
    vi.mocked(dashboardService.get).mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an error state, without a retry button, when loading fails", async () => {
    vi.mocked(dashboardService.get).mockRejectedValue(new ApiError(500, "Unable to load dashboard data."));
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load dashboard data.");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("renders metrics for a non-super-admin user without a department filter", async () => {
    vi.mocked(dashboardService.get).mockResolvedValue(makeMetrics());
    renderDashboard({ user: makeUser({ role: "admin" }) });

    expect(await screen.findByText("Total tickets")).toBeInTheDocument();
    expect(screen.getByText("Your department's ticket overview.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Filter dashboard by department")).not.toBeInTheDocument();
    expect(dashboardService.get).toHaveBeenCalledWith(undefined, "week");
    expect(departmentService.list).not.toHaveBeenCalled();
  });

  it("calls the overview endpoint for a super admin with no department filter", async () => {
    vi.mocked(dashboardService.getOverview).mockResolvedValue(makeOverview());
    vi.mocked(departmentService.list).mockResolvedValue({
      message: "ok",
      departments: [makeDepartment()],
    });

    renderDashboard({ user: makeUser({ role: "super_admin" }) });

    expect(await screen.findByText("System-wide ticket overview.")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter dashboard by department")).toBeInTheDocument();
    expect(await screen.findByText("Total tickets")).toBeInTheDocument();
    expect(dashboardService.getOverview).toHaveBeenCalledWith("week");
    expect(dashboardService.get).not.toHaveBeenCalled();
  });

  it("reloads metrics with the selected period", async () => {
    const user = userEvent.setup();
    vi.mocked(dashboardService.get).mockResolvedValue(makeMetrics());
    renderDashboard({ user: makeUser({ role: "admin" }) });

    await screen.findByText("Total tickets");
    vi.mocked(dashboardService.get).mockClear();

    await user.click(screen.getByRole("button", { name: "Month" }));

    await waitFor(() => {
      expect(dashboardService.get).toHaveBeenCalledWith(undefined, "month");
    });
  });

  it("switches from the overview endpoint to the scoped endpoint when a super admin picks a department", async () => {
    const user = userEvent.setup();
    vi.mocked(dashboardService.getOverview).mockResolvedValue(makeOverview());
    vi.mocked(dashboardService.get).mockResolvedValue(makeMetrics());
    vi.mocked(departmentService.list).mockResolvedValue({
      message: "ok",
      departments: [makeDepartment()],
    });

    renderDashboard({ user: makeUser({ role: "super_admin" }) });

    await screen.findByText("Total tickets");
    expect(dashboardService.get).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText("Filter dashboard by department"), "dept-1");

    await waitFor(() => {
      expect(dashboardService.get).toHaveBeenCalledWith("dept-1", "week");
    });
  });
});
