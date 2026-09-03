import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TicketTable } from "./TicketTable";
import { formatDate, fullName } from "../../utils/format";
import type { Ticket } from "../../types/ticket";
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
    department: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    ticketId: "ticket-1",
    title: "Printer is broken",
    description: "The office printer jams constantly.",
    status: "open",
    priority: "high",
    departmentId: "dept-1",
    department: makeDepartment(),
    assignedToId: null,
    assignedTo: null,
    createdById: "user-1",
    createdBy: makeUser(),
    createdAt: "2024-01-05T10:00:00.000Z",
    updatedAt: "2024-01-05T10:00:00.000Z",
    closedAt: null,
    ...overrides,
  };
}

function renderTable(tickets: Ticket[]) {
  return render(
    <MemoryRouter>
      <TicketTable tickets={tickets} />
    </MemoryRouter>,
  );
}

describe("TicketTable", () => {
  it("renders a row for each ticket with its key details", () => {
    const ticket = makeTicket();
    renderTable([ticket]);

    expect(screen.getAllByRole("link", { name: ticket.title })[0]).toHaveAttribute(
      "href",
      "/tickets/ticket-1",
    );
    expect(screen.getAllByText("Support").length).toBeGreaterThan(0);
    expect(screen.getAllByText(fullName(ticket.createdBy)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatDate(ticket.createdAt)).length).toBeGreaterThan(0);
  });

  it("shows 'Unassigned' when no assignee is set", () => {
    renderTable([makeTicket({ assignedToId: null, assignedTo: null })]);
    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
  });

  it("shows the assignee's name when assigned", () => {
    const assignee = makeUser({ id: "user-2", firstName: "Sam", lastName: "Lee" });
    renderTable([makeTicket({ assignedToId: "user-2", assignedTo: assignee })]);
    expect(screen.getAllByText("Sam Lee").length).toBeGreaterThan(0);
  });

  it("falls back to a dash when the department is missing", () => {
    // The type marks department as required, but the component guards with
    // `?.` for defensive rendering, so simulate that runtime case.
    renderTable([makeTicket({ department: undefined as unknown as Department })]);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders no rows when there are no tickets", () => {
    renderTable([]);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
