import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import type { SafeUser } from "../../types/user";

// LoginPage/RegisterPage otherwise have E2E coverage (e2e/login.spec.ts,
// e2e/register.spec.ts); this only covers the already-authenticated redirect
// branch, which a real browser session can't easily exercise.

function makeUser(overrides: Partial<SafeUser> = {}): SafeUser {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: true,
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
    logout: vi.fn(),
    setUser: vi.fn(),
    ...overrides,
  };
}

function renderLogin(authOverrides: Partial<AuthContextValue> = {}) {
  const authValue = makeAuthValue(authOverrides);
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tickets" element={<p>Tickets page</p>} />
          <Route path="/verify-required" element={<p>Verify required page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("LoginPage", () => {
  it("redirects an already-authenticated verified user to their default route", async () => {
    renderLogin({ user: makeUser({ role: "user", isVerified: true }) });
    expect(await screen.findByText("Tickets page")).toBeInTheDocument();
  });

  it("redirects an already-authenticated unverified user to /verify-required", async () => {
    renderLogin({ user: makeUser({ isVerified: false }) });
    expect(await screen.findByText("Verify required page")).toBeInTheDocument();
  });

  it("renders the login form when not authenticated", () => {
    renderLogin({ status: "unauthenticated", user: null });
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
