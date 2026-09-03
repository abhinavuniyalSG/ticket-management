import type { DashboardMetrics, DashboardPeriod } from "../../types/dashboard";
import { DASHBOARD_PERIOD_WINDOW_LABELS } from "../../constants/options";

interface DashboardStatsProps {
  metrics: DashboardMetrics;
  period: DashboardPeriod;
}

export function DashboardStats({ metrics, period }: DashboardStatsProps) {
  const tiles: Array<{ label: string; value: string }> = [
    { label: "Total tickets", value: String(metrics.totalTickets) },
    { label: "Open", value: String(metrics.openTickets) },
    { label: "Assigned", value: String(metrics.assignedTickets) },
    { label: "In progress", value: String(metrics.inProgressTickets) },
    { label: "In review", value: String(metrics.reviewTickets) },
    { label: "Completed", value: String(metrics.completedTickets) },
    { label: "Closed", value: String(metrics.closedTickets) },
    {
      label: `Avg. completion time (${DASHBOARD_PERIOD_WINDOW_LABELS[period]})`,
      value: `${metrics.productivity.averageCompletionTimeHours.toFixed(1)}h`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {tile.label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}
