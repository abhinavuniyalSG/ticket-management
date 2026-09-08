import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DashboardCharts } from "../DashboardCharts";
import type {
  PriorityDistributionEntry,
  StatusDistributionEntry,
  TicketsOverTimeEntry,
} from "../../../types/dashboard";

function makeStatusEntry(
  overrides: Partial<StatusDistributionEntry> = {},
): StatusDistributionEntry {
  return { status: "open", count: 4, ...overrides };
}

function makePriorityEntry(
  overrides: Partial<PriorityDistributionEntry> = {},
): PriorityDistributionEntry {
  return { priority: "high", count: 3, ...overrides };
}

function makeTrendEntry(
  overrides: Partial<TicketsOverTimeEntry> = {},
): TicketsOverTimeEntry {
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

    const section = screen
      .getByText("Status distribution")
      .closest("div") as HTMLElement;
    expect(within(section).getByText("Open")).toBeInTheDocument();
    expect(within(section).getByText("4")).toBeInTheDocument();
    expect(within(section).getByText("Closed")).toBeInTheDocument();
    expect(within(section).getByText("9")).toBeInTheDocument();
  });

  it("colors each status bar to match the app's fixed status color", () => {
    render(
      <DashboardCharts
        statusDistribution={[
          makeStatusEntry({ status: "open", count: 4 }),
          makeStatusEntry({ status: "completed", count: 2 }),
        ]}
        priorityDistribution={[]}
        ticketsOverTime={[]}
        period="week"
      />,
    );

    const section = screen
      .getByText("Status distribution")
      .closest("div") as HTMLElement;
    const bars = section.querySelectorAll(".recharts-bar-rectangle path");
    const fills = Array.from(bars).map((bar) => bar.getAttribute("fill"));
    expect(fills).toEqual(expect.arrayContaining(["#64748b", "#22c55e"]));
  });

  it("shows a 'no data yet' message instead of an empty chart", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[]}
        period="week"
      />,
    );

    const section = screen
      .getByText("Status distribution")
      .closest("div") as HTMLElement;
    expect(within(section).getByText("No data yet.")).toBeInTheDocument();
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

    const section = screen
      .getByText("Priority distribution")
      .closest("div") as HTMLElement;
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

    expect(
      screen.getByText("Tickets over time (12 months)"),
    ).toBeInTheDocument();
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

  it("renders the trend chart with a Created/Closed legend", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[makeTrendEntry({ date: "2024" })]}
        period="year"
      />,
    );

    const chart = screen.getByTestId("tickets-trend-chart");
    expect(chart.querySelector("svg.recharts-surface")).toBeInTheDocument();
    expect(within(chart).getByText("Created")).toBeInTheDocument();
    expect(within(chart).getByText("Closed")).toBeInTheDocument();
  });

  it("shows a full month and year in the accessible table for the month period", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[makeTrendEntry({ date: "2024-03" })]}
        period="month"
      />,
    );

    const table = screen.getByRole("table");
    expect(within(table).getByText("March 2024")).toBeInTheDocument();
  });

  it("shows the bare year in the accessible table for the year period", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[makeTrendEntry({ date: "2024" })]}
        period="year"
      />,
    );

    const table = screen.getByRole("table");
    expect(within(table).getByText("2024")).toBeInTheDocument();
  });

  it("labels each bar with just the month, not the year, for the month period", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[
          makeTrendEntry({ date: "2025-12" }),
          makeTrendEntry({ date: "2026-01" }),
        ]}
        period="month"
      />,
    );

    // Scoped to the chart itself: recharts also leaves a singleton
    // `#recharts_measurement_span` on `document.body` (used to measure tick
    // text width) whose leftover content can otherwise also match "Dec".
    const chart = screen.getByTestId("tickets-trend-chart");
    expect(within(chart).getByText("Dec")).toBeInTheDocument();
    expect(within(chart).getByText("Jan")).toBeInTheDocument();
    expect(within(chart).queryByText("Dec 2025")).not.toBeInTheDocument();
    expect(within(chart).queryByText("Jan 2026")).not.toBeInTheDocument();
  });

  it("bookends the month trend chart with the first and last entries' years", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[
          makeTrendEntry({ date: "2025-12" }),
          makeTrendEntry({ date: "2026-01" }),
        ]}
        period="month"
      />,
    );

    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  it("doesn't show year bookends for non-month periods", () => {
    render(
      <DashboardCharts
        statusDistribution={[]}
        priorityDistribution={[]}
        ticketsOverTime={[
          makeTrendEntry({ date: "2025-12-29" }),
          makeTrendEntry({ date: "2026-01-05" }),
        ]}
        period="week"
      />,
    );

    expect(screen.queryByText("2025")).not.toBeInTheDocument();
    expect(screen.queryByText("2026")).not.toBeInTheDocument();
  });
});
