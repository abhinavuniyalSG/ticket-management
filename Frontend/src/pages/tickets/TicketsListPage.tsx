import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Select } from "../../components/atoms/Select";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { Tooltip } from "../../components/atoms/Tooltip";
import { Spinner } from "../../components/atoms/Spinner";
import { SearchInput } from "../../components/molecules/SearchInput";
import { EmptyState } from "../../components/molecules/EmptyState";
import { ErrorState } from "../../components/molecules/ErrorState";
import { Pagination } from "../../components/molecules/Pagination";
import { TicketTable } from "../../components/organisms/TicketTable";
import { CLOSE_ICON, FILTER_ICON, PLUS_ICON } from "../../components/organisms/navIcons";
import { ticketService } from "../../services/ticketService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, type PaginationMeta } from "../../types/api";
import type {
  Ticket,
  TicketPriority,
  TicketQueryParams,
  TicketStatus,
} from "../../types/ticket";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";
import {
  DEFAULT_PAGE_SIZE,
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
  // react-select's rich internal markup makes an implicit wrapping <label>
  // an unreliable way to name the control (its accessible name ends up
  // concatenating the placeholder/value text too), so give the field an
  // explicit aria-label instead of relying on the wrap alone.
  const field = isValidElement<{ "aria-label"?: string }>(children)
    ? cloneElement(children, { "aria-label": children.props["aria-label"] ?? label })
    : children;

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      {field}
    </label>
  );
}

function toIsoStart(date: string): string | undefined {
  return date ? new Date(`${date}T00:00:00.000Z`).toISOString() : undefined;
}

function toIsoEnd(date: string): string | undefined {
  return date ? new Date(`${date}T23:59:59.999Z`).toISOString() : undefined;
}

/** Reads the filters straight from the URL so a bookmarked/shared/refreshed
 * link reproduces the same view instead of always starting from scratch. */
function filtersFromSearchParams(params: URLSearchParams): FilterState {
  return {
    title: params.get("title") ?? EMPTY_FILTERS.title,
    status: params.get("status") ?? EMPTY_FILTERS.status,
    priority: params.get("priority") ?? EMPTY_FILTERS.priority,
    departmentId: params.get("departmentId") ?? EMPTY_FILTERS.departmentId,
    assignedToId: params.get("assignedToId") ?? EMPTY_FILTERS.assignedToId,
    createdById: params.get("createdById") ?? EMPTY_FILTERS.createdById,
    createdFrom: params.get("createdFrom") ?? EMPTY_FILTERS.createdFrom,
    createdTo: params.get("createdTo") ?? EMPTY_FILTERS.createdTo,
    sortBy: params.get("sortBy") ?? EMPTY_FILTERS.sortBy,
    sortOrder: params.get("sortOrder") ?? EMPTY_FILTERS.sortOrder,
  };
}

