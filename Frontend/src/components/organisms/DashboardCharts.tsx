import { DASHBOARD_PERIOD_WINDOW_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "../../constants/options";
import type {
  DashboardPeriod,
  PriorityDistributionEntry,
  StatusDistributionEntry,
  TicketsOverTimeEntry,
} from "../../types/dashboard";
import type { TicketPriority, TicketStatus } from "../../types/ticket";

const PERIOD_RANGE_PHRASE: Record<DashboardPeriod, string> = {
  week: "per day over the last 7 days",
  month: "per day over the last 30 days",
  year: "per month over the last 12 months",
};

function formatBucketLabel(dateStr: string, period: DashboardPeriod): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(
    undefined,
    period === "year"
      ? { month: "short", timeZone: "UTC" }
      : { month: "short", day: "numeric", timeZone: "UTC" },
  );
}

function formatAccessibleBucketLabel(dateStr: string, period: DashboardPeriod): string {
  if (period !== "year") return dateStr;
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "#64748b",
  assigned: "#3b82f6",
  in_progress: "#f59e0b",
  reviewed: "#8b5cf6",
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

function TrendChart({ data, period }: { data: TicketsOverTimeEntry[]; period: DashboardPeriod }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.created, d.closed]));
  const width = 560;
  const height = 200;
  const paddingLeft = 32;
  const paddingBottom = 24;
  const chartWidth = width - paddingLeft - 8;
  const chartHeight = height - paddingBottom - 8;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(18, groupWidth / 3);
  const minLabelWidth = period === "year" ? 24 : 40;
  const labelStep = Math.max(1, Math.ceil(minLabelWidth / groupWidth));

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Tickets over time ({DASHBOARD_PERIOD_WINDOW_LABELS[period]})
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full bg-blue-500"
              aria-hidden="true"
            />
            Created
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full bg-green-500"
              aria-hidden="true"
            />
            Closed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={`Bar chart of tickets created and closed ${PERIOD_RANGE_PHRASE[period]}`}
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
          <text
            x={4}
            y={height - paddingBottom + 4}
            className="fill-slate-400 text-[9px]"
          >
            0
          </text>

          {data.map((entry, index) => {
            const groupX = paddingLeft + index * groupWidth;
            const createdHeight = (entry.created / max) * chartHeight;
            const closedHeight = (entry.closed / max) * chartHeight;
            const showLabel = index === data.length - 1 || index % labelStep === 0;
            const label = showLabel ? formatBucketLabel(entry.date, period) : null;

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
                {label !== null && (
                  <text
                    x={groupX + groupWidth / 2}
                    y={height - 6}
                    textAnchor="middle"
                    className="fill-slate-500 text-[9px]"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sr-only">
        <table>
          <caption>
            Tickets created and closed {PERIOD_RANGE_PHRASE[period]}
          </caption>
          <thead>
            <tr>
              <th scope="col">{period === "year" ? "Month" : "Date"}</th>
              <th scope="col">Created</th>
              <th scope="col">Closed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.date}>
                <td>{formatAccessibleBucketLabel(entry.date, period)}</td>
                <td>{entry.created}</td>
                <td>{entry.closed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface DashboardChartsProps {
  statusDistribution: StatusDistributionEntry[];
  priorityDistribution: PriorityDistributionEntry[];
  ticketsOverTime: TicketsOverTimeEntry[];
  period: DashboardPeriod;
}

export function DashboardCharts({
  statusDistribution,
  priorityDistribution,
  ticketsOverTime,
  period,
}: DashboardChartsProps) {
  return (
    <div className="flex flex-col gap-4">
      <TrendChart data={ticketsOverTime} period={period} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistributionBars
          title="Status distribution"
          entries={statusDistribution.map((e) => ({
            key: e.status,
            count: e.count,
          }))}
          colors={STATUS_COLORS}
          labels={STATUS_LABELS}
        />
        <DistributionBars
          title="Priority distribution"
          entries={priorityDistribution.map((e) => ({
            key: e.priority,
            count: e.count,
          }))}
          colors={PRIORITY_COLORS}
          labels={PRIORITY_LABELS}
        />
      </div>
    </div>
  );
}
