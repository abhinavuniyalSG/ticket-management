import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DashboardCharts } from "./DashboardCharts";
import type {
  PriorityDistributionEntry,
  StatusDistributionEntry,
  TicketsOverTimeEntry,
} from "../../types/dashboard";

function makeStatusEntry(overrides: Partial<StatusDistributionEntry> = {}): StatusDistributionEntry {
  return { status: "open", count: 4, ...overrides };
}

function makePriorityEntry(
  overrides: Partial<PriorityDistributionEntry> = {},
): PriorityDistributionEntry {
  return { priority: "high", count: 3, ...overrides };
}

function makeTrendEntry(overrides: Partial<TicketsOverTimeEntry> = {}): TicketsOverTimeEntry {
  return { date: "2024-01-05", created: 5, closed: 2, ...overrides };
}

describe("DashboardCharts", () => {
  it("renders the status distribution with labels and counts", () => {
    render(
      <DashboardCharts
        statusDistribution={[
          makeStatusEntry({ status: "open", count: 4 }),
          makeStatusEntry({ status: "closed", count: 9 }),
        ]}
        priorityDistribution={[]}
        ticketsOverTime={[]}
        period="week"
      />,
    );

    const section = screen.getByText("Status distribution").closest("div") as HTMLElement;
    expect(within(section).getByText("Open")).toBeInTheDocument();
    expect(within(section).getByText("4")).toBeInTheDocument();
    expect(within(section).getByText("Closed")).toBeInTheDocument();
    expect(within(section).getByText("9")).toBeInTheDocument();
  });

  it("renders the priority distribution with labels and counts", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[
          makePriorityEntry({ priority: "high", count: 3 }),
          makePriorityEntry({ priority: "urgent", count: 7 }),
        ]}
        ticketsOverTime={[]}
        period="week"
      />,
    );

    const section = screen.getByText("Priority distribution").closest("div") as HTMLElement;
    expect(within(section).getByText("High")).toBeInTheDocument();
    expect(within(section).getByText("3")).toBeInTheDocument();
    expect(within(section).getByText("Urgent")).toBeInTheDocument();
    expect(within(section).getByText("7")).toBeInTheDocument();
  });

  it("shows the period-specific window label in the trend chart heading", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[]}
        period="month"
      />,
    );

    expect(screen.getByText("Tickets over time (30 days)")).toBeInTheDocument();
  });

  it("renders an accessible data table mirroring the chart's created/closed counts", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[
          makeTrendEntry({ date: "2024-01-01", created: 5, closed: 2 }),
          makeTrendEntry({ date: "2024-01-02", created: 8, closed: 6 }),
        ]}
        period="week"
      />,
    );

    const table = screen.getByRole("table");
    expect(within(table).getByRole("cell", { name: "5" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "2" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "8" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "6" })).toBeInTheDocument();
  });

  it("labels the chart svg for the given period", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[makeTrendEntry()]}
        period="year"
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Bar chart of tickets created and closed per month over the last 12 months",
      }),
    ).toBeInTheDocument();
  });

  it("shows a full month and year in the accessible table for the year period", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[makeTrendEntry({ date: "2024-03-15" })]}
        period="year"
      />,
    );

    const table = screen.getByRole("table");
    expect(within(table).getByText("March 2024")).toBeInTheDocument();
  });
});
