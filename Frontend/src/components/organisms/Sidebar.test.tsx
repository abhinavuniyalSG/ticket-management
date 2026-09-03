import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AuthContext } from "../../app/providers/AuthContext";
import type { AuthContextValue } from "../../app/providers/AuthContext";
import type { SafeUser } from "../../types/user";

function makeUser(overrides: Partial<SafeUser> = {}): SafeUser {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: true,
    departmentId: "dept-1",
    department: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <p>Current path: {location.pathname}</p>;
}

function renderSidebar(user: SafeUser | null, authOverrides: Partial<AuthContextValue> = {}) {
  const authValue: AuthContextValue = {
    user,
    status: user ? "authenticated" : "unauthenticated",
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    setUser: vi.fn(),
    ...authOverrides,
  };

  const utils = render(
    <MemoryRouter initialEntries={["/tickets"]}>
      <AuthContext.Provider value={authValue}>
        <Sidebar />
        <LocationProbe />
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { ...utils, authValue };
}

describe("Sidebar", () => {
  it("renders nothing when there is no authenticated user", () => {
    renderSidebar(null);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("shows only Tickets and Profile for a 'user' role", () => {
    renderSidebar(makeUser({ role: "user" }));

    expect(screen.getByRole("link", { name: "Tickets" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Departments" })).not.toBeInTheDocument();
  });

  it("adds Dashboard and Users for an 'admin' role, but not Departments", () => {
    renderSidebar(makeUser({ role: "admin" }));

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Departments" })).not.toBeInTheDocument();
  });

  it("shows every nav item for a 'super_admin' role", () => {
    renderSidebar(makeUser({ role: "super_admin" }));

    for (const label of ["Dashboard", "Tickets", "Users", "Departments", "Profile"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("shows the user's name, initials, and role label", () => {
    renderSidebar(makeUser({ firstName: "Jane", lastName: "Doe", role: "admin" }));

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("logs out and redirects to /login when 'Log out' is clicked", async () => {
    const user = userEvent.setup();
    const { authValue } = renderSidebar(makeUser());

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(authValue.logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Current path: /login")).toBeInTheDocument();
  });
});
