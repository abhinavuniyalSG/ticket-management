import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TicketMeta } from "./TicketMeta";
import type { Ticket } from "../../types/ticket";
import type { User } from "../../types/user";
import type { Department } from "../../types/department";

function makeUser(overrides: Partial<User> = {}): User {
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

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    ticketId: "ticket-1",
    title: "Printer is broken",
    description: "It jams every time.",
    status: "open",
    priority: "medium",
    departmentId: "dept-1",
    department: makeDepartment(),
    assignedToId: null,
    assignedTo: null,
    createdById: "user-1",
    createdBy: makeUser(),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    closedAt: null,
    ...overrides,
  };
}

describe("TicketMeta", () => {
  it("shows the department name", () => {
    render(<TicketMeta ticket={makeTicket()} />);
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("shows a dash when there is no department", () => {
    render(<TicketMeta ticket={makeTicket({ department: null as unknown as Department })} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the creator's full name", () => {
    render(<TicketMeta ticket={makeTicket({ createdBy: makeUser({ firstName: "Jane", lastName: "Doe" }) })} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("shows 'Unassigned' when there is no assignee", () => {
    render(<TicketMeta ticket={makeTicket({ assignedTo: null })} />);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("shows the assignee's full name when assigned", () => {
    render(
      <TicketMeta
        ticket={makeTicket({ assignedTo: makeUser({ firstName: "Sam", lastName: "Lee" }) })}
      />,
    );
    expect(screen.getByText("Sam Lee")).toBeInTheDocument();
  });

  it("shows a dash for closedAt when the ticket is not closed", () => {
    render(<TicketMeta ticket={makeTicket({ closedAt: null })} />);
    const closedRow = screen.getByText("Closed").closest("div");
    expect(closedRow).toHaveTextContent("—");
  });

  it("renders all expected meta labels", () => {
    render(<TicketMeta ticket={makeTicket()} />);
    ["Department", "Creator", "Assignee", "Created", "Updated", "Closed"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
