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
import {
  DASHBOARD_PERIODS,
  DASHBOARD_PERIOD_LABELS,
} from "../constants/options";
import type { DashboardMetrics, DashboardPeriod } from "../types/dashboard";
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
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {DASHBOARD_PERIOD_LABELS[option]}
        </button>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      departmentService
        .list()
        .then((res) => setDepartments(res.departments))
        .catch(() => undefined);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const request =
      isSuperAdmin && !departmentId
        ? dashboardService
            .getOverview(period)
            .then((res) => ({ message: res.message, ...res.systemWide }))
        : dashboardService.get(isSuperAdmin ? departmentId : undefined, period);

    request
      .then((res) => {
        if (!cancelled) setMetrics(res);
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
  }, [isSuperAdmin, departmentId, period]);

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
            {isSuperAdmin && (
              <Select
                aria-label="Filter dashboard by department"
                placeholder="All departments"
                value={departmentId}
                options={departments.map((d) => ({
                  value: d.departmentId,
                  label: d.departmentName,
                }))}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="min-w-[100px]"
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
