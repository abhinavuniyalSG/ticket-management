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
import { Badge } from "../../components/atoms/Badge";
import { Spinner } from "../../components/atoms/Spinner";
import { ErrorState } from "../../components/molecules/ErrorState";
import { ConfirmDialog } from "../../components/molecules/ConfirmDialog";
import { userService } from "../../services/userService";
import { departmentService } from "../../services/departmentService";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../types/api";
import type { User, UserRole } from "../../types/user";
import type { Department } from "../../types/department";
import { CONTACT_TYPE_LABELS, ROLE_LABELS, USER_ROLES } from "../../constants/options";
import { canDeleteUser, canEditUserDepartment, canEditUserName, canEditUserRole } from "../../utils/userPermissions";

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user: actor } = useAuth();
  const navigate = useNavigate();

  const [target, setTarget] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [departmentId, setDepartmentId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    Promise.all([userService.getById(id), departmentService.list()])
      .then(([userRes, deptRes]) => {
        setTarget(userRes.user);
        setFirstName(userRes.user.firstName);
        setLastName(userRes.user.lastName);
        setRole(userRes.user.role);
        setDepartmentId(userRes.user.departmentId ?? "");
        setDepartments(deptRes.departments);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Unable to load this user.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (!id) return <Navigate to="/users" replace />;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error || !target || !actor) {
    return (
      <PageContainer>
        <ErrorState message={error ?? "Unable to load this user."} />
      </PageContainer>
    );
  }

  const canEditName = canEditUserName(actor, target);
  const canEditDept = canEditUserDepartment(actor, target);
  const canEditRole = canEditUserRole(actor);
  const canDelete = canDeleteUser(actor, target);
  const canEditAnything = canEditName || canEditDept || canEditRole;

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const res = await userService.update(target.id, {
        ...(canEditName ? { firstName: firstName.trim(), lastName: lastName.trim() } : {}),
        ...(canEditDept ? { departmentId: departmentId || null } : {}),
        ...(canEditRole ? { role } : {}),
      });
      setTarget(res.user);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update this user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await userService.remove(target.id);
      toast.success(res.message);
      navigate("/users", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete this user.");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${target.firstName} ${target.lastName}`.trim()}
        description={target.email}
        actions={
          canDelete ? (
            <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
              Delete user
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Badge color={target.role === "super_admin" ? "purple" : target.role === "admin" ? "blue" : "slate"}>
            {ROLE_LABELS[target.role]}
          </Badge>
          <Badge color={target.isVerified ? "green" : "amber"}>
            {target.isVerified ? "Verified" : "Unverified"}
          </Badge>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Details</h2>
          <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First name" htmlFor="user-first-name">
                <Input
                  id="user-first-name"
                  value={firstName}
                  maxLength={50}
                  disabled={!canEditName || isSaving}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </FormField>
              <FormField label="Last name" htmlFor="user-last-name">
                <Input
                  id="user-last-name"
                  value={lastName}
                  maxLength={50}
                  disabled={!canEditName || isSaving}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </FormField>
            </div>
            <FormField label="Department" htmlFor="user-department">
              <Select
                id="user-department"
                value={departmentId}
                placeholder="Unassigned"
                options={departments.map((d) => ({ value: d.departmentId, label: d.departmentName }))}
                disabled={!canEditDept || isSaving}
                onChange={(e) => setDepartmentId(e.target.value)}
              />
            </FormField>
            <FormField label="Role" htmlFor="user-role">
              <Select
                id="user-role"
                value={role}
                options={USER_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                disabled={!canEditRole || isSaving}
                onChange={(e) => setRole(e.target.value as UserRole)}
              />
            </FormField>
            {canEditAnything && (
              <div className="flex justify-end">
                <Button type="submit" isLoading={isSaving}>
                  Save changes
                </Button>
              </div>
            )}
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Contacts</h2>
          {target.contacts && target.contacts.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {target.contacts.map((contact) => (
                <li key={contact.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {CONTACT_TYPE_LABELS[contact.contactType]}
                  </p>
                  <p className="text-sm text-slate-800">{contact.contactDetail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No contacts on file.</p>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete user"
        message={`This will permanently delete ${target.firstName} ${target.lastName}'s account.`}
        confirmLabel="Delete user"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </PageContainer>
  );
}
