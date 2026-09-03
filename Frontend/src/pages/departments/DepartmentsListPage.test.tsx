import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { DepartmentsListPage } from "./DepartmentsListPage";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";

vi.mock("../../services/departmentService", () => ({
  departmentService: { list: vi.fn(), create: vi.fn(), remove: vi.fn() },
}));
vi.mock("../../services/userService", () => ({
  userService: { list: vi.fn() },
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockedDepartmentService = vi.mocked(departmentService);
const mockedUserService = vi.mocked(userService);
const mockedToast = vi.mocked(toast);

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

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "admin",
    email: "jane@example.com",
    isVerified: true,
    departmentId: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DepartmentsListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUserService.list.mockResolvedValue({ message: "ok", users: [] });
});

describe("DepartmentsListPage", () => {
  it("shows a loading spinner while fetching departments", () => {
    mockedDepartmentService.list.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("loads departments on mount with the default query", async () => {
    mockedDepartmentService.list.mockResolvedValue({
      message: "ok",
      departments: [makeDepartment({ departmentName: "Support" })],
    });

    renderPage();

    await screen.findAllByRole("link", { name: "Support" });
    expect(mockedDepartmentService.list).toHaveBeenCalledWith({ departmentName: undefined });
  });

  it("shows an empty state when there are no departments", async () => {
    mockedDepartmentService.list.mockResolvedValue({ message: "ok", departments: [] });
    renderPage();

    expect(await screen.findByText("No departments found")).toBeInTheDocument();
  });

  it("shows an error state and retries on click", async () => {
    mockedDepartmentService.list.mockRejectedValueOnce(new ApiError(500, "Server error"));
    mockedDepartmentService.list.mockResolvedValueOnce({ message: "ok", departments: [] });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("No departments found")).toBeInTheDocument();
    expect(mockedDepartmentService.list).toHaveBeenCalledTimes(2);
  });

  it("refetches with the trimmed search text after debouncing", async () => {
    mockedDepartmentService.list.mockResolvedValue({ message: "ok", departments: [] });
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(mockedDepartmentService.list).toHaveBeenCalledTimes(1));
    await user.type(screen.getByLabelText("Search departments"), "Sales");

    await waitFor(
      () => expect(mockedDepartmentService.list).toHaveBeenLastCalledWith({ departmentName: "Sales" }),
      { timeout: 2000 },
    );
  });

  it("only offers admins and super admins as manager options", async () => {
    mockedDepartmentService.list.mockResolvedValue({ message: "ok", departments: [] });
    mockedUserService.list.mockResolvedValue({
      message: "ok",
      users: [
        makeUser({ id: "u1", firstName: "Ada", lastName: "Admin", role: "admin" }),
        makeUser({ id: "u2", firstName: "Sue", lastName: "Super", role: "super_admin" }),
        makeUser({ id: "u3", firstName: "Ray", lastName: "Regular", role: "user" }),
      ],
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "New department" }));

    const managerSelect = await screen.findByLabelText("Manager");
    await waitFor(() => expect(within(managerSelect).getAllByRole("option")).toHaveLength(3));
    expect(within(managerSelect).getByRole("option", { name: "Ada Admin" })).toBeInTheDocument();
    expect(within(managerSelect).getByRole("option", { name: "Sue Super" })).toBeInTheDocument();
    expect(within(managerSelect).queryByRole("option", { name: "Ray Regular" })).not.toBeInTheDocument();
  });

  it("validates the create form before submitting", async () => {
    mockedDepartmentService.list.mockResolvedValue({ message: "ok", departments: [] });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "New department" }));
    // Leave the email blank rather than typing an invalid value: an
    // <input type="email"> blocks form submission via native constraint
    // validation before our onSubmit handler ever runs, so an empty (but
    // non-required) field is the only reliable way to exercise the app's
    // own "invalid email" branch through a real submit.
    await user.type(screen.getByLabelText(/Department name/), "S");
    await user.click(screen.getByRole("button", { name: "Create department" }));

    expect(await screen.findByText("Must be at least 2 characters")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockedDepartmentService.create).not.toHaveBeenCalled();
  });

  it("creates a department, refreshes the list, and closes the form", async () => {
    mockedDepartmentService.list.mockResolvedValue({ message: "ok", departments: [] });
    mockedDepartmentService.create.mockResolvedValue({
      message: "Department created.",
      department: makeDepartment(),
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "New department" }));
    await user.type(screen.getByLabelText(/Department name/), "Sales");
    await user.type(screen.getByLabelText(/Department email/), "SALES@Example.com");
    await user.click(screen.getByRole("button", { name: "Create department" }));

    await waitFor(() =>
      expect(mockedDepartmentService.create).toHaveBeenCalledWith({
        departmentName: "Sales",
        departmentEmail: "sales@example.com",
        managedBy: undefined,
      }),
    );
    expect(mockedToast.success).toHaveBeenCalledWith("Department created.");
    expect(mockedDepartmentService.list).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("button", { name: "Create department" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New department" })).toBeInTheDocument();
  });

  it("shows an error toast and keeps the form open when creation fails", async () => {
    mockedDepartmentService.list.mockResolvedValue({ message: "ok", departments: [] });
    mockedDepartmentService.create.mockRejectedValue(new ApiError(409, "Name already in use"));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "New department" }));
    await user.type(screen.getByLabelText(/Department name/), "Sales");
    await user.type(screen.getByLabelText(/Department email/), "sales@example.com");
    await user.click(screen.getByRole("button", { name: "Create department" }));

    await waitFor(() => expect(mockedToast.error).toHaveBeenCalledWith("Name already in use"));
    expect(screen.getByRole("button", { name: "Create department" })).toBeInTheDocument();
  });

  it("deletes a department after confirming and removes it from the list", async () => {
    const target = makeDepartment({ departmentId: "dept-2", departmentName: "Marketing" });
    mockedDepartmentService.list.mockResolvedValue({ message: "ok", departments: [target] });
    mockedDepartmentService.remove.mockResolvedValue({ message: "Department deleted." });
    const user = userEvent.setup();
    renderPage();

    const table = await screen.findByRole("table");
    await user.click(within(table).getByRole("button", { name: "Delete Marketing" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Marketing");

    await user.click(within(dialog).getByRole("button", { name: "Delete department" }));

    await waitFor(() => expect(mockedDepartmentService.remove).toHaveBeenCalledWith("dept-2"));
    expect(mockedToast.success).toHaveBeenCalledWith("Department deleted.");
    expect(screen.queryAllByRole("link", { name: "Marketing" })).toHaveLength(0);
  });
});
