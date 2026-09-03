import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { VerifyEmailPage } from "./VerifyEmailPage";
import { authService } from "../../services/authService";
import { ApiError } from "../../types/api";

vi.mock("../../services/authService");

beforeEach(() => {
  vi.clearAllMocks();
});

function renderAtToken(token: string | null) {
  const path = token === null ? "/verify-email" : `/verify-email/${token}`;
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/verify-email/:token?" element={<VerifyEmailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("VerifyEmailPage", () => {
  it("shows a spinner while verification is in progress", () => {
    vi.mocked(authService.verifyEmail).mockReturnValue(new Promise(() => {}));
    renderAtToken("abc123");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Verifying your email address/)).toBeInTheDocument();
  });

  it("shows a success message and a link to sign in once verified", async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue({ message: "Email verified!" });
    renderAtToken("abc123");

    expect(await screen.findByText("Email verified!")).toBeInTheDocument();
    expect(authService.verifyEmail).toHaveBeenCalledWith("abc123");
    expect(screen.getByRole("link", { name: "Continue to sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows an error message with resend and sign-in links when verification fails", async () => {
    vi.mocked(authService.verifyEmail).mockRejectedValue(new ApiError(400, "Token has expired."));
    renderAtToken("expired-token");

    expect(await screen.findByText("Token has expired.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resend email" })).toHaveAttribute(
      "href",
      "/resend-verification",
    );
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/login");
  });

  it("shows an error immediately when there is no token", () => {
    renderAtToken(null);
    expect(screen.getByText("Missing verification token.")).toBeInTheDocument();
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });
});
