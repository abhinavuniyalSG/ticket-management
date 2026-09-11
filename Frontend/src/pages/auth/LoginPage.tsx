import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { FormField } from "../../components/molecules/FormField";
import { PasswordField } from "../../components/molecules/PasswordField";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { useAuth } from "../../hooks/useAuth";
import { useTouched } from "../../hooks/useTouched";
import { ApiError } from "../../types/api";
import { getDefaultRouteForRole } from "../../constants/navigation";

interface LocationState {
  from?: { pathname: string };
}

type FieldName = "email" | "password";

export function LoginPage() {
  const { user, status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { markTouched, isTouched } = useTouched<FieldName>();

  if (status === "authenticated" && user) {
    return (
      <Navigate to={user.isVerified ? getDefaultRouteForRole(user.role) : "/verify-required"} replace />
    );
  }

  // Disabled until both fields have something in them - matches Create
  // account's "don't let the user find out what's missing only after they
  // click submit" behavior.
  const canSubmit = email.trim().length > 0 && password.length > 0;

  const emailError = isTouched("email") && !email.trim() ? "Email is required" : undefined;
  const passwordError = isTouched("password") && !password ? "Password is required" : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const loggedInUser = await login({ email: email.trim().toLowerCase(), password });
      toast.success("Logged in successfully");
      if (!loggedInUser.isVerified) {
        navigate("/verify-required", { replace: true });
        return;
      }
      const state = location.state as LocationState | null;
      const redirectTo = state?.from?.pathname ?? getDefaultRouteForRole(loggedInUser.role);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to log in right now.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to manage your tickets.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <FormField label="Email" htmlFor="login-email" error={emailError} required>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            invalid={Boolean(emailError)}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={markTouched("email")}
            disabled={isSubmitting}
          />
        </FormField>
        <PasswordField
          label="Password"
          id="login-password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          error={passwordError}
          required
          onChange={setPassword}
          onBlur={markTouched("password")}
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!canSubmit}
          title={canSubmit ? undefined : "Enter your email and password."}
          className="w-full"
        >
          Sign in
        </Button>
      </form>
      <div className="mt-6 flex flex-col gap-1 text-center text-sm text-slate-500">
        <p>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-slate-900 hover:underline">
            Create one
          </Link>
        </p>
        <p>
          <Link to="/changepassword/email" className="font-medium text-slate-900 hover:underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
