import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardStats } from "./DashboardStats";
import type { DashboardMetrics } from "../../types/dashboard";

function makeMetrics(overrides: Partial<DashboardMetrics> = {}): DashboardMetrics {
  return {
    message: "ok",
    totalTickets: 42,
    openTickets: 10,
    assignedTickets: 8,
    inProgressTickets: 6,
    reviewTickets: 4,
    completedTickets: 9,
    closedTickets: 5,
    statusDistribution: [],
    priorityDistribution: [],
    productivity: { averageCompletionTimeHours: 12.345 },
    ticketsOverTime: [],
    ...overrides,
  };
}

describe("DashboardStats", () => {
  it("renders every metric tile with its label and value", () => {
    render(<DashboardStats metrics={makeMetrics()} period="week" />);

    expect(screen.getByText("Total tickets")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows the average completion time rounded to one decimal", () => {
    render(<DashboardStats metrics={makeMetrics({ productivity: { averageCompletionTimeHours: 12.345 } })} period="week" />);
    expect(screen.getByText("12.3h")).toBeInTheDocument();
  });

  it("labels the completion time tile with the period's window", () => {
    render(<DashboardStats metrics={makeMetrics()} period="week" />);
    expect(screen.getByText("Avg. completion time (7 days)")).toBeInTheDocument();

    render(<DashboardStats metrics={makeMetrics()} period="month" />);
    expect(screen.getByText("Avg. completion time (30 days)")).toBeInTheDocument();

    render(<DashboardStats metrics={makeMetrics()} period="year" />);
    expect(screen.getByText("Avg. completion time (12 months)")).toBeInTheDocument();
  });
});
