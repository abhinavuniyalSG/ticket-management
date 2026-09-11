import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { FormField } from "../../components/molecules/FormField";
import { Input } from "../../components/atoms/Input";
import { Select } from "../../components/atoms/Select";
import { Button } from "../../components/atoms/Button";
import { departmentService } from "../../services/departmentService";
import { userService } from "../../services/userService";
import { useTouched } from "../../hooks/useTouched";
import { ApiError } from "../../types/api";
import type { User } from "../../types/user";
import { fullName } from "../../utils/format";
import { isValidEmail } from "../../utils/validation";

type FieldName = "name" | "email";

function nameError(value: string): string | undefined {
  return value.trim().length < 2 ? "Must be at least 2 characters" : undefined;
}

function emailError(value: string): string | undefined {
  return !isValidEmail(value) ? "Enter a valid email address" : undefined;
}

export function CreateDepartmentPage() {
  const navigate = useNavigate();

  const [managers, setManagers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [managedBy, setManagedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { markTouched, isTouched } = useTouched<FieldName>();

  const canSubmit = nameError(name) === undefined && emailError(email) === undefined;

  useEffect(() => {
    userService
      .list()
      .then((res) =>
        setManagers(
          res.users.filter(
            (u) => u.role === "admin" || u.role === "super_admin",
          ),
        ),
      )
      .catch(() => undefined);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const res = await departmentService.create({
        departmentName: name.trim(),
        departmentEmail: email.trim().toLowerCase(),
        managedBy: managedBy || undefined,
      });
      toast.success(res.message);
      navigate(`/departments/${res.department.departmentId}`, {
        replace: true,
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Unable to create department.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="New department"
        description="Add a department and optionally assign a manager."
        backTo="/departments"
        backLabel="Back to departments"
      />

      <div className="shadow-soft mx-auto max-w-2xl rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Department name"
              htmlFor="dept-name"
              error={isTouched("name") ? nameError(name) : undefined}
              required
            >
              <Input
                id="dept-name"
                value={name}
                maxLength={100}
                placeholder="e.g. Customer Support"
                invalid={isTouched("name") && Boolean(nameError(name))}
                onChange={(e) => setName(e.target.value)}
                onBlur={markTouched("name")}
                disabled={isSubmitting}
              />
            </FormField>
            <FormField
              label="Department email"
              htmlFor="dept-email"
              error={isTouched("email") ? emailError(email) : undefined}
              required
            >
              <Input
                id="dept-email"
                type="email"
                placeholder="support@example.com"
                value={email}
                invalid={isTouched("email") && Boolean(emailError(email))}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={markTouched("email")}
                disabled={isSubmitting}
              />
            </FormField>
          </div>
          <FormField
            label="Manager"
            htmlFor="dept-manager"
            hint="Must be an admin or super admin."
          >
            <Select
              id="dept-manager"
              value={managedBy}
              placeholder="No manager"
              options={managers.map((m) => ({
                value: m.id,
                label: fullName(m),
              }))}
              onChange={(e) => setManagedBy(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!canSubmit}
              title={canSubmit ? undefined : "Enter a department name and a valid email address."}
            >
              Create department
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
