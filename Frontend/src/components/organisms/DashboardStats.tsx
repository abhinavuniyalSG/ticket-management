import type { DashboardMetrics } from "../../types/dashboard";

interface DashboardStatsProps {
  metrics: DashboardMetrics;
}

export function DashboardStats({ metrics }: DashboardStatsProps) {
  const tiles: Array<{ label: string; value: string }> = [
    { label: "Total tickets", value: String(metrics.totalTickets) },
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
