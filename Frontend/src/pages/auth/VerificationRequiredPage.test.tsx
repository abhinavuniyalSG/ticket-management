import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import toast from "react-hot-toast";
import { VerificationRequiredPage } from "./VerificationRequiredPage";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import { authService } from "../../services/authService";
import { ApiError } from "../../types/api";
import type { SafeUser } from "../../types/user";

vi.mock("../../services/authService");
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeUser(overrides: Partial<SafeUser> = {}): SafeUser {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: false,
    departmentId: null,
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
    logout: vi.fn().mockResolvedValue(undefined),
    setUser: vi.fn(),
    ...overrides,
  };
}

function renderPage(authOverrides: Partial<AuthContextValue> = {}) {
  const authValue = makeAuthValue(authOverrides);
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/verify-required"]}>
        <Routes>
          <Route path="/verify-required" element={<VerificationRequiredPage />} />
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/tickets" element={<p>Tickets page</p>} />
          <Route path="/dashboard" element={<p>Dashboard page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { authValue };
}

describe("VerificationRequiredPage", () => {
  it("shows a spinner while auth status is loading", () => {
    renderPage({ status: "loading", user: null });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", async () => {
    renderPage({ status: "unauthenticated", user: null });
    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("redirects to the user's default route once already verified", async () => {
    renderPage({ user: makeUser({ isVerified: true, role: "user" }) });
    expect(await screen.findByText("Tickets page")).toBeInTheDocument();
  });

  it("shows the verification prompt with the user's email", () => {
    renderPage({ user: makeUser({ email: "unverified@example.com" }) });
    expect(screen.getByText("unverified@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Resend verification email" }),
    ).toBeInTheDocument();
  });

  it("resends the verification email", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.resendVerification).mockResolvedValue({ message: "Email sent" });
    renderPage({ user: makeUser({ email: "unverified@example.com" }) });

    await user.click(screen.getByRole("button", { name: "Resend verification email" }));

    await waitFor(() => {
      expect(authService.resendVerification).toHaveBeenCalledWith("unverified@example.com");
    });
    expect(toast.success).toHaveBeenCalledWith("Email sent");
  });

  it("shows a toast when resending fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.resendVerification).mockRejectedValue(
      new ApiError(500, "Unable to resend the email."),
    );
    renderPage();

    await user.click(screen.getByRole("button", { name: "Resend verification email" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unable to resend the email.");
    });
  });

  it("logs out and redirects to login when 'login again' is clicked", async () => {
    const user = userEvent.setup();
    const { authValue } = renderPage();

    await user.click(screen.getByRole("button", { name: "login again" }));

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(authValue.logout).toHaveBeenCalledTimes(1);
  });
});
