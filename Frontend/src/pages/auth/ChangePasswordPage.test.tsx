import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { ChangePasswordPage } from "./ChangePasswordPage";
import { authService } from "../../services/authService";
import { ApiError } from "../../types/api";

vi.mock("../../services/authService");
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  render(
    <MemoryRouter>
      <ChangePasswordPage />
    </MemoryRouter>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
  await user.type(screen.getByLabelText(/^Current password/), "OldPass1!");
  await user.type(screen.getByLabelText(/^New password/), "NewPass2@");
}

describe("ChangePasswordPage", () => {
  it("shows validation errors for an empty submission", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Current password is required")).toBeInTheDocument();
    expect(screen.getByText(/At least 8 characters long/)).toBeInTheDocument();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it("rejects a new password identical to the old password", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.type(screen.getByLabelText(/^Current password/), "SamePass1!");
    await user.type(screen.getByLabelText(/^New password/), "SamePass1!");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      screen.getByText("New password must be different from the old password"),
    ).toBeInTheDocument();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it("submits the trimmed, lowercased email and shows a success message", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.changePassword).mockResolvedValue({ message: "Password changed" });
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "  Jane@Example.com  ");
    await user.type(screen.getByLabelText(/^Current password/), "OldPass1!");
    await user.type(screen.getByLabelText(/^New password/), "NewPass2@");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith({
        email: "jane@example.com",
        oldPassword: "OldPass1!",
        newPassword: "NewPass2@",
      });
    });
    expect(await screen.findByText(/Your password has been changed/)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Password changed");
  });

  it("shows a form-level error when the request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.changePassword).mockRejectedValue(
      new ApiError(400, "Current password is incorrect."),
    );
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.");
    expect(toast.error).toHaveBeenCalledWith("Current password is incorrect.");
  });
});
