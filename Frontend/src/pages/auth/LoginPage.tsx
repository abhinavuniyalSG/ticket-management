import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { FormField } from "../../components/molecules/FormField";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../types/api";
import { getDefaultRouteForRole } from "../../constants/navigation";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { user, status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "authenticated" && user) {
    return (
      <Navigate to={user.isVerified ? getDefaultRouteForRole(user.role) : "/verify-required"} replace />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
        <FormField label="Email" htmlFor="login-email" error={errors.email} required>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="Password" htmlFor="login-password" error={errors.password} required>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            invalid={Boolean(errors.password)}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
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
          <Link to="/change-password" className="font-medium text-slate-900 hover:underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
