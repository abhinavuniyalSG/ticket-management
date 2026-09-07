import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { authService } from "../../services/authService";
import { ApiError } from "../../types/api";

vi.mock("../../services/authService");
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderPage() {
  render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  it("shows a validation error for an invalid email and does not call the service", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send reset email" }));

    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it("submits the trimmed, lowercased email and shows the generic sent message with a disabled resend button", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.forgotPassword).mockResolvedValue({
      message: "If an account with that email exists, a password reset email has been sent",
    });
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "  Jane@Example.com  ");
    await user.click(screen.getByRole("button", { name: "Send reset email" }));

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith("jane@example.com");
    });
    expect(await screen.findByText(/password reset email has been sent/)).toBeInTheDocument();
    const resendButton = screen.getByRole("button", { name: /Resend email/ });
    expect(resendButton).toBeDisabled();
  });

  it("shows an error toast when the request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.forgotPassword).mockRejectedValue(new ApiError(429, "Too many requests."));
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset email" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Too many requests.");
    });
  });

  it("re-enables the resend button after the cooldown elapses and resends on click", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(authService.forgotPassword).mockResolvedValue({ message: "sent" });
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset email" }));
    await waitFor(() => expect(authService.forgotPassword).toHaveBeenCalledTimes(1));

    const resendButton = screen.getByRole("button", { name: /Resend email/ });
    expect(resendButton).toBeDisabled();

    await vi.advanceTimersByTimeAsync(180_000);

    expect(screen.getByRole("button", { name: "Resend email" })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Resend email" }));
    await waitFor(() => expect(authService.forgotPassword).toHaveBeenCalledTimes(2));
  });
});
