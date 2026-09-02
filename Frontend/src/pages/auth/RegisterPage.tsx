import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { FormField } from "../../components/molecules/FormField";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../types/api";
import { getPasswordErrors, isValidEmail } from "../../utils/validation";
import { getDefaultRouteForRole } from "../../constants/navigation";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterPage() {
  const { user, status, register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "authenticated" && user) {
    return (
      <Navigate to={user.isVerified ? getDefaultRouteForRole(user.role) : "/verify-required"} replace />
    );
  }

  const setField = (field: keyof FormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!values.firstName.trim()) nextErrors.firstName = "First name is required";
    else if (values.firstName.length > 50) nextErrors.firstName = "Must not exceed 50 characters";

    if (values.lastName.length > 50) nextErrors.lastName = "Must not exceed 50 characters";

    if (!values.email.trim()) nextErrors.email = "Email is required";
    else if (!isValidEmail(values.email)) nextErrors.email = "Enter a valid email address";

    const passwordErrors = getPasswordErrors(values.password);
    if (passwordErrors.length > 0) nextErrors.password = passwordErrors.join(", ");

    if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Passwords do not match";
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
      await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      toast.success("Account created. Please check your email to verify your account.");
      navigate("/verify-required", { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to create your account right now.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" description="Get started managing support tickets.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="First name" htmlFor="register-first-name" error={errors.firstName} required>
            <Input
              id="register-first-name"
              value={values.firstName}
              maxLength={50}
              invalid={Boolean(errors.firstName)}
              onChange={(e) => setField("firstName")(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
          <FormField label="Last name" htmlFor="register-last-name" error={errors.lastName}>
            <Input
              id="register-last-name"
              value={values.lastName}
              maxLength={50}
              invalid={Boolean(errors.lastName)}
              onChange={(e) => setField("lastName")(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
        </div>
        <FormField label="Email" htmlFor="register-email" error={errors.email} required>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            value={values.email}
            invalid={Boolean(errors.email)}
            onChange={(e) => setField("email")(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="register-password"
          error={errors.password}
          hint="At least 8 characters, with uppercase, lowercase, a number and a special character."
          required
        >
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            invalid={Boolean(errors.password)}
            onChange={(e) => setField("password")(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField
          label="Confirm password"
          htmlFor="register-confirm-password"
          error={errors.confirmPassword}
          required
        >
          <Input
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            onChange={(e) => setField("confirmPassword")(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-slate-900 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
