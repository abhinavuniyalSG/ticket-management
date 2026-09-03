import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import toast from "react-hot-toast";
import { UserDetailsPage } from "./UserDetailsPage";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import { userService } from "../../services/userService";
import { departmentService } from "../../services/departmentService";
import { ApiError } from "../../types/api";
import type { User } from "../../types/user";
import type { Department } from "../../types/department";

vi.mock("../../services/userService", () => ({
  userService: { getById: vi.fn(), update: vi.fn(), remove: vi.fn() },
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
    id: "user-2",
    firstName: "Other",
    lastName: "Person",
    role: "user",
    email: "other@example.com",
    isVerified: false,
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

function renderPage(authValue: AuthContextValue = makeAuthValue(), id = "user-2") {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[`/users/${id}`]}>
        <Routes>
          <Route path="/users/:id" element={<UserDetailsPage />} />
          <Route path="/users" element={<p>Users list page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedDepartmentService.list.mockResolvedValue({
    message: "ok",
    departments: [makeDepartment()],
  });
});

describe("UserDetailsPage", () => {
  it("shows a loading spinner while fetching the user", () => {
    mockedUserService.getById.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("loads the user and department list on mount", async () => {
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: makeUser() });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Other Person" })).toBeInTheDocument();
    expect(screen.getByText("other@example.com")).toBeInTheDocument();
    expect(mockedUserService.getById).toHaveBeenCalledWith("user-2");
    expect(mockedDepartmentService.list).toHaveBeenCalled();
  });

  it("shows role and verification badges", async () => {
    mockedUserService.getById.mockResolvedValue({
      message: "ok",
      user: makeUser({ role: "admin", isVerified: true }),
    });
    renderPage();

    await screen.findByRole("heading", { name: "Other Person" });
    expect(screen.getByText("Admin", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("shows an error state when the user fails to load", async () => {
    mockedUserService.getById.mockRejectedValue(new ApiError(404, "User not found"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("User not found");
  });

  it("lists the user's contacts", async () => {
    mockedUserService.getById.mockResolvedValue({
      message: "ok",
      user: makeUser({
        contacts: [
          { id: "c1", userId: "user-2", contactType: "phone", contactDetail: "555-0100", createdAt: "", updatedAt: "" },
        ],
      }),
    });
    renderPage();

    expect(await screen.findByText("555-0100")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
  });

  it("shows a fallback message when the user has no contacts", async () => {
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: makeUser({ contacts: [] }) });
    renderPage();

    expect(await screen.findByText("No contacts on file.")).toBeInTheDocument();
  });

  it("disables fields the actor is not permitted to edit", async () => {
    // A regular user viewing their own profile can edit their name but not
    // their department or role.
    const self = makeUser({ id: "actor-1", role: "user" });
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: self });
    renderPage(makeAuthValue({ user: self }), "actor-1");

    await screen.findByRole("heading", { name: "Other Person" });
    expect(screen.getByLabelText("First name")).toBeEnabled();
    expect(screen.getByLabelText("Last name")).toBeEnabled();
    expect(screen.getByLabelText("Department")).toBeDisabled();
    expect(screen.getByLabelText("Role")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("does not show a save button when the actor cannot edit anything", async () => {
    // An admin from a different department viewing a user they cannot touch.
    const target = makeUser({ id: "user-2", departmentId: "dept-other" });
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: target });
    renderPage(
      makeAuthValue({ user: makeUser({ id: "actor-1", role: "admin", departmentId: "dept-mine" }) }),
    );

    await screen.findByRole("heading", { name: "Other Person" });
    expect(screen.getByLabelText("First name")).toBeDisabled();
    // Admins may move someone else's department regardless of department match.
    expect(screen.getByLabelText("Department")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("saves editable fields and reflects the updated user", async () => {
    const target = makeUser();
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: target });
    mockedUserService.update.mockResolvedValue({
      message: "User updated.",
      user: { ...target, firstName: "Updated" },
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Other Person" });
    const firstNameInput = screen.getByLabelText("First name");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Updated");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(mockedUserService.update).toHaveBeenCalledWith("user-2", {
        firstName: "Updated",
        lastName: "Person",
        departmentId: null,
        role: "user",
      }),
    );
    expect(mockedToast.success).toHaveBeenCalledWith("User updated.");
    expect(await screen.findByRole("heading", { name: "Updated Person" })).toBeInTheDocument();
  });

  it("shows an error toast when saving fails", async () => {
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: makeUser() });
    mockedUserService.update.mockRejectedValue(new ApiError(400, "Invalid update"));
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Other Person" });
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockedToast.error).toHaveBeenCalledWith("Invalid update"));
  });

  it("deletes the user after confirming and navigates back to the list", async () => {
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: makeUser() });
    mockedUserService.remove.mockResolvedValue({ message: "User deleted." });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete user" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete user" }));

    await waitFor(() => expect(mockedUserService.remove).toHaveBeenCalledWith("user-2"));
    expect(mockedToast.success).toHaveBeenCalledWith("User deleted.");
    expect(await screen.findByText("Users list page")).toBeInTheDocument();
  });

  it("closes the dialog and shows an error toast when deletion fails", async () => {
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: makeUser() });
    mockedUserService.remove.mockRejectedValue(new ApiError(500, "Server error"));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete user" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete user" }));

    await waitFor(() => expect(mockedToast.error).toHaveBeenCalledWith("Server error"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("hides the delete button when the actor cannot delete the user", async () => {
    const target = makeUser({ id: "user-2", role: "user" });
    mockedUserService.getById.mockResolvedValue({ message: "ok", user: target });
    renderPage(makeAuthValue({ user: makeUser({ id: "actor-1", role: "user" }) }));

    await screen.findByRole("heading", { name: "Other Person" });
    expect(screen.queryByRole("button", { name: "Delete user" })).not.toBeInTheDocument();
  });
});
