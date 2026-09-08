import type { DashboardMetrics, DashboardPeriod } from "../../types/dashboard";

interface DashboardStatsProps {
  metrics: DashboardMetrics;
}

const TOTAL_TICKETS_LABEL: Record<DashboardPeriod, string> = {
  day: "Total tickets created today",
  week: "Total tickets created this week",
  month: "Total tickets created this month",
  year: "Total tickets created this year",
};

export function DashboardStats({ metrics }: DashboardStatsProps) {
  const tiles: Array<{ label: string; value: string }> = [
    { label: TOTAL_TICKETS_LABEL[metrics.period], value: String(metrics.totalTicketsCreated) },
    { label: "Open", value: String(metrics.openTickets) },
    { label: "Assigned", value: String(metrics.assignedTickets) },
    { label: "In progress", value: String(metrics.inProgressTickets) },
    { label: "Reviewed", value: String(metrics.reviewedTickets) },
    { label: "Completed", value: String(metrics.completedTickets) },
    { label: "Closed", value: String(metrics.closedTickets) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="shadow-soft hover:shadow-card rounded-xl border border-slate-200/80 bg-white p-4 transition-shadow"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {tile.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}
