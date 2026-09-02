import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { FormField } from "../../components/molecules/FormField";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { authService } from "../../services/authService";
import { ApiError } from "../../types/api";
import { getPasswordErrors, isValidEmail } from "../../utils/validation";

interface FormValues {
  email: string;
  oldPassword: string;
  newPassword: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

export function ChangePasswordPage() {
  const [values, setValues] = useState<FormValues>({ email: "", oldPassword: "", newPassword: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (field: keyof FormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!isValidEmail(values.email)) nextErrors.email = "Enter a valid email address";
    if (!values.oldPassword) nextErrors.oldPassword = "Current password is required";

    const passwordErrors = getPasswordErrors(values.newPassword);
    if (passwordErrors.length > 0) nextErrors.newPassword = passwordErrors.join(", ");
    else if (values.newPassword === values.oldPassword) {
      nextErrors.newPassword = "New password must be different from the old password";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await authService.changePassword({
        email: values.email.trim().toLowerCase(),
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      toast.success(res.message);
      setSuccess(true);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to change your password right now.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Change password" description="Update your account password.">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-sm text-slate-600">
            Your password has been changed. Please sign in again.
          </p>
          <Link to="/login" className="text-sm font-medium text-slate-900 hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <FormField label="Email" htmlFor="cp-email" error={errors.email} required>
            <Input
              id="cp-email"
              type="email"
              autoComplete="email"
              value={values.email}
              invalid={Boolean(errors.email)}
              onChange={(e) => setField("email")(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
          <FormField label="Current password" htmlFor="cp-old-password" error={errors.oldPassword} required>
            <Input
              id="cp-old-password"
              type="password"
              autoComplete="current-password"
              value={values.oldPassword}
              invalid={Boolean(errors.oldPassword)}
              onChange={(e) => setField("oldPassword")(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
          <FormField
            label="New password"
            htmlFor="cp-new-password"
            error={errors.newPassword}
            hint="At least 8 characters, with uppercase, lowercase, a number and a special character."
            required
          >
            <Input
              id="cp-new-password"
              type="password"
              autoComplete="new-password"
              value={values.newPassword}
              invalid={Boolean(errors.newPassword)}
              onChange={(e) => setField("newPassword")(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Change password
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-slate-900 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
