import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import toast from "react-hot-toast";
import { DepartmentDetailsPage } from "./DepartmentDetailsPage";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";

vi.mock("../../services/departmentService", () => ({
  departmentService: { getById: vi.fn(), update: vi.fn(), remove: vi.fn() },
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

function renderPage(id = "dept-1") {
  return render(
    <MemoryRouter initialEntries={[`/departments/${id}`]}>
      <Routes>
        <Route path="/departments/:id" element={<DepartmentDetailsPage />} />
        <Route path="/departments" element={<p>Departments list page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUserService.list.mockResolvedValue({ message: "ok", users: [] });
});

describe("DepartmentDetailsPage", () => {
  it("shows a loading spinner while fetching the department", () => {
    mockedDepartmentService.getById.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("navigates back to the departments list via the back link", async () => {
    mockedDepartmentService.getById.mockResolvedValue({ message: "ok", department: makeDepartment() });
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Support" });
    await user.click(screen.getByRole("link", { name: "Back to departments" }));

    expect(await screen.findByText("Departments list page")).toBeInTheDocument();
  });

  it("loads the department and manager list on mount", async () => {
    mockedDepartmentService.getById.mockResolvedValue({ message: "ok", department: makeDepartment() });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Support" })).toBeInTheDocument();
    expect(screen.getByText("support@example.com")).toBeInTheDocument();
    expect(mockedDepartmentService.getById).toHaveBeenCalledWith("dept-1");
    expect(mockedUserService.list).toHaveBeenCalled();
  });

  it("prefills the form with the department's current values", async () => {
    mockedDepartmentService.getById.mockResolvedValue({
      message: "ok",
      department: makeDepartment({ managedBy: "user-1" }),
    });
    mockedUserService.list.mockResolvedValue({
      message: "ok",
      users: [makeUser({ id: "user-1", firstName: "Ada", lastName: "Admin", role: "admin" })],
    });
    renderPage();

    await screen.findByRole("heading", { name: "Support" });
    expect(screen.getByLabelText(/Department name/)).toHaveValue("Support");
    expect(screen.getByLabelText(/Department email/)).toHaveValue("support@example.com");
    expect(screen.getByLabelText("Manager")).toHaveValue("user-1");
  });

  it("shows an error state when the department fails to load", async () => {
    mockedDepartmentService.getById.mockRejectedValue(new ApiError(404, "Department not found"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Department not found");
  });

  it("only offers admins and super admins as manager options", async () => {
    mockedDepartmentService.getById.mockResolvedValue({ message: "ok", department: makeDepartment() });
    mockedUserService.list.mockResolvedValue({
      message: "ok",
      users: [
        makeUser({ id: "u1", firstName: "Ada", lastName: "Admin", role: "admin" }),
        makeUser({ id: "u2", firstName: "Ray", lastName: "Regular", role: "user" }),
      ],
    });
    renderPage();

    const managerSelect = await screen.findByLabelText("Manager");
    expect(within(managerSelect).getByRole("option", { name: "Ada Admin" })).toBeInTheDocument();
    expect(within(managerSelect).queryByRole("option", { name: "Ray Regular" })).not.toBeInTheDocument();
  });

  it("validates the form before saving", async () => {
    mockedDepartmentService.getById.mockResolvedValue({ message: "ok", department: makeDepartment() });
    const user = userEvent.setup();
    renderPage();

    const nameInput = await screen.findByLabelText(/Department name/);
    await user.clear(nameInput);
    await user.type(nameInput, "S");
    // Clear the email too: an <input type="email"> blocks native form
    // submission on a malformed value before onSubmit ever runs, so an
    // empty (non-required) field is the reliable way to hit the app's own
    // "invalid email" branch via a real submit.
    await user.clear(screen.getByLabelText(/Department email/));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Must be at least 2 characters")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockedDepartmentService.update).not.toHaveBeenCalled();
  });

  it("saves changes and reflects the updated department", async () => {
    mockedDepartmentService.getById.mockResolvedValue({ message: "ok", department: makeDepartment() });
    mockedDepartmentService.update.mockResolvedValue({
      message: "Department updated.",
      department: makeDepartment({ departmentName: "Customer Support" }),
    });
    const user = userEvent.setup();
    renderPage();

    const nameInput = await screen.findByLabelText(/Department name/);
    await user.clear(nameInput);
    await user.type(nameInput, "Customer Support");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(mockedDepartmentService.update).toHaveBeenCalledWith("dept-1", {
        departmentName: "Customer Support",
        departmentEmail: "support@example.com",
        managedBy: null,
      }),
    );
    expect(mockedToast.success).toHaveBeenCalledWith("Department updated.");
    expect(await screen.findByRole("heading", { name: "Customer Support" })).toBeInTheDocument();
  });

  it("shows an error toast when saving fails", async () => {
    mockedDepartmentService.getById.mockResolvedValue({ message: "ok", department: makeDepartment() });
    mockedDepartmentService.update.mockRejectedValue(new ApiError(409, "Name already in use"));
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Support" });
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockedToast.error).toHaveBeenCalledWith("Name already in use"));
  });

  it("deletes the department after confirming and navigates back to the list", async () => {
    mockedDepartmentService.getById.mockResolvedValue({ message: "ok", department: makeDepartment() });
    mockedDepartmentService.remove.mockResolvedValue({ message: "Department deleted." });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete department" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete department" }));

    await waitFor(() => expect(mockedDepartmentService.remove).toHaveBeenCalledWith("dept-1"));
    expect(mockedToast.success).toHaveBeenCalledWith("Department deleted.");
    expect(await screen.findByText("Departments list page")).toBeInTheDocument();
  });

  it("closes the dialog and shows an error toast when deletion fails", async () => {
    mockedDepartmentService.getById.mockResolvedValue({ message: "ok", department: makeDepartment() });
    mockedDepartmentService.remove.mockRejectedValue(new ApiError(500, "Server error"));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete department" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete department" }));

    await waitFor(() => expect(mockedToast.error).toHaveBeenCalledWith("Server error"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
