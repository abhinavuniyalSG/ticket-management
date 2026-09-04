import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { UsersListPage } from "./UsersListPage";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import { userService } from "../../services/userService";
import { departmentService } from "../../services/departmentService";
import { ApiError } from "../../types/api";
import type { User } from "../../types/user";
import type { Department } from "../../types/department";

vi.mock("../../services/userService", () => ({
  userService: { list: vi.fn(), remove: vi.fn() },
}));
vi.mock("../../services/departmentService", () => ({
  departmentService: { list: vi.fn() },
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockedUserService = vi.mocked(userService);
const mockedDepartmentService = vi.mocked(departmentService);
const mockedToast = vi.mocked(toast);

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: true,
    departmentId: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: makeUser({ id: "actor-1", role: "super_admin" }),
    status: "authenticated",
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    ...overrides,
  };
}

function renderPage(authValue: AuthContextValue = makeAuthValue()) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter>
        <UsersListPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedDepartmentService.list.mockResolvedValue({ message: "ok", departments: [] });
});

describe("UsersListPage", () => {
  it("shows a loading spinner while fetching users", () => {
    mockedUserService.list.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("loads users on mount with the default query", async () => {
    mockedUserService.list.mockResolvedValue({
      message: "ok",
      users: [makeUser({ id: "user-1", firstName: "Jane", lastName: "Doe" })],
    });

    renderPage();

    await screen.findAllByRole("link", { name: "Jane Doe" });
    expect(mockedUserService.list).toHaveBeenCalledWith({
      firstName: undefined,
      role: undefined,
      department: undefined,
    });
  });

  it("shows an empty state when there are no users", async () => {
    mockedUserService.list.mockResolvedValue({ message: "ok", users: [] });

    renderPage();

    expect(await screen.findByText("No users found")).toBeInTheDocument();
  });

  it("shows an error state and retries on click", async () => {
    mockedUserService.list.mockRejectedValueOnce(new ApiError(500, "Server error"));
    mockedUserService.list.mockResolvedValueOnce({ message: "ok", users: [] });

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("No users found")).toBeInTheDocument();
    expect(mockedUserService.list).toHaveBeenCalledTimes(2);
  });

  it("falls back to a generic error message for non-ApiError failures", async () => {
    mockedUserService.list.mockRejectedValue(new Error("boom"));

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load users.");
  });

  it("refetches with the trimmed search text after debouncing", async () => {
    mockedUserService.list.mockResolvedValue({ message: "ok", users: [] });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(mockedUserService.list).toHaveBeenCalledTimes(1));
    await user.type(screen.getByLabelText("Search users"), "Jane");

    await waitFor(
      () =>
        expect(mockedUserService.list).toHaveBeenLastCalledWith({
          firstName: "Jane",
          role: undefined,
          department: undefined,
        }),
      { timeout: 2000 },
    );
  });

  it("refetches when the role filter changes", async () => {
    mockedUserService.list.mockResolvedValue({ message: "ok", users: [] });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(mockedUserService.list).toHaveBeenCalledTimes(1));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by role" }), "admin");

    await waitFor(() =>
      expect(mockedUserService.list).toHaveBeenLastCalledWith({
        firstName: undefined,
        role: "admin",
        department: undefined,
      }),
    );
  });

  it("only shows the department filter to a super admin", async () => {
    mockedUserService.list.mockResolvedValue({ message: "ok", users: [] });
    renderPage(makeAuthValue({ user: makeUser({ id: "actor-1", role: "user" }) }));

    await waitFor(() => expect(mockedUserService.list).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("combobox", { name: "Filter by department" })).not.toBeInTheDocument();
    expect(mockedDepartmentService.list).not.toHaveBeenCalled();
  });

  it("loads departments and filters by department for a super admin", async () => {
    mockedUserService.list.mockResolvedValue({ message: "ok", users: [] });
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [makeDepartment({ departmentName: "Support" })],
    });
    const user = userEvent.setup();
    renderPage();

    const departmentSelect = await screen.findByRole("combobox", { name: "Filter by department" });
    await user.selectOptions(departmentSelect, "Support");

    await waitFor(() =>
      expect(mockedUserService.list).toHaveBeenLastCalledWith({
        firstName: undefined,
        role: undefined,
        department: "Support",
      }),
    );
  });

  it("enables the clear-filters button once a filter is active, and clears everything on click", async () => {
    mockedUserService.list.mockResolvedValue({ message: "ok", users: [] });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(mockedUserService.list).toHaveBeenCalledTimes(1));

    const clearButton = screen.getByRole("button", { name: "Clear filters" });
    expect(clearButton).toBeDisabled();

    await user.type(screen.getByLabelText("Search users"), "Jane");
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by role" }), "admin");

    await waitFor(() => expect(clearButton).toBeEnabled());

    await user.click(clearButton);

    expect(screen.getByLabelText("Search users")).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Filter by role" })).toHaveValue("");
    await waitFor(() =>
      expect(mockedUserService.list).toHaveBeenLastCalledWith({
        firstName: undefined,
        role: undefined,
        department: undefined,
      }),
    );
    expect(clearButton).toBeDisabled();
  });

  it("hides the delete action for a row the actor is not permitted to delete", async () => {
    mockedUserService.list.mockResolvedValue({
      message: "ok",
      users: [makeUser({ id: "user-2", firstName: "Other", lastName: "Person" })],
    });
    renderPage(makeAuthValue({ user: makeUser({ id: "actor-1", role: "user" }) }));

    await screen.findAllByRole("link", { name: "Other Person" });
    expect(screen.queryAllByRole("button", { name: "Delete Other Person" })).toHaveLength(0);
  });

  it("deletes a user after confirming and removes it from the list", async () => {
    const target = makeUser({ id: "user-2", firstName: "Other", lastName: "Person" });
    mockedUserService.list.mockResolvedValue({ message: "ok", users: [target] });
    mockedUserService.remove.mockResolvedValue({ message: "User deleted." });
    const user = userEvent.setup();
    renderPage();

    const table = await screen.findByRole("table");
    await user.click(within(table).getByRole("button", { name: "Delete Other Person" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Other Person");

    await user.click(within(dialog).getByRole("button", { name: "Delete user" }));

    await waitFor(() => expect(mockedUserService.remove).toHaveBeenCalledWith("user-2"));
    expect(mockedToast.success).toHaveBeenCalledWith("User deleted.");
    expect(screen.queryAllByRole("link", { name: "Other Person" })).toHaveLength(0);
  });

  it("shows an error toast and keeps the user listed when deletion fails", async () => {
    const target = makeUser({ id: "user-2", firstName: "Other", lastName: "Person" });
    mockedUserService.list.mockResolvedValue({ message: "ok", users: [target] });
    mockedUserService.remove.mockRejectedValue(new ApiError(403, "Not allowed"));
    const user = userEvent.setup();
    renderPage();

    const table = await screen.findByRole("table");
    await user.click(within(table).getByRole("button", { name: "Delete Other Person" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete user" }));

    await waitFor(() => expect(mockedToast.error).toHaveBeenCalledWith("Not allowed"));
    expect(screen.getAllByRole("link", { name: "Other Person" }).length).toBeGreaterThan(0);
  });
});
