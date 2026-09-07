import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CreateDepartmentPage } from "./CreateDepartmentPage";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { ApiError } from "../../types/api";
import type { User } from "../../types/user";
import { makePagination } from "../../test/paginationFixture";

vi.mock("../../services/departmentService", () => ({
  departmentService: { create: vi.fn() },
}));
vi.mock("../../services/userService", () => ({
  userService: { list: vi.fn() },
}));

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
import toast from "react-hot-toast";

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
    <MemoryRouter initialEntries={["/departments/new"]}>
      <Routes>
        <Route path="/departments/new" element={<CreateDepartmentPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(userService.list).mockResolvedValue({
    message: "ok",
    users: [],
    pagination: makePagination(),
  });
});

describe("CreateDepartmentPage", () => {
  it("renders a back link to the departments list", async () => {
    renderPage();

    const backLink = await screen.findByRole("link", { name: /Back to departments/ });
    expect(backLink).toHaveAttribute("href", "/departments");
  });

  it("only offers admins and super admins as manager options", async () => {
    vi.mocked(userService.list).mockResolvedValue({
      message: "ok",
      users: [
        makeUser({ id: "u1", firstName: "Ada", lastName: "Admin", role: "admin" }),
        makeUser({ id: "u2", firstName: "Sue", lastName: "Super", role: "super_admin" }),
        makeUser({ id: "u3", firstName: "Ray", lastName: "Regular", role: "user" }),
      ],
      pagination: makePagination({ totalItems: 3, totalPages: 1 }),
    });
    const user = userEvent.setup();
    renderPage();

    const managerSelect = await screen.findByLabelText("Manager");
    await user.click(managerSelect);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    expect(screen.getByRole("option", { name: "Ada Admin" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sue Super" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Ray Regular" })).not.toBeInTheDocument();
  });

  it("validates the form before submitting", async () => {
    const user = userEvent.setup();
    renderPage();

    // Leave the email blank rather than typing an invalid value: an
    // <input type="email"> blocks form submission via native constraint
    // validation before our onSubmit handler ever runs, so an empty (but
    // non-required) field is the only reliable way to exercise the app's
    // own "invalid email" branch through a real submit.
    await user.type(screen.getByLabelText(/Department name/), "S");
    await user.click(screen.getByRole("button", { name: "Create department" }));

    expect(await screen.findByText("Must be at least 2 characters")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(departmentService.create).not.toHaveBeenCalled();
  });

  it("creates a department and navigates to its details page", async () => {
    vi.mocked(departmentService.create).mockResolvedValue({
      message: "Department created.",
      department: {
        departmentId: "dept-99",
        departmentName: "Sales",
        departmentEmail: "sales@example.com",
        managedBy: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Department name/), "Sales");
    await user.type(screen.getByLabelText(/Department email/), "SALES@Example.com");
    await user.click(screen.getByRole("button", { name: "Create department" }));

    await waitFor(() =>
      expect(departmentService.create).toHaveBeenCalledWith({
        departmentName: "Sales",
        departmentEmail: "sales@example.com",
        managedBy: undefined,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Department created.");
    expect(mockNavigate).toHaveBeenCalledWith("/departments/dept-99", { replace: true });
  });

  it("shows an error toast and does not navigate when creation fails", async () => {
    vi.mocked(departmentService.create).mockRejectedValue(new ApiError(409, "Name already in use"));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Department name/), "Sales");
    await user.type(screen.getByLabelText(/Department email/), "sales@example.com");
    await user.click(screen.getByRole("button", { name: "Create department" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Name already in use"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
