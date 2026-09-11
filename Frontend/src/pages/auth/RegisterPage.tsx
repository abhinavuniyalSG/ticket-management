import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { FormField } from "../../components/molecules/FormField";
import { PasswordField } from "../../components/molecules/PasswordField";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { useAuth } from "../../hooks/useAuth";
import { useTouched } from "../../hooks/useTouched";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { ApiError } from "../../types/api";
import { isPasswordValid, isValidEmail } from "../../utils/validation";
import { getDefaultRouteForRole } from "../../constants/navigation";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function firstNameError(value: string): string | undefined {
  if (!value.trim()) return "First name is required";
  if (value.length > 50) return "Must not exceed 50 characters";
  return undefined;
}

function lastNameError(value: string): string | undefined {
  if (value.length > 50) return "Must not exceed 50 characters";
  return undefined;
}

function emailFieldError(value: string): string | undefined {
  if (!value.trim()) return "Email is required";
  if (!isValidEmail(value)) return "Enter a valid email address";
  return undefined;
}

export function RegisterPage() {
  const { user, status, register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { markTouched, isTouched } = useTouched<keyof FormValues>();

  // Debounced so "Passwords do not match" doesn't flash on every keystroke
  // while the user is still typing the confirmation - it only appears once
  // they've paused for a moment, or immediately if they blur away sooner.
  const debouncedConfirmPassword = useDebouncedValue(values.confirmPassword, 500);
  const [confirmBlurred, setConfirmBlurred] = useState(false);

  if (status === "authenticated" && user) {
    return (
      <Navigate to={user.isVerified ? getDefaultRouteForRole(user.role) : "/verify-required"} replace />
    );
  }

  const setField = (field: keyof FormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmBlurred(false);
    setField("confirmPassword")(value);
  };

  // Live (not submit-gated) checks, used to disable "Create account" until
  // every required field is actually filled in and valid - and to surface
  // "passwords do not match" as soon as it's true - instead of only finding
  // out any of this after clicking the button.
  const passwordTouched = values.password.length > 0;
  const confirmTouched = values.confirmPassword.length > 0;
  const passwordsMatch = values.password === values.confirmPassword;
  const isFirstNameValid = firstNameError(values.firstName) === undefined;
  const isLastNameValid = lastNameError(values.lastName) === undefined;
  const isEmailValid = emailFieldError(values.email) === undefined;
  const canSubmit =
    isFirstNameValid &&
    isLastNameValid &&
    isEmailValid &&
    passwordTouched &&
    isPasswordValid(values.password) &&
    confirmTouched &&
    passwordsMatch;
  const disabledReason = canSubmit
    ? undefined
    : "Fill in your first name, a valid email, and a matching password that meets all the requirements above.";

  // The debounced value has "caught up" to the live one once the user has
  // paused typing for the debounce delay - that, or an explicit blur, is
  // what reveals the mismatch message.
  const confirmHasSettled = debouncedConfirmPassword === values.confirmPassword;
  const confirmPasswordError =
    confirmTouched && !passwordsMatch && (confirmBlurred || confirmHasSettled)
      ? "Passwords do not match"
      : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!canSubmit) return;

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
          <FormField
            label="First name"
            htmlFor="register-first-name"
            error={isTouched("firstName") ? firstNameError(values.firstName) : undefined}
            required
          >
            <Input
              id="register-first-name"
              value={values.firstName}
              maxLength={50}
              placeholder="e.g. Jane"
              invalid={isTouched("firstName") && Boolean(firstNameError(values.firstName))}
              onChange={(e) => setField("firstName")(e.target.value)}
              onBlur={markTouched("firstName")}
              disabled={isSubmitting}
            />
          </FormField>
          <FormField
            label="Last name"
            htmlFor="register-last-name"
            error={isTouched("lastName") ? lastNameError(values.lastName) : undefined}
          >
            <Input
              id="register-last-name"
              value={values.lastName}
              maxLength={50}
              placeholder="e.g. Doe"
              invalid={isTouched("lastName") && Boolean(lastNameError(values.lastName))}
              onChange={(e) => setField("lastName")(e.target.value)}
              onBlur={markTouched("lastName")}
              disabled={isSubmitting}
            />
          </FormField>
        </div>
        <FormField
          label="Email"
          htmlFor="register-email"
          error={isTouched("email") ? emailFieldError(values.email) : undefined}
          required
        >
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            invalid={isTouched("email") && Boolean(emailFieldError(values.email))}
            onChange={(e) => setField("email")(e.target.value)}
            onBlur={markTouched("email")}
            disabled={isSubmitting}
          />
        </FormField>
        <PasswordField
          label="Password"
          id="register-password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={values.password}
          showRequirements
          required
          onChange={setField("password")}
          disabled={isSubmitting}
          isVisible={showPassword}
        />
        <PasswordField
          label="Confirm password"
          id="register-confirm-password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={values.confirmPassword}
          error={confirmPasswordError}
          required
          onChange={handleConfirmPasswordChange}
          onBlur={() => setConfirmBlurred(true)}
          disabled={isSubmitting}
          isVisible={showPassword}
        />
        <label
          htmlFor="register-show-password"
          className="-mt-3 inline-flex select-none items-center gap-2 text-xs text-slate-600"
        >
          <input
            id="register-show-password"
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            disabled={isSubmitting}
            className="h-3.5 w-3.5 rounded border-slate-300 accent-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          />
          Show passwords
        </label>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!canSubmit}
          title={disabledReason}
          className="w-full"
        >
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
