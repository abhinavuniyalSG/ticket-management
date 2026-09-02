import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import type { DashboardMetrics, DepartmentBreakdown } from "../types/dashboard";
import type { Department } from "../types/department";

export function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [breakdown, setBreakdown] = useState<DepartmentBreakdown[] | null>(null);
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
    setIsLoading(true);
    setError(null);

    const requests: Promise<unknown>[] = [
      dashboardService.get(isSuperAdmin ? departmentId || undefined : undefined).then(setMetrics),
    ];

    if (isSuperAdmin && !departmentId) {
      requests.push(dashboardService.getOverview().then((res) => setBreakdown(res.departments)));
    } else {
      setBreakdown(null);
    }

    Promise.all(requests)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load dashboard data.");
      })
      .finally(() => setIsLoading(false));
  }, [isSuperAdmin, departmentId]);

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={isSuperAdmin ? "System-wide ticket overview." : "Your department's ticket overview."}
        actions={
          isSuperAdmin ? (
            <Select
              aria-label="Filter dashboard by department"
              placeholder="All departments"
              value={departmentId}
              options={departments.map((d) => ({ value: d.departmentId, label: d.departmentName }))}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="min-w-[200px]"
            />
          ) : undefined
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
          />

          {breakdown && breakdown.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Department comparison</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-slate-600">
                        Department
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium text-slate-600">
                        Total tickets
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium text-slate-600">
                        Avg. completion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakdown.map((row) => (
                      <tr key={row.departmentId} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <Link
                            to={`/departments/${row.departmentId}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {row.departmentName}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">{row.totalTickets}</td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          {row.productivity.averageCompletionTimeHours.toFixed(1)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
