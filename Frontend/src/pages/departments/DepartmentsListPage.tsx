import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { SearchInput } from "../../components/molecules/SearchInput";
import { FormField } from "../../components/molecules/FormField";
import { Input } from "../../components/atoms/Input";
import { Select } from "../../components/atoms/Select";
import { Button } from "../../components/atoms/Button";
import { IconButton } from "../../components/atoms/IconButton";
import { Spinner } from "../../components/atoms/Spinner";
import { EmptyState } from "../../components/molecules/EmptyState";
import { ErrorState } from "../../components/molecules/ErrorState";
import { ConfirmDialog } from "../../components/molecules/ConfirmDialog";
import { DepartmentTable } from "../../components/organisms/DepartmentTable";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";
import { fullName } from "../../utils/format";

export function DepartmentsListPage() {
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [managedBy, setManagedBy] = useState("");
  const [createErrors, setCreateErrors] = useState<{ name?: string; email?: string }>({});
  const [isCreating, setIsCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setIsLoading(true);
    setError(null);
    departmentService
      .list()
      .then((res) => setDepartments(res.departments))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load departments.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    userService
      .list()
      .then((res) => setManagers(res.users.filter((u) => u.role === "admin" || u.role === "super_admin")))
      .catch(() => undefined);
  }, []);

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter(
      (d) =>
        d.departmentName.toLowerCase().includes(term) ||
        d.departmentEmail.toLowerCase().includes(term),
    );
  }, [departments, search]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof createErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email address";
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsCreating(true);
    try {
      const res = await departmentService.create({
        departmentName: name.trim(),
        departmentEmail: email.trim().toLowerCase(),
        managedBy: managedBy || undefined,
      });
      toast.success(res.message);
      setDepartments((prev) => (prev ? [...prev, res.department] : [res.department]));
      setName("");
      setEmail("");
      setManagedBy("");
      setIsCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to create department.");
    } finally {
      setIsCreating(false);
    }
  };

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
          <Button onClick={() => setIsCreateOpen((prev) => !prev)}>
            {isCreateOpen ? "Cancel" : "New department"}
          </Button>
        }
      />

      {isCreateOpen && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Department name" htmlFor="dept-name" error={createErrors.name} required>
              <Input
                id="dept-name"
                value={name}
                maxLength={100}
                invalid={Boolean(createErrors.name)}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
              />
            </FormField>
            <FormField label="Department email" htmlFor="dept-email" error={createErrors.email} required>
              <Input
                id="dept-email"
                type="email"
                value={email}
                invalid={Boolean(createErrors.email)}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isCreating}
              />
            </FormField>
          </div>
          <FormField label="Manager" htmlFor="dept-manager" hint="Must be an admin or super admin.">
            <Select
              id="dept-manager"
              value={managedBy}
              placeholder="No manager"
              options={managers.map((m) => ({ value: m.id, label: fullName(m) }))}
              onChange={(e) => setManagedBy(e.target.value)}
              disabled={isCreating}
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isCreating}>
              Create department
            </Button>
          </div>
        </form>
      )}

      <div className="mb-5">
        <SearchInput
          label="Search departments"
          placeholder="Search by name or email"
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

      {!isLoading && error && <ErrorState message={error} onRetry={load} />}

      {!isLoading && !error && filteredDepartments.length === 0 && (
        <EmptyState title="No departments found" description="Try adjusting your search, or create one." />
      )}

      {!isLoading && !error && filteredDepartments.length > 0 && (
        <DepartmentTable
          departments={filteredDepartments}
          renderActions={(department) => (
            <IconButton
              label={`Delete ${department.departmentName}`}
              variant="danger"
              onClick={() => setDeleteTarget(department)}
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
          )}
        />
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
