import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { ResendVerificationPage } from "./ResendVerificationPage";
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
      <ResendVerificationPage />
    </MemoryRouter>,
  );
}

describe("ResendVerificationPage", () => {
  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^Email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send verification email" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(authService.resendVerification).not.toHaveBeenCalled();
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
