import { PRIORITY_LABELS, STATUS_LABELS } from "../../constants/options";
import type {
  PriorityDistributionEntry,
  StatusDistributionEntry,
  TicketsOverTimeEntry,
} from "../../types/dashboard";
import type { TicketPriority, TicketStatus } from "../../types/ticket";

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "#64748b",
  assigned: "#3b82f6",
  in_progress: "#f59e0b",
  review: "#8b5cf6",
  completed: "#22c55e",
  closed: "#6b7280",
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: "#94a3b8",
  medium: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

function DistributionBars<T extends string>({
  title,
  entries,
  colors,
  labels,
}: {
  title: string;
  entries: Array<{ key: T; count: number }>;
  colors: Record<T, string>;
  labels: Record<T, string>;
}) {
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs font-medium text-slate-600">
              {labels[entry.key]}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(entry.count / max) * 100}%`,
                  backgroundColor: colors[entry.key],
                }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-xs font-semibold text-slate-700">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendChart({ data }: { data: TicketsOverTimeEntry[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.created, d.closed]));
  const width = 560;
  const height = 200;
  const paddingLeft = 32;
  const paddingBottom = 24;
  const chartWidth = width - paddingLeft - 8;
  const chartHeight = height - paddingBottom - 8;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(18, groupWidth / 3);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Tickets over time (7 days)</h3>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" aria-hidden="true" />
            Created
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden="true" />
            Closed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label="Bar chart of tickets created and closed per day over the last 7 days"
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[420px]"
        >
          {gridLines.map((fraction) => {
            const y = 8 + chartHeight * (1 - fraction);
            return (
              <line
                key={fraction}
                x1={paddingLeft}
                x2={width - 8}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            );
          })}
          <text x={4} y={12} className="fill-slate-400 text-[9px]">
            {max}
          </text>
          <text x={4} y={height - paddingBottom + 4} className="fill-slate-400 text-[9px]">
            0
          </text>

          {data.map((entry, index) => {
            const groupX = paddingLeft + index * groupWidth;
            const createdHeight = (entry.created / max) * chartHeight;
            const closedHeight = (entry.closed / max) * chartHeight;
            const label = new Date(entry.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });

            return (
              <g key={entry.date}>
                <rect
                  x={groupX + groupWidth / 2 - barWidth - 2}
                  y={8 + chartHeight - createdHeight}
                  width={barWidth}
                  height={createdHeight}
                  rx={3}
                  fill="#3b82f6"
                />
                <rect
                  x={groupX + groupWidth / 2 + 2}
                  y={8 + chartHeight - closedHeight}
                  width={barWidth}
                  height={closedHeight}
                  rx={3}
                  fill="#22c55e"
                />
                <text
                  x={groupX + groupWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-slate-500 text-[9px]"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <table className="sr-only">
        <caption>Tickets created and closed per day over the last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Created</th>
            <th scope="col">Closed</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.date}>
              <td>{entry.date}</td>
              <td>{entry.created}</td>
              <td>{entry.closed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DashboardChartsProps {
  statusDistribution: StatusDistributionEntry[];
  priorityDistribution: PriorityDistributionEntry[];
  ticketsOverTime: TicketsOverTimeEntry[];
}

export function DashboardCharts({
  statusDistribution,
  priorityDistribution,
  ticketsOverTime,
}: DashboardChartsProps) {
  return (
    <div className="flex flex-col gap-4">
      <TrendChart data={ticketsOverTime} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistributionBars
          title="Status distribution"
          entries={statusDistribution.map((e) => ({ key: e.status, count: e.count }))}
          colors={STATUS_COLORS}
          labels={STATUS_LABELS}
        />
        <DistributionBars
          title="Priority distribution"
          entries={priorityDistribution.map((e) => ({ key: e.priority, count: e.count }))}
          colors={PRIORITY_COLORS}
          labels={PRIORITY_LABELS}
        />
      </div>
    </div>
  );
}
