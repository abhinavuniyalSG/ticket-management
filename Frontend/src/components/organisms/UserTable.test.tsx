import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { UserTable } from "./UserTable";
import { fullName } from "../../utils/format";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: null,
    manager: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
    email: "jane@example.com",
    isVerified: true,
    departmentId: "dept-1",
    department: makeDepartment(),
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderTable(users: User[], renderActions?: (user: User) => ReactNode) {
  return render(
    <MemoryRouter>
      <UserTable users={users} renderActions={renderActions} />
    </MemoryRouter>,
  );
}

describe("UserTable", () => {
  it("renders a row for each user with their role, department and verification state", () => {
    renderTable([makeUser()]);

    expect(screen.getAllByRole("link", { name: "Jane Doe" })[0]).toHaveAttribute(
      "href",
      "/users/user-1",
    );
    expect(screen.getAllByText("jane@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("User").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Verified").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Support").length).toBeGreaterThan(0);
  });

  it("shows an 'Unverified' badge for unverified users", () => {
    renderTable([makeUser({ isVerified: false })]);
    expect(screen.getAllByText("Unverified").length).toBeGreaterThan(0);
  });

  it("labels admin and super_admin roles correctly", () => {
    renderTable([
      makeUser({ id: "user-2", role: "admin" }),
      makeUser({ id: "user-3", role: "super_admin" }),
    ]);
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Super Admin").length).toBeGreaterThan(0);
  });

  it("shows a dash when the user has no department", () => {
    renderTable([makeUser({ departmentId: null, department: null })]);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("does not render an actions column when renderActions is omitted", () => {
    renderTable([makeUser()]);
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("renders custom actions for each user when renderActions is provided", () => {
    renderTable([makeUser()], (user) => <button>Edit {fullName(user)}</button>);
    expect(screen.getAllByRole("button", { name: "Edit Jane Doe" }).length).toBeGreaterThan(0);
  });

  it("renders no rows when there are no users", () => {
    renderTable([]);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
