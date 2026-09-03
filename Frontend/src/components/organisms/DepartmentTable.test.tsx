import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { DepartmentTable } from "./DepartmentTable";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    role: "admin",
    email: "jane@example.com",
    isVerified: true,
    departmentId: "dept-1",
    department: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: "user-1",
    manager: makeUser(),
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderTable(departments: Department[], renderActions?: (department: Department) => ReactNode) {
  return render(
    <MemoryRouter>
      <DepartmentTable departments={departments} renderActions={renderActions} />
    </MemoryRouter>,
  );
}

describe("DepartmentTable", () => {
  it("renders a row for each department with its email and manager", () => {
    renderTable([makeDepartment()]);

    expect(screen.getAllByRole("link", { name: "Support" })[0]).toHaveAttribute(
      "href",
      "/departments/dept-1",
    );
    expect(screen.getAllByText("support@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
  });

  it("shows 'Unmanaged' when the department has no manager", () => {
    renderTable([makeDepartment({ managedBy: null, manager: null })]);
    expect(screen.getAllByText("Unmanaged").length).toBeGreaterThan(0);
  });

  it("does not render an actions column when renderActions is omitted", () => {
    renderTable([makeDepartment()]);
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("renders custom actions for each department when renderActions is provided", () => {
    renderTable([makeDepartment()], (department) => (
      <button>Edit {department.departmentName}</button>
    ));
    expect(screen.getAllByRole("button", { name: "Edit Support" }).length).toBeGreaterThan(0);
  });

  it("renders no rows when there are no departments", () => {
    renderTable([]);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