function pageFromSearchParams(params: URLSearchParams): number {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function TicketsListPage() {
  const { user } = useAuth();
  const canSeeUserFilters =
    user?.role === "admin" || user?.role === "super_admin";

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() =>
    filtersFromSearchParams(searchParams),
  );
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(() => pageFromSearchParams(searchParams));
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

  const filterQuery = useMemo<TicketQueryParams>(
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

  // Any filter change starts the results back over at page 1 - but not on
  // the very first render, which would otherwise stomp on a page number
  // that was just read from the URL (e.g. a bookmarked or refreshed link).
  const isFirstFilterQuery = useRef(true);
  useEffect(() => {
    if (isFirstFilterQuery.current) {
      isFirstFilterQuery.current = false;
      return;
    }
    setPage(1);
  }, [filterQuery]);

  // Keeps the URL in sync with the current filters/page so the view can be
  // bookmarked or shared, and survives a refresh instead of always resetting
  // to page 1. Uses replace so filtering/paging doesn't flood browser history.
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters) as [keyof FilterState, string][]) {
      if (value && value !== EMPTY_FILTERS[key]) {
        params.set(key, value);
      }
    }
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const query = useMemo<TicketQueryParams>(
    () => ({ ...filterQuery, page, limit: DEFAULT_PAGE_SIZE }),
    [filterQuery, page],
  );

  const loadTickets = () => {
    setIsLoading(true);
    setError(null);
    ticketService
      .list(query)
      .then((res) => {
        setTickets(res.tickets);
        setPagination(res.pagination);
      })
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
  // Title now has its own always-visible search box (matching Users/
  // Departments), so it isn't counted in the "Filters (n)" badge, which is
  // only meant to hint at filters hidden inside the collapsed panel.
  const hiddenFilterCount = Object.entries(filters).filter(
    ([key, value]) => !["title", "sortBy", "sortOrder"].includes(key) && value !== "",
  ).length;
  const filtersButtonLabel = isFiltersOpen
    ? "Hide filters"
    : hiddenFilterCount > 0
      ? `Filters (${hiddenFilterCount})`
      : "Filters";

  // A regular user's tickets are already scoped server-side to ones they created
  // or are assigned to, so there's no one else to filter by - just themselves.
  const userFilterOptions = canSeeUserFilters
    ? users.map((u) => ({ value: u.id, label: fullName(u) }))
    : user
      ? [{ value: user.id, label: fullName(user) }]
      : [];

  return (
    <PageContainer>
      <PageHeader
        title="Tickets"
        description="View and manage support tickets."
        actions={
          <>
            <SearchInput
              label="Search tickets by title"
              placeholder="Search by title"
              value={filters.title}
              onChange={(e) => setFilter("title")(e.target.value)}
              className="w-39.75 shrink-0"
            />
            <Tooltip label={filtersButtonLabel} className="shrink-0">
              <Button
                variant="secondary"
                className="relative"
                aria-label={filtersButtonLabel}
                onClick={() => setIsFiltersOpen((prev) => !prev)}
              >
                {isFiltersOpen ? CLOSE_ICON : FILTER_ICON}
                {!isFiltersOpen && hiddenFilterCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white"
                  >
                    {hiddenFilterCount}
                  </span>
                )}
              </Button>
            </Tooltip>
            <Tooltip label="New ticket" className="shrink-0">
              <Link
                to="/tickets/new"
                aria-label="New ticket"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/25 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {PLUS_ICON}
              </Link>
            </Tooltip>
          </>
        }
      />

      {isFiltersOpen && (
        <div className="mb-5 shadow-soft rounded-xl border border-slate-200/80 bg-white p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <FilterField label="Status">
              <Select
                placeholder="All"
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
                placeholder="All"
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
                placeholder="All"
                value={filters.departmentId}
                options={departments.map((d) => ({
                  value: d.departmentId,
                  label: d.departmentName,
                }))}
                onChange={(e) => setFilter("departmentId")(e.target.value)}
              />
            </FilterField>
            <FilterField label="AssignedTo">
              <Select
                placeholder="All"
                value={filters.assignedToId}
                options={userFilterOptions}
                onChange={(e) => setFilter("assignedToId")(e.target.value)}
              />
            </FilterField>
            <FilterField label="Creator">
              <Select
                placeholder="All"
                value={filters.createdById}
                options={userFilterOptions}
                onChange={(e) => setFilter("createdById")(e.target.value)}
              />
            </FilterField>
            <FilterField label="Created from">
              <Input
                type="date"
                value={filters.createdFrom}
                onChange={(e) => setFilter("createdFrom")(e.target.value)}
                className={filters.createdFrom ? "" : "text-slate-400!"}
              />
            </FilterField>
            <FilterField label="Created to">
              <Input
                type="date"
                value={filters.createdTo}
                onChange={(e) => setFilter("createdTo")(e.target.value)}
                className={filters.createdTo ? "" : "text-slate-400!"}
              />
            </FilterField>
            <FilterField label="Sort by">
              <Select
                value={filters.sortBy}
                options={Object.entries(SORT_BY_LABELS).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(e) => setFilter("sortBy")(e.target.value)}
                muted
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
                muted
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
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/25 active:scale-[0.98]"
              >
                New ticket
              </Link>
            )
          }
        />
      )}

      {!isLoading && !error && tickets && tickets.length > 0 && (
        <>
          <TicketTable tickets={tickets} />
          {/* Grows to fill any leftover height so pagination sits at the
              bottom of the page even when the list is short (e.g. a single
              result); collapses to nothing once the list already fills it. */}
          <div className="flex-1" />
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </PageContainer>
  );
}
