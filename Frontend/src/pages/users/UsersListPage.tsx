import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { SearchInput } from "../../components/molecules/SearchInput";
import { Select } from "../../components/atoms/Select";
import { Button } from "../../components/atoms/Button";
import { IconButton } from "../../components/atoms/IconButton";
import { Spinner } from "../../components/atoms/Spinner";
import { EmptyState } from "../../components/molecules/EmptyState";
import { ErrorState } from "../../components/molecules/ErrorState";
import { ConfirmDialog } from "../../components/molecules/ConfirmDialog";
import { UserTable } from "../../components/organisms/UserTable";
import { userService } from "../../services/userService";
import type { UserQueryParams } from "../../services/userService";
import { departmentService } from "../../services/departmentService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../types/api";
import type { User } from "../../types/user";
import type { Department } from "../../types/department";
import { ROLE_LABELS, USER_ROLES } from "../../constants/options";
import { canDeleteUser } from "../../utils/userPermissions";

export function UsersListPage() {
  const { user: actor } = useAuth();
  const isSuperAdmin = actor?.role === "super_admin";

  const [users, setUsers] = useState<User[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const query = useMemo<UserQueryParams>(
    () => ({
      firstName: debouncedSearch.trim() || undefined,
      role: (roleFilter || undefined) as UserQueryParams["role"],
      department: departmentFilter || undefined,
    }),
    [debouncedSearch, roleFilter, departmentFilter],
  );

  const loadUsers = () => {
    setIsLoading(true);
    setError(null);
    userService
      .list(query)
      .then((res) => setUsers(res.users))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load users.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (isSuperAdmin) {
      departmentService
        .list()
        .then((res) => setDepartments(res.departments))
        .catch(() => undefined);
    }
  }, [isSuperAdmin]);

  const hasActiveFilters = search !== "" || roleFilter !== "" || departmentFilter !== "";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setDepartmentFilter("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await userService.remove(deleteTarget.id);
      toast.success(res.message);
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== deleteTarget.id) : prev));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete this user.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Users" description="Manage user accounts." />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <SearchInput
          label="Search users"
          placeholder="Search by first name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          aria-label="Filter by role"
          placeholder="All roles"
          value={roleFilter}
          options={USER_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="sm:max-w-[160px]"
        />
        {isSuperAdmin && (
          <Select
            aria-label="Filter by department"
            placeholder="All departments"
            value={departmentFilter}
            options={departments.map((d) => ({ value: d.departmentName, label: d.departmentName }))}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="sm:max-w-[200px]"
          />
        )}
        <Button
          variant="secondary"
          disabled={!hasActiveFilters}
          onClick={clearFilters}
          className="border-slate-300 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-400 sm:ml-auto"
        >
          Clear filters
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && error && <ErrorState message={error} onRetry={loadUsers} />}

      {!isLoading && !error && users && users.length === 0 && (
        <EmptyState
          title="No users found"
          description="Try adjusting your search or filters."
        />
      )}

      {!isLoading && !error && users && users.length > 0 && actor && (
        <UserTable
          users={users}
          renderActions={(target) =>
            canDeleteUser(actor, target) ? (
              <IconButton
                label={`Delete ${target.firstName} ${target.lastName}`}
                variant="danger"
                onClick={() => setDeleteTarget(target)}
                icon={
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
            ) : null
          }
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete user"
        message={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.firstName} ${deleteTarget.lastName}'s account.`
            : ""
        }
        confirmLabel="Delete user"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}
