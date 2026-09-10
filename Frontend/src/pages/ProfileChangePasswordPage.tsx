import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { FormField } from "../components/molecules/FormField";
import { PasswordField } from "../components/molecules/PasswordField";
import { Input } from "../components/atoms/Input";
import { Button } from "../components/atoms/Button";
import { authService } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../types/api";
import { getPasswordErrors, isPasswordValid, isValidEmail } from "../utils/validation";

interface FormValues {
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

export function ProfileChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>({
    email: user?.email ?? "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    if (values.confirmPassword !== values.newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    return nextErrors;
  };

  // Live (not submit-gated) password checks - see RegisterPage for why.
  const passwordTouched = values.newPassword.length > 0;
  const confirmTouched = values.confirmPassword.length > 0;
  const passwordsMatch = values.newPassword === values.confirmPassword;
  const sameAsOldPassword =
    passwordTouched && values.oldPassword.length > 0 && values.newPassword === values.oldPassword;
  const canSubmit =
    (!passwordTouched || (isPasswordValid(values.newPassword) && !sameAsOldPassword)) &&
    (!confirmTouched || passwordsMatch);
  const newPasswordError = sameAsOldPassword
    ? "New password must be different from the old password"
    : undefined;
  const confirmPasswordError =
    errors.confirmPassword ?? (confirmTouched && !passwordsMatch ? "Passwords do not match" : undefined);

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
      await logout();
      navigate("/login", { replace: true });
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
    <PageContainer>
      <PageHeader
        title="Change password"
        description="Update your account password. You'll need to sign in again afterwards."
        backTo="/profile"
        backLabel="Back to profile"
      />

      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md shadow-soft rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-5">
            {formError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}
            <FormField label="Email" htmlFor="pcp-email">
              <Input id="pcp-email" type="email" value={values.email} disabled readOnly />
            </FormField>
            <PasswordField
              label="Current password"
              id="pcp-old-password"
              autoComplete="current-password"
              value={values.oldPassword}
              error={errors.oldPassword}
              required
              onChange={setField("oldPassword")}
              disabled={isSubmitting}
              isVisible={showPassword}
            />
            <PasswordField
              label="New password"
              id="pcp-new-password"
              autoComplete="new-password"
              value={values.newPassword}
              error={newPasswordError}
              showRequirements
              required
              onChange={setField("newPassword")}
              disabled={isSubmitting}
              isVisible={showPassword}
            />
            <PasswordField
              label="Confirm password"
              id="pcp-confirm-password"
              autoComplete="new-password"
              value={values.confirmPassword}
              error={confirmPasswordError}
              required
              onChange={setField("confirmPassword")}
              disabled={isSubmitting}
              isVisible={showPassword}
            />
            <label
              htmlFor="pcp-show-password"
              className="-mt-3 inline-flex select-none items-center gap-2 text-xs text-slate-600"
            >
              <input
                id="pcp-show-password"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                disabled={isSubmitting}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              />
              Show passwords
            </label>
            <Button type="submit" isLoading={isSubmitting} disabled={!canSubmit} className="w-full">
              Change password
            </Button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
