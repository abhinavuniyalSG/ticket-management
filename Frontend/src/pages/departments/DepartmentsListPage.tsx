import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { SearchInput } from "../../components/molecules/SearchInput";
import { IconButton } from "../../components/atoms/IconButton";
import { Spinner } from "../../components/atoms/Spinner";
import { EmptyState } from "../../components/molecules/EmptyState";
import { ErrorState } from "../../components/molecules/ErrorState";
import { ConfirmDialog } from "../../components/molecules/ConfirmDialog";
import { Pagination } from "../../components/molecules/Pagination";
import { DepartmentTable } from "../../components/organisms/DepartmentTable";
import { departmentService } from "../../services/departmentService";
import type { DepartmentQueryParams } from "../../services/departmentService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { ApiError, type PaginationMeta } from "../../types/api";
import type { Department } from "../../types/department";

export function DepartmentsListPage() {
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const filterQuery = useMemo<DepartmentQueryParams>(
    () => ({ departmentName: debouncedSearch.trim() || undefined }),
    [debouncedSearch],
  );

  // Any filter change starts the results back over at page 1.
  useEffect(() => {
    setPage(1);
  }, [filterQuery]);

  const query = useMemo<DepartmentQueryParams>(
    () => ({ ...filterQuery, page }),
    [filterQuery, page],
  );

  const loadDepartments = () => {
    setIsLoading(true);
    setError(null);
    departmentService
      .list(query)
      .then((res) => {
        setDepartments(res.departments);
        setPagination(res.pagination);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load departments.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await departmentService.remove(deleteTarget.departmentId);
      toast.success(res.message);
      setDepartments((prev) =>
        prev ? prev.filter((d) => d.departmentId !== deleteTarget.departmentId) : prev,
      );
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete department.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Departments"
        description="Manage departments and their managers."
        actions={
          <Link
            to="/departments/new"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/25 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            New department
          </Link>
        }
      />

      <div className="mb-5">
        <SearchInput
          label="Search departments"
          placeholder="Search by department name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && error && <ErrorState message={error} onRetry={loadDepartments} />}

      {!isLoading && !error && departments && departments.length === 0 && (
        <EmptyState title="No departments found" description="Try adjusting your search, or create one." />
      )}

      {!isLoading && !error && departments && departments.length > 0 && (
        <>
          <DepartmentTable
            departments={departments}
            renderActions={(department) => (
              <IconButton
                label={`Delete ${department.departmentName}`}
                variant="danger"
                onClick={() => setDeleteTarget(department)}
                icon={
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path
                      d="M4 6h12M8 6V4.5a1 1 0 011-1h2a1 1 0 011 1V6M5.5 6l.6 9.5a1 1 0 001 .9h5.8a1 1 0 001-.9l.6-9.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
            )}
          />
          {/* Grows to fill any leftover height so pagination sits at the
              bottom of the page even when the list is short (e.g. a single
              result); collapses to nothing once the list already fills it. */}
          <div className="flex-1" />
          {pagination && (
            <Pagination pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete department"
        message={
          deleteTarget
            ? `This will permanently delete "${deleteTarget.departmentName}". Tickets and users referencing it may be affected.`
            : ""
        }
        confirmLabel="Delete department"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}
