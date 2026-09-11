import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ResetPasswordPage } from "../ResetPasswordPage";
import { authService } from "../../../services/authService";
import { ApiError } from "../../../types/api";

vi.mock("../../../services/authService");

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage(path = "/changepassword/verify/tok123?email=jane%40example.com") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/changepassword/verify/:token" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^New password/), "NewPass2@");
  await user.type(screen.getByLabelText(/^Confirm password/), "NewPass2@");
}

describe("ResetPasswordPage", () => {
  it("shows an error state immediately when the email query param is missing", () => {
    renderPage("/changepassword/verify/tok123");

    expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^New password/)).not.toBeInTheDocument();
  });

  it("shows validation errors for a weak or mismatched password and does not call the service", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^New password/), "weak");
    await user.type(screen.getByLabelText(/^Confirm password/), "different");

    expect(screen.getByText(/At least 8 characters long/)).toBeInTheDocument();
    // The submit button stays disabled while invalid, so it can't be clicked
    // to trigger a submit attempt; the mismatch message instead appears on
    // its own after the debounce/blur delay described in ResetPasswordPage.
    expect(screen.getByRole("button", { name: "Reset password" })).toBeDisabled();
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("submits the token, email, and new password, then shows a success message", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.resetPassword).mockResolvedValue({
      message: "Password reset successful. Please sign in with your new password.",
    });
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        token: "tok123",
        email: "jane@example.com",
        newPassword: "NewPass2@",
      });
    });
    expect(await screen.findByText(/Password reset successful/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue to sign in" })).toBeInTheDocument();
  });

  it("shows an error state with a link to request a new link when the reset fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.resetPassword).mockRejectedValue(
      new ApiError(400, "Invalid or expired reset link"),
    );
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Invalid or expired reset link")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new link" })).toBeInTheDocument();
  });
});
