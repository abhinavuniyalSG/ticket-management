import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Select } from "../../components/atoms/Select";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { Spinner } from "../../components/atoms/Spinner";
import { EmptyState } from "../../components/molecules/EmptyState";
import { ErrorState } from "../../components/molecules/ErrorState";
import { TicketTable } from "../../components/organisms/TicketTable";
import { ticketService } from "../../services/ticketService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../types/api";
import type {
  Ticket,
  TicketPriority,
  TicketQueryParams,
  TicketStatus,
} from "../../types/ticket";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";
import {
  SORT_BY_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from "../../constants/options";
import { fullName } from "../../utils/format";

interface FilterState {
  title: string;
  status: string;
  priority: string;
  departmentId: string;
  assignedToId: string;
  createdById: string;
  createdFrom: string;
  createdTo: string;
  sortBy: string;
  sortOrder: string;
}

const EMPTY_FILTERS: FilterState = {
  title: "",
  status: "",
  priority: "",
  departmentId: "",
  assignedToId: "",
  createdById: "",
  createdFrom: "",
  createdTo: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      <span>{label}</span>
      {children}
    </label>
  );
}

function toIsoStart(date: string): string | undefined {
  return date ? new Date(`${date}T00:00:00.000Z`).toISOString() : undefined;
}

function toIsoEnd(date: string): string | undefined {
  return date ? new Date(`${date}T23:59:59.999Z`).toISOString() : undefined;
}

export function TicketsListPage() {
  const { user } = useAuth();
  const canSeeUserFilters =
    user?.role === "admin" || user?.role === "super_admin";

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    departmentService
      .list()
      .then((res) => setDepartments(res.departments))
      .catch(() => undefined);

    if (canSeeUserFilters) {
      userService
        .list()
        .then((res) => setUsers(res.users))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeUserFilters]);

  const debouncedTitle = useDebouncedValue(filters.title);

  const query = useMemo<TicketQueryParams>(
    () => ({
      title: debouncedTitle.trim() || undefined,
      status: (filters.status || undefined) as TicketStatus | undefined,
      priority: (filters.priority || undefined) as TicketPriority | undefined,
      departmentId: filters.departmentId || undefined,
      assignedToId: filters.assignedToId || undefined,
      createdById: filters.createdById || undefined,
      createdFrom: toIsoStart(filters.createdFrom),
      createdTo: toIsoEnd(filters.createdTo),
      sortBy: filters.sortBy as TicketQueryParams["sortBy"],
      sortOrder: filters.sortOrder as TicketQueryParams["sortOrder"],
    }),
    [
      debouncedTitle,
      filters.status,
      filters.priority,
      filters.departmentId,
      filters.assignedToId,
      filters.createdById,
      filters.createdFrom,
      filters.createdTo,
      filters.sortBy,
      filters.sortOrder,
    ],
  );

  const loadTickets = () => {
    setIsLoading(true);
    setError(null);
    ticketService
      .list(query)
      .then((res) => setTickets(res.tickets))
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : "Unable to load tickets.",
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const setFilter = (field: keyof FilterState) => (value: string) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => !["sortBy", "sortOrder"].includes(key) && value !== "",
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Tickets"
        description="View and manage support tickets."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
            >
              {isFiltersOpen ? "Hide filters" : "Filters"}
              {!isFiltersOpen && hasActiveFilters
                ? ` (${activeFilterCount})`
                : ""}
            </Button>
            <Link
              to="/tickets/new"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              New ticket
            </Link>
          </>
        }
      />

      {isFiltersOpen && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <FilterField label="Title">
              <Input
                type="text"
                placeholder="Search by title"
                value={filters.title}
                onChange={(e) => setFilter("title")(e.target.value)}
              />
            </FilterField>
            <FilterField label="Status">
              <Select
                placeholder="All statuses"
                value={filters.status}
                options={TICKET_STATUSES.map((s) => ({
                  value: s,
                  label: STATUS_LABELS[s],
                }))}
                onChange={(e) => setFilter("status")(e.target.value)}
              />
            </FilterField>
            <FilterField label="Priority">
              <Select
                placeholder="All priorities"
                value={filters.priority}
                options={TICKET_PRIORITIES.map((p) => ({
                  value: p,
                  label: PRIORITY_LABELS[p],
                }))}
                onChange={(e) => setFilter("priority")(e.target.value)}
              />
            </FilterField>
            <FilterField label="Department">
              <Select
                placeholder="All departments"
                value={filters.departmentId}
                options={departments.map((d) => ({
                  value: d.departmentId,
                  label: d.departmentName,
                }))}
                onChange={(e) => setFilter("departmentId")(e.target.value)}
              />
            </FilterField>
            {canSeeUserFilters && (
              <FilterField label="Assignee">
                <Select
                  placeholder="All assignees"
                  value={filters.assignedToId}
                  options={users.map((u) => ({
                    value: u.id,
                    label: fullName(u),
                  }))}
                  onChange={(e) => setFilter("assignedToId")(e.target.value)}
                />
              </FilterField>
            )}
            {canSeeUserFilters && (
              <FilterField label="Creator">
                <Select
                  placeholder="All creators"
                  value={filters.createdById}
                  options={users.map((u) => ({
                    value: u.id,
                    label: fullName(u),
                  }))}
                  onChange={(e) => setFilter("createdById")(e.target.value)}
                />
              </FilterField>
            )}
            <FilterField label="Created from">
              <Input
                type="date"
                value={filters.createdFrom}
                onChange={(e) => setFilter("createdFrom")(e.target.value)}
              />
            </FilterField>
            <FilterField label="Created to">
              <Input
                type="date"
                value={filters.createdTo}
                onChange={(e) => setFilter("createdTo")(e.target.value)}
              />
            </FilterField>
            <FilterField label="Sort by">
              <Select
                value={filters.sortBy}
                options={Object.entries(SORT_BY_LABELS).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(e) => setFilter("sortBy")(e.target.value)}
              />
            </FilterField>
            <FilterField label="Sort order">
              <Select
                value={filters.sortOrder}
                options={[
                  { value: "desc", label: "Descending" },
                  { value: "asc", label: "Ascending" },
                ]}
                onChange={(e) => setFilter("sortOrder")(e.target.value)}
              />
            </FilterField>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="secondary"
              disabled={!hasActiveFilters}
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="border-slate-300 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-400"
            >
              Reset filters
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && error && (
        <ErrorState message={error} onRetry={loadTickets} />
      )}

      {!isLoading && !error && tickets && tickets.length === 0 && (
        <EmptyState
          title="No tickets found"
          description={
            hasActiveFilters
              ? "Try adjusting or resetting your filters."
              : "Create your first ticket to get started."
          }
          action={
            hasActiveFilters ? (
              <Button
                variant="secondary"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                Reset filters
              </Button>
            ) : (
              <Link
                to="/tickets/new"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                New ticket
              </Link>
            )
          }
        />
      )}

      {!isLoading && !error && tickets && tickets.length > 0 && (
        <TicketTable tickets={tickets} />
      )}
    </PageContainer>
  );
}
