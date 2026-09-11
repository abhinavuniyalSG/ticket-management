import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { ResendVerificationPage } from "../ResendVerificationPage";
import { authService } from "../../../services/authService";
import { ApiError } from "../../../types/api";

vi.mock("../../../services/authService");
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  render(
    <MemoryRouter>
      <ResendVerificationPage />
    </MemoryRouter>,
  );
}

describe("ResendVerificationPage", () => {
  it("disables Send verification email until a valid email is entered", async () => {
    const user = userEvent.setup();
    renderPage();

    const button = screen.getByRole("button", { name: "Send verification email" });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/^Email/), "not-an-email");
    expect(button).toBeDisabled();

    await user.clear(screen.getByLabelText(/^Email/));
    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    expect(button).toBeEnabled();

    expect(authService.resendVerification).not.toHaveBeenCalled();
  });

  it("validates the email on blur, not before, and clears the error live once fixed", async () => {
    const user = userEvent.setup();
    renderPage();

    const email = screen.getByLabelText(/^Email/);
    await user.type(email, "not-an-email");
    expect(screen.queryByText("Enter a valid email address")).not.toBeInTheDocument();

    await user.tab();
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();

    await user.clear(email);
    await user.type(email, "jane@example.com");
    expect(screen.queryByText("Enter a valid email address")).not.toBeInTheDocument();
  });

  it("submits the trimmed, lowercased email and shows a confirmation message", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.resendVerification).mockResolvedValue({ message: "Email sent" });
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "  Jane@Example.com  ");
    await user.click(screen.getByRole("button", { name: "Send verification email" }));

    await waitFor(() => {
      expect(authService.resendVerification).toHaveBeenCalledWith("jane@example.com");
    });
    expect(
      await screen.findByText(/If an account with that email exists/),
    ).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Email sent");
  });

  it("shows a field error and toast when the request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.resendVerification).mockRejectedValue(
      new ApiError(429, "Too many requests. Try again later."),
    );
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Send verification email" }));

    expect(await screen.findByText("Too many requests. Try again later.")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Too many requests. Try again later.");
  });
});
