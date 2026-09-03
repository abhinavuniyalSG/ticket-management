import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { MobileNavigation } from "./MobileNavigation";
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

function renderNav(
  user: SafeUser | null,
  props: { isOpen?: boolean; onClose?: () => void } = {},
  authOverrides: Partial<AuthContextValue> = {},
) {
  const authValue: AuthContextValue = {
    user,
    status: user ? "authenticated" : "unauthenticated",
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    setUser: vi.fn(),
    ...authOverrides,
  };
  const onClose = props.onClose ?? vi.fn();

  const utils = render(
    <MemoryRouter initialEntries={["/tickets"]}>
      <AuthContext.Provider value={authValue}>
        <MobileNavigation isOpen={props.isOpen ?? true} onClose={onClose} />
        <LocationProbe />
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { ...utils, authValue, onClose };
}

describe("MobileNavigation", () => {
  it("renders nothing when isOpen is false", () => {
    renderNav(makeUser(), { isOpen: false });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders nothing when there is no authenticated user, even if open", () => {
    renderNav(null, { isOpen: true });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("shows only the nav items allowed for the user's role", () => {
    renderNav(makeUser({ role: "user" }));

    expect(screen.getByRole("link", { name: "Tickets" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Departments" })).not.toBeInTheDocument();
  });

  it("shows the user's name and role label", () => {
    renderNav(makeUser({ firstName: "Jane", lastName: "Doe", role: "super_admin" }));

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("calls onClose when the overlay is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderNav(makeUser());

    await user.click(screen.getByRole("button", { name: "Close navigation" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close icon button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderNav(makeUser());

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the Escape key is pressed", async () => {
    const user = userEvent.setup();
    const { onClose } = renderNav(makeUser());

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when a nav item is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderNav(makeUser());

    await user.click(screen.getByRole("link", { name: "Tickets" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("logs out and redirects to /login when 'Log out' is clicked", async () => {
    const user = userEvent.setup();
    const { authValue } = renderNav(makeUser());

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(authValue.logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Current path: /login")).toBeInTheDocument();
  });
});
