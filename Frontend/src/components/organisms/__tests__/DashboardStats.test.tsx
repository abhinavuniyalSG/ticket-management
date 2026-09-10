import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardStats } from "../DashboardStats";
import type { DashboardMetrics } from "../../../types/dashboard";

function makeMetrics(overrides: Partial<DashboardMetrics> = {}): DashboardMetrics {
  return {
    message: "ok",
    departmentId: null,
    period: "day",
    totalTicketsCreatedToday: 42,
    openTickets: 10,
    assignedTickets: 8,
    inProgressTickets: 6,
    reviewedTickets: 4,
    completedTickets: 9,
    closedDateToday: 5,
    statusDistribution: [],
    priorityDistribution: [],
    ticketsOverTime: [],
    ...overrides,
  };
}

describe("DashboardStats", () => {
  it("renders every metric tile with its label and value", () => {
    render(<DashboardStats metrics={makeMetrics()} />);

    expect(screen.getByText("Total tickets created today")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Closed today")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("labels the total and closed tiles with the selected period's wording", () => {
    render(<DashboardStats metrics={makeMetrics({ period: "week" })} />);
    expect(screen.getByText("Total tickets created this week")).toBeInTheDocument();
    expect(screen.getByText("Closed this week")).toBeInTheDocument();
  });
});
