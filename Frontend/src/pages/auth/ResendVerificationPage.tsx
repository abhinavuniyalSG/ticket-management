import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { FormField } from "../../components/molecules/FormField";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { authService } from "../../services/authService";
import { useTouched } from "../../hooks/useTouched";
import { ApiError } from "../../types/api";
import { isValidEmail } from "../../utils/validation";

export function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { markTouched, isTouched } = useTouched<"email">();

  // Disabled until there's a valid email to send to, rather than only
  // finding out it's missing/invalid after clicking submit.
  const canSubmit = isValidEmail(email);
  // Shown once the user leaves the field, not before - see RegisterPage.
  const emailError = isTouched("email")
    ? !email.trim()
      ? "Email is required"
      : !isValidEmail(email)
        ? "Enter a valid email address"
        : undefined
    : undefined;
  const displayedError = emailError ?? serverError ?? undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const res = await authService.resendVerification(email.trim().toLowerCase());
      toast.success(res.message);
      setSent(true);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to resend the email.";
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Resend verification email"
      description="Enter your email and we'll send a new verification link."
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-sm text-slate-600">
            If an account with that email exists, a verification email has been sent.
          </p>
          <Link to="/login" className="text-sm font-medium text-slate-900 hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField label="Email" htmlFor="resend-email" error={displayedError} required>
            <Input
              id="resend-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              invalid={Boolean(displayedError)}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={markTouched("email")}
              disabled={isSubmitting}
            />
          </FormField>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!canSubmit}
            title={canSubmit ? undefined : "Enter a valid email address."}
            className="w-full"
          >
            Send verification email
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
