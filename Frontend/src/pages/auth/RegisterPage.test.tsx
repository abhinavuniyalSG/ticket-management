import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";
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

function renderRegister(authOverrides: Partial<AuthContextValue> = {}) {
  const authValue = makeAuthValue(authOverrides);
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<p>Dashboard page</p>} />
          <Route path="/verify-required" element={<p>Verify required page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RegisterPage", () => {
  it("redirects an already-authenticated verified user to their default route", async () => {
    renderRegister({ user: makeUser({ role: "admin", isVerified: true }) });
    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });

  it("redirects an already-authenticated unverified user to /verify-required", async () => {
    renderRegister({ user: makeUser({ isVerified: false }) });
    expect(await screen.findByText("Verify required page")).toBeInTheDocument();
  });

  it("renders the registration form when not authenticated", () => {
    renderRegister({ status: "unauthenticated", user: null });
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });
});
