import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import toast from "react-hot-toast";
import { ProfilePage } from "./ProfilePage";
import { AuthContext } from "../app/providers/AuthContext";
import type { AuthContextValue } from "../app/providers/AuthContext";
import { userService } from "../services/userService";
import { ApiError } from "../types/api";
import type { User } from "../types/user";
import type { Contact } from "../types/contact";

vi.mock("../services/userService");
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "contact-1",
    userId: "user-1",
    contactType: "phone",
    contactDetail: "+1 555 000 1234",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: true,
    departmentId: null,
    department: null,
    contacts: [],
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

function renderProfilePage(authOverrides: Partial<AuthContextValue> = {}) {
  const authValue = makeAuthValue(authOverrides);
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { authValue };
}

describe("ProfilePage", () => {
  it("shows a spinner while the profile is loading", () => {
    vi.mocked(userService.getById).mockReturnValue(new Promise(() => {}));
    renderProfilePage();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an error state when loading fails, with a working retry", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById)
      .mockRejectedValueOnce(new ApiError(500, "Unable to load your profile."))
      .mockResolvedValueOnce({ message: "ok", user: makeUser() });

    renderProfilePage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load your profile.");

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByLabelText(/^First name/)).toHaveValue("Jane");
    expect(userService.getById).toHaveBeenCalledTimes(2);
  });

  it("renders the profile's personal information", async () => {
    vi.mocked(userService.getById).mockResolvedValue({
      message: "ok",
      user: makeUser({
        role: "admin",
        department: {
          departmentId: "dept-1",
          departmentName: "Support",
          departmentEmail: "support@example.com",
          managedBy: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    });

    renderProfilePage();

    expect(await screen.findByLabelText(/^First name/)).toHaveValue("Jane");
    expect(screen.getByLabelText("Last name")).toHaveValue("Doe");
    expect(screen.getByLabelText("Email")).toHaveValue("jane@example.com");
    expect(screen.getByLabelText("Role")).toHaveValue("Admin");
    expect(screen.getByLabelText("Department")).toHaveValue("Support");
  });

  it("shows 'Unassigned' when the user has no department", async () => {
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });

    renderProfilePage();

    expect(await screen.findByLabelText("Department")).toHaveValue("Unassigned");
  });

  it("shows 'No contacts added yet.' when there are no contacts", async () => {
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });

    renderProfilePage();

    expect(await screen.findByText("No contacts added yet.")).toBeInTheDocument();
  });

  it("requires a first name before saving", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });

    renderProfilePage();

    const firstName = await screen.findByLabelText(/^First name/);
    await user.clear(firstName);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("First name is required");
    expect(userService.update).not.toHaveBeenCalled();
  });

  it("saves name changes and updates the auth context", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });
    const updatedUser = makeUser({ firstName: "Janet" });
    vi.mocked(userService.update).mockResolvedValue({ message: "Profile updated", user: updatedUser });

    const { authValue } = renderProfilePage();

    const firstName = await screen.findByLabelText(/^First name/);
    await user.clear(firstName);
    await user.type(firstName, "Janet");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(userService.update).toHaveBeenCalledWith("user-1", {
        firstName: "Janet",
        lastName: "Doe",
      });
    });
    expect(authValue.setUser).toHaveBeenCalledWith(updatedUser);
    expect(toast.success).toHaveBeenCalledWith("Profile updated");
  });

  it("shows an error toast when saving the name fails", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });
    vi.mocked(userService.update).mockRejectedValue(new ApiError(400, "Unable to update your profile."));

    renderProfilePage();

    await screen.findByLabelText(/^First name/);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unable to update your profile.");
    });
  });

  it("requires a contact detail before adding a contact", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });

    renderProfilePage();

    await screen.findByLabelText(/^First name/);
    await user.click(screen.getByRole("button", { name: "Add contact" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Contact detail is required");
    expect(userService.addContact).not.toHaveBeenCalled();
  });

  it("adds a contact and clears the form", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });
    vi.mocked(userService.addContact).mockResolvedValue({
      message: "Contact added",
      contact: makeContact({ contactDetail: "+44 7700 900000" }),
    });

    renderProfilePage();

    await screen.findByLabelText(/^First name/);
    const detail = screen.getByLabelText(/^Detail/);
    await user.type(detail, "+44 7700 900000");
    await user.click(screen.getByRole("button", { name: "Add contact" }));

    expect(await screen.findByText("+44 7700 900000")).toBeInTheDocument();
    expect(detail).toHaveValue("");
    expect(toast.success).toHaveBeenCalledWith("Contact added");
  });

  it("shows a contact error when adding a contact fails", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });
    vi.mocked(userService.addContact).mockRejectedValue(new ApiError(400, "Contact already exists."));

    renderProfilePage();

    await screen.findByLabelText(/^First name/);
    await user.type(screen.getByLabelText(/^Detail/), "+44 7700 900000");
    await user.click(screen.getByRole("button", { name: "Add contact" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Contact already exists.");
    expect(toast.error).toHaveBeenCalledWith("Contact already exists.");
  });

  it("removes a contact", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({
      message: "ok",
      user: makeUser({ contacts: [makeContact()] }),
    });
    vi.mocked(userService.removeContact).mockResolvedValue({ message: "Contact removed" });

    renderProfilePage();

    expect(await screen.findByText("+1 555 000 1234")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove contact" }));

    await waitFor(() => {
      expect(screen.queryByText("+1 555 000 1234")).not.toBeInTheDocument();
    });
    expect(toast.success).toHaveBeenCalledWith("Contact removed");
  });

  it("shows a toast when removing a contact fails", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({
      message: "ok",
      user: makeUser({ contacts: [makeContact()] }),
    });
    vi.mocked(userService.removeContact).mockRejectedValue(new ApiError(500, "Unable to remove contact."));

    renderProfilePage();

    await screen.findByText("+1 555 000 1234");
    await user.click(screen.getByRole("button", { name: "Remove contact" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unable to remove contact.");
    });
    expect(screen.getByText("+1 555 000 1234")).toBeInTheDocument();
  });

  it("deletes the account after confirming, then logs out and redirects to login", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });
    vi.mocked(userService.remove).mockResolvedValue({ message: "Account deleted" });

    const { authValue } = renderProfilePage();

    await screen.findByLabelText(/^First name/);
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete account" }));

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(userService.remove).toHaveBeenCalledWith("user-1");
    expect(authValue.logout).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Account deleted");
  });

  it("shows a toast and closes the dialog when account deletion fails", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getById).mockResolvedValue({ message: "ok", user: makeUser() });
    vi.mocked(userService.remove).mockRejectedValue(new ApiError(500, "Unable to delete your account."));

    const { authValue } = renderProfilePage();

    await screen.findByLabelText(/^First name/);
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete account" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unable to delete your account.");
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(authValue.logout).not.toHaveBeenCalled();
  });
});
