import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { FormField } from "../../components/molecules/FormField";
import { Input } from "../../components/atoms/Input";
import { Select } from "../../components/atoms/Select";
import { Button } from "../../components/atoms/Button";
import { Spinner } from "../../components/atoms/Spinner";
import { ErrorState } from "../../components/molecules/ErrorState";
import { ConfirmDialog } from "../../components/molecules/ConfirmDialog";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { ApiError } from "../../types/api";
import type { Department } from "../../types/department";
import type { User } from "../../types/user";
import { fullName } from "../../utils/format";
import { isValidEmail } from "../../utils/validation";

export function DepartmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [managedBy, setManagedBy] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    Promise.all([departmentService.getById(id), userService.list()])
      .then(([deptRes, userRes]) => {
        setDepartment(deptRes.department);
        setName(deptRes.department.departmentName);
        setEmail(deptRes.department.departmentEmail);
        setManagedBy(deptRes.department.managedBy ?? "");
        setManagers(userRes.users.filter((u) => u.role === "admin" || u.role === "super_admin"));
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load this department.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (!id) return <Navigate to="/departments" replace />;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error || !department) {
    return (
      <PageContainer>
        <ErrorState message={error ?? "Unable to load this department."} />
      </PageContainer>
    );
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof formErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Must be at least 2 characters";
    if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address";
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const res = await departmentService.update(department.departmentId, {
        departmentName: name.trim(),
        departmentEmail: email.trim().toLowerCase(),
        managedBy: managedBy || null,
      });
      setDepartment(res.department);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update this department.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await departmentService.remove(department.departmentId);
      toast.success(res.message);
      navigate("/departments", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete this department.");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={department.departmentName}
        description={department.departmentEmail}
        backTo="/departments"
        backLabel="Back to departments"
        actions={
          <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
            Delete department
          </Button>
        }
      />

      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4">
          <FormField label="Department name" htmlFor="dept-detail-name" error={formErrors.name} required>
            <Input
              id="dept-detail-name"
              value={name}
              maxLength={100}
              invalid={Boolean(formErrors.name)}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </FormField>
          <FormField label="Department email" htmlFor="dept-detail-email" error={formErrors.email} required>
            <Input
              id="dept-detail-email"
              type="email"
              value={email}
              invalid={Boolean(formErrors.email)}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
            />
          </FormField>
          <FormField label="Manager" htmlFor="dept-detail-manager" hint="Must be an admin or super admin.">
            <Select
              id="dept-detail-manager"
              value={managedBy}
              placeholder="No manager"
              options={managers.map((m) => ({ value: m.id, label: fullName(m) }))}
              onChange={(e) => setManagedBy(e.target.value)}
              disabled={isSaving}
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving}>
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete department"
        message={`This will permanently delete "${department.departmentName}".`}
        confirmLabel="Delete department"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </PageContainer>
  );
}
