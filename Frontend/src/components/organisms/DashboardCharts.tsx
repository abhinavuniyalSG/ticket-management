import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DASHBOARD_PERIOD_WINDOW_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "../../constants/options";
import type {
  DashboardPeriod,
  PriorityDistributionEntry,
  StatusDistributionEntry,
  TicketsOverTimeEntry,
} from "../../types/dashboard";
import type { TicketPriority, TicketStatus } from "../../types/ticket";

const PERIOD_RANGE_PHRASE: Record<DashboardPeriod, string> = {
  day: "per day over the last 7 days",
  week: "per week over the last 4 weeks",
  month: "per month over the last 12 months",
  year: "per year",
};

/**
 * `date` is 'YYYY-MM-DD' for day/week (a day, or a week's Monday), 'YYYY-MM'
 * for month, and 'YYYY' for year - see the backend's ticketsOverTime docs.
 * Month labels are month-only (no year): the chart shows the spanned years
 * once each instead, bookending the axis - see the year-range row below.
 */
function formatBucketLabel(dateStr: string, period: DashboardPeriod): string {
  if (period === "year") return dateStr;
  const date = new Date(dateStr);
  return date.toLocaleDateString(
    undefined,
    period === "month"
      ? { month: "short", timeZone: "UTC" }
      : { month: "short", day: "numeric", timeZone: "UTC" },
  );
}

function yearOf(dateStr: string): number {
  return new Date(dateStr).getUTCFullYear();
}

function formatAccessibleBucketLabel(
  dateStr: string,
  period: DashboardPeriod,
): string {
  if (period !== "month") return dateStr;
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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

const AXIS_TICK_STYLE = { fontSize: 10, fill: "#94a3b8" };
const COUNT_LABEL_STYLE = { fill: "#334155", fontSize: 12, fontWeight: 600 };

function DistributionChart<T extends string>({
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
  const chartData = entries.map((entry) => ({
    key: entry.key,
    label: labels[entry.key],
    count: entry.count,
  }));
  const chartHeight = Math.max(chartData.length * 44, 1);

  return (
    <div className="shadow-soft rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {chartData.length === 0 ? (
        <p className="mt-4 text-xs text-slate-400">No data yet.</p>
      ) : (
        <div className="mt-4" style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 28, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                width={88}
                tick={{ fontSize: 12, fill: "#475569" }}
              />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                isAnimationActive={false}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={colors[entry.key]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  style={COUNT_LABEL_STYLE}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TrendChart({
  data,
  period,
}: {
  data: TicketsOverTimeEntry[];
  period: DashboardPeriod;
}) {
  const chartData = data.map((entry) => ({
    date: entry.date,
    label: formatBucketLabel(entry.date, period),
    created: entry.created,
    closed: entry.closed,
  }));

  return (
    <div className="shadow-soft rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">
        Tickets over time ({DASHBOARD_PERIOD_WINDOW_LABELS[period]})
      </h3>

      <div
        data-testid="tickets-trend-chart"
        className="mt-3"
        style={{ width: "100%", height: 240 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barGap={2}
          >
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={AXIS_TICK_STYLE}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
              tick={AXIS_TICK_STYLE}
            />
            <Tooltip cursor={{ fill: "#f8fafc" }} />
            <Legend
              verticalAlign="top"
              align="right"
              height={28}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: "#475569" }}
            />
            <Bar
              dataKey="created"
              name="Created"
              fill="#4f46e5"
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            />
            <Bar
              dataKey="closed"
              name="Closed"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {period === "month" && data.length > 0 && (
        <div className="mt-1 flex justify-between px-7 text-[10px] font-medium text-slate-400">
          <span>{yearOf(data[0]!.date)}</span>
          <span>{yearOf(data[data.length - 1]!.date)}</span>
        </div>
      )}

      <div className="sr-only">
        <table>
          <caption>
            Tickets created and closed {PERIOD_RANGE_PHRASE[period]}
          </caption>
          <thead>
            <tr>
              <th scope="col">
                {period === "year"
                  ? "Year"
                  : period === "month"
                    ? "Month"
                    : "Date"}
              </th>
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
        <DistributionChart
          title="Status distribution"
          entries={statusDistribution.map((e) => ({
            key: e.status,
            count: e.count,
          }))}
          colors={STATUS_COLORS}
          labels={STATUS_LABELS}
        />
        <DistributionChart
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
