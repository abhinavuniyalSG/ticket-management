import { useEffect, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { Select } from "../components/atoms/Select";
import { Spinner } from "../components/atoms/Spinner";
import { ErrorState } from "../components/molecules/ErrorState";
import { DashboardStats } from "../components/organisms/DashboardStats";
import { DashboardCharts } from "../components/organisms/DashboardCharts";
import { dashboardService } from "../services/dashboardService";
import { departmentService } from "../services/departmentService";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../types/api";
import { DASHBOARD_PERIODS, DASHBOARD_PERIOD_LABELS } from "../constants/options";
import type {
  DashboardMetrics,
  DashboardOverview,
  DashboardPeriod,
  StatusDistributionEntry,
} from "../types/dashboard";
import type { Department } from "../types/department";

function PeriodToggle({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Select time range"
      className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5"
    >
      {DASHBOARD_PERIODS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            value === option
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {DASHBOARD_PERIOD_LABELS[option]}
        </button>
      ))}
    </div>
  );
}

/** `/dashboard/overview` has no statusDistribution array; it's rebuilt from its per-status counts. */
function statusDistributionFrom(overview: DashboardOverview): StatusDistributionEntry[] {
  return [
    { status: "open", count: overview.openTickets },
    { status: "assigned", count: overview.assignedTickets },
    { status: "in_progress", count: overview.inProgressTickets },
    { status: "reviewed", count: overview.reviewedTickets },
    { status: "completed", count: overview.completedTickets },
    { status: "closed", count: overview.closedDateToday },
  ];
}

export function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const canFilterByDepartment = isSuperAdmin || user?.role === "admin";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [period, setPeriod] = useState<DashboardPeriod>("day");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canFilterByDepartment) return;
    departmentService
      .list()
      .then((res) => setDepartments(res.departments))
      .catch(() => undefined);
  }, [canFilterByDepartment]);

  // An admin may manage more than one department; only offer those in their picker.
  const selectableDepartments = isSuperAdmin
    ? departments
    : departments.filter((d) => d.managedBy === user?.id);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const scopedDepartmentId =
      canFilterByDepartment && departmentId ? departmentId : undefined;

    // Both routes share the same department/period scoping, so one selection
    // drives both calls: overview for the counts (and status distribution,
    // rebuilt from them), the scoped dashboard for priority distribution and
    // the trend, which overview doesn't return.
    Promise.all([
      dashboardService.getOverview(scopedDepartmentId, period),
      dashboardService.get(scopedDepartmentId, period),
    ])
      .then(([overview, dashboard]) => {
        if (cancelled) return;
        setMetrics({
          message: dashboard.message,
          departmentId: overview.departmentId,
          period: overview.period,
          totalTicketsCreatedToday: overview.totalTicketsCreatedToday,
          openTickets: overview.openTickets,
          assignedTickets: overview.assignedTickets,
          inProgressTickets: overview.inProgressTickets,
          reviewedTickets: overview.reviewedTickets,
          completedTickets: overview.completedTickets,
          closedDateToday: overview.closedDateToday,
          statusDistribution: statusDistributionFrom(overview),
          priorityDistribution: dashboard.priorityDistribution,
          ticketsOverTime: dashboard.ticketsOverTime,
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load dashboard data.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canFilterByDepartment, departmentId, period]);

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={
          isSuperAdmin
            ? "System-wide ticket overview."
            : "Your department's ticket overview."
        }
        actions={
          <>
            <PeriodToggle value={period} onChange={setPeriod} />
            {canFilterByDepartment && (
              <Select
                aria-label="Filter dashboard by department"
                placeholder={isSuperAdmin ? "All departments" : "Default department"}
                value={departmentId}
                options={selectableDepartments.map((d) => ({
                  value: d.departmentId,
                  label: d.departmentName,
                }))}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-40 shrink-0"
              />
            )}
          </>
        }
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && error && <ErrorState message={error} />}

      {!isLoading && !error && metrics && (
        <div className="flex flex-col gap-6">
          <DashboardStats metrics={metrics} />
          <DashboardCharts
            statusDistribution={metrics.statusDistribution}
            priorityDistribution={metrics.priorityDistribution}
            ticketsOverTime={metrics.ticketsOverTime}
            period={period}
          />
        </div>
      )}
    </PageContainer>
  );
}
